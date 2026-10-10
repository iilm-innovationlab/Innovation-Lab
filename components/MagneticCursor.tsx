"use client";
import { useEffect, useRef } from "react";

function isDarkArea(el: Element | null) {
  if (!el) return false;
  const darkSelector = ".reels,.footer,.about-bnv,.community-founder,.opportunity.dark,.mobile-menu,.fun-playground,.bnv";
  if (el.closest(darkSelector)) return true;

  let node: Element | null = el;
  for (let i = 0; i < 5 && node; i++, node = node.parentElement) {
    const bg = window.getComputedStyle(node).backgroundColor;
    const match = bg.match(/rgba?\(([^)]+)\)/);
    if (!match) continue;
    const parts = match[1].split(",").map(v => parseFloat(v.trim()));
    if (parts.length < 3) continue;
    const alpha = parts[3] ?? 1;
    if (alpha < 0.2) continue;
    const luminance = (0.2126 * parts[0] + 0.7152 * parts[1] + 0.0722 * parts[2]) / 255;
    if (luminance < 0.34) return true;
    if (luminance > 0.72) return false;
  }
  return false;
}

export default function MagneticCursor() {
  const bulb = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let x = -100, y = -100, raf = 0;
    let dark = false;

    const move = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      dark = isDarkArea(document.elementFromPoint(x, y));
      bulb.current?.classList.toggle("bulb-glow", dark);
    };

    const tick = () => {
      if (bulb.current) bulb.current.style.transform = `translate3d(${x}px,${y}px,0)`;
      raf = requestAnimationFrame(tick);
    };

    const click = (e: MouseEvent) => {
      const spark = document.createElement("span");
      spark.className = "cursor-spark";
      spark.style.left = `${e.clientX}px`;
      spark.style.top = `${e.clientY}px`;
      spark.textContent = "✦";
      document.body.appendChild(spark);
      window.setTimeout(() => spark.remove(), 560);
    };
    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("click", click, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("click", click);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <>
    <div ref={bulb} className="cursor-bulb" aria-hidden="true">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16 4.5a8.1 8.1 0 0 0-4.8 14.6c.9.7 1.4 1.6 1.4 2.7h6.8c0-1.1.5-2 1.4-2.7A8.1 8.1 0 0 0 16 4.5Z" />
        <path d="M13.1 25h5.8M14 28h4" />
      </svg>
      <span className="cursor-bulb-glow" />
    </div>
  </>;
}
