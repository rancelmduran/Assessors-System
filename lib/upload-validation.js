// Server-side inspection of public-form attachments (pure functions, no I/O). The browser-declared MIME type is never
// trusted: the file's own bytes decide what it is, and the declared type must agree with them.
//
// Accepted: PDF, JPEG, PNG (see lib/config.js upload.allowedTypes). Each is checked structurally, not just by its first
// bytes: JPEG/PNG must have a readable header with sane dimensions, PNG must end with its IEND chunk, and PDFs that
// carry active content (JavaScript, launch actions, embedded files, rich media, form submission) are refused.
// The PDF check is a best-effort screen of the raw file; it cannot see inside compressed object streams, so keep
// antivirus scanning on the receiving mailbox as the second layer.

export const MAX_PIXELS = 100_000_000; // 100 megapixels: far above any phone/scanner photo, blocks decompression bombs

const TYPES = Object.freeze({
  pdf: { mime: "application/pdf", ext: "pdf" },
  jpeg: { mime: "image/jpeg", ext: "jpg" },
  png: { mime: "image/png", ext: "png" },
});

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PNG_IEND = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);

const sane = (w, h) => Number.isInteger(w) && Number.isInteger(h) && w > 0 && h > 0 && w * h <= MAX_PIXELS;

function inspectPng(b) {
  if (b.length < 8 + 25 + 12 || !b.subarray(0, 8).equals(PNG_SIG)) return false;
  if (b.readUInt32BE(8) !== 13 || b.toString("latin1", 12, 16) !== "IHDR") return false;
  if (!sane(b.readUInt32BE(16), b.readUInt32BE(20))) return false;
  return b.subarray(b.length - 12).equals(PNG_IEND); // anything after IEND (polyglot payload) or a truncated file fails
}

function inspectJpeg(b) {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8 || b[2] !== 0xff) return false;
  let i = 2;
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff) return false;
    let m = b[i + 1];
    while (m === 0xff && i + 2 < b.length) { i += 1; m = b[i + 1]; } // fill bytes
    if (m === 0x01 || (m >= 0xd0 && m <= 0xd8)) { i += 2; continue; } // markers without a length
    if (m === 0xd9 || m === 0xda) return false; // end of image / start of scan reached without a frame header
    const len = b.readUInt16BE(i + 2);
    if (len < 2 || i + 2 + len > b.length) return false;
    const isSof = m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc;
    if (isSof) return len >= 8 && sane(b.readUInt16BE(i + 7), b.readUInt16BE(i + 5));
    i += 2 + len;
  }
  return false;
}

// Names of PDF actions/objects that execute code, launch programs, hide payloads or post data. Long names are looked
// for everywhere (they cannot occur in compressed data by chance); the 3-letter "/JS" is only looked for outside
// stream bodies, where random binary would otherwise trigger it.
const PDF_LONG = /\/(JavaScript|Launch|EmbeddedFiles?|RichMedia|SubmitForm|ImportData)(?![A-Za-z0-9])/;
const PDF_JS = /\/JS(?![A-Za-z0-9])/;

function outsideStreams(s) {
  const parts = [];
  let pos = 0;
  for (;;) {
    const a = s.indexOf("stream", pos);
    if (a < 0) { parts.push(s.slice(pos)); break; }
    parts.push(s.slice(pos, a));
    const e = s.indexOf("endstream", a + 6);
    if (e < 0) { parts.push(s.slice(a)); break; } // unterminated "stream": do not let it hide the rest of the file
    pos = e + 9;
  }
  return parts.join(" ");
}

function inspectPdf(b) {
  if (b.length < 16 || b.toString("latin1", 0, 5) !== "%PDF-" || !/^[0-9]\.[0-9]/.test(b.toString("latin1", 5, 8))) return false;
  // "#4A#53" style name escapes would otherwise hide "/JS": decode them before matching.
  const text = b.toString("latin1").replace(/#([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  if (PDF_LONG.test(text)) return false;
  return !PDF_JS.test(outsideStreams(text));
}

// Returns { ok: true, type, mime, ext } when the bytes are a well-formed allowed file whose kind matches `declaredType`,
// otherwise { ok: false }. `declaredType` is the browser-supplied MIME type (used only as a cross-check).
export function inspectUpload(buffer, declaredType) {
  const b = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  let kind = null;
  if (b.length >= 5 && b.toString("latin1", 0, 5) === "%PDF-") kind = inspectPdf(b) ? "pdf" : null;
  else if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) kind = inspectJpeg(b) ? "jpeg" : null;
  else if (b.length >= 8 && b.subarray(0, 8).equals(PNG_SIG)) kind = inspectPng(b) ? "png" : null;
  if (!kind || TYPES[kind].mime !== declaredType) return { ok: false };
  return { ok: true, type: kind, mime: TYPES[kind].mime, ext: TYPES[kind].ext };
}

// Safe attachment name: no path parts, no control or odd characters, no inner dots (so "invoice.pdf.exe" cannot pose
// as a document), and an extension that matches the DETECTED type rather than whatever the sender typed.
export function safeAttachmentName(original, ext, index) {
  const base = String(original || "")
    .split(/[\\/]/).pop()
    .replace(/\.[A-Za-z0-9]{1,8}$/, "") // drop the sender's own extension
    .replace(/[^\w\- ]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return `${base && /[A-Za-z0-9]/.test(base) ? base : `attachment-${index + 1}`}.${ext}`;
}
