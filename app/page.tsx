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
import SectionLabel from "@/components/SectionLabel";
import GoogleFormButton from "@/components/GoogleFormButton";
import { bnvIndiaPortfolio, forms } from "@/lib/content";
import { FAQSection } from "@/components/PublicExtras";
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

export default async function Home() {
  const [events, teamMembers, shorts] = await Promise.all([getPublishedEvents(), getPublishedTeam(), getPublishedShorts()]);
  return (
    <main className="homepage-main">
      <Hero />
      <div className="container"><PushNotifications /></div>

      {/* 01 — WHAT IS THE INNOVATION LAB */}
      <section className="manifesto section" id="lab">
        <div className="container manifesto-grid">
          <ScrollReveal>
            <h2 className="mega section-name-heading">What is <i>Innovation Lab?</i></h2>
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
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 02 — WHAT IS BNV */}
      <section className="bnv section" id="bnv">
        <div className="container">
          <ScrollReveal>
            <div className="bnv-head">
              <div className="bnv-copy">
                <h2 className="mega section-name-heading">What is <i>Beyond Next Ventures?</i></h2>
                <p>
                  Beyond Next Ventures (BNV) is a Japan-based venture firm focused on deep-tech investment and ecosystem building. Its India work connects students and builders with a wider network of ventures, investment experience and people working on ambitious technologies.
                </p>
                <Link href="/about#bnv" className="text-link" data-cursor>
                  About BNV &amp; the ecosystem ↗
                </Link>
              </div>
              <div className="bnv-japan-photo" role="img" aria-label="Background photograph of Mount Fuji and the red Chureito Pagoda in Japan" />
            </div>
          </ScrollReveal>
          <div className="bnv-facts bnv-facts-single">
            <div><span className="bnv-fund-label">Fund raised</span><b><i>₹</i>600<em>crore</em></b><span className="bnv-fund-note">Deep-tech investing across ventures</span></div>
          </div>

        </div>
      </section>



      <section className="visual-story" id="starting-point">
        <div className="story-image story-one"><Image src="/campus-starting-left.jpeg" alt="IILM campus courtyard" fill sizes="50vw" /></div>
        <div className="story-copy"><ScrollReveal><SectionLabel>Start anywhere</SectionLabel><h2>No idea yet?<br /><span>That’s okay.</span></h2><p>You can come in curious. Explore entrepreneurship, join the Explorer community, attend sessions, find problems and learn how builders think.</p><Link href="#journey" className="text-link" data-cursor>Find your starting point <span>↗</span></Link></ScrollReveal></div>
        <div className="story-image story-two"><Image src="/campus-starting-right.jpeg" alt="IILM campus building" fill sizes="30vw" /></div>
      </section>

      {/* 03 — MEMBER JOURNEY */}
      <section className="journey-section section" id="journey">
        <div className="container">
          <ScrollReveal>
            <SectionLabel>03 / Member Journey Framework &amp; Roadmap</SectionLabel>
            <div className="section-heading-row">
              <div>
                <h2 className="mega">Member Journey <i>Framework &amp; Roadmap.</i></h2>
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
          <ScrollReveal><SectionLabel>Roadmap in motion</SectionLabel><h2 className="mega roadmap-motion-title">From “what if?” to<br /><i>“we built it.”</i></h2></ScrollReveal>
          <div className="flow-list">{moves.map(([n, t, d], i) => <ScrollReveal key={n} delay={i * 45}><div className="flow-item"><span>{n}</span><h3>{t}</h3><p>{d}</p></div></ScrollReveal>)}</div>
        </div>
      </section>

      {/* 04 — MEET THE TEAM */}
      <section className="team-section section" id="team">
        <div className="container">
          <ScrollReveal><SectionLabel>04 / Meet Our Team</SectionLabel><h2 className="mega">Meet Our <i>Team.</i></h2><p className="lead-copy">Meet the student team behind Campus Innovation Fellow and Social Media.</p></ScrollReveal>
          <TeamGrid members={teamMembers} />
          
        </div>
      </section>

      <section className="star-ideators-promo section"><div className="container"><div className="section-heading-row"><div><SectionLabel>Ideas worth watching</SectionLabel><h2 className="mega">Meet our <i>Star Ideators.</i></h2><p>Students turning observations into ideas, experiments and early solutions.</p></div><Link href="/star-ideators" className="text-link">Meet the Star Ideators ↗</Link></div></div></section>

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

      <FAQSection />

      <section className="events section" id="events"><div className="container"><div className="section-heading-row"><div><SectionLabel>What’s happening?</SectionLabel><h2 className="mega">Show up.<br /><i>Make something.</i></h2></div><Link href="/events" className="text-link">View full calendar ↗</Link></div>{events.length ? <EventCalendar events={events} /> : <div className="empty-editorial"><div className="empty-stamp">SOON</div><div><h3>The calendar is ready for your first event.</h3><p>New events and sessions will be announced here.</p></div><span>👀</span></div>}</div></section>

      <section className="meme-strip"><div className="meme-card"><span>01</span><p>I came to college for a degree.</p><b>Me 6 months later:<br />building an MVP at 3 AM 💀</b></div><div className="meme-card offset"><span>02</span><p>“I’ll validate the idea first.”</p><b>Also me:<br />already designing the logo 💀</b></div></section>

      <section className="final-cta section"><div className="final-blob" /><div className="container"><SectionLabel>The starting line</SectionLabel><h2>Your idea doesn't need<br />to be perfect.<br /><i>It just needs to start.</i></h2><p>Whether you’re curious, have an idea, or are already building something — there’s a place for you here.</p><Link href="/join" className="hero-btn hero-btn-red" data-cursor>Join the Lab ↗</Link></div></section>

      {/* 06 — SOCIAL / FOLLOW */}
      <section className="reels section" id="youtube-shorts"><div className="container"><SectionLabel>06 / Follow the Lab</SectionLabel><h2 className="mega">See what we’re building <i>IRL.</i></h2><p className="lead-copy">Watch the latest YouTube Shorts and follow the Lab as the community grows.</p><ReelSlider shorts={shorts} /></div></section>
    </main>
  );
}
