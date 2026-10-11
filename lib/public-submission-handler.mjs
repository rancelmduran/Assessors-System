import { createHash } from 'node:crypto';
import { upload } from './config.js';
import { inspectUpload, safeAttachmentName } from './upload-validation.js';
import { submissionSettings, createSubmissionProtection, isAllowedOrigin, submissionIp } from './public-submission-security.mjs';

export const MAX_BODY_BYTES = upload.maxTotalBytes + 64 * 1024;
const TEXT_FIELDS = ['fullName', 'email', 'phone', 'address', 'purpose', 'details', 'website', 'cf-turnstile-response'];
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/;
const EMAIL = /^[A-Za-z0-9._%+'-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;
const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' };
const error = (message, status = 400, extra = {}) => Response.json({ error: message }, { status, headers: { ...headers, ...extra } });
const success = () => Response.json({ ok: true }, { headers });
const limited = result => error('Too many requests or a duplicate submission. Please wait before trying again.', 429, { 'Retry-After': String(result.retryAfter) });

export async function readBodyLimited(req) {
  const size = req.headers.get('content-length');
  if (size !== null && (!/^\d+$/.test(size) || Number(size) > MAX_BODY_BYTES)) return null;
  if (!req.body) return Buffer.alloc(0);
  const reader = req.body.getReader();
  const chunks = [];
  let total = 0, timer;
  const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('BODY_TIMEOUT')), 8000); });
  try {
    for (;;) {
      const { done, value } = await Promise.race([reader.read(), timeout]);
      if (done) break;
      total += value.length;
      if (total > MAX_BODY_BYTES) return null;
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  } finally {
    clearTimeout(timer);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

// External services are injectable for offline tests; production route always uses the real settings and guards.
export function createSubmissionHandler({ createTransport, env = () => process.env, protection = createSubmissionProtection } = {}) {
  return async function POST(req) {
    let config;
    try { config = submissionSettings(env()); }
    catch { return error('Online requests are temporarily unavailable. Please contact the office directly.', 503); }
    if (!isAllowedOrigin(req, config)) return error('Request blocked.', 403);
    if (!/^multipart\/form-data;\s*boundary=/i.test(req.headers.get('content-type') || '')) return error('Invalid submission.', 415);
    try {
      const guards = protection(config);
      const ip = submissionIp(req, config);
      const gate = await guards.request(ip);
      if (!gate.allowed) return limited(gate);
      const body = await readBodyLimited(req);
      if (!body) return error('Maximum 5 attachments and 4 MB total. Please reduce the upload size.', 413);
      let form;
      try { form = await new Response(body, { headers: { 'Content-Type': req.headers.get('content-type') } }).formData(); }
      catch { return error('Invalid submission.'); }
      if ([...form.keys()].length > TEXT_FIELDS.length + upload.maxFiles) return error('Invalid submission.');
      for (const key of new Set(form.keys())) {
        if (key === 'files') continue;
        if (!TEXT_FIELDS.includes(key) || form.getAll(key).length !== 1 || typeof form.get(key) !== 'string') return error('Invalid submission.');
      }
      if (form.get('website')) return success(); // Honeypot: no email and no challenge request.
      const d = {};
      for (const key of TEXT_FIELDS.slice(0,6)) {
        const value = form.get(key);
        if (typeof value !== 'string' || CONTROL.test(value) || (key !== 'details' && /[\r\n\t]/.test(value))) return error('Please enter valid text in all required fields.');
        d[key] = key === 'details' ? value.trim() : value.normalize('NFC').trim().replace(/ +/g, ' ');
        if (!d[key]) return error('Please fill out all required fields.');
      }
      if (d.fullName.length > 120 || !/^[\p{L}\p{M}][\p{L}\p{M} .'\u2019-]+$/u.test(d.fullName) || (d.fullName.match(/\p{L}/gu) || []).length < 2) return error('Please enter your name using letters, spaces, apostrophes, periods or hyphens.');
      if (d.email.length > 120 || !EMAIL.test(d.email)) return error('Please enter a valid email address.');
      if (d.phone.length > 30 || !/^[+\d() .-]+$/.test(d.phone) || (d.phone.match(/\d/g) || []).length < 7) return error('Please enter a valid contact number.');
      if (d.address.length > 250 || d.purpose.length > 150 || d.details.length > 3000) return error('One or more fields exceed the allowed length.');
      const files = form.getAll('files');
      if (files.some(f => typeof f === 'string' || !f.size)) return error('Invalid attachment.');
      if (files.length > upload.maxFiles || files.reduce((sum, f) => sum + f.size, 0) > upload.maxTotalBytes) return error('Maximum 5 attachments and 4 MB total.', 413);
      if (!await guards.verify(form.get('cf-turnstile-response'))) return error('Please complete the security check again.', 403);
      const attachments = [];
      for (const [index, file] of files.entries()) {
        const content = Buffer.from(await file.arrayBuffer());
        const checked = inspectUpload(content, file.type);
        if (!checked.ok) return error('Only valid PDF, JPG and PNG attachments are accepted.');
        attachments.push({ filename: safeAttachmentName(file.name, checked.ext, index), content, contentType: checked.mime, contentDisposition: 'attachment' });
      }
      const fingerprint = createHash('sha256').update(JSON.stringify([
        ...Object.entries(d).map(([key, value]) => key === 'email' ? value.toLowerCase() : value.replace(/\s+/g, ' ')),
        ...attachments.map(a => createHash('sha256').update(a.content).digest('hex')).sort(),
      ])).digest('hex');
      const budget = await guards.submission({ ip, email: d.email, fingerprint });
      if (!budget.allowed) return limited(budget);
      // Never refund after an SMTP error: the provider may have accepted mail before a timeout.
      // No automatic retries, so ambiguous delivery cannot cause repeated messages.
      const transporter = createTransport(config.smtp);
      try {
        await transporter.sendMail({
          from: config.from, to: config.to, replyTo: d.email,
          subject: `[Web Request] ${d.purpose.slice(0,80)} - ${d.fullName.slice(0,60)}`,
          text: ['New request from the public website',
            `Submitted: ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })} (Philippine Time)`, '',
            `Full name: ${d.fullName}`, `Email: ${d.email}`, `Contact number: ${d.phone}`,
            `Address: ${d.address}`, `Purpose: ${d.purpose}`, '', 'Details:', d.details, '',
            `Attachments: ${attachments.length}`, 'Treat submitted documents and links as untrusted. Use the office mailbox security scanner.',
          ].join('\n'), attachments, disableFileAccess: true, disableUrlAccess: true,
        });
      } catch {
        // No raw provider errors, submitted personal information or credentials in logs or responses.
        return error('Delivery could not be confirmed. Please wait 10 minutes before retrying, or contact the office.', 502);
      } finally { transporter.close?.(); }
      return success();
    } catch { return error('Online requests are temporarily unavailable. Please contact the office directly.', 503, { 'Retry-After': '60' }); }
  };
}
