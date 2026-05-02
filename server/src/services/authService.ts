// Lógica de negocio para usuario autenticado con Firebase y perfil local.
import type { DecodedIdToken } from "firebase-admin/auth";
import { env } from "../config/env";
import { UsersRepository } from "../repositories/usersRepository";
import { AuthUser, UpdateProfileDto } from "../types/auth";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export class AuthService {
  constructor(private readonly usersRepository: UsersRepository) {}

  /**
   * Resuelve o crea el usuario local enlazado al UID de Firebase.
   */
  async ensureLocalUserFromFirebase(decoded: DecodedIdToken): Promise<string> {
    const uid = decoded.uid;
    const emailRaw = decoded.email?.trim().toLowerCase();
    if (!emailRaw) {
      throw new Error("La cuenta de Firebase no tiene email");
    }

    const existingUid = await this.usersRepository.findByFirebaseUid(uid);
    if (existingUid) {
      return existingUid.id;
    }

    const existingEmail = await this.usersRepository.findByEmail(emailRaw);
    if (existingEmail) {
      throw new Error(
        "Ya existe una cuenta local con ese email. Usa la misma cuenta de Firebase o contacta soporte."
      );
    }

    const nameFromToken = (decoded.name ?? emailRaw.split("@")[0] ?? "Usuario").trim() || "Usuario";
    const trialEndsAt = new Date(Date.now() + env.proTrialDays * DAY_IN_MS);
    const created = await this.usersRepository.createFromFirebase({
      firebaseUid: uid,
      email: emailRaw,
      name: nameFromToken,
      trialEndsAt
    });
    return created.id;
  }

  async getProfile(userId: string): Promise<AuthUser | null> {
    return this.usersRepository.findById(userId);
  }

  async updateProfile(userId: string, patch: UpdateProfileDto): Promise<AuthUser | null> {
    const current = await this.usersRepository.findById(userId);
    if (!current) return null;

    const name = patch.name !== undefined ? patch.name.trim() : current.name;
    const lastName = patch.lastName !== undefined ? patch.lastName.trim() : current.lastName;
    let avatarUrl = current.avatarUrl;
    if (patch.avatarUrl !== undefined) {
      if (patch.avatarUrl === null || patch.avatarUrl === "") {
        avatarUrl = null;
      } else {
        const trimmed = patch.avatarUrl.trim();
        avatarUrl = trimmed.length ? trimmed : null;
      }
    }

    return this.usersRepository.updateProfile(userId, { name, lastName, avatarUrl });
  }
}
