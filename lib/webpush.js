import webpush from "web-push";

let _webpushConfigured = false;
export function getWebpush() {
  if (!_webpushConfigured) {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) {
      throw new Error("Claves VAPID no configuradas");
    }
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    _webpushConfigured = true;
  }
  return webpush;
}
