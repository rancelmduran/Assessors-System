"use client";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { upload } from "../../lib/config";

const mb = n => (n / 1024 / 1024).toFixed(1);
const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function TransactionForm({ defaultPurpose = "", active = true }) {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState({ type: "idle", text: "" });
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);
  const challenge = useRef(null), widget = useRef(null), sending = useRef(false);

  useEffect(() => {
    if (!active || !siteKey || !window.turnstile || !challenge.current) return;
    widget.current = window.turnstile.render(challenge.current, {
      sitekey: siteKey, action: "public_request", "response-field": false, size: "flexible",
      callback: value => setToken(value),
      "expired-callback": () => setToken(""),
      "error-callback": () => { setToken(""); setStatus({ type: "error", text: "Security check unavailable. Please retry the check or contact the office." }); },
    });
    return () => {
      if (widget.current !== null) window.turnstile?.remove(widget.current);
      widget.current = null;
      setToken("");
    };
  }, [active, ready]);

  function resetChallenge() {
    setToken("");
    if (widget.current !== null) window.turnstile?.reset(widget.current);
  }
  function addFiles(list) {
    const next = [...files, ...list];
    if (next.some(file => !upload.allowedTypes.includes(file.type) || !file.size)) {
      setStatus({ type: "error", text: "Use nonempty PDF, JPG or PNG files." }); return;
    }
    if (next.length > upload.maxFiles || next.reduce((sum, file) => sum + file.size, 0) > upload.maxTotalBytes) {
      setStatus({ type: "error", text: `Maximum ${upload.maxFiles} files, ${mb(upload.maxTotalBytes)} MB total.` }); return;
    }
    setFiles(next);
    setStatus({ type: "idle", text: "" });
  }
  async function onSubmit(event) {
    event.preventDefault();
    if (sending.current) return;
    if (!token) { setStatus({ type: "error", text: "Please complete the security check." }); return; }
    const form = event.currentTarget;
    const data = new FormData(form);
    data.delete("files");
    files.forEach(file => data.append("files", file));
    data.set("cf-turnstile-response", token);
    sending.current = true;
    setStatus({ type: "sending", text: "Sending…" });
    try {
      const response = await fetch("/api/transaction", { method: "POST", body: data, signal: AbortSignal.timeout(45000) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) throw new Error(result.error || "Delivery could not be confirmed. Please contact the office before resubmitting.");
      form.reset(); setFiles([]);
      setStatus({ type: "success", text: "Your request was emailed to the Municipal Assessor's Office. The office will review it; this is not confirmation of approval or processing." });
    } catch (error) {
      setStatus({ type: "error", text: error.name === "TimeoutError" || error.name === "TypeError" ? "Delivery could not be confirmed. Please contact the office before resubmitting." : error.message });
    } finally { sending.current = false; resetChallenge(); }
  }
  return (
    <form onSubmit={onSubmit} onPaste={event => { if (event.clipboardData.files.length) { event.preventDefault(); addFiles([...event.clipboardData.files]); } }}>
      <p className="notice">Your information and attachments will be emailed to the office to handle your request. Include only the documents needed for your service.</p>
      <label>Full name *<input name="fullName" autoComplete="name" required maxLength={120} /></label>
      <label>Email *<input name="email" type="email" autoComplete="email" required maxLength={120} /></label>
      <label>Contact number *<input name="phone" type="tel" autoComplete="tel" required maxLength={30} /></label>
      <label>Address *<input name="address" autoComplete="street-address" required maxLength={250} /></label>
      <label>Purpose *<input name="purpose" defaultValue={defaultPurpose} required maxLength={150} placeholder="State the purpose of your request" /></label>
      <label>Details *<textarea name="details" rows={5} required maxLength={3000} /></label>
      <label>Attachments (PDF, JPG, PNG; maximum 5 files and 4 MB total)
        <input name="files" type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={event => { addFiles([...event.target.files]); event.target.value = ""; }} />
      </label>
      <ul className="files">{files.map((file,index) => <li key={index}><span>{file.name || "pasted-file"} ({mb(file.size)} MB)</span><button type="button" aria-label={`Remove ${file.name || "attachment"}`} onClick={() => setFiles(files.filter((_,i) => i !== index))}>×</button></li>)}</ul>
      <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {active && siteKey && <Script id="public-turnstile" src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={() => setReady(true)} onError={() => setStatus({ type: "error", text: "Security check could not load. Please contact the office or try again later." })} />}
      <div className="tx-verification"><p>Complete the security check to send your request.</p><div ref={challenge} />{siteKey ? <button type="button" onClick={resetChallenge} disabled={status.type === "sending"}>Restart security check</button> : <p role="status">Online requests are temporarily unavailable. Please contact the office directly.</p>}</div>
      <button type="submit" disabled={!token || status.type === "sending"}>{status.type === "sending" ? "Sending…" : "Submit request"}</button>
      {status.type === "success" && <div className="msg-ok" role="status">{status.text}</div>}
      {status.type === "error" && <div className="msg-err" role="alert">{status.text}</div>}
    </form>
  );
}
