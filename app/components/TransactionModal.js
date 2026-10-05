"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import RequirementsModal from "./RequirementsModal";
import TransactionForm from "./TransactionForm";

const FOCUSABLE = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";
// The Requirements popup is a separate dialog; while it is open it handles Escape/Tab itself.
const NESTED = ".req-backdrop:not(.tx-backdrop)";

// Hero "Submit a Transaction / Request" button + in-page popup holding the existing
// Requirements button and transaction form. Once opened, the popup stays mounted (only hidden)
// so a half-filled form and its attachments are not lost if it is closed by accident.
export default function TransactionModal() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef(null);
  const dialogRef = useRef(null);
  const headingRef = useRef(null);

  function openModal() {
    setMounted(true);
    setOpen(true);
  }

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
      if (document.querySelector(NESTED)) return; // Requirements popup is on top
      if (e.key === "Escape") {
        setOpen(false);
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

  return (
    <>
      <button type="button" className="btn btn-primary" ref={triggerRef} onClick={openModal} aria-haspopup="dialog">
        Submit a Transaction / Request
      </button>

      {mounted &&
        createPortal(
          <div
            className="req-backdrop tx-backdrop"
            style={open ? undefined : { display: "none" }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div className="req-dialog tx-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="tx-title">
              <div className="req-head">
                <h3 id="tx-title" ref={headingRef} tabIndex={-1}>
                  Submit a Transaction / Request
                </h3>
                <button type="button" className="req-close" onClick={() => setOpen(false)} aria-label="Close transaction form">
                  <span aria-hidden="true">&times;</span> Close
                </button>
              </div>
              <div className="req-body">
                <p className="tx-lead">No account needed. Fill out the form and your request will be sent to the office.</p>
                <RequirementsModal />
                <TransactionForm />
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
