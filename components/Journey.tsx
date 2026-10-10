"use client";
import Link from "next/link";
import { useState } from "react";
const stages=[
 {n:"01",name:"Explorer",line:"I’m curious.",body:"No idea yet? That’s okay. Discover entrepreneurship, explore problems, join workshops and meet other students.",meta:"Sessions ≈ every 15 days",cta:"Become an Explorer",href:"/join",tone:"red"},
 {n:"02",name:"Ideator",line:"I have an idea.",body:"Turn assumptions into evidence through customer discovery, research, validation, prototyping and mentorship.",meta:"Sessions ≈ every week",cta:"Join Ideator",href:"/join",tone:"navy"},
 {n:"03",name:"Founder’s Club",line:"I’m building it.",body:"For students who have progressed into serious execution — with deeper venture-building guidance and ecosystem exposure.",meta:"Coming soon",cta:"Coming soon 🚀",href:"#founders",tone:"gold"},
];
export default function Journey(){const [active,setActive]=useState(0);return <div className="journey-award">{stages.map((s,i)=><article key={s.n} onMouseEnter={()=>setActive(i)} className={`journey-panel ${active===i?"active":""} tone-${s.tone}`}><button className="journey-hit" onClick={()=>setActive(i)} aria-expanded={active===i}><span>{s.n}</span><h3>{s.name}</h3><p>“{s.line}”</p><b>{active===i?"−":"+"}</b></button><div className="journey-body"><div><span className="mini-label">{s.meta}</span><p>{s.body}</p></div>{i<2?<Link href={s.href} className="circle-cta" data-cursor>{s.cta}<span>↗</span></Link>:<span className="circle-cta disabled">{s.cta}</span>}</div></article>)}</div>}
