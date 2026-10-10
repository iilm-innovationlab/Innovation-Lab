"use client";

import { useMemo, useState } from "react";

const faq = [
  ["What is the Innovation Lab?", "IILM × BNV Innovation Lab is a student-focused ecosystem for discovering problems, developing ideas, validating them, building prototypes and moving toward venture building."],
  ["Who can join?", "Students can enter through Explorer, Ideator, or the Founder’s Club journey depending on where they are in their idea and execution journey."],
  ["Do I need a startup idea?", "No. Explorer is specifically for curious students who do not have an idea yet."],
  ["Is Founder’s Club open now?", "Founder’s Club is marked Coming Soon. The Lab will publish the next selection and launch details through the announcement system."],
  ["Are the sessions free?", "The Lab is designed as a student ecosystem. Check each published event for its registration details and any event-specific requirements."],
];

const resources = [
  ["Problem discovery", "Learn to notice real problems before jumping to solutions."],
  ["Market validation", "Talk to people, test assumptions and find evidence."],
  ["MVP thinking", "Turn a validated idea into the smallest useful version."],
  ["Pitch & storytelling", "Explain the problem, insight, product and opportunity clearly."],
];

export function PublicSearch() {
  const [query, setQuery] = useState("");
  const items = useMemo(() => [
    ["Innovation Lab", "/about#innovation-lab"], ["BNV", "/about#bnv"], ["Explorer", "/join/explorer"], ["Ideator", "/join/ideator"], ["Campus Innovation Fellow", "/join/campus-innovation-fellow"], ["Social Media Team", "/join/social-media"], ["Events", "/events"], ["Team", "/team"], ["FAQ", "#faq"], ["Resources", "#resources"],
  ].filter(([name]) => name.toLowerCase().includes(query.toLowerCase())), [query]);
  return <section className="public-search section" aria-label="Search the Innovation Lab"><div className="container public-search-inner"><div><span className="eyebrow">FIND YOUR WAY</span><h2>Search the Lab.</h2><p>Jump straight to a programme, opportunity, event or resource.</p></div><div className="search-box"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Try “Explorer”, “events”, “team”…" aria-label="Search Innovation Lab" /></div>{query && <div className="search-results">{items.length ? items.map(([name, href]) => <a key={href} href={href}>{name}<span>↗</span></a>) : <p>No match yet. Try another word.</p>}</div>}</div></section>;
}

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  return <section className="faq section" id="faq"><div className="container faq-grid"><div><span className="eyebrow">GOOD TO KNOW</span><h2 className="mega">Questions,<br/><i>answered.</i></h2><p>Everything you need before you jump in.</p></div><div className="faq-list">{faq.map(([q, a], i) => <button className={`faq-item ${open === i ? "is-open" : ""}`} key={q} onClick={() => setOpen(open === i ? null : i)}><span>{q}</span><b>{open === i ? "−" : "+"}</b>{open === i && <p>{a}</p>}</button>)}</div></div></section>;
}

export function ResourcesSection() {
  return <section className="resources section" id="resources"><div className="container"><div className="section-head"><div><span className="eyebrow">LAB KNOWLEDGE</span><h2 className="mega">Build your <i>toolkit.</i></h2></div><span className="section-note">FREE / SELF-PACED</span></div><div className="resource-grid">{resources.map(([title, desc], i) => <article key={title}><span>0{i + 1}</span><h3>{title}</h3><p>{desc}</p><a href="/programs">Explore <span>↗</span></a></article>)}</div></div></section>;
}

export function TestimonialsSection() {
  return <section className="testimonials section"><div className="container"><div className="section-head"><div><span className="eyebrow">STUDENT VOICE</span><h2 className="mega">Stories from <i>builders.</i></h2></div></div><div className="empty-editorial"><div className="empty-stamp">VOICE</div><div><h3>Verified student stories will appear here.</h3><p>We will publish testimonials only after students have shared and approved their stories.</p></div></div></div></section>;
}

export function CommunityCounts({ counts = {} }: { counts?: Record<string, number> }) {
  const items = [
    ["Explorer", "Curiosity → exploration", "/join/explorer", counts.Explorer],
    ["Ideator", "Idea → validation", "/join/ideator", counts.Ideator],
    ["Founder’s Club", "Execution → venture building", "#founders", counts["Founder’s Club"]],
  ] as const;
  return <section className="community-counts section"><div className="container"><div className="section-head"><div><span className="eyebrow">THE COMMUNITY</span><h2 className="mega">Find your <i>people.</i></h2></div></div><div className="community-count-grid">{items.map(([name, desc, href, count]) => <article key={name}><strong>{name}</strong><span>{desc}</span>{typeof count === "number" && count > 0 && <small className="community-count-number">{count.toLocaleString("en-IN")} members</small>}<b><a href={href}>{name === "Founder’s Club" ? "Coming Soon" : "Open journey ↗"}</a></b></article>)}</div></div></section>;
}

export function NotificationPrompt() {
  const [status, setStatus] = useState<"idle" | "enabled" | "unsupported">("idle");
  const enable = async () => {
    if (!("Notification" in window)) return setStatus("unsupported");
    const permission = await Notification.requestPermission();
    setStatus(permission === "granted" ? "enabled" : "unsupported");
  };
  return <div className="notification-prompt"><div><span>🔔</span><div><strong>Don’t miss Lab updates.</strong><p>Get browser notifications for new events and important announcements.</p></div></div><button onClick={enable}>{status === "enabled" ? "Notifications on ✓" : status === "unsupported" ? "Not available here" : "Enable notifications"}</button></div>;
}
