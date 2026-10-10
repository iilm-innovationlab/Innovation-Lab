"use client";

import { useEffect } from "react";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Admin Studio error", error);
  }, [error]);

  return (
    <main className="admin-login-shell">
      <section className="admin-login-card" aria-labelledby="admin-error-title">
        <span className="admin-login-kicker">ADMIN STUDIO / ERROR</span>
        <h1 id="admin-error-title" className="admin-error-title">Something went wrong<span>.</span></h1>
        <p className="admin-error-copy">The Admin Studio hit an unexpected error. Your saved data has not been intentionally deleted.</p>
        <div className="admin-error-actions">
          <button className="admin-primary" onClick={() => reset()}>Try again ↗</button>
          <a className="admin-secondary" href="/">Back to website</a>
        </div>
      </section>
    </main>
  );
}
