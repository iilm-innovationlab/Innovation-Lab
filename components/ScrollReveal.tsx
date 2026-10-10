"use client";
import { useEffect, useRef, type ReactNode } from "react";
export default function ScrollReveal({children,className="",delay=0}:{children:ReactNode;className?:string;delay?:number}){
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{const el=ref.current;if(!el)return;el.style.setProperty("--delay",`${delay}ms`);const io=new IntersectionObserver(([e])=>{if(e.isIntersecting){el.classList.add("is-visible");io.disconnect()}},{threshold:.1,rootMargin:"0px 0px -8% 0px"});io.observe(el);return()=>io.disconnect()},[delay]);
 return <div ref={ref} className={`scroll-reveal ${className}`}>{children}</div>;
}
