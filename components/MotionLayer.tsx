"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Grids/lists whose direct children get a light staggered entrance (opacity + transform only).
const STAGGER_GROUPS = [
  ".portfolio-grid", ".problem-grid", ".team-grid-rich", ".team-grid-card", ".team-page-grid", ".team-card-grid",
  ".explorer-grid", ".opportunity-grid", ".public-event-grid", ".event-grid", ".star-ideators-public-grid",
  ".join-choice-grid", ".maturity-journey", ".manifesto-list", ".ecosystem-intro", ".community-count-grid", ".resource-grid",
];
// Sections whose looping animations are paused while off-screen.
const PAUSE_TARGETS = ".section,.hero-award,.ticker,.footer,.bnv,.reels,.fun-playground,.community-block,.visual-story";

export default function MotionLayer() {
  const bar = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Scroll progress bar: one passive listener, rAF-throttled, transform only.
  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    let frame = 0;
    const paint = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      el.style.transform = `scaleX(${max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0})`;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(paint); };
    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { if (frame) cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, [pathname]);

  // Low-end / data-saver devices get a lighter motion mode.
  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const lite = nav.connection?.saveData === true || (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) || (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 2);
    document.documentElement.classList.toggle("motion-lite", lite);
  }, []);

  // Staggered reveals + pause off-screen loops. Re-runs on route change.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timers: number[] = [];
    const cleanups: Array<() => void> = [];

    const setup = window.setTimeout(() => {
      const revealIO = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          revealIO.unobserve(el);
          el.classList.add("fx-in");
          const delay = parseInt(el.style.getPropertyValue("--fx-d") || "0", 10) || 0;
          // Remove helper classes afterwards so normal hover transitions are untouched.
          timers.push(window.setTimeout(() => { el.classList.remove("fx", "fx-in"); el.style.removeProperty("--fx-d"); }, delay + 1000));
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

      STAGGER_GROUPS.forEach((selector) => {
        document.querySelectorAll<HTMLElement>(selector).forEach((group) => {
          Array.from(group.children).slice(0, 12).forEach((child, i) => {
            const node = child as HTMLElement;
            if (node.getBoundingClientRect().top < window.innerHeight * 0.95) return; // already on screen: leave alone
            node.style.setProperty("--fx-d", `${Math.min(i, 5) * 70}ms`);
            node.classList.add("fx");
            revealIO.observe(node);
          });
        });
      });

      const pauseIO = new IntersectionObserver((entries) => {
        entries.forEach((entry) => (entry.target as HTMLElement).setAttribute("data-offscreen", entry.isIntersecting ? "false" : "true"));
      }, { rootMargin: "120px 0px" });
      document.querySelectorAll(PAUSE_TARGETS).forEach((n) => pauseIO.observe(n));

      cleanups.push(() => { revealIO.disconnect(); pauseIO.disconnect(); });
    }, 120);

    return () => {
      window.clearTimeout(setup);
      timers.forEach((t) => window.clearTimeout(t));
      cleanups.forEach((fn) => fn());
    };
  }, [pathname]);

  return <div ref={bar} className="motion-progress" aria-hidden="true" />;
}
