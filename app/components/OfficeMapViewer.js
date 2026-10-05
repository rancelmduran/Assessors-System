"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { office } from "../../lib/config";

const FOCUSABLE = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";
const CLOSE_MS = 180; // keep in sync with the .cc-backdrop.is-closing animation

// Office map preview + in-page enlarged viewer (no navigation, no new tab).
// The preview iframe is NOT covered by anything: a small "Click or tap to enlarge" button sits over it so the
// embedded map and its controls (e.g. the Street View thumbnail) stay fully clickable. The popup reuses the existing
// popup styles (.req-*) and fade/scale animation (.cc-*).
export default function OfficeMapViewer() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const triggerRef = useRef(null);
  const dialogRef = useRef(null);
  const headingRef = useRef(null);
  const closingRef = useRef(false);
  const timerRef = useRef(0);
  const { lat, lng } = office.coordinates;
  const src = `https://maps.google.com/maps?q=${lat},${lng}&z=17&output=embed`;

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
      <div className="map-frame">
        <iframe
          title="Map showing the location of the Municipal Assessor's Office"
          src={src}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          tabIndex={-1}
        />
        <button type="button" className="map-open" ref={triggerRef} onClick={openViewer} aria-haspopup="dialog" aria-label="Enlarge the office location map">
          <span className="map-hint" aria-hidden="true">Click or tap to enlarge</span>
        </button>
      </div>

      {open &&
        createPortal(
          <div
            className={`req-backdrop cc-backdrop${closing ? " is-closing" : ""}`}
            onClick={(e) => {
              if (e.target === e.currentTarget) requestClose();
            }}
          >
            <div className="req-dialog map-dialog cc-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="map-title">
              <div className="req-head">
                <h3 id="map-title" ref={headingRef} tabIndex={-1}>
                  Office Location
                </h3>
                <button type="button" className="req-close" onClick={requestClose} aria-label="Close map">
                  <span aria-hidden="true">&times;</span> Close
                </button>
              </div>
              <div className="req-body req-body-pdf">
                <iframe
                  className="map-full"
                  title="Enlarged map showing the location of the Municipal Assessor's Office"
                  src={src}
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
