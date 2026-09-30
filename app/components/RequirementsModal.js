"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { requirementItems, pdfUrl } from "../../lib/requirements";

const FOCUSABLE = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";

// "Requirements" button + in-page popup (no navigation, no new tab).
export default function RequirementsModal() {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const triggerRef = useRef(null);
  const dialogRef = useRef(null);
  const headingRef = useRef(null);
  const active = requirementItems.find((i) => i.id === activeId) || null;

  function close() {
    setOpen(false);
    setActiveId(null);
  }

  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden"; // lock background scroll
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`; // avoid layout shift

    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setActiveId(null);
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
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
      triggerRef.current?.focus();
    };
  }, [open]);

  // Move focus to the heading whenever the popup or its view changes; reset inner scroll.
  useEffect(() => {
    if (!open) return;
    headingRef.current?.focus();
    const body = dialogRef.current?.querySelector(".req-body");
    if (body) body.scrollTop = 0;
  }, [open, activeId]);

  return (
    <>
      <div className="req-actions">
        <button type="button" className="req-open" ref={triggerRef} onClick={() => setOpen(true)} aria-haspopup="dialog">
          Requirements
        </button>
      </div>

      {open &&
        createPortal(
          <div
            className="req-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <div className={`req-dialog${active ? " req-dialog-pdf" : ""}`} ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="req-title">
              <div className="req-head">
                <h3 id="req-title" ref={headingRef} tabIndex={-1}>
                  {active ? active.title : "Requirements"}
                </h3>
                <button type="button" className="req-close" onClick={close} aria-label="Close requirements">
                  <span aria-hidden="true">&times;</span> Close
                </button>
              </div>

              <div className={`req-body${active ? " req-body-pdf" : ""}`}>
                {active ? (
                  <>
                    <object className="req-pdf" data={pdfUrl(active)} type="application/pdf" aria-label={`${active.title} (PDF)`}>
                      <p className="req-fallback">
                        Your browser can&apos;t display this PDF here.{" "}
                        <a href={pdfUrl(active)} target="_blank" rel="noopener noreferrer">Open the PDF</a>
                      </p>
                    </object>
                    <div className="req-bar">
                      <button type="button" className="req-back" onClick={() => setActiveId(null)}>
                        <span aria-hidden="true">&larr;</span> Back to list
                      </button>
                      <a className="req-newtab" href={pdfUrl(active)} target="_blank" rel="noopener noreferrer">Open PDF in browser</a>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="req-hint">Select a transaction to view its requirements.</p>
                    <ol className="req-list">
                      {requirementItems.map((item, i) => (
                        <li key={item.id}>
                          <button type="button" className="req-item" onClick={() => setActiveId(item.id)}>
                            <span className="req-num" aria-hidden="true">{i + 1}</span>
                            <span className="req-title">{item.title}</span>
                            <span className="req-chev" aria-hidden="true">&rsaquo;</span>
                          </button>
                        </li>
                      ))}
                    </ol>
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
