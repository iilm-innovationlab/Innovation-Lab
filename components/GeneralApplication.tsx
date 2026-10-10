"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { uploadImageDirectToCloudinary } from "@/lib/cloudinary-client";

type ApplicationKind = "ideator" | "campus_innovation_fellow";

export default function GeneralApplication({ type }: { type: ApplicationKind }) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState("");
  const ideator = type === "ideator";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const application: Record<string, unknown> = {
          type,
          full_name: String(form.get("name") || ""),
          email: String(form.get("email") || ""),
          phone: String(form.get("phone") || ""),
          campus: String(form.get("campus") || ""),
          degree: String(form.get("degree") || ""),
          year: String(form.get("year") || ""),
          current_stage: String(form.get("stage") || ""),
          idea: ideator ? String(form.get("idea") || "") : null,
          problem: ideator ? String(form.get("problem") || "") : null,
          target_users: ideator ? String(form.get("users") || "") : null,
          prototype_url: ideator ? String(form.get("prototype") || "") : null,
          message: String(form.get("motivation") || ""),
          payload: ideator
            ? { validation: String(form.get("validation") || "") }
            : { relevant_experience: String(form.get("experience") || ""), contribution: String(form.get("contribution") || "") },
          website: String(form.get("website") || ""),
        };
      if (type === "campus_innovation_fellow" && profilePicture) {
        // The image bypasses Vercel and uploads directly from this browser to Cloudinary.
        application.profile_picture_url = await uploadImageDirectToCloudinary(profilePicture, "application");
      }
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(application),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error || "We could not submit your application. Please try again.");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not submit your application. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleProfilePicture = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setError("");
    if (!file) { setProfilePicture(null); setPicturePreview(""); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setProfilePicture(null); setPicturePreview(""); event.target.value = ""; setError("Choose a JPG, PNG, or WebP image."); return; }
    if (file.size > 5 * 1024 * 1024) { setProfilePicture(null); setPicturePreview(""); event.target.value = ""; setError("Profile picture must be 5 MB or smaller."); return; }
    setProfilePicture(file);
    const reader = new FileReader();
    reader.onload = () => setPicturePreview(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  if (submitted) return <section className="explorer-success"><div className="success-burst">✓</div><span className="explorer-kicker">APPLICATION RECEIVED</span><h2>{ideator ? <>Your idea has<br /><i>a starting point.</i></> : <>Thanks for stepping<br /><i>up to build.</i></>}</h2><p>Your application has been submitted successfully. The Innovation Lab team will review it.</p><a className="text-link" href="/join">Back to Join the Lab ↗</a></section>;

  return <form className="explorer-form" onSubmit={submit}>
    <div className="explorer-form-head"><span className="explorer-kicker">{ideator ? "IDEATOR / −1 → 0" : "CAMPUS INNOVATION FELLOW / TEAM APPLICATION"}</span><h2>{ideator ? <>Let’s test the <i>idea.</i></> : <>Help build the <i>ecosystem.</i></>}</h2><p>{ideator ? "Tell us about the problem you want to solve and what you have learned so far." : "Tell us about yourself, your campus, and how you would help students discover and build ideas."}</p></div>
    <div className="explorer-form-section"><span>01</span><div><small>ABOUT YOU</small><h3>Let’s meet you.</h3></div></div>
    <div className="explorer-grid">
      <label>Full name *<input name="name" required maxLength={160} autoComplete="name" /></label>
      <label>Email address *<input name="email" required type="email" maxLength={254} autoComplete="email" /></label>
      <label>Phone / WhatsApp *<input name="phone" required inputMode="tel" maxLength={40} /></label>
      <label>Degree / programme *<input name="degree" required maxLength={180} placeholder="e.g. B.Tech CSE, BBA, MBA" /></label>
      <label>Year of study *<select name="year" required defaultValue=""><option value="" disabled>Select year</option><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option><option>5th Year</option><option>Other</option></select></label>
      <label>Campus *<select name="campus" required defaultValue=""><option value="" disabled>Select campus</option><option>Greater Noida</option><option>Gurugram</option><option>Rohtak</option><option>Other</option></select></label>
    </div>
    {!ideator && <div className="explorer-grid profile-picture-upload"><label className="full">Profile picture <span className="profile-picture-optional">Optional · JPG, PNG, or WebP · max 5 MB</span><input name="profile_picture" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleProfilePicture} /></label>{picturePreview && <div className="profile-picture-preview"><img src={picturePreview} alt="Profile picture preview" /><button type="button" onClick={() => { setProfilePicture(null); setPicturePreview(""); const input = document.querySelector<HTMLInputElement>('input[name="profile_picture"]'); if (input) input.value = ""; }}>Remove picture</button></div>}</div>}
    {ideator ? <>
      <div className="explorer-form-section"><span>02</span><div><small>YOUR IDEA</small><h3>What are you exploring?</h3></div></div>
      <div className="explorer-grid"><label className="full">Describe your idea *<textarea name="idea" required rows={4} maxLength={4000} /></label><label className="full">What problem are you trying to solve? *<textarea name="problem" required rows={3} maxLength={4000} /></label><label className="full">Who experiences this problem? *<textarea name="users" required rows={3} maxLength={4000} /></label><label className="full">What have you done to validate the problem so far? *<textarea name="validation" required rows={3} maxLength={4000} /></label><label className="full">Current stage<select name="stage" defaultValue="idea"><option value="idea">Idea stage</option><option value="research">Researching the problem</option><option value="validation">Validating with users</option><option value="prototype">Building a prototype</option><option value="mvp">MVP / early product</option></select></label><label className="full">Prototype or portfolio link (optional)<input name="prototype" type="url" maxLength={1000} placeholder="https://…" /></label></div>
    </> : <>
      <div className="explorer-form-section"><span>02</span><div><small>YOUR CONTRIBUTION</small><h3>How would you help?</h3></div></div>
      <div className="explorer-grid"><label className="full">Why do you want to become a Campus Innovation Fellow? *<textarea name="motivation" required rows={4} maxLength={4000} /></label><label className="full">Relevant experience, activities or skills (optional)<textarea name="experience" rows={3} maxLength={4000} /></label><label className="full">What is one thing you would do to help students engage with innovation? *<textarea name="contribution" required rows={4} maxLength={4000} /></label><label className="full">Current stage<select name="stage" defaultValue="team_application"><option value="team_application">Applying to join the team</option><option value="event_volunteering">Event and community work</option><option value="project_execution">Project execution</option><option value="outreach">Outreach and partnerships</option></select></label></div>
    </>}
    <div aria-hidden="true" className="website-field" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0, 0, 0, 0)" }}><label>Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    {error && <p className="admin-login-error" role="alert">{error}</p>}
    <button className="hero-btn hero-btn-red" type="submit" disabled={loading}>{loading ? "Submitting…" : "Submit application ↗"}</button>
    <p className="form-config-note">Your application is submitted securely to the Innovation Lab database. Please provide accurate information.</p>
  </form>;
}
