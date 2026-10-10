import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import Hero from "@/components/Hero";
import Journey from "@/components/Journey";
import MaturityJourney from "@/components/MaturityJourney";
import TeamGrid from "@/components/TeamGrid";
import ScrollReveal from "@/components/ScrollReveal";
import ReelSlider from "@/components/ReelSlider";
import FunMissions from "@/components/FunMissions";
import SectionLabel from "@/components/SectionLabel";
import GoogleFormButton from "@/components/GoogleFormButton";
import WomenBuild from "@/components/WomenBuild";
import { bnvIndiaPortfolio, forms } from "@/lib/content";
import { PublicSearch, FAQSection, ResourcesSection, TestimonialsSection, CommunityCounts } from "@/components/PublicExtras";
import PushNotifications from "@/components/PushNotifications";
import EventCalendar from "@/components/EventCalendar";

const moves = [
  ["01", "DISCOVER", "Notice problems, people and possibilities."],
  ["02", "EXPLORE", "Find your curiosity and a direction."],
  ["03", "IDEATE", "Turn a real problem into an idea worth testing."],
  ["04", "VALIDATE", "Talk to people and learn what is actually true."],
  ["05", "BUILD", "Create a prototype, MVP or first version."],
  ["06", "CONNECT", "Meet mentors, ecosystem members and other builders."],
  ["07", "GROW", "Move toward venture building and impact."],
];

export const revalidate = 600;

export const metadata: Metadata = pageMetadata({ title: "IILM Innovation Lab | Student Entrepreneurship & Innovation", description: "Discover IILM × BNV Innovation Lab: a student entrepreneurship and innovation ecosystem for problem discovery, idea validation, prototyping, mentorship and venture building across IILM campuses.", path: "/", keywords: ["IILM Innovation Lab", "IILM innovation", "IILM entrepreneurship", "IILM startup ecosystem", "IILM BNV Innovation Lab", "student entrepreneurship India", "Beyond Next Ventures India"] });

async function getPublishedEvents() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return [];
  try {
    const res = await fetch(`${url}/rest/v1/events?select=id,title,description,starts_at,community,location,registration_url&status=eq.published&order=starts_at.asc&limit=6`, { headers: { apikey: anon }, next: { revalidate: 600, tags: ["public-events"] } });
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}


async function getPublishedShorts() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return [];
  try {
    const res = await fetch(`${url}/rest/v1/youtube_shorts?select=id,youtube_id,title&published=eq.true&order=display_order.asc&limit=12`, { headers: { apikey: anon }, next: { revalidate: 600, tags: ["public-shorts"] } });
    return res.ok ? await res.json() : [];
  } catch { return []; }
}

async function getPublishedTeam() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return [];
  try {
    const res = await fetch(`${url}/rest/v1/team_members?select=id,name,role,campus,team,year_of_study,degree_program,photo_url,bio,linkedin_url&published=eq.true&order=display_order.asc&limit=30`, { headers: { apikey: anon }, next: { revalidate: 600, tags: ["public-team"] } });
    return res.ok ? await res.json() : [];
  } catch { return []; }
}

async function getCommunityCounts() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return {};
  try { const res = await fetch(`${url}/rest/v1/communities?select=name,member_count&published=eq.true&limit=10`, { headers: { apikey: anon }, next: { revalidate: 900, tags: ["public-communities"] } }); if (!res.ok) return {}; const rows = await res.json(); return Object.fromEntries((rows as Array<{ name: string; member_count: number }>).map((r) => [r.name, r.member_count])); } catch { return {}; }
}

async function getPublishedStarIdeators() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return [];
  try { const res = await fetch(`${url}/rest/v1/star_ideators?select=id,name,role,bio,photo_url,linkedin_url&published=eq.true&order=display_order.asc,created_at.desc&limit=12`, { headers: { apikey: anon }, next: { revalidate: 600, tags: ["public-star-ideators"] } }); return res.ok ? await res.json() : []; } catch { return []; }
}

async function getPublishedAnnouncements() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return [];
  try {
    const res = await fetch(`${url}/rest/v1/announcements?select=id,title,body,created_at,updated_by_name&published=eq.true&order=created_at.desc&limit=4`, { headers: { apikey: anon }, next: { revalidate: 600, tags: ["public-announcements"] } });
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

export default async function Home() {
  const [announcements, events, communityCounts, teamMembers, shorts, starIdeators] = await Promise.all([getPublishedAnnouncements(), getPublishedEvents(), getCommunityCounts(), getPublishedTeam(), getPublishedShorts(), getPublishedStarIdeators()]);
  return (
    <main>
      <Hero />
      {announcements[0] && <div className="announcement-banner"><div className="container announcement-banner-inner"><span>NEW / {announcements[0].title}</span><p>{announcements[0].body}</p><a href="#announcements">Read update ↗</a></div></div>}
      <div className="container"><PushNotifications /></div>

      {/* 01 — WHAT IS THE INNOVATION LAB */}
      <section className="manifesto section" id="lab">
        <div className="container manifesto-grid">
          <ScrollReveal>
            <SectionLabel>01 / What is Innovation Lab?</SectionLabel>
            <h2 className="mega">A place to turn <i>curiosity</i> into action.</h2>
          </ScrollReveal>
          <ScrollReveal delay={140}>
            <div className="manifesto-side">
              <p>
                IILM × BNV Innovation Lab is a student-focused innovation and entrepreneurship ecosystem where students can discover problems, develop ideas, validate concepts, build prototypes, meet people and move toward venture building.
              </p>
              <div className="manifesto-list">
                <span>Curious but no idea? Start here.</span>
                <span>Have an idea? Test it.</span>
                <span>Validated something? Build it.</span>
                <span>Already building? Find your people.</span>
              </div>
              <Link href="/about#innovation-lab" className="text-link" data-cursor>
                Explore Innovation Lab in detail <span>↗</span>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <PublicSearch />

      {/* 02 — WHAT IS BNV */}
      <section className="bnv section" id="bnv">
        <div className="container">
          <ScrollReveal>
            <SectionLabel>02 / What is Beyond Next Ventures?</SectionLabel>
            <div className="bnv-head">
              <div>
                <h2 className="mega">Japan × India.<br /><i>Deep tech × people.</i></h2>
                <p>
                  Beyond Next Ventures (BNV) is a Japan-based venture firm focused on deep-tech investment and ecosystem building. Its India work connects students and builders with a wider network of ventures, investment experience and people working on ambitious technologies.
                </p>
              </div>
              <Link href="/about#bnv" className="text-link" data-cursor>
                About BNV &amp; the ecosystem ↗
              </Link>
            </div>
          </ScrollReveal>
          <div className="bnv-facts">
            <div><b>2014</b><span>Founded in Tokyo</span></div>
            <div><b>2019</b><span>India investing since</span></div>
            <div><b>Seed → early</b><span>Early-stage focus</span></div>
            <div><b>Network</b><span>Ventures · mentors · ecosystem connections</span></div>
          </div>
          <div className="bnv-bridge">
            <div className="bnv-side"><small>IILM</small><strong>Campus</strong><strong>Students</strong><strong>Learning</strong><strong>Community</strong></div>
            <div className="bnv-x">×</div>
            <div className="bnv-side"><small>BNV</small><strong>Venture ecosystem</strong><strong>Investment</strong><strong>Mentorship</strong><strong>Japan–India</strong></div>
            <div className="bnv-result"><span>RESULT</span><b>IILM × BNV<br />Innovation Lab</b></div>
          </div>
        </div>
      </section>

      {/* LIVE ANNOUNCEMENTS */}
      <section className="announcements-public section" id="announcements">
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Live from the Lab</SectionLabel>
            <div className="section-heading-row"><div><h2 className="mega">What’s <i>happening?</i></h2><p>Important updates, application openings and Lab news will appear here when published by the team.</p></div><Link href="/events" className="text-link">See the calendar ↗</Link></div>
          </ScrollReveal>
          <div className="announcement-public-grid">
            {announcements.length ? announcements.map((a: {id:string;title:string;body?:string;updated_by_name?:string}, i:number) => <article className={`announcement-public-card ${i===0 ? "is-featured" : ""}`} key={a.id}><span>ANNOUNCEMENT</span><h3>{a.title}</h3><p>{a.body}</p>{a.updated_by_name && <small>Published by {a.updated_by_name}</small>}</article>) : <div className="empty-editorial"><div className="empty-stamp">NEWS</div><div><h3>No announcements published yet.</h3><p>Official updates will appear here when the Lab team publishes them.</p><Link href="/join" className="text-link">Explore ways to join <span>↗</span></Link></div></div>}
          </div>
        </div>
      </section>

      {/* A compact bridge into the detailed About Us page; nothing else is removed. */}
      <section className="about-bridge section">
        <div className="container">
          <div className="about-bridge-card">
            <div>
              <SectionLabel>Go deeper</SectionLabel>
              <h2 className="mega small-mega">Everything behind the <i>Lab.</i></h2>
              <p>Read the full story: what the Innovation Lab is, what BNV brings, the venture network, mentor ecosystem and how IILM × BNV fit together.</p>
            </div>
            <Link href="/about" className="hero-btn hero-btn-red" data-cursor>Open About Us ↗</Link>
          </div>
        </div>
      </section>

      <section className="visual-story" id="starting-point">
        <div className="story-image story-one"><Image src="/campus-2.webp" alt="IILM campus" fill sizes="50vw" /></div>
        <div className="story-copy"><ScrollReveal><SectionLabel>Start anywhere</SectionLabel><h2>No idea yet?<br /><span>That’s okay.</span></h2><p>You can come in curious. Explore entrepreneurship, join the Explorer community, attend sessions, find problems and learn how builders think.</p><Link href="#journey" className="text-link" data-cursor>Find your starting point <span>↗</span></Link></ScrollReveal></div>
        <div className="story-image story-two"><Image src="/campus-4.webp" alt="IILM campus building" fill sizes="30vw" /></div>
      </section>

      {/* 03 — MEMBER JOURNEY */}
      <section className="journey-section section" id="journey">
        <div className="container">
          <ScrollReveal>
            <SectionLabel>03 / Member Journey Framework &amp; Roadmap</SectionLabel>
            <div className="section-heading-row">
              <div>
                <h2 className="mega">Discover → <i>Explorer → Ideator → Founder.</i></h2>
                <p>Three communities, one progression from curiosity to serious execution.</p>
              </div>
              <span className="journey-progress">01 — 03</span>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={120}><Journey /></ScrollReveal>
        </div>
      </section>

      <section className="framework section" id="framework">
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Member maturity framework</SectionLabel>
            <h2 className="mega">From <i>−2</i> to <i>+1.</i></h2>
            <p className="lead-copy">Your starting point is not a judgement. It is simply a signal for what you need next.</p>
          </ScrollReveal>
          <MaturityJourney />
          <div className="framework-note"><span>−2 → +1</span><p><b>Explorer</b> helps curiosity become direction. <b>Ideator</b> takes an idea through research and validation. <b>Founder’s Club</b> is for serious execution and venture-building.</p></div>
        </div>
      </section>

      <section className="flow-section section">
        <div className="container">
          <ScrollReveal><SectionLabel>Roadmap in motion</SectionLabel><h2 className="mega">From “what if?” to<br /><i>“we built it.”</i></h2></ScrollReveal>
          <div className="flow-list">{moves.map(([n, t, d], i) => <ScrollReveal key={n} delay={i * 45}><div className="flow-item"><span>{n}</span><h3>{t}</h3><p>{d}</p><b>↗</b></div></ScrollReveal>)}</div>
        </div>
      </section>

      {/* 04 — MEET THE TEAM */}
      <section className="team-section section" id="team">
        <div className="container">
          <ScrollReveal><SectionLabel>04 / Meet Our Team</SectionLabel><h2 className="mega">Real people. <i>One ecosystem.</i></h2><p className="lead-copy">Meet the student team behind Campus Innovation Fellow and Social Media.</p></ScrollReveal>
          <TeamGrid members={teamMembers} />
          
          <Link href="/team" className="text-link">Meet the full team ↗</Link>
        </div>
      </section>

      {/* STAR IDEATORS — profiles are managed from Admin Studio */}
      <section className="star-ideators-section section" id="star-ideators"><div className="container"><ScrollReveal><SectionLabel>Ideas worth watching</SectionLabel><div className="section-heading-row"><div><h2 className="mega">Meet our <i>Star Ideators.</i></h2><p>Students turning observations into ideas, experiments and early solutions.</p></div></div></ScrollReveal>{starIdeators.length > 0 ? <div className="star-ideators-public-grid">{starIdeators.map((item: {id:string;name:string;role?:string;bio?:string;photo_url?:string;linkedin_url?:string})=><article className="star-ideator-public-card" key={item.id}>{item.photo_url ? <img className="star-ideator-public-photo" src={item.photo_url} alt={item.name} loading="lazy" decoding="async"/> : <div className="star-ideator-public-placeholder">{item.name.split(" ").map((part:string)=>part[0]).join("").slice(0,2).toUpperCase()}</div>}<div className="star-ideator-public-copy"><span>STAR IDEATOR</span><h3>{item.name}</h3>{item.role && <h4>{item.role}</h4>}{item.bio && <p>{item.bio}</p>}{item.linkedin_url && <a href={item.linkedin_url} target="_blank" rel="noreferrer">Connect on LinkedIn ↗</a>}</div></article>)}</div> : <div className="star-ideators-empty"><strong>Great ideas start with people.</strong><p>Our Star Ideators will be featured here as soon as their profiles are published.</p></div>}</div></section>

      {/* 05 — JOIN THE TEAM */}
      <section className="join-team section" id="join-team">
        <div className="container">
          <ScrollReveal><SectionLabel>05 / Join Our Team</SectionLabel><h2 className="mega">Want to build<br /><i>with us?</i></h2></ScrollReveal>
          <div className="opportunity-grid">
            <div className="opportunity"><span>01</span><h3>Campus Innovation Fellow</h3><p>Help build innovation culture across campus — events, communities, ideas and execution.</p><GoogleFormButton href={forms.campus} label="Apply" fallback="Open application" fallbackHref="/join/campus-innovation-fellow" /></div>
            <div className="opportunity dark"><span>02</span><h3>Social Media Team</h3><p>Reels, editing, content, memes, storytelling and digital marketing.</p><GoogleFormButton href={forms.social} label="Apply" fallback="Open application" fallbackHref="/join/social-media" /></div>
          </div>
        </div>
      </section>

      {/* Existing supporting content — kept intact, moved after the primary chronology. */}
      <FunMissions />
      <WomenBuild />

      <section className="community-section" id="explorer">
        <div className="community-block community-explorer"><div className="community-num">01</div><div className="community-content"><SectionLabel>Explorer community</SectionLabel><h2>Start with<br /><em>curiosity.</em></h2><p>You don't need an idea yet. Explorer is for students who are curious about entrepreneurship and want to discover what they might build.</p><div className="chip-row"><span>Online sessions ≈ every 15 days</span><span>Workshops</span><span>Problem discovery</span><span>Startup exposure</span><span>Networking</span></div><a className="hero-btn hero-btn-red" href="/join/explorer">Become an Explorer ↗</a></div><div className="community-art"><div className="art-ring" /><div className="art-word">CURIOUS</div><div className="art-note">what if?</div></div></div>
        <div className="community-block community-ideator" id="ideator"><div className="community-art ideator-art"><div className="grid-paper" /><div className="idea-card">IDEA<br /><b>→</b><br />TEST</div><div className="idea-note">talk to users.</div></div><div className="community-content"><div className="community-num">02</div><SectionLabel>Ideator community</SectionLabel><h2>Got an<br /><em>idea?</em></h2><p>Now let’s figure out whether it is worth building. Get guidance around market research, customer discovery, validation, refinement, prototyping and MVP development.</p><div className="chip-row"><span>Online IFP sessions</span><span>Market research</span><span>Customer discovery</span><span>Validation</span><span>Mentorship</span><span>MVP development</span></div><GoogleFormButton href={forms.ideator} label="Join Ideator" fallback="Open Ideator application" fallbackHref="/join/ideator" /></div></div>
        <div className="community-block community-founder" id="founders"><div className="community-num">03</div><div className="community-content"><SectionLabel>Founder’s Club</SectionLabel><h2>Founder<br /><em>mode.</em></h2><p>Founder’s Club is the filtered, advanced community for students who have moved beyond validation into serious execution — prototype, MVP and venture building.</p><div className="chip-row"><span>Advanced mentorship</span><span>Angel investor connections</span><span>Incubation pathway</span><span>Japan opportunities</span><span>Hackathons</span><span>Venture building</span></div><span className="coming-soon">COMING SOON 🚀</span></div><div className="founder-art"><span>03</span><strong>BUILD<br />SERIOUSLY.</strong><i>launch / learn / repeat</i></div></div>
      </section>

      <section className="portfolio section" id="portfolio"><div className="container"><ScrollReveal><SectionLabel>BNV India network of ventures</SectionLabel><div className="section-heading-row"><div><h2 className="mega">Ideas that made it <i>out.</i></h2><p>BNV’s official India portfolio includes ventures across healthcare, AI/digital, climate, agriculture/food and other deep-tech categories.</p></div><a className="text-link" href="https://beyondnextventures.com/india/" target="_blank" rel="noreferrer">Explore BNV India ↗</a></div></ScrollReveal><div className="portfolio-grid">{bnvIndiaPortfolio.map((p, i) => <a key={p.name} className="portfolio-card" href="https://beyondnextventures.com/portfolio/" target="_blank" rel="noreferrer"><span>{String(i + 1).padStart(2, "0")}</span><h3>{p.name}</h3><p>{p.note}</p><b>BNV portfolio ↗</b></a>)}</div></div></section>

      <section className="problems section" id="problems"><div className="container"><ScrollReveal><SectionLabel>Problems we explore</SectionLabel><h2 className="mega">Start with the <i>problem.</i></h2><p className="lead-copy">Not every problem needs to become a startup. The first move is to notice it, frame it and talk to people.</p></ScrollReveal><div className="problem-grid"><div><span>01</span><h3>What keeps happening?</h3><p>Bring a recurring student, campus, consumer or real-world frustration.</p></div><div><span>02</span><h3>Who feels it?</h3><p>Map the people who experience the problem and what they do today.</p></div><div><span>03</span><h3>What could change?</h3><p>Turn observations into hypotheses worth testing with real people.</p></div></div></div></section>

      <section className="sessions section"><div className="container"><ScrollReveal><SectionLabel>Previous sessions</SectionLabel><div className="section-heading-row"><div><h2 className="mega">Learn. Meet. <i>Repeat.</i></h2><p>Session archives, photographs, speakers and takeaways will be published here from the admin panel.</p></div><Link href="/events" className="text-link">Open sessions archive ↗</Link></div></ScrollReveal><div className="archive-placeholder"><div className="archive-number">00</div><div><h3>Session archive is being curated.</h3><p>No session names, dates or speaker information are invented on this page.</p></div><span>ARCHIVE</span></div></div></section>

      <TestimonialsSection />
      <CommunityCounts counts={communityCounts} />
      <ResourcesSection />
      <FAQSection />

      <section className="events section" id="events"><div className="container"><div className="section-heading-row"><div><SectionLabel>What’s happening?</SectionLabel><h2 className="mega">Show up.<br /><i>Make something.</i></h2></div><Link href="/events" className="text-link">View full calendar ↗</Link></div>{events.length ? <EventCalendar events={events} /> : <div className="empty-editorial"><div className="empty-stamp">SOON</div><div><h3>The calendar is ready for your first event.</h3><p>Published events created in Admin Studio will appear here automatically.</p></div><span>👀</span></div>}</div></section>

      <section className="meme-strip"><div className="meme-card"><span>01</span><p>I came to college for a degree.</p><b>Me 6 months later:<br />building an MVP at 3 AM 💀</b></div><div className="meme-card offset"><span>02</span><p>“I’ll validate the idea first.”</p><b>Also me:<br />already designing the logo 💀</b></div></section>

      <section className="final-cta section"><div className="final-blob" /><div className="container"><SectionLabel>The starting line</SectionLabel><h2>Your idea doesn't need<br />to be perfect.<br /><i>It just needs to start.</i></h2><p>Whether you’re curious, have an idea, or are already building something — there’s a place for you here.</p><Link href="/join" className="hero-btn hero-btn-red" data-cursor>Start your journey ↗</Link></div></section>

      {/* 06 — SOCIAL / FOLLOW */}
      <section className="reels section" id="youtube-shorts"><div className="container"><SectionLabel>06 / Follow the Lab</SectionLabel><h2 className="mega">See what we’re building <i>IRL.</i></h2><p className="lead-copy">Watch the latest YouTube Shorts and follow the Lab as the community grows.</p><ReelSlider shorts={shorts} /><div className="follow"><span>IILM × BNV / SOCIAL</span><div className="follow-links"><a href="https://www.youtube.com/" target="_blank" rel="noreferrer noopener">YouTube Shorts ↗</a></div><small>YouTube Shorts are managed from Admin → Social.</small></div></div></section>
    </main>
  );
}
