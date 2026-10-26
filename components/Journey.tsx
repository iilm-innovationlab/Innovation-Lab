"use client";

import Link from "next/link";
import { forms } from "@/lib/content";
import { useEffect, useRef, useState } from "react";

const stages = [
  { n: "01", name: "Explorer", line: "I’m finding direction.", body: "Explore opportunities, research problems, join workshops and learn alongside other students.", meta: "Learn and explore", cta: "Become an Explorer", href: forms.explorer, tone: "navy", comingSoon: false },
  { n: "02", name: "Ideator", line: "I have an idea.", body: "Turn assumptions into evidence through customer discovery, research, validation and prototyping.", meta: "Test your ideas", cta: "Join Ideator", href: forms.ideator, tone: "green", comingSoon: false },
  { n: "03", name: "Founder", line: "I’m building it.", body: "Move into serious execution, build a venture and work towards real-world impact with ecosystem support.", meta: "Build something real", cta: "Coming Soon", href: "", tone: "gold", comingSoon: true },
];

export default function Journey() {
  const [active, setActive] = useState(0);
  const stageRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const nodes = stageRefs.current.filter(Boolean) as HTMLElement[];
    if (!nodes.length || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) {
        const index = nodes.indexOf(visible.target as HTMLElement);
        if (index >= 0) setActive(index);
      }
    }, { rootMargin: "-25% 0px -35% 0px", threshold: [0.1, 0.25, 0.5, 0.75] });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="journey-scroll-roadmap" style={{ ["--journey-progress" as string]: `${((active + 1) / stages.length) * 100}%` }}>
      <div className="journey-roadmap-rail" aria-hidden="true"><span /></div>
      <div className="journey-scroll-stages">
        {stages.map((stage, index) => (
          <article ref={(node) => { stageRefs.current[index] = node; }} key={stage.n} className={`journey-scroll-stage tone-${stage.tone}${active === index ? " is-active" : ""}`}>
            <div className="journey-stage-marker"><span>{stage.n}</span></div>
            <div className="journey-stage-card">
              <div className="journey-stage-topline"><span>{stage.meta}</span><span>{stage.n} / 03</span></div>
              <h3>{stage.name}</h3>
              <p className="journey-stage-line">“{stage.line}”</p>
              <p className="journey-stage-body">{stage.body}</p>
              {stage.comingSoon ? <span className="journey-stage-cta journey-stage-cta-disabled" aria-disabled="true">Coming Soon</span> : stage.href.startsWith("https://") ? <a href={stage.href} target="_blank" rel="noreferrer noopener" className="journey-stage-cta">{stage.cta}</a> : <Link href={stage.href} className="journey-stage-cta">{stage.cta}</Link>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
