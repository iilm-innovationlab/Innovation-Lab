"use client";

import Link from "next/link";
import { forms } from "@/lib/content";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type Stage = {
  n: string; name: string; line: string; body: string; meta: string; cta: string; href: string;
  tone: "navy" | "green" | "gold"; comingSoon: boolean; keyword: string; chips: string[]; icon: ReactNode;
};

const iconProps = { width: 26, height: 26, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

const stages: Stage[] = [
  { n: "01", name: "Explorer", line: "I’m finding direction.", body: "Explore opportunities, research problems, join workshops and learn alongside other students.", meta: "Learn and explore", cta: "Become an Explorer", href: forms.explorer, tone: "navy", comingSoon: false, keyword: "Curiosity", chips: ["Workshops", "Problem research", "Peer learning"],
    icon: <svg {...iconProps}><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></svg> },
  { n: "02", name: "Ideator", line: "I have an idea.", body: "Turn assumptions into evidence through customer discovery, research, validation and prototyping.", meta: "Test your ideas", cta: "Join Ideator", href: forms.ideator, tone: "green", comingSoon: false, keyword: "Validation", chips: ["Customer discovery", "Validation", "Prototyping"],
    icon: <svg {...iconProps}><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1.1 1.2 1.1 2V16h5v-.2c0-.8.5-1.5 1.1-2A6 6 0 0 0 12 3Z" /></svg> },
  { n: "03", name: "Founder", line: "I’m building it.", body: "Move into serious execution, build a venture and work towards real-world impact with ecosystem support.", meta: "Build something real", cta: "Coming Soon", href: "", tone: "gold", comingSoon: true, keyword: "Execution", chips: ["Venture building", "Ecosystem support", "Real impact"],
    icon: <svg {...iconProps}><path d="M5 19c-1.2-3.6 0-8 4-12 3-3 7-3.8 10-3.5.3 3-.5 7-3.5 10-4 4-8.4 5.2-10.5 5.5Z" /><circle cx="15" cy="9" r="1.6" /><path d="M5 19l-1.5 1.5M9 15l-3 .5M9 15l-.5 3" /></svg> },
];

function isExternal(href: string) {
  return /^https:\/\//i.test(href);
}

export default function Journey() {
  const rootRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const stageRefs = useRef<Array<HTMLElement | null>>([]);
  const [reached, setReached] = useState(0);
  const [seen, setSeen] = useState<boolean[]>(() => stages.map(() => false));

  const update = useCallback(() => {
    const root = rootRef.current;
    const nodes = nodeRefs.current.filter(Boolean) as HTMLElement[];
    if (!root || nodes.length < 2) return;
    const rootTop = root.getBoundingClientRect().top;
    const centers = nodes.map((node) => { const r = node.getBoundingClientRect(); return r.top - rootTop + r.height / 2; });
    const start = centers[0];
    const height = Math.max(centers[centers.length - 1] - start, 1);
    const line = window.innerHeight * 0.55;
    const fill = Math.min(Math.max(line - rootTop - start, 0), height);
    root.style.setProperty("--jr-top", `${start}px`);
    root.style.setProperty("--jr-height", `${height}px`);
    root.style.setProperty("--jr-fill", `${fill}px`);
    const count = centers.filter((c) => rootTop + c <= line).length;
    setReached((prev) => (prev === count ? prev : count));
  }, []);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, [update]);

  useEffect(() => {
    const nodes = stageRefs.current.filter(Boolean) as HTMLElement[];
    if (!nodes.length || typeof IntersectionObserver === "undefined") { setSeen(stages.map(() => true)); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const i = nodes.indexOf(entry.target as HTMLElement);
        if (i < 0) return;
        setSeen((prev) => (prev[i] ? prev : prev.map((v, k) => (k === i ? true : v))));
        io.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  return (
    <div className="jr" ref={rootRef} role="list" aria-label="Member journey: Explorer, Ideator, Founder">
      <div className="jr-spine" aria-hidden="true">
        <span className="jr-spine-fill" />
        <span className="jr-spine-head" />
      </div>

      {stages.map((stage, i) => {
        const side = i % 2 === 0 ? "left" : "right";
        const cls = `jr-stage jr-${side} tone-${stage.tone}${seen[i] ? " is-seen" : ""}${reached > i ? " is-reached" : ""}${reached === i + 1 ? " is-current" : ""}`;
        return (
          <article key={stage.n} role="listitem" ref={(el) => { stageRefs.current[i] = el; }} className={cls} style={{ ["--i" as string]: i } as CSSProperties}>
            <div className="jr-aside" aria-hidden="true">
              <span className="jr-aside-num">{stage.n}</span>
              <span className="jr-aside-word">{stage.keyword}</span>
            </div>

            <div className="jr-node-col">
              <span className="jr-node" ref={(el) => { nodeRefs.current[i] = el; }}>
                <span className="jr-node-ring" />
                <span className="jr-node-core">{stage.icon}</span>
              </span>
            </div>

            <div className="jr-card">
              <span className="jr-card-glow" aria-hidden="true" />
              <div className="jr-card-top">
                <span className="jr-pill">{stage.meta}</span>
                <span className="jr-step">Step {stage.n} <i>/ 03</i></span>
              </div>
              <h3>{stage.name}</h3>
              <p className="jr-line">“{stage.line}”</p>
              <p className="jr-body">{stage.body}</p>
              <ul className="jr-chips">{stage.chips.map((c) => <li key={c}>{c}</li>)}</ul>
              {stage.comingSoon ? (
                <span className="jr-cta jr-cta-off" aria-disabled="true">Coming Soon</span>
              ) : isExternal(stage.href) ? (
                <a href={stage.href} target="_blank" rel="noreferrer noopener" className="jr-cta">{stage.cta}<b aria-hidden="true">↗</b></a>
              ) : (
                <Link href={stage.href} className="jr-cta">{stage.cta}<b aria-hidden="true">→</b></Link>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
