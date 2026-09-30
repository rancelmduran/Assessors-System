"use client";
import { useEffect, useRef, useState } from "react";

const links = [
  { href: "#about", label: "About" },
  { href: "#mission-vision", label: "Mission / Vision" },
  { href: "#org-chart", label: "Employees" },
  { href: "#transaction", label: "Transact / Request" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navRef = useRef(null);
  const [active, setActive] = useState("");

  // Close the mobile menu / login panel on outside click or Escape.
  useEffect(() => {
    if (!menuOpen && !loginOpen) return;
    const closeAll = () => {
      setMenuOpen(false);
      setLoginOpen(false);
    };
    const onDown = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) closeAll();
    };
    const onKey = (e) => {
      if (e.key === "Escape") closeAll();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, loginOpen]);

  // Highlight the link of the section currently in view (state changes only when the section changes).
  useEffect(() => {
    const ids = links.map((l) => l.href.slice(1));
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length || !("IntersectionObserver" in window)) return;
    const visible = new Set();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id)));
        setActive(ids.find((id) => visible.has(id)) || "");
      },
      { rootMargin: "-35% 0px -55% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Uses the existing authentication endpoint: POST /api/auth/login
  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        window.location.href = "/office";
        return;
      }
      const json = await res.json().catch(() => ({}));
      setError(json.error || "Login failed.");
    } catch {
      setError("Login failed. Please try again.");
    }
    setBusy(false);
  }

  return (
    <nav className="nav" ref={navRef} aria-label="Main navigation">
      <div id="nav-menu" className={`nav-links${menuOpen ? " open" : ""}`}>
        {links.map((l) => (
          <a key={l.href} href={l.href} aria-current={active === l.href.slice(1) ? "true" : undefined} onClick={() => setMenuOpen(false)}>
            {l.label}
          </a>
        ))}
      </div>

      <div className="nav-tools">
        <button
          type="button"
          className="nav-btn"
          aria-label="Employee / Admin login"
          aria-expanded={loginOpen}
          onClick={() => {
            setLoginOpen((o) => !o);
            setMenuOpen(false);
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
        {loginOpen && (
          <div className="nav-panel" role="dialog" aria-label="Employee / Admin Login">
            <strong>Employee / Admin Login</strong>
            <form onSubmit={onSubmit}>
              <label>Username<input name="username" required autoFocus autoComplete="username" /></label>
              <label>Password<input name="password" type="password" required autoComplete="current-password" /></label>
              <button disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
              {error && <div className="msg-err" role="alert">{error}</div>}
            </form>
          </div>
        )}
      </div>

      <button
        type="button"
        className="nav-btn nav-toggle"
        aria-label="Menu"
        aria-expanded={menuOpen}
        aria-controls="nav-menu"
        onClick={() => {
          setMenuOpen((o) => !o);
          setLoginOpen(false);
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          {menuOpen ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>
    </nav>
  );
}
