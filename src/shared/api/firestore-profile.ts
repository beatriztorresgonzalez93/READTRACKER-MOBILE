// Lee y escribe el perfil de usuario en la colección "users" de Firestore.
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

import { getFirebaseFirestore } from "@/shared/config/firebase";
import type { User } from "@/shared/types/auth";

const USERS_COLLECTION = "users";

type FirestoreProfileData = {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string | null;
  createdAt?: ReturnType<typeof serverTimestamp>;
  updatedAt?: ReturnType<typeof serverTimestamp>;
};

function toUser(uid: string, data: Record<string, unknown>): User {
  return {
    id: uid,
    name: (data.name as string) ?? undefined,
    firstName: (data.firstName as string) ?? undefined,
    lastName: (data.lastName as string) ?? undefined,
    email: (data.email as string) ?? "",
    avatarUrl: (data.avatarUrl as string | null) ?? null,
    createdAt: data.createdAt
      ? typeof data.createdAt === "string"
        ? data.createdAt
        : (data.createdAt as { toDate?: () => Date }).toDate?.().toISOString()
      : undefined,
    trialEndsAt: (data.trialEndsAt as string) ?? null,
    isPro: (data.isPro as boolean) ?? false,
    proActivatedAt: (data.proActivatedAt as string) ?? null,
  };
}

export async function getFirestoreProfile(uid: string): Promise<User | null> {
  const db = getFirebaseFirestore();
  const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
  if (!snap.exists()) return null;
  return toUser(uid, snap.data());
}

export async function createFirestoreProfile(
  uid: string,
  data: { name?: string; email: string },
): Promise<User> {
  const db = getFirebaseFirestore();
  const profile: FirestoreProfileData = {
    name: data.name ?? "",
    firstName: "",
    lastName: "",
    email: data.email,
    avatarUrl: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, USERS_COLLECTION, uid), profile);
  return toUser(uid, { ...profile, email: data.email });
}

export async function updateFirestoreProfile(
  uid: string,
  payload: {
    name?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string | null;
  },
): Promise<void> {
  const db = getFirebaseFirestore();
  const updates: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.firstName !== undefined) updates.firstName = payload.firstName;
  if (payload.lastName !== undefined) updates.lastName = payload.lastName;
  if (payload.avatarUrl !== undefined) updates.avatarUrl = payload.avatarUrl;
  await updateDoc(doc(db, USERS_COLLECTION, uid), updates);
}
