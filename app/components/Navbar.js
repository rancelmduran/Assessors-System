"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./Navbar.module.css";

const baseLinks = [
  { href: "#services", label: "Services", icon: "services" },
  { href: "#about", label: "About", icon: "about" },
  { href: "#citizens-charter", label: "Charter", icon: "charter" },
  { href: "#faq", label: "FAQs", icon: "faq" },
  { href: "#office-location", label: "Visit us", icon: "location" },
];
const announcementsLink = { href: "#announcements", label: "Notices", icon: "announcements" };

// Inline icons for the mobile dock (no icon library needed).
const ICONS = {
  services: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  faq: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M12 17h.01" /></>,
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
  const links = useMemo(() => (showAnnouncements ? [baseLinks[0], announcementsLink, ...baseLinks.slice(1)] : baseLinks), [showAnnouncements]);
  const dockLinks = links.filter((link) => ["services", "announcements", "faq", "location"].includes(link.icon));
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);
  const dockRef = useRef(null);
  const [active, setActive] = useState("");

  // Close the mobile menu on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const closeAll = () => setMenuOpen(false);
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
  }, [menuOpen]);

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

  // Mobile dock: hides only after meaningful downward scrolling, shows again after a short upward scroll, and a
  // cooldown stops rapid toggling. Class toggles only (no re-renders), one rAF-throttled passive listener,
  // attached only on mobile widths.
  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;
    const root = document.documentElement;
    const mq = window.matchMedia("(max-width: 899px)");
    const TOP_ZONE = 24; // always visible this close to the top
    const HIDE_AFTER = 120; // px scrolled down (in one direction) before hiding
    const SHOW_AFTER = 48; // px scrolled up (in one direction) before showing
    const MIN_HIDE_Y = 160; // never hide before the page has really been scrolled
    const COOLDOWN = 700; // ms, roughly the slide duration: no re-toggle mid-animation
    let lastY = window.scrollY;
    let anchor = lastY; // scroll position where the current direction started
    let dir = 0;
    let lastToggle = 0;
    let raf = 0;
    let hidden = false;
    let typing = false;

    const set = (h) => {
      if (h === hidden) return;
      hidden = h;
      lastToggle = performance.now();
      dock.classList.toggle("is-hidden", h);
      root.classList.toggle("dock-hidden", h);
    };
    const update = () => {
      raf = 0;
      if (typing) return;
      const y = Math.max(0, window.scrollY);
      const dy = y - lastY;
      lastY = y;

      if (y <= TOP_ZONE) {
        set(false);
        anchor = y;
        return;
      }
      if (y + window.innerHeight >= document.documentElement.scrollHeight - 4) {
        set(true); // never cover the last bit of the page
        anchor = y;
        return;
      }
      if (dy === 0) return;
      const d = dy > 0 ? 1 : -1;
      if (d !== dir) {
        dir = d;
        anchor = y - dy; // direction changed: measure from where it changed
      }
      if (performance.now() - lastToggle < COOLDOWN) return;
      const travel = Math.abs(y - anchor);
      if (d > 0 && y > MIN_HIDE_Y && travel >= HIDE_AFTER) set(true);
      else if (d < 0 && travel >= SHOW_AFTER) set(false);
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
      lastY = anchor = window.scrollY;
      dir = 0;
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

      <button
        type="button"
        className="nav-btn nav-toggle"
        aria-label="Menu"
        aria-expanded={menuOpen}
        aria-controls="nav-menu"
        onClick={() => {
          setMenuOpen((o) => !o);
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

    {/* Common public tasks; the footer retains links to the full office information. */}
    <nav className={`dock ${styles.dock}`} ref={dockRef} aria-label="Quick navigation">
      {dockLinks.map((l) => (
        <a key={l.href} href={l.href} aria-label={l.label} data-label={l.label} aria-current={active === l.href.slice(1) ? "true" : undefined}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {ICONS[l.icon]}
          </svg>
          <span className={styles.dockLabel}>{l.label}</span>
        </a>
      ))}
    </nav>

    </>
  );
}
