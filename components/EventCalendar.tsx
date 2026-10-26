"use client";
import { useMemo, useState } from "react";

type EventItem = { id: string; title: string; starts_at?: string | null; community?: string | null; description?: string | null; location?: string | null; registration_url?: string | null };
export default function EventCalendar({ events }: { events: EventItem[] }) {
  const [filter, setFilter] = useState("All");
  const filtered = useMemo(() => filter === "All" ? events : events.filter(e => e.community === filter), [events, filter]);
  const groups = ["All", ...Array.from(new Set(events.map(e => e.community).filter(Boolean) as string[]))];
  return <div className="public-events"><div className="event-filters">{groups.map(g => <button key={g} className={filter === g ? "is-active" : ""} onClick={() => setFilter(g)}>{g}</button>)}</div><div className="public-event-grid">{filtered.length ? filtered.map((event, i) => <article className="public-event-card" key={event.id}><span>{event.community || "Innovation Lab"}</span><strong>{event.starts_at ? new Date(event.starts_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Date TBA"}</strong><h3>{event.title}</h3><p>{event.description || "An upcoming IILM × BNV Innovation Lab session."}</p><small>{event.starts_at && (new Date(event.starts_at).getHours() !== 0 || new Date(event.starts_at).getMinutes() !== 0) ? new Date(event.starts_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : "Time not specified"}{event.location ? ` · ${event.location}` : ""}</small>{event.registration_url ? <a className="hero-btn hero-btn-red" href={event.registration_url} target="_blank" rel="noreferrer">Register ↗</a> : <span className="event-no-reg">Registration details coming soon.</span>}</article>) : <div className="empty-editorial"><div className="empty-stamp">SOON</div><div><h3>No events published yet 👀</h3><p>New events will appear here as soon as they are announced.</p></div></div>}</div></div>;
}
