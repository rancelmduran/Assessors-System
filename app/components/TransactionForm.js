"use client";
import { useState } from "react";
import { upload } from "../../lib/config";

const mb = (n) => (n / 1024 / 1024).toFixed(1);

export default function TransactionForm() {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState({ type: "idle", text: "" });

  function addFiles(list) {
    const next = [...files];
    for (const f of list) {
      if (!upload.allowedTypes.includes(f.type)) {
        setStatus({ type: "error", text: `"${f.name}" is not allowed. Use PDF, JPG or PNG.` });
        return;
      }
      next.push(f);
    }
    const total = next.reduce((s, f) => s + f.size, 0);
    if (next.length > upload.maxFiles || total > upload.maxTotalBytes) {
      setStatus({ type: "error", text: `Maximum ${upload.maxFiles} files, ${mb(upload.maxTotalBytes)} MB total.` });
      return;
    }
    setFiles(next);
    setStatus({ type: "idle", text: "" });
  }

  function onPaste(e) {
    const pasted = [...e.clipboardData.files];
    if (pasted.length) {
      e.preventDefault();
      addFiles(pasted);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    data.delete("files");
    files.forEach((f) => data.append("files", f));
    setStatus({ type: "sending", text: "Sending..." });
    try {
      const res = await fetch("/api/transaction", { method: "POST", body: data });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Something went wrong. Please try again.");
      form.reset();
      setFiles([]);
      setStatus({ type: "success", text: "Your request was sent to the Municipal Assessor's Office. Thank you." });
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    }
  }

  return (
    <form onSubmit={onSubmit} onPaste={onPaste}>
      <label>Full name *<input name="fullName" required maxLength={120} /></label>
      <label>Email *<input name="email" type="email" required maxLength={120} /></label>
      <label>Contact number *<input name="phone" required maxLength={30} /></label>
      <label>Address *<input name="address" required maxLength={250} /></label>
      <label>Purpose *<input name="purpose" required maxLength={150} placeholder="State the purpose of your request" /></label>
      <label>Details *<textarea name="details" rows={5} required maxLength={3000} /></label>
      <label>Attachments (PDF, JPG, PNG; you can also paste images here)
        <input
          name="files"
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => { addFiles([...e.target.files]); e.target.value = ""; }}
        />
        <ul className="files">
          {files.map((f, i) => (
            <li key={i}>
              <span>{f.name || "pasted-file"} ({mb(f.size)} MB)</span>
              <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))}>x</button>
            </li>
          ))}
        </ul>
      </label>
      <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <button disabled={status.type === "sending"}>{status.type === "sending" ? "Sending..." : "Submit request"}</button>
      {status.type === "success" && <div className="msg-ok" role="status">{status.text}</div>}
      {status.type === "error" && <div className="msg-err" role="alert">{status.text}</div>}
    </form>
  );
}
