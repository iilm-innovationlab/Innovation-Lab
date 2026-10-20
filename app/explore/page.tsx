import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { bnvIndiaPortfolio } from "@/lib/content";
import { ResourcesSection } from "@/components/PublicExtras";
import ScrollReveal from "@/components/ScrollReveal";
import SectionLabel from "@/components/SectionLabel";

export const metadata: Metadata = pageMetadata({ title: "Explore | IILM × BNV Innovation Lab", description: "Explore real problems, ventures in the BNV India network, and practical tools for your innovation journey.", path: "/explore" });

export default function ExplorePage() {
  return (
    <main className="explore-page">
      <section className="section" style={{ paddingBottom: "65px" }}>
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Explore the Lab</SectionLabel>
            <h1 className="page-heading">Explore ideas.<br /><i>Find what matters.</i></h1>
            <p className="lead-copy" style={{ marginTop: "28px" }}>Start with real problems, discover ventures built around ambitious ideas, and find practical tools for your next step.</p>
          </ScrollReveal>
        </div>
      </section>

      <section className="portfolio section" id="portfolio"><div className="container"><ScrollReveal><SectionLabel>BNV India network of ventures</SectionLabel><div className="section-heading-row"><div><h2 className="mega">Ideas that made it <i>out.</i></h2><p>BNV’s official India portfolio includes ventures across healthcare, AI/digital, climate, agriculture/food and other deep-tech categories.</p></div><a className="text-link" href="https://beyondnextventures.com/india/" target="_blank" rel="noreferrer noopener">Explore BNV India ↗</a></div></ScrollReveal><div className="portfolio-grid">{bnvIndiaPortfolio.map((p, i) => <a key={p.name} className="portfolio-card" href="https://beyondnextventures.com/portfolio/" target="_blank" rel="noreferrer noopener"><span>{String(i + 1).padStart(2, "0")}</span><h3>{p.name}</h3><p>{p.note}</p><b>BNV portfolio ↗</b></a>)}</div></div></section>

      <section className="problems section" id="problems"><div className="container"><ScrollReveal><SectionLabel>Problems we explore</SectionLabel><h2 className="mega">Start with the <i>problem.</i></h2><p className="lead-copy">Not every problem needs to become a startup. The first move is to notice it, frame it and talk to people.</p></ScrollReveal><div className="problem-grid"><div><span>01</span><h3>What keeps happening?</h3><p>Bring a recurring student, campus, consumer or real-world frustration.</p></div><div><span>02</span><h3>Who feels it?</h3><p>Map the people who experience the problem and what they do today.</p></div><div><span>03</span><h3>What could change?</h3><p>Turn observations into hypotheses worth testing with real people.</p></div></div></div></section>

      <ResourcesSection />
    </main>
  );
}
