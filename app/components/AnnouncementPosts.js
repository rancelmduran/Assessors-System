"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PublicIcon from "./PublicIcon";
import styles from "./AnnouncementPosts.module.css";

const FOCUSABLE = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";
const CLOSE_MS = 180; // keep in sync with the .cc-backdrop.is-closing animation
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const STEP = 0.5;

// Announcement cards (title + caption + cover) with an in-page page viewer:
// enlargement/zoom, previous/next, thumbnails, keyboard (Esc, arrows, +/-) and swipe.
// Reuses the existing popup shell (.req-backdrop / .req-dialog) like the Citizen's Charter viewer.
export default function AnnouncementPosts({ posts }) {
  // Empty display slots keep the coverflow visible until real notices fill it.
  const cards = posts.length ? [...posts, ...Array.from({ length: Math.max(0, 5 - posts.length) }, (_, index) => ({
    id: `empty-announcement-slot-${index + 1}`,
    placeholder: true,
    title: "Blank announcement",
    caption: ["A future notice will appear here. Check back for updates from the office."],
    pages: [],
  }))] : [];
  const [cardIndex, setCardIndex] = useState(0);
  const carouselTouch = useRef(null);
  const cardRefs = useRef([]);
  const swiped = useRef(false);
  const [active, setActive] = useState(null); // post being viewed
  const [page, setPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [closing, setClosing] = useState(false);
  const triggerRef = useRef(null);
  const dialogRef = useRef(null);
  const headingRef = useRef(null);
  const stageRef = useRef(null);
  const thumbsRef = useRef(null);
  const closingRef = useRef(false);
  const timerRef = useRef(0);
  const touchX = useRef(null);

  const total = active ? active.pages.length : 0;
  const count = cards.length;
  const selected = count ? cardIndex % count : 0;
  const changeCard = (direction, moveFocus = false) => {
    if (count < 2) return;
    const next = (selected + direction + count) % count;
    setCardIndex(next);
    if (moveFocus) cardRefs.current[next]?.focus({ preventScroll: true });
  };

  const openViewer = (post, startPage, el) => {
    triggerRef.current = el;
    closingRef.current = false;
    setClosing(false);
    setPage(startPage);
    setZoom(1);
    setActive(post);
  };

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    const finish = () => {
      closingRef.current = false;
      setClosing(false);
      setActive(null);
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }
    setClosing(true);
    timerRef.current = window.setTimeout(finish, CLOSE_MS);
  }, []);

  const goTo = useCallback(
    (i) => {
      if (!total) return;
      setPage(Math.min(Math.max(i, 0), total - 1));
      setZoom(1);
      if (stageRef.current) stageRef.current.scrollTo({ top: 0, left: 0 });
    },
    [total]
  );

  const changeZoom = useCallback((delta) => {
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((z + delta) * 100) / 100)));
  }, []);

  useEffect(() => {
    if (!active) return;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden"; // lock background scroll
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    headingRef.current?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") {
        requestClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setPage((p) => Math.min(p + 1, active.pages.length - 1));
        setZoom(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPage((p) => Math.max(p - 1, 0));
        setZoom(1);
      } else if (e.key === "+" || e.key === "=") {
        changeZoom(STEP);
      } else if (e.key === "-" || e.key === "_") {
        changeZoom(-STEP);
      } else if (e.key === "Tab" && dialogRef.current) {
        const els = [...dialogRef.current.querySelectorAll(FOCUSABLE)].filter((el) => !el.disabled);
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
      triggerRef.current?.focus({ preventScroll: true });
    };
  }, [active, requestClose, changeZoom]);

  // Keep the current thumbnail visible.
  useEffect(() => {
    const el = thumbsRef.current?.querySelector('[aria-current="true"]');
    el?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [page, active]);

  const onTouchStart = (e) => {
    touchX.current = zoom === 1 ? e.touches[0].clientX : null;
  };
  const onTouchEnd = (e) => {
    if (touchX.current !== null) {
      const dx = e.changedTouches[0].clientX - touchX.current;
      if (Math.abs(dx) > 50) goTo(page + (dx < 0 ? 1 : -1));
    }
    touchX.current = null;
  };

  const current = active ? active.pages[page] : null;

  if (!count) return null;

  return (
    <>
      <div className={styles.carousel} role="region" aria-roledescription="carousel" aria-label="Office announcements"
        onKeyDown={(e) => {
          if (count > 1 && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
            e.preventDefault();
            changeCard(e.key === "ArrowRight" ? 1 : -1, !!e.target.closest("button[data-announcement-card]"));
          }
        }}>
        <div className={styles.deck}
          onTouchStart={(e) => { carouselTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; swiped.current = false; }}
          onTouchCancel={() => { carouselTouch.current = null; swiped.current = false; }}
          onTouchEnd={(e) => {
            if (!carouselTouch.current) return;
            const dx = e.changedTouches[0].clientX - carouselTouch.current.x;
            const dy = e.changedTouches[0].clientY - carouselTouch.current.y;
            if (count > 1 && Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
              swiped.current = true;
              changeCard(dx < 0 ? 1 : -1);
            }
            carouselTouch.current = null;
          }}>
          <div className={styles.deckGlow} aria-hidden="true" />
          {cards.map((post, index) => {
            let offset = (index - selected + count) % count;
            if (offset > count / 2) offset -= count;
            const distance = Math.abs(offset);
            const excerpt = post.caption.find((line) => !line.includes(post.title)) || "Open this announcement to read the full notice.";
            return (
              <div key={post.id} className={styles.slide} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${count}`}
                aria-hidden={distance > 2 ? "true" : undefined}
                style={{ "--offset": offset, "--distance": distance, zIndex: count - distance, visibility: distance > 2 ? "hidden" : undefined }}>
                <button type="button" ref={(el) => { cardRefs.current[index] = el; }} className={styles.card} data-announcement-card="" data-selected={offset === 0 ? "true" : undefined} tabIndex={offset === 0 ? 0 : -1}
                  onClick={(e) => {
                    if (swiped.current) { swiped.current = false; return; }
                    setCardIndex(index);
                    if (!post.placeholder) openViewer(post, 0, e.currentTarget);
                  }}
                  aria-haspopup={post.placeholder ? undefined : "dialog"} aria-label={post.placeholder ? `Select blank announcement slot ${index + 1}` : `Read ${post.title}`}>
                  <span className={`${styles.photo}${post.placeholder ? ` ${styles.placeholderPhoto}` : ""}`}>
                    {post.placeholder ? <span className={styles.placeholderArt}><PublicIcon name="document" width="56" height="56" /><span>Awaiting an announcement</span></span> : <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={post.pages[0].src} alt={`${post.title}, ${post.pages[0].label}`} width={post.pages[0].width} height={post.pages[0].height} loading="lazy" decoding="async" draggable={false} />
                    <span className={styles.pageBadge}>{post.pages.length > 1 ? `${post.pages.length} pages` : "View image"}</span>
                    </>}
                  </span>
                  <span className={styles.cardBody}>
                    <span className={styles.category}>{post.placeholder ? "PLACEHOLDER" : "PUBLIC NOTICE"} <span aria-hidden="true">/</span> POLANGUI</span>
                    <span className={styles.cardTitle}>{post.title}</span>
                    <span className={styles.excerpt}>{excerpt}</span>
                    {post.dateLabel && <span className={styles.date}>{post.dateLabel}</span>}
                    <span className={styles.cardLink}>{post.placeholder ? "No notice published yet" : <>View announcement <span aria-hidden="true">↗</span></>}</span>
                  </span>
                </button>
              </div>
            );
          })}
        </div>
        <div className={styles.controls}>
          {count > 1 && <button type="button" className={styles.controlButton} aria-label="Previous announcement" onClick={() => changeCard(-1)}>←</button>}
          <div className={styles.position} aria-live="polite" aria-atomic="true"><strong>{String(selected + 1).padStart(2, "0")}</strong><span aria-hidden="true"> / </span><span>{String(count).padStart(2, "0")}</span><span className={styles.positionLabel}>{count === 1 ? "Office announcement" : "Browse notices"}</span></div>
          {count > 1 && <button type="button" className={styles.controlButton} aria-label="Next announcement" onClick={() => changeCard(1)}>→</button>}
        </div>
        {count > 1 && <div className={styles.dots} role="group" aria-label="Choose an announcement">{cards.map((post, index) => <button type="button" key={post.id} aria-label={post.placeholder ? `Show blank announcement slot ${index + 1}` : `Show announcement ${index + 1}: ${post.title}`} aria-current={index === selected ? "true" : undefined} onClick={() => setCardIndex(index)} />)}</div>}
        <p className={styles.hint}>{count > 1 ? "Swipe or use the arrows to explore. Select a published notice to read more." : "Select the card to read the full notice and explore all its pages."}</p>
      </div>

      {active &&
        createPortal(
          <div
            className={`req-backdrop cc-backdrop ${styles.backdrop}${closing ? " is-closing" : ""}`}
            onClick={(e) => {
              if (e.target === e.currentTarget) requestClose();
            }}
          >
            <div className={`req-dialog cc-dialog annv-dialog ${styles.viewer}`} ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="annv-title">
              <div className="req-head">
                <h3 id="annv-title" ref={headingRef} tabIndex={-1}>
                  {active.title}
                </h3>
                <button type="button" className="req-close" onClick={requestClose} aria-label="Close viewer">
                  <span aria-hidden="true">&times;</span> Close
                </button>
              </div>

              <div className={styles.viewerContent}>
              <div className={styles.viewerDocument}>
              <div className="annv-toolbar">
                <span className="annv-page" aria-live="polite">
                  {current.label} <span className="annv-of">({page + 1} of {total})</span>
                </span>
                <div className="annv-zoom" role="group" aria-label="Zoom">
                  <button type="button" className="annv-tool" onClick={() => changeZoom(-STEP)} disabled={zoom <= MIN_ZOOM} aria-label="Zoom out">
                    &minus;
                  </button>
                  <button type="button" className="annv-tool annv-reset" onClick={() => setZoom(1)} disabled={zoom === 1} aria-label="Reset zoom">
                    {Math.round(zoom * 100)}%
                  </button>
                  <button type="button" className="annv-tool" onClick={() => changeZoom(STEP)} disabled={zoom >= MAX_ZOOM} aria-label="Zoom in">
                    +
                  </button>
                  <a className="annv-tool annv-open" href={current.src} target="_blank" rel="noopener noreferrer">
                    Full size
                  </a>
                </div>
              </div>

              <div className="annv-main">
                <button type="button" className="annv-nav annv-prev" onClick={() => goTo(page - 1)} disabled={page === 0} aria-label="Previous page">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M15 5l-7 7 7 7" />
                  </svg>
                </button>
                <div className="annv-stage" ref={stageRef} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} tabIndex={0} aria-label={`${current.label}, scrollable`}>
                  {/* Width scales with zoom; the stage scrolls when zoomed in so table values stay readable. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    key={current.src}
                    className="annv-img"
                    src={current.src}
                    alt={`${active.title}, ${current.label}`}
                    width={current.width}
                    height={current.height}
                    style={{ width: `${zoom * 100}%` }}
                    draggable={false}
                  />
                </div>
                <button type="button" className="annv-nav annv-next" onClick={() => goTo(page + 1)} disabled={page === total - 1} aria-label="Next page">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="annv-thumbs" ref={thumbsRef} role="group" aria-label="Pages">
                {active.pages.map((p, i) => (
                  <button
                    type="button"
                    key={p.src}
                    className={`annv-thumb${i === page ? " is-active" : ""}`}
                    onClick={() => goTo(i)}
                    aria-label={`Go to ${p.label}`}
                    aria-current={i === page ? "true" : undefined}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.src} alt="" width={p.width} height={p.height} loading="lazy" decoding="async" />
                    <span>{p.label.replace("Page ", "")}</span>
                  </button>
                ))}
              </div>
              </div>
              <aside className={styles.viewerCaption} aria-label="Announcement caption">
                <p className={styles.viewerEyebrow}>FROM THE MUNICIPAL ASSESSOR&apos;S OFFICE</p>
                <h4>{active.title}</h4>
                {active.dateLabel && <p className={styles.date}>{active.dateLabel}</p>}
                {active.caption.length ? active.caption.map((line, i) => <p key={i}>{line}</p>) : <p>View the published notice in the image viewer.</p>}
              </aside>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
