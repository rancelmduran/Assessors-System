"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

// Clickable org chart thumbnail + in-page fullscreen viewer (no new tab, no navigation).
export default function OrgChartViewer() {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const triggerRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden"; // lock background scroll
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`; // avoid layout shift
    closeRef.current?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setZoom(false);
      } else if (e.key === "Tab") {
        e.preventDefault(); // the close button is the only focusable control
        closeRef.current?.focus();
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

  function close() {
    setOpen(false);
    setZoom(false);
  }

  return (
    <>
      <div className="org-scroll">
        <button
          type="button"
          className="org-open"
          ref={triggerRef}
          onClick={() => setOpen(true)}
          aria-label="Open the organizational chart in a full-screen viewer"
        >
          <Image
            className="org-img"
            src="/org-chart.png"
            alt="Organizational chart of the Municipal Assessor's Office"
            width={2134}
            height={1600}
            sizes="(max-width: 899px) 640px, 1040px"
            quality={90}
          />
        </button>
      </div>

      {open &&
        createPortal(
          <div
            className="lightbox"
            role="dialog"
            aria-modal="true"
            aria-label="Organizational chart viewer"
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <button type="button" className="lightbox-close" ref={closeRef} onClick={close} aria-label="Close organizational chart viewer">
              <span aria-hidden="true">&times;</span> Close
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={`lightbox-img${zoom ? " zoomed" : ""}`}
              src="/org-chart.png"
              alt="Organizational chart of the Municipal Assessor's Office (enlarged)"
              width={2134}
              height={1600}
              decoding="async"
              onClick={() => setZoom((z) => !z)}
              title={zoom ? "Click to fit the screen" : "Click to zoom in"}
            />
          </div>,
          document.body
        )}
    </>
  );
}
