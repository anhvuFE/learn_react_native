import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
// getReactNativePersistence ships in firebase/auth's RN entry but not in web typings.
// @ts-expect-error RN-only export
import { getReactNativePersistence, initializeAuth, type Auth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "Firebase API key missing — check fe/.env for EXPO_PUBLIC_FIREBASE_*",
  );
}

export const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let _auth: Auth;
try {
  _auth = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Already initialized (e.g. from fast refresh)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  _auth = require("firebase/auth").getAuth(firebaseApp);
}

export const auth = _auth;
export const storage = getStorage(firebaseApp);
