/* global self, importScripts, firebase */
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js",
);

// IMPORTANT: keep these in sync with src/lib/firebase.ts
firebase.initializeApp({
  apiKey: "AIzaSyBHLVzn-sU8jo-pKdzL4h2mNkYzCWaiQAE",
  authDomain: "learn-react-native-12a3f.firebaseapp.com",
  projectId: "learn-react-native-12a3f",
  storageBucket: "learn-react-native-12a3f.firebasestorage.app",
  messagingSenderId: "950677101440",
  appId: "1:950677101440:web:1abe06e0e61af9f8a47f65",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "ScreenMindr";
  const body = payload.notification?.body ?? "";
  self.registration.showNotification(title, {
    body,
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    data: payload.data ?? {},
  });
});
