"use client";

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
  const teamSlots = members.map((member, index) => ({
    ...member,
    number: String(index + 1).padStart(2, "0"),
    degree: member.degree_program || member.degree || "",
    program: member.program || "",
    year: member.year_of_study || member.year || "",
    campus: member.campus || "Campus not specified",
    team: member.team === "Campus Innovation Fellow" ? "Campus Innovation Fellow" : "Social Media Team",
    role: member.role || "Team member",
  }));

  if (teamSlots.length === 0) {
    return <div className="empty-editorial"><div className="empty-stamp">TEAM</div><div><h3>Team profiles are being prepared.</h3><p>Verified team members will appear here once they are published in Admin Studio.</p></div></div>;
  }

  return (
    <div className="team-experience">
      <div className="team-experience-head">
        <div>
          <span className="team-eyebrow">{teamSlots.length} PUBLISHED MEMBERS</span>
          <p className="team-hint">Meet the people building the IILM × BNV Innovation Lab.</p>
        </div>
      </div>

      <div className={`team-grid ${className}`.trim()}>
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
    </div>
  );
}
