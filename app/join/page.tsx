import type { Metadata } from "next";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import SectionLabel from "@/components/SectionLabel";
import { forms } from "@/lib/content";

export const metadata: Metadata = pageMetadata({
  title: "Join IILM Innovation Lab | Communities & Team",
  description: "Choose your path into the IILM × BNV Innovation Lab: Explorer, Ideator, Campus Innovation Fellow, or Social Media Team.",
  path: "/join",
  keywords: ["join IILM Innovation Lab", "IILM Explorer", "IILM Ideator", "IILM Campus Innovation Fellow", "IILM Social Media Team"]
});

export default function JoinPage(){
  return <main className="page-shell"><div className="container">
    <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Join the Lab", path: "/join" }]} />
    <SectionLabel>Join the Innovation Lab</SectionLabel>
    <h1 className="mega">Find your<br/><i>starting point.</i></h1>
    <p className="lead-copy">There are two separate ways to be part of the IILM × BNV Innovation Lab: join a community, or join the team that builds it.</p>

    <section className="join-section">
      <SectionLabel>01 / Join a community</SectionLabel>
      <h2 className="mega">Explore. <i>Ideate.</i></h2>
      <div className="join-choice-grid">
        <article>
          <span>−2</span><small>EXPLORER</small><h2>I’m curious.</h2>
          <p>No idea yet. Explore entrepreneurship, attend sessions, meet people and discover problems worth solving.</p>
          <a className="hero-btn hero-btn-red" href={forms.explorer} target="_blank" rel="noreferrer noopener">Open Explorer form ↗</a>
        </article>
        <article>
          <span>−1 → 0</span><small>IDEATOR</small><h2>I have an idea.</h2>
          <p>You have an idea and want guidance around research, validation, customers, prototyping and execution.</p>
          <a className="hero-btn hero-btn-red" href={forms.ideator} target="_blank" rel="noreferrer noopener">Open Ideator form ↗</a>
        </article>
        <article className="muted-choice">
          <span>+1</span><small>FOUNDER’S CLUB</small><h2>Founder mode.</h2>
          <p>For students who have moved into serious execution. Founder’s Club is launching soon.</p>
          <b>COMING SOON 🚀</b>
        </article>
      </div>
    </section>

    <section className="join-team section">
      <SectionLabel>02 / Join the team</SectionLabel>
      <h2 className="mega">Help build <i>the Lab.</i></h2>
      <p className="lead-copy">These are team-member opportunities, separate from the Explorer and Ideator communities.</p>
      <div className="opportunity-grid">
        <div className="opportunity">
          <span>01</span><h3>Campus Innovation Fellow</h3>
          <p>Help create the innovation culture across campus, support initiatives and build with students.</p>
          <a className="hero-btn hero-btn-red" href={forms.campus} target="_blank" rel="noreferrer noopener">Open CIF form ↗</a>
        </div>
        <div className="opportunity dark">
          <span>02</span><h3>Social Media Team</h3>
          <p>Content, reels, editing, memes, storytelling, design and digital marketing for the Innovation Lab.</p>
          <a className="hero-btn hero-btn-red" href={forms.social} target="_blank" rel="noreferrer noopener">Open Social Media form ↗</a>
        </div>
      </div>
    </section>

    <div className="form-config-note">
      <b>Separate forms, separate paths.</b>
      <p>Explorer, Ideator, Campus Innovation Fellow and Social Media Team now have their own dedicated routes. Nothing on this Join page needs to redirect applicants to another form.</p>
    </div>
    <Link href="/" className="text-link">Back to Innovation Lab ↗</Link>
  </div></main>
}
