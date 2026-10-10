"use client";

/**
 * Browser push notifications are intentionally disabled. The previous opt-in
 * UI invoked Notification.requestPermission(), which can trigger repeated
 * browser permission prompts and make visitors distrust the site. Keep this
 * component as a no-op so existing imports remain safe without changing the
 * surrounding page layout or other site functionality.
 */
export default function PushNotifications() {
  return null;
}
