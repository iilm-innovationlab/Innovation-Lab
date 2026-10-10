"use client";
import { ChangeEvent, FormEvent, useState } from "react";
import { uploadImageDirectToCloudinary } from "@/lib/cloudinary-client";

export default function SocialMediaApplication(){
  const [submitted,setSubmitted] = useState(false);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");
  const [profilePicture,setProfilePicture] = useState<File | null>(null);
  const [picturePreview,setPicturePreview] = useState("");

  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const required = ["name","whatsapp","email","year","degree","campus","idea","humour"];
    const missing = required.some((key)=>!String(form.get(key)||"").trim());
    const roles = form.getAll("roles").map(String).filter(Boolean);
    if (!roles.length) { setError("Please select at least one role."); return; }
    if(missing){ setError("Please complete every required field."); return; }
    setLoading(true);
    try {
      const application: Record<string, unknown> = {
        type:"social_media", full_name:String(form.get("name")||""), email:String(form.get("email")||""), phone:String(form.get("whatsapp")||""),
        campus:String(form.get("campus")||""), degree:String(form.get("degree")||""), year:String(form.get("year")||""),
        message:String(form.get("idea")||""), payload:{ roles, humour:String(form.get("humour")||""), work:String(form.get("work")||""), linkedin:String(form.get("linkedin")||"") }, website:String(form.get("website")||"")
      };
      if (profilePicture) {
        // Only the URL goes to the application API; the image bytes go straight to Cloudinary.
        application.profile_picture_url = await uploadImageDirectToCloudinary(profilePicture, "application");
      }
      const response = await fetch("/api/applications", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(application) });
      const result = await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(result?.error || "We could not submit your application.");
      setSubmitted(true);
    } catch(err){ setError(err instanceof Error ? err.message : "We could not submit your application. Please try again."); }
    finally { setLoading(false); }
  }

  const handleProfilePicture = (event:ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setError("");
    if(!file){setProfilePicture(null);setPicturePreview("");return;}
    if(!["image/jpeg","image/png","image/webp"].includes(file.type)){setProfilePicture(null);setPicturePreview("");event.target.value="";setError("Choose a JPG, PNG, or WebP image.");return;}
    if(file.size>5*1024*1024){setProfilePicture(null);setPicturePreview("");event.target.value="";setError("Profile picture must be 5 MB or smaller.");return;}
    setProfilePicture(file);
    const reader=new FileReader();reader.onload=()=>setPicturePreview(String(reader.result||""));reader.readAsDataURL(file);
  };

  if(submitted) return <section className="explorer-success social-success">
    <div className="success-burst">✦</div>
    <span className="explorer-kicker">SOCIAL MEDIA TEAM / APPLICATION RECEIVED</span>
    <h2>Okay, content<br/><i>person. We see you.</i> 👀</h2>
    <p>Thanks for applying to the IILM × BNV Social Media Team. We’ll review your ideas, creative thinking and work samples.</p>
    <a className="hero-btn hero-btn-red" href="/join">Back to Join the Lab ↗</a>
  </section>;

  return <form className="explorer-form social-form" onSubmit={submit} noValidate>
    <div className="explorer-form-head">
      <span className="explorer-kicker">SOCIAL MEDIA TEAM / APPLICATION</span>
      <h2><i>Vaste Guna Huiya?</i> 👀</h2>
      <p>If you know what that means, you might just be our kind of person.</p>
      <p className="social-intro">We’re looking for students who can bring <b>creativity, fun and humour</b> to the IILM × BNV Innovation Lab’s Instagram page and help us build a brand that students actually want to follow.</p>
      <div className="social-callout"><strong>No fancy resume required.</strong><span>Show us how you think, what you create, and what you’d bring to the table.</span></div>
    </div>

    <div className="explorer-form-section"><span>01</span><div><small>ABOUT YOU</small><h3>Who are we talking to?</h3></div></div>
    <div className="explorer-grid">
      <label>Full Name *<input name="name" required placeholder="Your full name" /></label>
      <label>WhatsApp Number *<input name="whatsapp" required placeholder="Your WhatsApp number" inputMode="tel" /></label>
      <label>Email Address *<input name="email" type="email" required placeholder="you@iilm.edu" /></label>
      <label>Year of Study *<select name="year" required defaultValue=""><option value="" disabled>Select your year</option><option>Year 1</option><option>Year 2</option><option>Year 3</option><option>Year 4</option><option>Year 5</option></select></label>
      <label>Degree / Program *<input name="degree" required placeholder="B.Tech CSE, BBA, MBA…" /></label>
      <label className="full">Campus *<select name="campus" required defaultValue=""><option value="" disabled>Select your campus</option><option>IILM Greater Noida</option><option>IILM Gurugram</option><option>IILM Lodhi Road</option></select></label>
    </div>
    <div className="explorer-grid profile-picture-upload"><label className="full">Profile picture <span className="profile-picture-optional">Optional · JPG, PNG, or WebP · max 5 MB</span><input name="profile_picture" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleProfilePicture} /></label>{picturePreview && <div className="profile-picture-preview"><img src={picturePreview} alt="Profile picture preview" /><button type="button" onClick={() => {setProfilePicture(null);setPicturePreview("");const input=document.querySelector<HTMLInputElement>('input[name="profile_picture"]');if(input)input.value="";}}>Remove picture</button></div>}</div>

    <div className="explorer-form-section"><span>02</span><div><small>YOUR ROLE</small><h3>Pick your creative weapon.</h3></div></div>
    <fieldset className="explorer-source social-roles"><legend>Which role(s) are you interested in? *</legend>
      {["Content Creator","Brand Strategist","Video Editor","Visual Designer","Social Media Manager"].map(x=><label key={x}><input type="checkbox" name="roles" value={x}/><span>{x}</span></label>)}
    </fieldset>

    <div className="explorer-form-section"><span>03</span><div><small>THE ₹0 CHALLENGE</small><h3>Okay, show us how you think.</h3></div></div>
    <label className="explorer-full-label">You have ₹0, one Instagram account and 7 days to make students across IILM notice the Innovation Lab. What would you do? *<textarea name="idea" required rows={7} placeholder="Give us your wildest realistic plan…" /></label>

    <div className="explorer-form-section"><span>04</span><div><small>MAKE IT FUNNY</small><h3>Would students actually share it?</h3></div></div>
    <label className="explorer-full-label">You’re asked to make a reel about “Entrepreneurship at IILM.” How would you add humour so students actually want to watch and share it? *<textarea name="humour" required rows={7} placeholder="Pitch the reel. Hook, joke, format — go for it." /></label>

    <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="form-honeypot" />

    <div className="explorer-form-section"><span>05</span><div><small>SHOW YOUR WORK</small><h3>Drop the receipts.</h3></div></div>
    <label className="explorer-full-label">Link to anything you’ve created: Instagram/content page, reels, videos, edits, designs, memes, photography, college projects, portfolio, YouTube channel, or anything else you’re proud of.<textarea name="work" rows={4} placeholder="Paste your best link(s)" /></label>
    <label className="explorer-full-label">LinkedIn Profile Link <input name="linkedin" placeholder="https://linkedin.com/in/your-name" inputMode="url" /></label>

    {error && <p className="explorer-error">{error}</p>}
    <div className="explorer-submit"><button className="hero-btn hero-btn-red" disabled={loading}>{loading?"Sending your application…":"Apply to the Social Media Team ↗"}</button><small>No passwords. No boring corporate energy. Just show us what you can make.</small></div>
  </form>
}
