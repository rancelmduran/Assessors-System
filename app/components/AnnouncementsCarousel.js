"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const INTERVAL = 4500; // ms between automatic slides
const TRANSITION = 600; // ms, keep in sync with the inline transition below

export default function AnnouncementsCarousel({ images }) {
  const n = images.length;
  // One extra copy of the first image at the end gives a seamless right-to-left loop.
  const slides = n > 1 ? [...images, images[0]] : images;
  const [idx, setIdx] = useState(0);
  const [anim, setAnim] = useState(true);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const idxRef = useRef(0);
  const lock = useRef(false);
  const timer = useRef(0);
  const raf = useRef(0);
  const touchX = useRef(null);

  useEffect(() => {
    idxRef.current = idx;
  }, [idx]);

  // Respect reduced motion: no auto-slide, no transitions (buttons/swipe still change slides instantly).
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      cancelAnimationFrame(raf.current);
    },
    []
  );

  const nextFrame = (fn) => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      raf.current = requestAnimationFrame(fn);
    });
  };

  const go = useCallback(
    (dir) => {
      if (n < 2) return;
      if (reduced) {
        setIdx((i) => (i + dir + n) % n);
        return;
      }
      if (lock.current) return;
      lock.current = true;

      if (dir > 0) {
        setAnim(true);
        setIdx((i) => i + 1);
      } else if (idxRef.current === 0) {
        // Step back from the first slide: jump (invisibly) to the end copy, then slide to the last image.
        setAnim(false);
        setIdx(n);
        nextFrame(() => {
          setAnim(true);
          setIdx(n - 1);
        });
      } else {
        setAnim(true);
        setIdx((i) => i - 1);
      }

      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        if (idxRef.current >= n) {
          // Reached the end copy: snap back to the real first slide without animating.
          setAnim(false);
          setIdx(0);
          nextFrame(() => setAnim(true));
        }
        lock.current = false;
      }, TRANSITION + 80);
    },
    [n, reduced]
  );

  useEffect(() => {
    if (n < 2 || paused || reduced) return;
    const t = setInterval(() => go(1), INTERVAL);
    return () => clearInterval(t);
  }, [n, paused, reduced, go]);

  const onTouchStart = (e) => {
    touchX.current = e.touches[0].clientX;
    setPaused(true);
  };
  const onTouchEnd = (e) => {
    if (touchX.current !== null) {
      const dx = e.changedTouches[0].clientX - touchX.current;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    }
    touchX.current = null;
    setPaused(false);
  };

  if (!n) return null;
  const current = idx % n;

  return (
    <div
      className="ann"
      role="region"
      aria-roledescription="carousel"
      aria-label="Announcements"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div className="ann-viewport">
        <div
          className="ann-track"
          style={{
            transform: `translate3d(-${idx * 100}%, 0, 0)`,
            transition: anim && !reduced ? `transform ${TRANSITION}ms cubic-bezier(.4, 0, .2, 1)` : "none",
          }}
        >
          {slides.map((src, i) => {
            const isClone = n > 1 && i === n;
            return (
              <div className="ann-slide" key={`${src}-${i}`} aria-hidden={i !== current || isClone ? "true" : undefined}>
                <Image
                  className="ann-img"
                  src={src}
                  alt={isClone ? "" : `Announcement ${i + 1} of ${n}`}
                  fill
                  sizes="(max-width: 1100px) 100vw, 1040px"
                  priority={i === 0}
                  draggable={false}
                />
              </div>
            );
          })}
        </div>
      </div>

      {n > 1 && (
        <>
          <button type="button" className="ann-btn ann-prev" aria-label="Previous announcement" onClick={() => go(-1)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button type="button" className="ann-btn ann-next" aria-label="Next announcement" onClick={() => go(1)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
