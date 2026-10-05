"use client";
import { useEffect, useMemo, useRef, useState } from "react";

const baseLinks = [
  { href: "#about", label: "About", icon: "about" },
  { href: "#mission-vision", label: "Mission / Vision", icon: "vision" },
  { href: "#citizens-charter", label: "Citizen's Charter", icon: "charter" },
  { href: "#office-location", label: "Location", icon: "location" },
  { href: "#org-chart", label: "Employees", icon: "employees" },
];
const announcementsLink = { href: "#announcements", label: "Announcements", icon: "announcements" };

// Inline icons for the mobile dock (no icon library needed).
const ICONS = {
  about: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </>
  ),
  vision: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  charter: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </>
  ),
  location: (
    <>
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  employees: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  announcements: (
    <>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </>
  ),
};

export default function Navbar({ showAnnouncements = false }) {
  // The shortcut only exists when the Announcements section is rendered (it is hidden when there are no images).
  const links = useMemo(() => (showAnnouncements ? [...baseLinks, announcementsLink] : baseLinks), [showAnnouncements]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navRef = useRef(null);
  const dockRef = useRef(null);
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
  }, [links]);

  // Mobile dock: hide while scrolling down, show while scrolling up / at the top. Class toggles only (no re-renders),
  // one rAF-throttled passive listener, attached only on mobile widths.
  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;
    const root = document.documentElement;
    const mq = window.matchMedia("(max-width: 899px)");
    let last = window.scrollY;
    let raf = 0;
    let hidden = false;
    let typing = false;

    const set = (h) => {
      if (h === hidden) return;
      hidden = h;
      dock.classList.toggle("is-hidden", h);
      root.classList.toggle("dock-hidden", h);
    };
    const update = () => {
      raf = 0;
      if (typing) return;
      const y = Math.max(0, window.scrollY);
      const atBottom = y + window.innerHeight >= document.documentElement.scrollHeight - 4;
      if (y <= 24) {
        set(false);
      } else if (atBottom) {
        set(true); // never cover the last bit of the page
      } else if (Math.abs(y - last) >= 8) {
        set(y > last);
      } else {
        return;
      }
      last = y;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    // Tuck the dock away while a form field is focused (on-screen keyboard).
    const isField = (t) => t instanceof Element && t.matches("input, select, textarea");
    const onFocusIn = (e) => {
      if (isField(e.target)) {
        typing = true;
        set(true);
      }
    };
    const onFocusOut = () => {
      typing = false;
    };

    const detach = () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      cancelAnimationFrame(raf);
      raf = 0;
      set(false);
    };
    const attach = () => {
      detach();
      if (!mq.matches) return;
      last = window.scrollY;
      window.addEventListener("scroll", onScroll, { passive: true });
      document.addEventListener("focusin", onFocusIn);
      document.addEventListener("focusout", onFocusOut);
      update();
    };
    attach();
    mq.addEventListener("change", attach);
    return () => {
      mq.removeEventListener("change", attach);
      detach();
    };
  }, []);

  // Glass navbar: a class on the header strengthens its background once the page is scrolled (class toggle only, no re-render).
  useEffect(() => {
    const header = navRef.current?.closest("header");
    if (!header) return;
    const update = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      header.classList.remove("is-scrolled");
    };
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
    <>
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
          className="nav-btn nav-login"
          aria-label="Employee / Admin login"
          aria-expanded={loginOpen}
          onClick={() => {
            setLoginOpen((o) => !o);
            setMenuOpen(false);
          }}
        >
          <svg className="ico-lines" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
          <svg className="ico-gear" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

    {/* Mobile-only floating dock (hidden on desktop via CSS). Same destinations as the desktop links. */}
    <nav className="dock" ref={dockRef} aria-label="Quick navigation">
      {links.map((l) => (
        <a key={l.href} href={l.href} aria-label={l.label} data-label={l.label} aria-current={active === l.href.slice(1) ? "true" : undefined}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {ICONS[l.icon]}
          </svg>
        </a>
      ))}
    </nav>
    </>
  );
}
