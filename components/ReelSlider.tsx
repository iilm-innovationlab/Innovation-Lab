"use client";

import { useRef } from "react";

type Short = { id: string; youtube_id: string; title?: string | null };

export default function ReelSlider({ shorts }: { shorts: Short[] }) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (distance: number) => {
    ref.current?.scrollBy({ left: distance, behavior: "smooth" });
  };

  return (
    <div className="shorts-shell" aria-label="IILM BNV Innovation Lab YouTube Shorts">
      <div className="shorts-glow shorts-glow-one" aria-hidden="true" />
      <div className="shorts-glow shorts-glow-two" aria-hidden="true" />

      <div className="shorts-head">
        <div className="shorts-title">
          <span className="shorts-play-mark" aria-hidden="true">▶</span>
          <h3>YouTube Shorts</h3>
        </div>
        <div className="shorts-controls">
          <button type="button" onClick={() => scroll(-360)} aria-label="Previous Short">←</button>
          <button type="button" onClick={() => scroll(360)} aria-label="Next Short">→</button>
        </div>
      </div>

      {shorts.length > 0 ? <div className="shorts-track" ref={ref} aria-label="YouTube Shorts">
        {shorts.map((short, index) => (
          <article className="short-card" key={short.id}>
            <div className="short-reel-frame">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${short.youtube_id}`}
                title={short.title || `IILM × BNV Innovation Lab YouTube Short ${index + 1}`}
                loading="lazy"
                allow="picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </article>
        ))}
      </div> : <div className="empty-editorial"><div className="empty-stamp">PLAY</div><div><h3>New Shorts are coming soon.</h3><p>Published videos will appear here when the Lab team adds them in Admin Studio.</p></div></div>}

      <div className="shorts-footer">
        <span>Swipe / drag to explore · Play each Short directly here</span>
        <span className="shorts-line" aria-hidden="true"><i /></span>
        <a href="https://www.youtube.com/" target="_blank" rel="noreferrer noopener">YouTube ↗</a>
      </div>
    </div>
  );
}
