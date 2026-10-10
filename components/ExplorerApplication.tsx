"use client";
import { FormEvent, useState } from "react";

const WHATSAPP_COMMUNITY_URL = process.env.NEXT_PUBLIC_EXPLORER_WHATSAPP_URL || "";

export default function ExplorerApplication(){
  const [submitted,setSubmitted] = useState(false);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");

  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const required = ["name","contact","email","degree","section","year","campus","stage","motivation","source"];
    const missing = required.some((key)=>!String(form.get(key)||"").trim());
    if(missing){ setError("Please complete every required field."); setLoading(false); return; }
    try {
      const response = await fetch("/api/applications", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({
        type:"explorer", full_name:String(form.get("name")||""), email:String(form.get("email")||""), phone:String(form.get("contact")||""),
        campus:String(form.get("campus")||""), degree:String(form.get("degree")||""), year:String(form.get("year")||""),
        current_stage:String(form.get("stage")||""), message:String(form.get("motivation")||""),
        payload:{ class_section:String(form.get("section")||""), source:String(form.get("source")||"") }, website:String(form.get("website")||"")
      })});
      const result = await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(result?.error || "We could not submit your application.");
      setSubmitted(true);
    } catch(err){ setError(err instanceof Error ? err.message : "We could not submit your application. Please try again."); }
    finally { setLoading(false); }
  }

  if(submitted) return <section className="explorer-success">
    <div className="success-burst">✦</div>
    <span className="explorer-kicker">YOU’RE IN THE EXPLORER QUEUE</span>
    <h2>Curiosity unlocked.<br/><i>Now go explore.</i></h2>
    <p>Thanks for applying to the IILM × BNV Innovation Lab. Join the WhatsApp Community to stay updated about sessions, workshops, masterclasses, competitions and other opportunities.</p>
    {WHATSAPP_COMMUNITY_URL ? <a className="hero-btn hero-btn-red" href={WHATSAPP_COMMUNITY_URL} target="_blank" rel="noreferrer">Join WhatsApp Community ↗</a> : <div className="explorer-config">WhatsApp Community link will be added here once the official link is configured.</div>}
    <a className="text-link" href="/join">Back to Join the Lab ↗</a>
  </section>;

  return <form className="explorer-form" onSubmit={submit} noValidate>
    <div className="explorer-form-head">
      <span className="explorer-kicker">EXPLORER APPLICATION / −2</span>
      <h2>Start with <i>curiosity.</i></h2>
      <p>You don’t need a startup idea. Tell us a little about yourself and what you want to explore.</p>
    </div>

    <div className="explorer-form-section"><span>01</span><div><small>ABOUT YOU</small><h3>Let’s meet you.</h3></div></div>
    <div className="explorer-grid">
      <label>Full Name *<input name="name" required placeholder="Your full name" /></label>
      <label>Contact Details *<input name="contact" required placeholder="Mobile / WhatsApp number" inputMode="tel" /></label>
      <label>Email ID *<input name="email" type="email" required placeholder="you@iilm.edu" /></label>
      <label>Degree Program *<input name="degree" required placeholder="B.Tech CSE, BBA, MBA…" /></label>
      <label>Class Section *<input name="section" required placeholder="e.g. A / B / C" /></label>
      <label>Year of Study *<select name="year" required defaultValue=""><option value="" disabled>Select your year</option><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option><option>5th Year</option><option>Other</option></select></label>
      <label className="full">IILM Campus *<select name="campus" required defaultValue=""><option value="" disabled>Select your campus</option><option>Greater Noida</option><option>Lodhi Road</option><option>Gurugram</option></select></label>
    </div>

    <div className="explorer-form-section"><span>02</span><div><small>WHERE YOU ARE</small><h3>Your startup stage.</h3></div></div>
    <fieldset className="explorer-stage"><legend>Which best describes you right now? *</legend>
      <label><input type="radio" name="stage" value="I do not have an idea yet, just curious" required/><span><b>−2</b><strong>No idea yet</strong><small>I’m curious and want to explore.</small></span></label>
      <label><input type="radio" name="stage" value="I have a half-baked idea"/><span><b>−1</b><strong>Half-baked idea</strong><small>Something is forming in my head.</small></span></label>
      <label><input type="radio" name="stage" value="I have an idea"/><span><b>0</b><strong>I have an idea</strong><small>I want to learn what comes next.</small></span></label>
      <label><input type="radio" name="stage" value="I have already executed my idea"/><span><b>+1</b><strong>Already executed</strong><small>I’ve already started building.</small></span></label>
    </fieldset>

    <div className="explorer-form-section"><span>03</span><div><small>YOUR WHY</small><h3>What pulls you in?</h3></div></div>
    <label className="explorer-full-label">Why do you want to pursue entrepreneurship? *<textarea name="motivation" required rows={6} placeholder="There’s no perfect answer. Tell us what makes you curious…" /></label>

    <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="form-honeypot" />

    <div className="explorer-form-section"><span>04</span><div><small>DISCOVERY</small><h3>How did you find us?</h3></div></div>
    <fieldset className="explorer-source"><legend>How did you get to know about the IILM × BNV Innovation Lab? *</legend>
      {["Orientation","ERP System","College WhatsApp Group","Faculty","Members of the Innovation Lab","Other"].map(x=><label key={x}><input type="radio" name="source" value={x} required/><span>{x}</span></label>)}
    </fieldset>

    {error && <p className="explorer-error">{error}</p>}
    <div className="explorer-submit"><button className="hero-btn hero-btn-red" disabled={loading}>{loading?"Opening the lab…":"Become an Explorer ↗"}</button><small>By submitting, you’re joining a community built around learning, experimenting and building.</small></div>
    <div className="explorer-note"><b>Already have a startup idea?</b> <a href="/join#ideator">Apply as an Ideator ↗</a></div>
  </form>
}
