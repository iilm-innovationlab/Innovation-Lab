"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

export default function PushNotifications() {
  const [state, setState] = useState<"hidden" | "ready" | "enabled" | "unsupported">("hidden");
  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window) || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      setState("unsupported"); return;
    }
    setState(Notification.permission === "granted" ? "enabled" : "ready");
  }, []);
  if (state === "hidden" || state === "unsupported") return null;
  const enable = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;
      const registration = await navigator.serviceWorker.register("/push-sw.js");
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) });
      await fetch("/api/notifications/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription.toJSON()) });
      setState("enabled");
    } catch (error) { console.error("Push subscription failed", error); }
  };
  return <div className="notification-prompt"><div><span>🔔</span><div><strong>{state === "enabled" ? "Lab notifications are on." : "Don’t miss Lab updates."}</strong><p>{state === "enabled" ? "You’ll receive opted-in event and announcement notifications." : "Get browser notifications for new events and important announcements."}</p></div></div><button onClick={enable}>{state === "enabled" ? "Notifications on ✓" : "Enable notifications"}</button></div>;
}
