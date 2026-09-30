"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

// Clickable org chart thumbnail + in-page fullscreen viewer (no new tab, no navigation).
export default function OrgChartViewer() {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const triggerRef = useRef(null);
  const closeRef = useRef(null);
  const boxRef = useRef(null); // scrollable lightbox
  const imgRef = useRef(null);
  const anchorRef = useRef(null); // tapped point, so the zoom keeps it under the finger

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

  function toggleZoom(e) {
    const r = e.currentTarget.getBoundingClientRect();
    anchorRef.current = {
      fx: (e.clientX - r.left) / r.width,
      fy: (e.clientY - r.top) / r.height,
      x: e.clientX,
      y: e.clientY,
    };
    setZoom((z) => !z);
  }

  // After the size changes, scroll so the tapped spot of the chart stays where it was tapped.
  useLayoutEffect(() => {
    const a = anchorRef.current;
    anchorRef.current = null;
    const box = boxRef.current;
    const img = imgRef.current;
    if (!a || !box || !img) return;
    const r = img.getBoundingClientRect();
    box.scrollLeft += r.left + a.fx * r.width - a.x;
    box.scrollTop += r.top + a.fy * r.height - a.y;
  }, [zoom]);

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
            ref={boxRef}
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
              ref={imgRef}
              className={`lightbox-img${zoom ? " zoomed" : ""}`}
              src="/org-chart.png"
              alt="Organizational chart of the Municipal Assessor's Office (enlarged)"
              width={2134}
              height={1600}
              decoding="async"
              onClick={toggleZoom}
              title={zoom ? "Click to fit the screen" : "Click to zoom in"}
            />
          </div>,
          document.body
        )}
    </>
  );
}
