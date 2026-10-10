"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const ideaPrompts = [
  "Spot a problem people complain about.",
  "Ask: what takes 10 minutes but should take 10 seconds?",
  "Build the tiny version first. 🚀",
  "Talk to 3 real users before you code.",
  "Turn one annoying campus moment into an idea."
];

export default function Hero(){
 const stage=useRef<HTMLDivElement>(null);
 const [promptIndex,setPromptIndex]=useState(0);
 const [spark,setSpark]=useState(0);
 useEffect(()=>{const el=stage.current;if(!el||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const onMove=(e:MouseEvent)=>{const r=el.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5;const y=(e.clientY-r.top)/r.height-.5;el.style.setProperty("--mx",`${x*18}px`);el.style.setProperty("--my",`${y*18}px`)};const reset=()=>{el.style.setProperty("--mx","0px");el.style.setProperty("--my","0px")};el.addEventListener("mousemove",onMove);el.addEventListener("mouseleave",reset);return()=>{el.removeEventListener("mousemove",onMove);el.removeEventListener("mouseleave",reset)}} ,[]);
 const nextIdea=()=>{setPromptIndex(i=>(i+1)%ideaPrompts.length);setSpark(s=>s+1)};
 return <section className="hero-award" id="top">
   <div className="hero-noise"/><div className="hero-orbit orbit-a"/><div className="hero-orbit orbit-b"/>
   <div className="hero-wrap">
    <div className="hero-topline"><span>IILM × BNV Innovation Lab</span><span>Explore · Build · Launch</span></div>
    <div className="hero-copy-award">
      <h1><span>You don’t need</span><em>an idea.</em><strong>You just need curiosity.</strong></h1>
      <p>From “What if?” to “We built it.” A place to explore problems, develop ideas, validate concepts, build prototypes and move toward entrepreneurship.</p>
      <div className="hero-actions"><Link href="#journey" className="hero-btn hero-btn-red" data-cursor>Start your journey <span>↗</span></Link><Link href="#lab" className="hero-btn hero-btn-ghost" data-cursor>I’m just curious <span>👀</span></Link></div>
      <button className="idea-generator" type="button" onClick={nextIdea} aria-label="Generate another innovation prompt">
        <span className="idea-generator-top"><b>NEED A LITTLE SPARK?</b><i>tap to shuffle ↻</i></span>
        <strong key={spark}>{ideaPrompts[promptIndex]}</strong>
        <span className="idea-dots" aria-hidden="true"><i/><i/><i/><i/><i/></span>
      </button>
    </div>
    <div className="hero-stage" ref={stage}>
      <div className="hero-image-main"><Image src="/campus-2.webp" alt="IILM campus courtyard" fill priority loading="eager" sizes="(max-width: 900px) 92vw, 68vw" unoptimized/></div>
      <div className="hero-image-inset"><Image src="/campus-3.webp" alt="IILM campus building" fill sizes="320px" unoptimized/></div>
      <div className="hero-image-float"><Image src="/campus-4.webp" alt="IILM campus walkway" fill sizes="260px" unoptimized/><span>LIVE / CAMPUS</span></div>
      <div className="hero-sticker sticker-a">NO IDEA YET?<br/><b>PERFECT.</b></div>
      <div className="hero-sticker sticker-b">LET’S<br/><b>BUILD →</b></div>
      <div className="hero-sticker sticker-c">Founder mode<br/><b>loading…</b></div>
      <div className="hero-sticker sticker-d">WHAT IF?<br/><b>TRY IT.</b></div>
      <div className="hero-cross">+</div><div className="hero-arrow">↘</div>
      <div className="hero-spark spark-1">✦</div><div className="hero-spark spark-2">✦</div><div className="hero-spark spark-3">✦</div>
    </div>
   </div>
   <div className="hero-scroll"><span>Scroll to explore</span><i/></div>
 </section>
}
