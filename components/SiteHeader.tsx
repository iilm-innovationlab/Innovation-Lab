"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const groups = [
  { label: "About", items: [["About the Lab", "/#lab"], ["BNV", "/#bnv"]] },
  { label: "Explore", items: [["Journey", "/#journey"], ["Communities", "/#explorer"], ["Star Ideators", "/#star-ideators"], ["Opportunities", "/#join-team"]] },
  { label: "Discover", items: [["Announcements", "/#announcements"], ["Events", "/#events"], ["Portfolio", "/#portfolio"], ["Team", "/#team"]] },
  { label: "Resources", items: [["Resources", "/#resources"], ["FAQs", "/#faq"], ["YouTube Shorts", "/#youtube-shorts"]] },
] as const;
export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mobileExpandedGroup, setMobileExpandedGroup] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const closeMenu = () => { setOpen(false); requestAnimationFrame(() => toggleRef.current?.focus()); };

  useEffect(() => {
    const onScroll = () => { setScrolled(window.scrollY > 24); const max = document.documentElement.scrollHeight - window.innerHeight; setProgress(max > 0 ? Math.min(100, Math.max(0, window.scrollY / max * 100)) : 0); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && open) closeMenu(); };
    window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("keydown", onKey); onScroll();
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("keydown", onKey); };
  }, [open]);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const mq = window.matchMedia("(min-width:1001px)");
    const onChange = () => { if (mq.matches) setOpen(false); };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement, body = document.body;
    html.style.overflow = "hidden"; body.style.overflow = "hidden";
    const timer = window.setTimeout(() => firstLinkRef.current?.focus({ preventScroll: true }), 120);
    return () => { window.clearTimeout(timer); html.style.overflow = ""; body.style.overflow = ""; };
  }, [open]);

  const menu = (
    <div className={`mobile-menu ${open ? "is-open" : ""}`} id="mobile-navigation" aria-hidden={!open}>
      <div className="mobile-menu-grid"><div className="mobile-menu-meta"><span>01 / NAVIGATION</span><p>Find your next step.</p></div>
        <nav className="mobile-menu-links" aria-label="Mobile navigation">
          <Link className="mobile-menu-home" href="/" ref={firstLinkRef} tabIndex={open ? 0 : -1} onClick={closeMenu}><span>01</span><strong>Home</strong><i>↗</i></Link>
          {groups.map((group, groupIndex) => <div className={`mobile-nav-category ${mobileExpandedGroup === group.label ? "is-expanded" : ""}`} key={group.label}>
            <button type="button" className="mobile-nav-category-trigger" aria-expanded={mobileExpandedGroup === group.label} onClick={() => setMobileExpandedGroup(current => current === group.label ? null : group.label)} tabIndex={open ? 0 : -1}><span>{String(groupIndex + 2).padStart(2, "0")}</span><strong>{group.label}</strong><i aria-hidden="true">⌄</i></button>
            <div className="mobile-nav-category-panel" hidden={mobileExpandedGroup !== group.label}>
              {group.items.map(([label, href]) => <Link key={label} href={href} tabIndex={open && mobileExpandedGroup === group.label ? 0 : -1} onClick={closeMenu}>{label}<i aria-hidden="true">↗</i></Link>)}
            </div>
          </div>)}
          <Link href="/join" className="mobile-menu-cta" tabIndex={open ? 0 : -1} onClick={closeMenu}><span>06</span><strong>Join the Lab</strong><i>→</i></Link>
        </nav><div className="mobile-menu-footer"><span>IILM × BNV INNOVATION LAB</span><span>EXPLORE · IDEATE · BUILD</span></div>
      </div>
    </div>
  );

  return <><header className={`site-header ${scrolled ? "is-scrolled" : ""} ${open ? "menu-open" : ""}`} data-menu-open={open ? "true" : "false"}>
    <div className="nav-progress" style={{ width: `${progress}%` }} aria-hidden="true" />
    <div className="nav-shell">
      <Link href="/" className="brand-lockup" aria-label="IILM × BNV Innovation Lab" onClick={() => setOpen(false)}><Image src={open ? "/iilm-bnv-logo-user-light-cropped.webp" : "/iilm-bnv-logo-user-cropped.webp"} alt="IILM × BNV Innovation Lab" width={1863} height={336} priority unoptimized className="brand-logo" /></Link>
      <nav className="desktop-nav" aria-label="Primary navigation">
        <Link className="nav-home-link" href="/">Home</Link>
        {groups.map(group => <div className="nav-dropdown" key={group.label}><button type="button" className="nav-group-trigger" aria-haspopup="true">{group.label}<span>⌄</span></button><div className="nav-dropdown-panel">{group.items.map(([label, href]) => <Link key={label} href={href}>{label}</Link>)}</div></div>)}
      </nav>
      <Link href="/join" className="nav-cta" data-cursor onClick={() => setOpen(false)}>Join the Lab <span>↗</span></Link>
      <button ref={toggleRef} type="button" className={`menu-toggle ${open ? "is-open" : ""}`} onClick={() => { setOpen(v => !v); setMobileExpandedGroup(null); }} aria-label={open ? "Close navigation menu" : "Open navigation menu"} aria-expanded={open} aria-controls="mobile-navigation"><span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" /><b aria-hidden="true">{open ? "CLOSE" : "MENU"}</b></button>
    </div>
  </header>{mounted && createPortal(menu, document.body)}</>;
}
