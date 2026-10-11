# Protected public email submissions — activation guide

This guide describes activation and verification of the protected public email form. Production deployment status and live verification results are recorded separately in the deployment report.

The public email form works independently of the office system and Supabase. Only POST /api/transaction is restored. Office pages, employee authentication, office APIs, private GIS records and database tooling remain excluded from this release. Never push the original dirty office checkout to publish these changes.

## Owner setup

1. Open the Cloudflare dashboard → Turnstile → Add widget. Choose a descriptive name, add exactly assessors-system.vercel.app as the hostname and choose Managed. No Cloudflare DNS or nameserver change is needed. Keep pre-clearance off. Save the site key and secret privately. Use real production keys, not the documented dummy test keys.
2. Open the Upstash console → Redis → Create Database. Use a dedicated database named assessor-public-form and the Free plan. Choose a nearby available region. Do not enter a card or enable paid upgrades for this setup. Find its HTTPS REST URL and standard read/write REST token. Do not use the read-only token or the redis:// connection string. This database stores only expiring HMAC counter keys and counts, not submitted names, addresses, messages or attachments.
3. Open the existing Vercel project assessors-system → Settings → Environment Variables. Add these variables to Production only. Keep the existing SMTP variables unchanged. Do not share screenshots of values, keys or full connection strings.

| Variable | Value/source |
| --- | --- |
| PUBLIC_SUBMISSION_ORIGIN | https://assessors-system.vercel.app (no trailing slash) |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY | Cloudflare widget's site key; this particular key is intentionally public |
| TURNSTILE_SECRET_KEY | Cloudflare widget's private secret |
| UPSTASH_REDIS_REST_URL | Upstash's HTTPS REST endpoint |
| UPSTASH_REDIS_REST_TOKEN | Upstash's private standard read/write REST token |

Only NEXT_PUBLIC_TURNSTILE_SITE_KEY is browser-visible. Never give SMTP, Redis or Turnstile secrets a NEXT_PUBLIC_ prefix. Do not copy environment files into Git. Existing mail configuration must use authenticated SMTP with verified TLS: port 465 with SMTP_SECURE=true or port 587 with SMTP_SECURE=false and mandatory STARTTLS. OFFICE_EMAIL_TO must be a single office email address; SMTP_FROM may be a single address or a display name plus address.

4. Save the variables, then confirm “Protection settings configured.” Publish the reviewed public-form release after the offline verification checks; redeploying an older informational release does not restore its API. The site key is embedded at build time, so activation needs a new build after the settings are saved. Preview hostnames are not automatically trusted; activation targets the canonical production site only.

## Implemented protections

- Cloudflare Siteverify validation on the server for every send; exact hostname and public_request action; single-use/expired tokens rejected. The browser widget alone cannot authorize email.
- Shared, expiring Redis budgets across Vercel instances, with a single atomic script per budget stage. No memory-only production fallback. Protection outages or malformed replies stop sending.
- Request flood limits: 60 attempts per visitor per 10 minutes and 600 site-wide per 10 minutes, before parsing uploads.
- Submission limits: 3 per visitor per 10 minutes, 10 per visitor per hour, 5 per submitted email address per hour and 120 site-wide per hour.
- Same normalized request and attachment content cannot be submitted again for 10 minutes. Changes to content can evade duplicate matching but remain bound by the other budgets.
- Names accept Unicode letters, combining marks, spaces, apostrophes, periods and hyphens. This rejects invalid formatting; it does not prove a real identity or email ownership. No arbitrary name blacklist is used.
- Exact Origin and Fetch Metadata checks, a honeypot, rejection of repeated/unknown fields, bounded body reads and conservative validation.
- At most 5 PDF/JPG/PNG attachments, 4 MB total, with multipart headroom below Vercel's 4.5 MB limit. Server checks bytes rather than trusting declared MIME types, screens common PDF active content and normalizes attachment filenames.
- Fixed office recipient and sender; visitor address is Reply-To only. Plain-text email, verified SMTP TLS, no file/URL reads and no raw sensitive error logs.
- No SMTP retries or budget refunds after ambiguous mail failures. Wait 10 minutes or contact the office instead of repeatedly submitting.

## Verification and remaining gates

Offline tests block remote sockets and fetch. They exercise real multipart parsing, validation, command generation, guard ordering, denial paths, MIME screening and SMTP configuration, with fake external responses. They do not establish live Cloudflare, Redis script execution, SMTP delivery, quota availability or provider behavior.

Before publication, verify variable names are present without downloading values, rerun build/tests/audit/diff checks and inspect the exact release diff. After the explicitly authorized release, check the live widget and have the owner send one clearly labeled, non-sensitive test request and confirm it arrives. No automated mail to the office has been sent. Live Redis counters necessarily write ephemeral protection keys; no Supabase/local database or office records are involved.

Mailbox antivirus and spam controls must remain enabled: attachment screening is not a full malware scanner. The form does not authenticate visitors, verify mailbox ownership or eliminate all human/distributed abuse. IP limits can be shared by people on the same office/mobile network. If limits need adjustment, use reviewed code changes; never bypass the protection on failure. Public mailto links remain usable and bypass the website, so configure the receiving mailbox's spam filters separately.

Free-tier exhaustion makes the form temporarily unavailable rather than sending unprotected email. Check the provider dashboards periodically. Cloudflare currently offers a free production Turnstile plan; Upstash currently lists a free Redis tier of 250 MB and 500K commands per month. Script-internal operations count toward provider usage; do not infer the quota from HTTP request count alone. No paid service was enabled by this change.

## Commands (public release checkout, after dependency installation)

```powershell
npm run build
npm test
npm audit --omit=dev --ignore-scripts --registry=https://registry.npmjs.org/
git diff --check
```

The npm test command preloads tests/forbid-external-services.mjs and permits only loopback HTTP for the isolated production smoke server. No credentials are needed for offline verification.

Official references:
- https://developers.cloudflare.com/turnstile/get-started/widget-management/dashboard/
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- https://developers.cloudflare.com/turnstile/plans/
- https://upstash.com/docs/redis/features/restapi
- https://upstash.com/docs/redis/sdks/ts/commands/scripts/eval
- https://upstash.com/pricing/redis
- https://vercel.com/docs/headers/request-headers
- https://vercel.com/docs/functions/limitations
