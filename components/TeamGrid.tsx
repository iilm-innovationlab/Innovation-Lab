"use client";

import { useState } from "react";
import { optimizedCloudinaryImageUrl } from "@/lib/cloudinary-url";

type TeamMember = {
  id: string;
  name: string;
  role?: string | null;
  campus?: string | null;
  team?: string | null;
  photo_url?: string | null;
  bio?: string | null;
  linkedin_url?: string | null;
  degree?: string | null;
  program?: string | null;
  year?: string | null;
  degree_program?: string | null;
  year_of_study?: string | null;
};

export default function TeamGrid({ members, className = "" }: { members: TeamMember[]; className?: string }) {
  const [showAllMembers, setShowAllMembers] = useState(false);
  const isDedicatedTeamPage = className.split(" ").includes("team-page-grid");
  const featuredHead: TeamMember = {
    id: "gaurav-saxena",
    name: "Gaurav Saxena",
    role: "Head",
    team: "Head",
    campus: "IILM × BNV Innovation Lab",
    photo_url: "/team/gaurav-saxena.webp",
  };

  const teamSlots = [featuredHead, ...members.filter((member) => member.id !== featuredHead.id)].map((member, index) => ({
    ...member,
    number: String(index + 1).padStart(2, "0"),
    degree: member.degree_program || member.degree || "",
    program: member.program || "",
    year: member.year_of_study || member.year || "",
    campus: member.campus || "Campus not specified",
    team: member.role === "Head" || member.team === "Head" ? "Head" : member.team === "Campus Innovation Fellow" ? "Campus Innovation Fellow" : "Social Media Team",
    role: member.role || "Team member",
  }));

  if (teamSlots.length === 0) {
    return <div className="empty-editorial"><div className="empty-stamp">TEAM</div><div><h3>Team profiles are being prepared.</h3><p>Our team profiles will be available here soon.</p></div></div>;
  }

  return (
    <div className="team-experience">
      <div className="team-experience-head">
        <div>
          <span className="team-eyebrow">{teamSlots.length} PUBLISHED MEMBERS</span>
          <p className="team-hint">Meet the people building the IILM × BNV Innovation Lab.</p>
        </div>
      </div>

      <div id="team-grid-list" className={`team-grid ${className} ${showAllMembers ? "team-grid--expanded" : ""}`.trim()}>
        {teamSlots.map((member) => (
          <article key={member.id} className="team-grid-card">
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
        ))}
      </div>
      {!isDedicatedTeamPage && teamSlots.length > 4 && (
        <button
          type="button"
          className={`team-members-toggle${showAllMembers ? " is-expanded" : ""}`}
          aria-expanded={showAllMembers}
          aria-controls="team-grid-list"
          onClick={() => setShowAllMembers((current) => !current)}
        >
          <span>{showAllMembers ? "Show fewer team members" : "Show all team members"}</span>
          <span className="team-members-toggle-icon" aria-hidden="true">&#9662;</span>
        </button>
      )}
    </div>
  );
}
