"use client";
import { useEffect, useState } from "react";

const SHOW_AFTER = 500; // px scrolled before the button appears

export default function ScrollToTop() {
  const [scrolled, setScrolled] = useState(false);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    let raf = 0;
    // State only changes when the value flips, so scrolling does not re-render on every event.
    const check = () => {
      raf = 0;
      setScrolled(window.scrollY > SHOW_AFTER);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    // Hide while a form field is focused so the button never covers form controls.
    const isField = (t) => t instanceof Element && t.matches("input, select, textarea");
    const onFocusIn = (e) => {
      if (isField(e.target)) setTyping(true);
    };
    const onFocusOut = () => setTyping(false);

    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      cancelAnimationFrame(raf);
    };
  }, []);

  function toTop() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      className={`to-top${scrolled && !typing ? " show" : ""}`}
      onClick={toTop}
      aria-label="Scroll to top"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
