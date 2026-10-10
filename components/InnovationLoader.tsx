"use client";

import { useEffect, useState } from "react";

export default function InnovationLoader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 1250);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="innovation-loader" aria-label="Loading IILM BNV Innovation Lab" role="status">
      <div className="innovation-loader__field" aria-hidden="true">
        <span className="loader-orbit loader-orbit--one" />
        <span className="loader-orbit loader-orbit--two" />
        <span className="loader-node node-a" />
        <span className="loader-node node-b" />
        <span className="loader-node node-c" />
        <span className="loader-node node-d" />

        <svg className="loader-bulb" viewBox="0 0 180 210" fill="none">
          <path className="bulb-outline" d="M90 16c-36 0-64 28-64 64 0 23 12 43 30 54 9 6 14 15 14 25h40c0-10 5-19 14-25 18-11 30-31 30-54 0-36-28-64-64-64Z" />
          <path className="bulb-neck" d="M70 160h40M72 174h36M77 188h26" />
          <path className="bulb-ray ray-one" d="M90 1v-11" />
          <path className="bulb-ray ray-two" d="m33 25-8-8" />
          <path className="bulb-ray ray-three" d="m147 25 8-8" />
          <path className="bulb-ray ray-four" d="M17 80H5" />
          <path className="bulb-ray ray-five" d="M163 80h12" />
          <path className="bulb-filament" d="M72 84c8-14 28-14 36 0-5 5-9 13-9 22v13H81v-13c0-9-4-17-9-22Z" />
        </svg>

        <span className="loader-spark spark-one">✦</span>
        <span className="loader-spark spark-two">✦</span>
        <span className="loader-spark spark-three">+</span>
      </div>
      <div className="innovation-loader__copy">
        <span>IILM × BNV</span>
        <strong>INNOVATION LAB</strong>
        <small>turning curiosity into possibility</small>
      </div>
    </div>
  );
}
