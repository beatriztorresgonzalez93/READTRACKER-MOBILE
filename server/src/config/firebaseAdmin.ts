// Inicializa Firebase Admin y verifica ID tokens de Firebase Auth.
import admin from "firebase-admin";
import { env } from "./env";

let app: admin.app.App | null = null;

function getAdminApp(): admin.app.App {
  if (app) {
    return app;
  }
  if (!env.firebaseProjectId || !env.firebaseClientEmail || !env.firebasePrivateKey) {
    throw new Error(
      "Falta configuración Firebase Admin: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY"
    );
  }
  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.firebaseProjectId,
      clientEmail: env.firebaseClientEmail,
      privateKey: env.firebasePrivateKey
    })
  });
  return app;
}

export async function verifyFirebaseIdToken(idToken: string) {
  return getAdminApp().auth().verifyIdToken(idToken);
}
