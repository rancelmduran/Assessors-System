"use client";
import { useState } from "react";

export default function EmployeeLogin() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      window.location.href = "/office";
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error || "Login failed.");
      setBusy(false);
    }
  }

  return (
    <section>
      <div className="wrap" style={{ maxWidth: 400 }}>
        <h2>Employee / Admin Login</h2>
        <form onSubmit={onSubmit}>
          <label>Username<input name="username" required autoComplete="username" /></label>
          <label>Password<input name="password" type="password" required autoComplete="current-password" /></label>
          <button disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
          {error && <div className="msg-err" role="alert">{error}</div>}
        </form>
        <p><a href="/">&larr; Back to public site</a></p>
      </div>
    </section>
  );
}
