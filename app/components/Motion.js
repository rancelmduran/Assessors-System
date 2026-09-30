"use client";
import { useEffect } from "react";

// Motion layer for the public page. Skipped entirely when reduced motion is requested.
//  - Parallax: elements with [data-parallax="<speed>"] (decorative only).
//  - Reveal:   elements with .reveal fade in once via IntersectionObserver.
//  - Tilt:     elements with [data-tilt] react to a fine (mouse) pointer only.
//
// Parallax is stateless per frame: every animation frame reads the CURRENT scroll
// position and updates every layer. No layer is ever marked inactive, so scrolling
// up, down, changing direction, or resuming after a long idle always works.
export default function Motion() {
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let stop = null;

    function attachTilt(el) {
      const MAX = 3; // max degrees
      let raf = 0;
      let cx = 0;
      let cy = 0;

      function apply() {
        raf = 0;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const px = Math.min(1, Math.max(0, (cx - r.left) / r.width));
        const py = Math.min(1, Math.max(0, (cy - r.top) / r.height));
        el.style.setProperty("--rx", `${((0.5 - py) * MAX * 2).toFixed(2)}deg`);
        el.style.setProperty("--ry", `${((px - 0.5) * MAX * 2).toFixed(2)}deg`);
        el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
        el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
      }
      function isMouse(e) {
        return !e.pointerType || e.pointerType === "mouse";
      }
      function onEnter(e) {
        if (isMouse(e)) el.classList.add("tilting");
      }
      function onMove(e) {
        if (!isMouse(e)) return;
        cx = e.clientX;
        cy = e.clientY;
        if (!raf) raf = requestAnimationFrame(apply);
      }
      function reset() {
        cancelAnimationFrame(raf);
        raf = 0;
        el.classList.remove("tilting");
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
      }

      el.addEventListener("pointerenter", onEnter);
      el.addEventListener("pointermove", onMove, { passive: true });
      el.addEventListener("pointerleave", reset);
      return () => {
        el.removeEventListener("pointerenter", onEnter);
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", reset);
        cancelAnimationFrame(raf);
        el.classList.remove("tilting");
        ["--rx", "--ry", "--mx", "--my"].forEach((p) => el.style.removeProperty(p));
      };
    }

    function start() {
      const layers = [...document.querySelectorAll("[data-parallax]")].map((el) => ({
        el,
        speed: parseFloat(el.dataset.parallax) || 0,
        parent: el.parentElement,
        top: 0,
        height: 0,
        last: null,
      }));
      const revealEls = [...document.querySelectorAll(".reveal")];
      let vh = window.innerHeight;
      let scale = 1;
      let frameId = 0; // pending scroll frame (0 = none)
      let measureId = 0; // pending measure frame (0 = none)
      let idleTimer = 0;

      // Reveal: show what is already in view immediately (no flash), then observe the rest.
      revealEls.forEach((el) => {
        if (el.getBoundingClientRect().top < vh * 0.92) el.classList.add("in");
      });
      root.classList.add("motion");
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("in");
              io.unobserve(e.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -8% 0px" }
      );
      revealEls.forEach((el) => {
        if (!el.classList.contains("in")) io.observe(el);
      });

      // Pointer-reactive cards only for devices with a real hover pointer.
      const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      const tiltCleanups = fine ? [...document.querySelectorAll("[data-tilt]")].map(attachTilt) : [];

      // Always uses the current scroll position; updates every layer (a few cheap writes).
      function frame() {
        frameId = 0;
        const y = window.scrollY;
        for (const l of layers) {
          const offset = (y + vh / 2 - (l.top + l.height / 2)) * l.speed * scale;
          const value = offset.toFixed(1);
          if (value !== l.last) {
            l.last = value;
            l.el.style.transform = `translate3d(0, ${value}px, 0)`;
          }
        }
      }

      function requestFrame() {
        if (!frameId) frameId = requestAnimationFrame(frame);
      }

      // Reads layout (all reads first), then applies a frame. Runs on load/resize/idle, not per scroll.
      function measure() {
        measureId = 0;
        vh = window.innerHeight;
        const w = window.innerWidth;
        scale = w < 700 ? 0.5 : w < 1024 ? 0.75 : 1;
        const y = window.scrollY;
        for (const l of layers) {
          const r = l.parent.getBoundingClientRect();
          l.top = r.top + y;
          l.height = r.height;
        }
        frame();
      }

      function scheduleMeasure() {
        if (!measureId) measureId = requestAnimationFrame(measure);
      }

      function onScroll() {
        requestFrame();
        // Re-sync cached positions shortly after scrolling stops (never disables anything).
        clearTimeout(idleTimer);
        idleTimer = setTimeout(scheduleMeasure, 200);
      }

      function onVisible() {
        if (!document.hidden) scheduleMeasure();
      }

      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", scheduleMeasure, { passive: true });
      window.addEventListener("orientationchange", scheduleMeasure);
      window.addEventListener("load", scheduleMeasure);
      window.addEventListener("pageshow", scheduleMeasure);
      document.addEventListener("visibilitychange", onVisible);
      const ro = new ResizeObserver(scheduleMeasure); // page height changes (images/fonts)
      ro.observe(document.body);
      measure();

      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", scheduleMeasure);
        window.removeEventListener("orientationchange", scheduleMeasure);
        window.removeEventListener("load", scheduleMeasure);
        window.removeEventListener("pageshow", scheduleMeasure);
        document.removeEventListener("visibilitychange", onVisible);
        ro.disconnect();
        io.disconnect();
        tiltCleanups.forEach((c) => c());
        clearTimeout(idleTimer);
        cancelAnimationFrame(frameId);
        cancelAnimationFrame(measureId);
        frameId = 0;
        measureId = 0;
        layers.forEach((l) => (l.el.style.transform = ""));
        root.classList.remove("motion");
      };
    }

    function sync() {
      if (stop) {
        stop();
        stop = null;
      }
      if (!mq.matches) stop = start();
    }

    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      if (stop) stop();
    };
  }, []);

  return null;
}
