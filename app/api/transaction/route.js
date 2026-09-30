import nodemailer from "nodemailer";
import { upload } from "../../../lib/config";

export const runtime = "nodejs";
export const maxDuration = 30; // seconds; SMTP + attachments can be slow on serverless

const err = (error, status = 400) => Response.json({ error }, { status });
const oneLine = (s, max) => s.replace(/\s+/g, " ").trim().slice(0, max);
const kb = (n) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(2)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export async function POST(req) {
  // All credentials come from environment variables (server-side only). Never hard-code them.
  const { OFFICE_EMAIL_TO, SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!OFFICE_EMAIL_TO || !SMTP_HOST || !SMTP_FROM) {
    return err("Email service is not configured. Please contact the office directly.", 500);
  }

  let form;
  try {
    form = await req.formData();
  } catch {
    return err("Invalid submission.");
  }

  // Honeypot: pretend success for bots
  if (form.get("website")) return Response.json({ ok: true });

  const v = (k) => String(form.get(k) || "").trim();
  const d = { fullName: v("fullName"), email: v("email"), phone: v("phone"), address: v("address"), purpose: v("purpose"), details: v("details") };

  if (Object.values(d).some((x) => !x)) return err("Please fill out all required fields.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return err("Please enter a valid email address.");
  if (d.purpose.length > 150) return err("Purpose is too long.");
  if (d.details.length > 3000) return err("Details are too long.");

  const files = form.getAll("files").filter((f) => typeof f !== "string" && f.size > 0);
  const total = files.reduce((s, f) => s + f.size, 0);
  if (files.length > upload.maxFiles || total > upload.maxTotalBytes) return err("Attachments exceed the allowed size or count.");
  if (files.some((f) => !upload.allowedTypes.includes(f.type))) return err("Only PDF, JPG and PNG files are allowed.");

  const attachments = await Promise.all(
    files.map(async (f, i) => ({
      filename: (f.name || `attachment-${i + 1}`).replace(/[^\w.\- ]/g, "_"),
      content: Buffer.from(await f.arrayBuffer()),
      contentType: f.type,
    }))
  );

  const attachmentInfo = attachments.length
    ? [`Attachments (${attachments.length}, ${kb(total)} total):`, ...attachments.map((a, i) => `  ${i + 1}. ${a.filename} (${a.contentType}, ${kb(a.content.length)})`)]
    : ["Attachments: none"];

  const submittedAt = new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" });

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: SMTP_SECURE === "true",
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    // Fail fast instead of hanging the serverless function.
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: OFFICE_EMAIL_TO,
      replyTo: d.email,
      // Free text goes into the subject line: keep it single-line and short.
      subject: `[Web Request] ${oneLine(d.purpose, 80)} - ${oneLine(d.fullName, 60)}`,
      text: [
        "New request from the public website",
        `Submitted: ${submittedAt} (Philippine Time)`,
        "",
        `Full name: ${d.fullName}`,
        `Email: ${d.email}`,
        `Contact number: ${d.phone}`,
        `Address: ${d.address}`,
        `Purpose: ${d.purpose}`,
        "",
        "Details:",
        d.details,
        "",
        ...attachmentInfo,
      ].join("\n"),
      attachments,
    });
  } catch (e) {
    // Log only the error code/message (never credentials) for debugging in server logs.
    console.error("Mail send failed:", e.code || "", e.message);
    return err("We could not send your request right now. Please try again later.", 502);
  }
  return Response.json({ ok: true });
}
