"use client";
import { maturitySteps } from "@/lib/content";
import { useState } from "react";
export default function MaturityJourney(){
 const [active,setActive]=useState(0);
 return <div className="maturity-journey">
  <div className="maturity-line" aria-hidden="true" />
  {maturitySteps.map((s,i)=><button key={s.value} className={`maturity-card ${active===i?"is-active":""}`} onClick={()=>setActive(i)}>
   <span className="maturity-value">{s.value}</span><small>{s.community}</small><h3>{s.title}</h3><p>{s.description}</p>
  </button>)}
 </div>
}
