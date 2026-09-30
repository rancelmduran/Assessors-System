"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

const FADE_MS = 450;
const FAILSAFE_MS = 10000; // only if the load event never fires (not a delay)

// Full-screen branded loader. Server-rendered so it shows before JS runs,
// then fades out as soon as the page has finished loading.
export default function Loader() {
  const [phase, setPhase] = useState("loading"); // loading -> leaving -> gone

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let fadeTimer;
    const finish = () => {
      setPhase((p) => (p === "loading" ? (reduce ? "gone" : "leaving") : p));
      if (!reduce) fadeTimer = setTimeout(() => setPhase("gone"), FADE_MS);
    };

    let failsafe;
    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
      failsafe = setTimeout(finish, FAILSAFE_MS);
    }

    // Block keyboard access to the page underneath while the loader is visible.
    const onKey = (e) => {
      if (e.key === "Tab") e.preventDefault();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("load", finish);
      document.removeEventListener("keydown", onKey);
      clearTimeout(failsafe);
      clearTimeout(fadeTimer);
    };
  }, []);

  useEffect(() => {
    if (phase === "gone") return;
    // Lock page scroll while the loader is up (matches the modals' approach).
    const body = document.body;
    const prev = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = prev;
    };
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div className={`site-loader${phase === "leaving" ? " is-leaving" : ""}`} role="status" aria-live="polite" aria-label="Loading">
      <div className="site-loader-inner">
        <Image className="site-loader-logo" src="/masso-logo.png" alt="" width={160} height={160} sizes="160px" priority />
        <div className="site-loader-bar" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}
