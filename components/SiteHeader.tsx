"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const groups = [
  { label: "About", items: [["About the Lab", "/#lab"], ["BNV", "/#bnv"]] },
  { label: "Explore", items: [["Journey", "/#journey"], ["Communities", "/#explorer"], ["Star Ideators", "/#star-ideators"], ["Opportunities", "/#join-team"]] },
  { label: "Discover", items: [["Announcements", "/#announcements"], ["Events", "/#events"], ["Portfolio", "/#portfolio"], ["Team", "/#team"]] },
  { label: "Resources", items: [["Resources", "/#resources"], ["FAQs", "/#faq"], ["YouTube Shorts", "/#youtube-shorts"]] },
] as const;
const allLinks = [["Home", "/", "01"], ["About the Lab", "/#lab", "02"], ["BNV", "/#bnv", "03"], ["Announcements", "/#announcements", "04"], ["Journey", "/#journey", "05"], ["Communities", "/#explorer", "06"], ["Star Ideators", "/#star-ideators", "07"], ["Team", "/#team", "08"], ["Opportunities", "/#join-team", "09"], ["Portfolio", "/#portfolio", "10"], ["Resources", "/#resources", "11"], ["FAQs", "/#faq", "12"], ["Events", "/#events", "13"], ["YouTube Shorts", "/#youtube-shorts", "14"]] as const;

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const closeMenu = () => { setOpen(false); requestAnimationFrame(() => toggleRef.current?.focus()); };

  useEffect(() => {
    const onScroll = () => { setScrolled(window.scrollY > 24); const max = document.documentElement.scrollHeight - window.innerHeight; setProgress(max > 0 ? Math.min(100, Math.max(0, window.scrollY / max * 100)) : 0); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && open) closeMenu(); };
    window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("keydown", onKey); onScroll();
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("keydown", onKey); };
  }, [open]);
  useEffect(() => {
    if (!open) { document.body.style.overflow = ""; document.body.style.touchAction = ""; return; }
    document.body.style.overflow = "hidden"; document.body.style.touchAction = "none";
    const timer = window.setTimeout(() => firstLinkRef.current?.focus(), 120);
    return () => { window.clearTimeout(timer); document.body.style.overflow = ""; document.body.style.touchAction = ""; };
  }, [open]);

  return <header className={`site-header ${scrolled ? "is-scrolled" : ""} ${open ? "menu-open" : ""}`} data-menu-open={open ? "true" : "false"}>
    <div className="nav-progress" style={{ width: `${progress}%` }} aria-hidden="true" />
    <div className="nav-shell">
      <Link href="/" className="brand-lockup" aria-label="IILM × BNV Innovation Lab" onClick={() => setOpen(false)}><Image src={open ? "/iilm-bnv-logo-user-light-cropped.webp" : "/iilm-bnv-logo-user-cropped.webp"} alt="IILM × BNV Innovation Lab" width={1863} height={336} priority unoptimized className="brand-logo" /></Link>
      <nav className="desktop-nav" aria-label="Primary navigation">
        <Link className="nav-home-link" href="/">Home</Link>
        {groups.map(group => <div className="nav-dropdown" key={group.label}><button type="button" className="nav-group-trigger" aria-haspopup="true">{group.label}<span>⌄</span></button><div className="nav-dropdown-panel">{group.items.map(([label, href]) => <Link key={label} href={href}>{label}</Link>)}</div></div>)}
      </nav>
      <Link href="/join" className="nav-cta" data-cursor onClick={() => setOpen(false)}>Join the Lab <span>↗</span></Link>
      <button ref={toggleRef} type="button" className={`menu-toggle ${open ? "is-open" : ""}`} onClick={() => setOpen(v => !v)} aria-label={open ? "Close navigation menu" : "Open navigation menu"} aria-expanded={open} aria-controls="mobile-navigation"><span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" /><b aria-hidden="true">{open ? "CLOSE" : "MENU"}</b></button>
    </div>
    <div className={`mobile-menu-backdrop ${open ? "is-open" : ""}`} aria-hidden="true" onClick={closeMenu} />
    <div className={`mobile-menu ${open ? "is-open" : ""}`} id="mobile-navigation" aria-hidden={!open}>
      <div className="mobile-menu-grid"><div className="mobile-menu-meta"><span>01 / NAVIGATION</span><p>Find your next step.</p></div>
        <nav className="mobile-menu-links" aria-label="Mobile navigation">
          {allLinks.map(([label, href, number], index) => <Link key={label} href={href} ref={index === 0 ? firstLinkRef : undefined} tabIndex={open ? 0 : -1} onClick={closeMenu}><span>{number}</span><strong>{label}</strong><i>↗</i></Link>)}
          <Link href="/join" className="mobile-menu-cta" tabIndex={open ? 0 : -1} onClick={closeMenu}><span>15</span><strong>Join the Lab</strong><i>→</i></Link>
        </nav><div className="mobile-menu-footer"><span>IILM × BNV INNOVATION LAB</span><span>EXPLORE · IDEATE · BUILD</span></div>
      </div>
    </div>
  </header>;
}
