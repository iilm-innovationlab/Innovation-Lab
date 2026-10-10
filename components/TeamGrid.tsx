"use client";

import { useMemo, useState } from "react";
import { optimizedCloudinaryImageUrl } from "@/lib/cloudinary-url";
type TeamMember = { id: string; name: string; role?: string | null; campus?: string | null; team?: string | null; photo_url?: string | null; bio?: string | null; linkedin_url?: string | null; degree?: string | null; program?: string | null; year?: string | null };

function rotate<T>(items: T[], by: number) {
  const n = items.length;
  const offset = ((by % n) + n) % n;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

export default function TeamGrid({ members }: { members: TeamMember[] }) {
  const teamSlots = members.map((member, index) => ({ ...member, number: String(index + 1).padStart(2, "0"), degree: member.degree || "", program: member.program || "", year: member.year || "", campus: member.campus || "Campus not specified", team: member.team === "Campus Innovation Fellow" ? "Campus Innovation Fellow" : "Social Media Team", role: member.role || "Team member", name: member.name }));
  const [order, setOrder] = useState(() => teamSlots.map((_, i) => i));
  const [active, setActive] = useState(0);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragX, setDragX] = useState(0);

  const orderedMembers = useMemo(() => order.map((index) => teamSlots[index]), [order]);
  const visible = useMemo(() => {
    const windowed = rotate(orderedMembers, active);
    return windowed.slice(0, Math.min(5, orderedMembers.length));
  }, [orderedMembers, active]);

  const move = (direction: 1 | -1) => {
    if (orderedMembers.length === 0) return;
    setActive((current) => (current + direction + orderedMembers.length) % orderedMembers.length);
    setDragX(0);
  };

  const shuffle = () => {
    setOrder((current) => {
      const next = [...current];
      for (let i = next.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
    setActive(0);
    setDragX(0);
  };

  if (orderedMembers.length === 0) return <div className="empty-editorial"><div className="empty-stamp">TEAM</div><div><h3>Team profiles are being prepared.</h3><p>Verified team members will appear here once they are published in Admin Studio.</p></div></div>;

  return (
    <div className="team-experience">
      <div className="team-experience-head">
        <div>
          <span className="team-eyebrow">{orderedMembers.length} PUBLISHED MEMBERS</span>
          <p className="team-hint">Swipe the deck. Shuffle the people. Meet the crew behind the chaos.</p>
        </div>
        <div className="team-controls">
          <button type="button" onClick={() => move(-1)} aria-label="Previous team member">←</button>
          <button type="button" onClick={() => move(1)} aria-label="Next team member">→</button>
          <button type="button" className="team-shuffle" onClick={shuffle} aria-label="Shuffle team members">
            <span>✣</span> Shuffle
          </button>
        </div>
      </div>

      <div
        className="team-deck"
        onPointerDown={(event) => {
          setDragStart(event.clientX);
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (dragStart !== null) setDragX(event.clientX - dragStart);
        }}
        onPointerUp={() => {
          if (Math.abs(dragX) > 55) move(dragX > 0 ? -1 : 1);
          else setDragX(0);
          setDragStart(null);
        }}
        onPointerCancel={() => { setDragStart(null); setDragX(0); }}
      >
        {visible.map((member, index) => {
          const isFront = index === 0;
          const rotation = index === 0 ? 0 : index % 2 === 0 ? 3 : -3;
          return (
            <article
              key={`${member.number}-${index}`}
              className={`team-deck-card ${isFront ? "is-front" : ""}`}
              style={{
                zIndex: visible.length - index,
                transform: isFront
                  ? `translate3d(${dragX}px,0,0) rotate(${dragX * 0.025}deg)`
                  : `translate3d(${index * 17}px,${index * 11}px,0) rotate(${rotation}deg)`,
                opacity: 1 - index * 0.12,
              }}
              aria-hidden={!isFront}
            >
              <div className="team-card-visual">
                <div className="team-card-grid" />
                <div className="team-orbit orbit-one" />
                <div className="team-orbit orbit-two" />
                <span className="team-card-number">{member.number}</span>
                {member.photo_url ? <img src={optimizedCloudinaryImageUrl(member.photo_url, 480)} alt={member.name} className="team-card-real-photo" loading="lazy" decoding="async" width={480} height={480} /> : <span className="team-photo-label">PHOTO<br /><b>COMING SOON</b></span>}
                <span className="team-card-cross">+</span>
                <span className="team-card-campus">{member.campus}</span>
              </div>
              <div className="team-card-info">
                <div>
                  <span>{member.team}</span>
                  <h3>{member.name}</h3>
                </div>
                <div className="team-card-meta">
                  {member.degree && <b>{member.degree}</b>}
                  {member.program && <b>{member.program}</b>}
                  {member.year && <b>Year {member.year}</b>}
                </div>
              </div>
            </article>
          );
        })}
        <div className="team-deck-caption"><span>DRAG / SWIPE</span><i>↔</i></div>
      </div>

      <div className="team-progress" aria-label="Team member navigation">
        <span>{String(active + 1).padStart(2, "0")}</span>
        <div><i style={{ width: `${((active + 1) / orderedMembers.length) * 100}%` }} /></div>
        <span>{String(orderedMembers.length).padStart(2, "0")}</span>
      </div>
    </div>
  );
}
