"use client";
import { useState } from "react";

const modes = [
  { label: "CURIOUS", icon: "👀", title: "Go looking for a problem.", copy: "Walk around campus and notice the tiny things people complain about." },
  { label: "PROBLEM HUNTER", icon: "🕵️", title: "Find the annoying bit.", copy: "If something takes five steps when it should take one, you may have found a startup problem." },
  { label: "BUILDER", icon: "🛠️", title: "Make it tiny first.", copy: "Forget the perfect app. Build the smallest useful version and put it in front of someone." },
  { label: "CONNECTOR", icon: "🤝", title: "Talk to a human.", copy: "Your next useful conversation could be more valuable than another 20 tabs in your browser." },
];

export default function FunMissions(){
  const [active, setActive] = useState(0);
  const mode = modes[active];
  return (
    <section className="fun-missions" aria-label="Choose your Innovation Lab mode">
      <div className="fun-missions-inner">
        <div className="fun-missions-intro">
          <span className="fun-kicker">THE LAB PLAYGROUND ✦</span>
          <h2>Pick your <i>mode.</i></h2>
          <p>There is no wrong starting point. Tap one and get a tiny mission.</p>
        </div>
        <div className="fun-mode-row" role="tablist" aria-label="Innovation Lab modes">
          {modes.map((item, index) => (
            <button key={item.label} className={`fun-mode ${index === active ? "is-active" : ""}`} onClick={() => setActive(index)} role="tab" aria-selected={index === active}>
              <span>{item.icon}</span><b>{item.label}</b><i>↗</i>
            </button>
          ))}
        </div>
        <div className="fun-mission-card" key={mode.label}>
          <span className="fun-mission-number">0{active + 1}</span>
          <span className="fun-mission-icon">{mode.icon}</span>
          <div><small>TODAY'S TINY MISSION</small><h3>{mode.title}</h3><p>{mode.copy}</p></div>
          <span className="fun-mission-arrow">✦</span>
        </div>
      </div>
    </section>
  );
}
