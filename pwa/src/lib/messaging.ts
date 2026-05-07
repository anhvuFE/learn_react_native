import { getApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as
  | string
  | undefined;

export async function requestWebPushToken(): Promise<string | null> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }
  if (!VAPID_KEY) {
    console.warn(
      "[fcm] VITE_FIREBASE_VAPID_KEY not set — web push disabled. Generate one in Firebase Console.",
    );
    return null;
  }

  const perm = await Notification.requestPermission();
  if (perm !== "granted") return null;

  const sw = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js",
  );

  const messaging = getMessaging(getApp());
  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: sw,
  });

  return token ?? null;
}

export function onForegroundMessage(
  cb: (payload: { notification?: { title?: string; body?: string } }) => void,
) {
  if (typeof window === "undefined") return () => {};
  try {
    const messaging = getMessaging(getApp());
    return onMessage(messaging, cb);
  } catch {
    return () => {};
  }
}

export function getCurrentPermission(): NotificationPermission | null {
  if (typeof window === "undefined" || !("Notification" in window))
    return null;
  return Notification.permission;
}
