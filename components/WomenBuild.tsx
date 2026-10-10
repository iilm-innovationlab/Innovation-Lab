"use client";

import Link from "next/link";
import { useState } from "react";

const stories = [
  {
    no: "01",
    name: "Indra Nooyi",
    role: "Former CEO & Chairman, PepsiCo",
    tag: "GLOBAL LEADERSHIP",
    fact: "Nooyi served as PepsiCo’s CEO for 12 years and joined the company in 1994.",
    lesson: "Big leadership careers can start long before anyone calls you a leader.",
    source: "https://www.pepsico.com/newsroom/press-releases/2019/pepsico-elects-ceo-ramon-laguarta-as-chairman-of-the-board",
    initials: "IN",
    image: "https://images.squarespace-cdn.com/content/v1/5d7121a2621fa50001fc829f/1573844000262-ZXEDCOYYQX0869HMJ7OJ/Nooyi%2C%2BIndra.jpg",
  },
  {
    no: "02",
    name: "Ghazal Alagh",
    role: "Co-founder & CIO, Honasa Consumer",
    tag: "PRODUCT + PURPOSE",
    fact: "Ghazal co-founded Honasa in 2016 and helped build Mamaearth and other consumer brands around specific customer needs.",
    lesson: "Start with a real problem. Then keep listening to the people who have it.",
    source: "https://honasa.in/pages/ghazal-alagh",
    initials: "GA",
    image: "https://cdn.shopify.com/s/files/1/0615/0048/9770/files/Frame_3_1_e7e062d0-d8b4-47c6-83c5-a1635c0a12b3.png?v=1767952849",
  },
  {
    no: "03",
    name: "Falguni Nayar",
    role: "Founder, Executive Chairperson & CEO, Nykaa",
    tag: "LATE-BLOOMING FOUNDER",
    fact: "Falguni founded Nykaa in 2012 after a long career in investment banking and built it into a major beauty and lifestyle platform.",
    lesson: "There is no universal age, timeline or career path for becoming a founder.",
    source: "https://www.nykaa.com/who_are_we-app/lp",
    initials: "FN",
    image: "https://images-static.naikaa.com/media/wysiwyg/uiTools/2023-12/Falguni-Nayar-2.jpg",
  },
  {
    no: "04",
    name: "Kiran Mazumdar-Shaw",
    role: "Founder & Executive Chairperson, Biocon",
    tag: "DEEP TECH",
    fact: "Kiran founded Biocon and helped build it from a small beginning into a global biopharmaceutical enterprise.",
    lesson: "A technical problem can become a very big company when someone decides to build around it.",
    source: "https://www.biocon.com/about-us/board-of-directors-biocon/kiran-mazumdar-shaw/",
    initials: "KM",
    image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kiran%20Mazumdar-Shaw%20BNC.jpg",
  },
];

const myths = [
  ["“I need a perfect idea.”", "Nope. Start with curiosity. Explorer exists for exactly that."],
  ["“I need to know everything first.”", "Also nope. Learn, test, ask, repeat. That is literally the process."],
  ["“I have to be fearless.”", "Absolutely not. You can build while being nervous. Founder mode is not a personality type."],
  ["“Someone else is already doing it.”", "Probably. That can be useful. Study the problem, find the gap, make your version better."],
];

export default function WomenBuild() {
  const [myth, setMyth] = useState(0);

  return (
    <section className="women-build section" id="women-in-entrepreneurship">
      <div className="women-noise" />
      <div className="container">
        <div className="women-head">
          <div>
            <span className="section-label women-label"><i /> Women who build</span>
            <h2 className="mega">Your idea deserves<br /><i>a seat at the table.</i></h2>
            <p className="lead-copy">Entrepreneurship is not a boys-only group project. If you have a problem you care about, a weird idea, or simply a “what if?” — there is room to start.</p>
          </div>
          <div className="women-burst" aria-hidden="true">
            <span>NO PERMISSION</span>
            <strong>NEEDED.</strong>
            <small>just curiosity + action ✦</small>
          </div>
        </div>

        <div className="women-myth-box">
          <div>
            <span className="women-mini">FOUNDER MYTH BUSTER</span>
            <h3>{myths[myth][0]}</h3>
            <p>{myths[myth][1]}</p>
          </div>
          <button type="button" onClick={() => setMyth((myth + 1) % myths.length)}>
            Bust another myth <b>↻</b>
          </button>
          <div className="women-dots" aria-hidden="true">{myths.map((_, i) => <i key={i} className={i === myth ? "active" : ""} />)}</div>
        </div>

        <div className="women-story-head">
          <span className="women-mini">REAL PEOPLE. REAL BUILDS.</span>
          <p>Four examples, from different industries and paths.</p>
        </div>

        <div className="women-stories">
          {stories.map((story) => (
            <article className="women-story" key={story.name}>
              <div className="women-story-visual">
                <span className="women-story-no">{story.no}</span>
                <span className="women-story-tag">{story.tag}</span>
                <img className="women-story-photo" src={story.image} alt={`${story.name} portrait`} loading="lazy" decoding="async" />
                <div className="women-story-photo-shade" />
                <div className="women-monogram"><span>{story.initials}</span></div>
                <div className="women-orbit women-orbit-a" />
                <div className="women-orbit women-orbit-b" />
              </div>
              <div className="women-story-copy">
                <h3>{story.name}</h3>
                <span>{story.role}</span>
                <p>{story.fact}</p>
                <strong>Takeaway → <em>{story.lesson}</em></strong>
                <a href={story.source} target="_blank" rel="noreferrer">Verified story ↗</a>
              </div>
            </article>
          ))}
        </div>

        <div className="women-cta">
          <div>
            <span className="women-mini">YOUR TURN</span>
            <h3>Plot twist: the next story could be yours.</h3>
            <p>You do not have to arrive as a “founder”. Start as a curious student. We will help you find the next step.</p>
          </div>
          <Link href="#journey" className="hero-btn hero-btn-red" data-cursor>Start curious ↗</Link>
        </div>
      </div>
    </section>
  );
}
