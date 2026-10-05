"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { citizensCharter } from "../../lib/citizensCharter";

const FOCUSABLE = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";
const CLOSE_MS = 180; // keep in sync with the .cc-backdrop.is-closing animation

// Clickable Citizen's Charter card + in-page PDF popup (no navigation, no new tab).
// Reuses the Requirements popup styles (.req-*) and behavior: Close button, backdrop click,
// Escape, background scroll lock, focus trap and a fallback "Open the PDF" link.
export default function CitizensCharterViewer() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const triggerRef = useRef(null);
  const dialogRef = useRef(null);
  const headingRef = useRef(null);
  const imgRef = useRef(null);
  const closingRef = useRef(false);
  const timerRef = useRef(0);
  const pdf = citizensCharter.pdf;

  // If the logo failed before hydration, the error event was missed: check once on mount.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setImgFailed(true);
  }, []);

  function openViewer() {
    closingRef.current = false;
    setClosing(false);
    setOpen(true);
  }

  // Plays the short fade/scale-out, then unmounts. Skips the animation for reduced motion.
  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    const finish = () => {
      closingRef.current = false;
      setClosing(false);
      setOpen(false);
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }
    setClosing(true);
    timerRef.current = window.setTimeout(finish, CLOSE_MS);
  }, []);

  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden"; // lock background scroll
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`; // avoid layout shift
    headingRef.current?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") {
        requestClose();
      } else if (e.key === "Tab" && dialogRef.current) {
        const els = [...dialogRef.current.querySelectorAll(FOCUSABLE)];
        if (!els.length) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (!dialogRef.current.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(timerRef.current);
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
      triggerRef.current?.focus();
    };
  }, [open, requestClose]);

  return (
    <>
      <button type="button" className="cc-open" ref={triggerRef} onClick={openViewer} aria-haspopup="dialog">
        <span className="cc-visual">
          {imgFailed ? (
            <svg className="cc-fallback-icon" width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
              <path d="M14 3v5h5M9 13h6M9 17h6" />
            </svg>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              className="cc-img"
              src={citizensCharter.image}
              alt=""
              width={290}
              height={158}
              loading="lazy"
              decoding="async"
              onError={() => setImgFailed(true)}
            />
          )}
        </span>
        <span className="cc-text">
          <span className="cc-title">Read the {citizensCharter.title}</span>
          <span className="cc-sub">Click or tap to open the full document on this page.</span>
          <span className="cc-cta">View the PDF</span>
        </span>
      </button>

      {open &&
        createPortal(
          <div
            className={`req-backdrop cc-backdrop${closing ? " is-closing" : ""}`}
            onClick={(e) => {
              if (e.target === e.currentTarget) requestClose();
            }}
          >
            <div className="req-dialog req-dialog-pdf cc-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="cc-title">
              <div className="req-head">
                <h3 id="cc-title" ref={headingRef} tabIndex={-1}>
                  {citizensCharter.title}
                </h3>
                <button type="button" className="req-close" onClick={requestClose} aria-label="Close Citizen's Charter">
                  <span aria-hidden="true">&times;</span> Close
                </button>
              </div>

              <div className="req-body req-body-pdf">
                <object className="req-pdf" data={`${pdf}#toolbar=1&navpanes=0&view=FitH`} type="application/pdf" aria-label={`${citizensCharter.title} (PDF)`}>
                  <p className="req-fallback">
                    Your browser can&apos;t display this PDF here.{" "}
                    <a href={pdf} target="_blank" rel="noopener noreferrer">Open the PDF</a>
                  </p>
                </object>
                <div className="req-bar cc-bar">
                  <a className="req-newtab" href={pdf} target="_blank" rel="noopener noreferrer">Open PDF in browser</a>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
