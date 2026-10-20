"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

export default function Hero(){
 const stage=useRef<HTMLDivElement>(null);
 useEffect(()=>{const el=stage.current;if(!el||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const onMove=(e:MouseEvent)=>{const r=el.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5;const y=(e.clientY-r.top)/r.height-.5;el.style.setProperty("--mx",`${x*18}px`);el.style.setProperty("--my",`${y*18}px`)};const reset=()=>{el.style.setProperty("--mx","0px");el.style.setProperty("--my","0px")};el.addEventListener("mousemove",onMove);el.addEventListener("mouseleave",reset);return()=>{el.removeEventListener("mousemove",onMove);el.removeEventListener("mouseleave",reset)}} ,[]);
 return <section className="hero-award" id="top">
   <div className="hero-noise"/><div className="hero-orbit orbit-a"/><div className="hero-orbit orbit-b"/>
   <div className="hero-wrap">
    <div className="hero-copy-award">
      <h1><span>You don’t need</span><em>an idea.</em><strong>You just need curiosity.</strong></h1>
      <p>From “What if?” to “We built it.” A place to explore problems, develop ideas, validate concepts, build prototypes and move toward entrepreneurship.</p>
      <div className="hero-actions"><Link href="#journey" className="hero-btn hero-btn-red" data-cursor>Start your journey <span>↗</span></Link><Link href="#journey" className="hero-btn hero-btn-ghost" data-cursor>How to Be a Member <span>↗</span></Link></div>
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
 </section>
}
