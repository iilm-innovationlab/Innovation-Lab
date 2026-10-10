"use client";

import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  getCurrentUser,
  getMyProfile,
  refreshAuthSession,
  signInWithPassword,
  signOut,
  supabaseConfigured,
} from "@/lib/supabase-rest";

export type AdminIdentity = { id: string; name: string; email: string; role: "admin" };

type Props = {
  children: ReactNode;
  onIdentity: (identity: AdminIdentity | null) => void;
};

export default function AdminAuth({ children, onIdentity }: Props) {
  const [identity, setIdentity] = useState<AdminIdentity | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  const applyIdentity = useCallback(
    (next: AdminIdentity | null) => {
      setIdentity(next);
      onIdentity(next);
    },
    [onIdentity],
  );

  useEffect(() => {
    let active = true;

    const restore = async () => {
      try {
        window.localStorage.removeItem("iilm-admin-demo");
        const raw = window.localStorage.getItem("iilm-admin-session");
        if (!raw) return;

        const saved = JSON.parse(raw);
        if (!saved?.identity) return;

        // Never restore a demo identity. Old preview sessions are untrusted and must be removed.
        if (saved.demo || saved.identity?.id === "legacy-demo-account") {
          window.localStorage.removeItem("iilm-admin-session");
          return;
        }

        if (!supabaseConfigured || !saved.access_token) return;

        let accessToken = saved.access_token as string;
        let refreshToken = saved.refresh_token as string | undefined;
        let user = await getCurrentUser(accessToken);

        if (!user?.id && refreshToken) {
          const refreshed = await refreshAuthSession(refreshToken);
          accessToken = refreshed.access_token;
          refreshToken = refreshed.refresh_token;
          user = await getCurrentUser(accessToken);
          window.localStorage.setItem(
            "iilm-admin-session",
            JSON.stringify({ ...saved, access_token: accessToken, refresh_token: refreshToken }),
          );
        }

        if (active && user?.id) {
          const profile = await getMyProfile(accessToken, user.id);
          if (profile && profile.id === user.id && profile.role === "admin") {
            applyIdentity({
              id: user.id,
              name: profile.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Admin",
              email: user.email || profile.email || "",
              role: "admin",
            });
          } else {
            window.localStorage.removeItem("iilm-admin-session");
            applyIdentity(null);
          }
        } else if (active) window.localStorage.removeItem("iilm-admin-session");
      } catch {
        if (active) window.localStorage.removeItem("iilm-admin-session");
      } finally {
        if (active) setCheckingSession(false);
      }
    };

    void restore();
    return () => {
      active = false;
    };
  }, [applyIdentity]);

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (!supabaseConfigured) {
        throw new Error("Admin sign-in is temporarily unavailable. Please contact the site administrator.");
      }

      const session = await signInWithPassword(normalizedEmail, password);
      const user = await getCurrentUser(session.access_token);
      if (!user?.id) throw new Error("We could not verify your account. Please try again.");
      if (typeof user.email !== "string" || user.email.trim().toLowerCase() !== normalizedEmail) {
        throw new Error("The authenticated email does not match the email you entered. Please sign out and try again.");
      }

      const profile = await getMyProfile(session.access_token, user.id);
      if (!profile || profile.id !== user.id || profile.role !== "admin") {
        throw new Error("This account is not authorized for Innovation Lab Admin Studio.");
      }

      const next: AdminIdentity = {
        id: user.id,
        name: profile.full_name || user.user_metadata?.full_name || user.user_metadata?.name || normalizedEmail.split("@")[0],
        email: user.email || profile.email || normalizedEmail,
        role: "admin",
      };

      window.localStorage.setItem(
        "iilm-admin-session",
        JSON.stringify({ identity: next, access_token: session.access_token, refresh_token: session.refresh_token }),
      );
      applyIdentity(next);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(async () => {
    try {
      const raw = window.localStorage.getItem("iilm-admin-session");
      const saved = raw ? JSON.parse(raw) : null;
      if (saved?.access_token) await signOut(saved.access_token);
    } catch {
      // Always clear the local session even if the network logout fails.
    } finally {
      window.localStorage.removeItem("iilm-admin-session");
      applyIdentity(null);
    }
  }, [applyIdentity]);

  useEffect(() => {
    const handler = () => void logout();
    const profileHandler = (event: Event) => {
      const detail = (event as CustomEvent<{ full_name?: string }>).detail;
      const fullName = detail?.full_name?.trim();
      if (!fullName) return;
      try {
        const raw = window.localStorage.getItem("iilm-admin-session");
        const saved = raw ? JSON.parse(raw) : null;
        if (!saved?.identity?.id) return;
        const updated = { ...saved.identity, name: fullName } as AdminIdentity;
        window.localStorage.setItem("iilm-admin-session", JSON.stringify({ ...saved, identity: updated }));
        setIdentity(updated);
        onIdentity(updated);
      } catch { /* The next session restore will reload the saved profile from Supabase. */ }
    };
    window.addEventListener("iilm-admin-request-logout", handler);
    window.addEventListener("iilm-admin-profile-updated", profileHandler);
    return () => {
      window.removeEventListener("iilm-admin-request-logout", handler);
      window.removeEventListener("iilm-admin-profile-updated", profileHandler);
    };
  }, [logout, onIdentity]);

  if (checkingSession) {
    return (
      <main className="admin-login-shell" aria-busy="true">
        <div className="admin-login-loading" role="status">
          <div className="admin-login-spinner" aria-hidden="true" />
          <strong>Opening Admin Studio</strong>
          <span>Checking your session…</span>
        </div>
      </main>
    );
  }

  if (identity) return <>{children}</>;

  return (
    <main className="admin-login-shell">
      <div className="admin-login-background" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <section className="admin-login-card" aria-labelledby="admin-login-title">
        <div className="admin-login-brand">
          <div className="admin-brand-mark">IN</div>
          <div>
            <strong>IILM × BNV</strong>
            <span>Innovation Lab · Admin Studio</span>
          </div>
        </div>

        <div className="admin-login-heading">
          <span className="admin-login-kicker">TEAM ACCESS</span>
          <h1 id="admin-login-title">Welcome back<span>.</span></h1>
          <p>Sign in to manage applications, events, communities and published content.</p>
        </div>

        <form className="admin-login-form" onSubmit={login} noValidate>
          <label>
            <span>Email address / Username</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email address or username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              autoFocus
            />
          </label>

          <label>
            <span>Password</span>
            <div className="admin-password-field">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {error && (
            <div className="admin-login-error" role="alert">
              <strong>Couldn’t sign you in.</strong>
              <span>{error}</span>
            </div>
          )}

          <button className="admin-login-submit" type="submit" disabled={loading || !email.trim() || !password}>
            <span>{loading ? "Signing in…" : "Sign in"}</span>
            <b aria-hidden="true">↗</b>
          </button>
        </form>

        <div className="admin-login-footer">
          <span>Private workspace</span>
          <span>·</span>
          <a href="/">Back to website</a>
        </div>
      </section>
    </main>
  );
}
