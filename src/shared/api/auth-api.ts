// Perfil de usuario almacenado en Firestore (colección "users").
// Se mantiene la interfaz pública para no romper los consumidores.
import {
  createFirestoreProfile,
  getFirestoreProfile,
  updateFirestoreProfile,
} from "@/shared/api/firestore-profile";
import { getFirebaseAuth } from "@/shared/config/firebase";
import type { User } from "@/shared/types/auth";

/**
 * Obtiene el perfil del usuario actual desde Firestore.
 * Si el documento aún no existe (primer login), lo crea con los datos de Firebase Auth.
 */
export async function getMe(_token: string): Promise<User> {
  const firebaseUser = getFirebaseAuth().currentUser;
  console.log("[Firestore profile] getMe llamado, uid:", firebaseUser?.uid ?? "SIN USER");
  if (!firebaseUser) throw new Error("Sesión de Firebase no disponible.");

  try {
    const existing = await getFirestoreProfile(firebaseUser.uid);
    console.log("[Firestore profile] perfil existente:", existing ? "SI" : "NO");
    if (existing) return existing;

    console.log("[Firestore profile] creando perfil nuevo...");
    const created = await createFirestoreProfile(firebaseUser.uid, {
      name: firebaseUser.displayName ?? "",
      email: firebaseUser.email ?? "",
    });
    console.log("[Firestore profile] perfil creado OK");
    return created;
  } catch (err) {
    console.error("[Firestore profile] ERROR en getMe:", err);
    throw err;
  }
}

type UpdateMePayload = {
  name?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
};

export async function updateMe(_token: string, payload: UpdateMePayload): Promise<User> {
  const firebaseUser = getFirebaseAuth().currentUser;
  if (!firebaseUser) throw new Error("Sesión de Firebase no disponible.");

  await updateFirestoreProfile(firebaseUser.uid, payload);

  const updated = await getFirestoreProfile(firebaseUser.uid);
  if (!updated) throw new Error("No se pudo leer el perfil tras actualizarlo.");
  return updated;
}
