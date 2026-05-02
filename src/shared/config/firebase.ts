// Cliente Firebase Auth (login/registro); el backend valida ID tokens con Firebase Admin.
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";

import { env } from "@/shared/config/env";

function assertFirebaseConfig(): void {
  const missing: string[] = [];
  if (!env.firebaseApiKey?.trim()) missing.push("EXPO_PUBLIC_FIREBASE_API_KEY");
  if (!env.firebaseAuthDomain?.trim()) missing.push("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (!env.firebaseProjectId?.trim()) missing.push("EXPO_PUBLIC_FIREBASE_PROJECT_ID");
  if (!env.firebaseAppId?.trim()) missing.push("EXPO_PUBLIC_FIREBASE_APP_ID");
  if (missing.length) {
    throw new Error(`Configura Firebase en .env: ${missing.join(", ")}`);
  }
}

let app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp {
  assertFirebaseConfig();
  if (!getApps().length) {
    app = initializeApp({
      apiKey: env.firebaseApiKey,
      authDomain: env.firebaseAuthDomain,
      projectId: env.firebaseProjectId,
      storageBucket: env.firebaseStorageBucket || undefined,
      messagingSenderId: env.firebaseMessagingSenderId || undefined,
      appId: env.firebaseAppId
    });
    return app;
  }
  return getApps()[0]!;
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}
