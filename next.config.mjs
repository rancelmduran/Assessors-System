// Phase S2.6: HTTP security headers + no-store caching for the private areas. Nothing else is configured here.
//
// Compatibility notes (why the list is deliberately conservative):
//  - The Content-Security-Policy only sets directives that cannot break Next.js (which needs inline scripts without a
//    nonce), the public Google Maps embed, the same-origin PDF <object> viewers, the DOCX editor, or blob: previews:
//      frame-ancestors 'self'  -> nobody else may frame the site (clickjacking); the site's own pages/PDFs still can
//      base-uri 'self'         -> an injected <base> tag cannot redirect relative URLs
//      form-action 'self'      -> forms can only post back to this site
//      object-src 'self'       -> only same-origin <object>/<embed> (the requirements and Citizen's Charter PDFs)
//    script-src / img-src / connect-src are intentionally NOT restricted: a strict script-src needs per-request nonces and
//    browser testing, and is left for a later phase.
//  - X-Frame-Options is SAMEORIGIN (not DENY) so same-origin framing of the PDFs keeps working.
//  - HSTS is sent in production builds only, without includeSubDomains/preload (those are deployment decisions).
//  - Cache-Control: no-store on /api/* (signed-in data, profile details, documents) and /office/* (the private pages).
//    The profile picture route sets its own private caching and is excluded; the public site stays cacheable.

const isProd = process.env.NODE_ENV === "production";

export const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'self'" },
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }] : []),
];

const NO_STORE = [{ key: "Cache-Control", value: "no-store" }];
const NO_INDEX = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

export async function buildHeaders() {
  return [
    { source: "/(.*)", headers: SECURITY_HEADERS },
    // Every API route except the avatar image (which sets its own "private, immutable" caching keyed by ?v=).
    { source: "/api/:path((?!profile/avatar$).*)", headers: [...NO_STORE, ...NO_INDEX] },
    { source: "/office/:path*", headers: [...NO_STORE, ...NO_INDEX] },
  ];
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false, // do not advertise the framework in every response
  headers: buildHeaders,
};

export default nextConfig;
