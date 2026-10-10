import type { Metadata } from "next";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import { pageMetadata } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import SectionLabel from "@/components/SectionLabel";
import { bnvIndiaPortfolio, campuses } from "@/lib/content";

export const metadata: Metadata = pageMetadata({ title: "About IILM Innovation Lab & BNV", description: "Learn what IILM × BNV Innovation Lab is, how the student entrepreneurship journey works, what Beyond Next Ventures brings, and how the venture and mentor ecosystem connects to IILM students.", path: "/about", keywords: ["IILM Innovation Lab", "IILM BNV", "About IILM Innovation Lab", "Beyond Next Ventures India", "IILM entrepreneurship", "student innovation ecosystem"] });

export default function AboutPage() {
  return (
    <main className="page-shell">
      <div className="container"><BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "About Us", path: "/about" }]} />
        <SectionLabel>About Us</SectionLabel>
        <h1 className="mega">The story behind<br /><i>IILM × BNV.</i></h1>
        <div className="about-hero-copy">
          <p>Innovation Lab is the student-facing space where curiosity, ideas, validation and venture building come together. Beyond Next Ventures brings venture-building and deep-tech ecosystem experience into that journey.</p>
          <Image src="/campus-1.webp" alt="IILM campus" width={1800} height={1050} priority unoptimized />
        </div>

        <section className="about-split" id="innovation-lab">
          <div><SectionLabel>01 / Innovation Lab</SectionLabel><h2>A home for<br /><i>curiosity.</i></h2></div>
          <div>
            <p>Students do not have to arrive with a polished startup idea. The Lab is designed to give them a progression: discover what interests them, explore problems, form and test ideas, validate them with real people, build prototypes or MVPs, and move toward venture building.</p>
            <p>The public community journey has three stages: <b>Explorer</b> for curiosity and discovery, <b>Ideator</b> for ideas, research and validation, and <b>Founder’s Club</b> for serious execution. Founder’s Club is launching soon.</p>
          </div>
        </section>

        <section className="about-detail-grid">
          <article><span>EXPLORER</span><h3>Discover.</h3><p>For students who are curious but do not have an idea yet. Sessions, workshops, problem discovery and exposure help turn curiosity into direction.</p></article>
          <article><span>IDEATOR</span><h3>Validate.</h3><p>For students with an idea. The focus moves to market research, customer discovery, validation, prototyping, MVP thinking and mentorship.</p></article>
          <article><span>FOUNDER’S CLUB</span><h3>Build.</h3><p>The advanced community for students who have moved beyond validation into prototype, MVP and venture execution. It is launching soon.</p></article>
        </section>

        <section className="about-bnv" id="bnv">
          <SectionLabel>02 / Beyond Next Ventures</SectionLabel>
          <h2>Japan-based. Deep-tech focused. India-connected.</h2>
          <p>Beyond Next Ventures (BNV) is a Japan-based venture firm founded in Tokyo in 2014. Its official materials describe a focus on deep-tech startups, including investment and ecosystem building across Japan and India. Its India activity has been underway since 2019.</p>
          <div className="bnv-facts"><div><b>2014</b><span>Founded in Tokyo</span></div><div><b>2019</b><span>India investing since</span></div><div><b>Seed → early</b><span>Early-stage focus</span></div><div><b>Deep tech</b><span>Healthcare · AI/digital · Climate · Agri/Food · other deep tech</span></div></div>
        </section>

        <section className="about-network">
          <SectionLabel>03 / What the ecosystem brings</SectionLabel>
          <div className="about-network-grid">
            <div><h3>Venture network</h3><p>Students can see real examples of companies that have moved from ideas into products, markets and ventures through BNV’s India portfolio.</p></div>
            <div><h3>Mentors &amp; people</h3><p>The Lab is designed around access to people: founders, mentors, ecosystem members, speakers and other builders who can help students learn through conversations and feedback.</p></div>
            <div><h3>Campus communities</h3><p>The ecosystem connects students across IILM Greater Noida, IILM Gurugram and IILM Rohtak.</p></div>
            <div><h3>Japan–India bridge</h3><p>BNV’s Japan–India context gives the Lab a wider lens on deep-tech ventures, commercialization and international ecosystem building.</p></div>
          </div>
          <div className="campus-row">{campuses.map(c => <span key={c}>{c}</span>)}</div>
        </section>

        <section className="about-portfolio">
          <div className="section-heading-row"><div><SectionLabel>04 / BNV India venture network</SectionLabel><h2 className="mega small-mega">Companies to <i>learn from.</i></h2></div><a className="text-link" href="https://beyondnextventures.com/portfolio/" target="_blank" rel="noreferrer">View BNV portfolio ↗</a></div>
          <div className="portfolio-grid">{bnvIndiaPortfolio.map((p, i) => <a key={p.name} className="portfolio-card" href="https://beyondnextventures.com/portfolio/" target="_blank" rel="noreferrer"><span>{String(i + 1).padStart(2, "0")}</span><h3>{p.name}</h3><p>{p.note}</p></a>)}</div>
        </section>

        <section className="team-join-strip"><div><h2>Now find your starting point.</h2><p>Explore the journey, meet the team or join the Lab.</p></div><div className="about-actions"><Link href="/programs" className="hero-btn hero-btn-red">Explore the journey ↗</Link><Link href="/team" className="text-link">Meet the team ↗</Link></div></section>
      </div>
    </main>
  );
}
