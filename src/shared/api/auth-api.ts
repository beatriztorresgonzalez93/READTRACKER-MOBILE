// Perfil de usuario vía API (PostgreSQL). Firebase Auth solo para el token.
import { apiRequest } from "@/shared/api/client";
import type { User } from "@/shared/types/auth";

type ApiAuthUser = {
  id: string;
  firstName: string;
  name: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  trialEndsAt: string | null;
  isPro: boolean;
  proActivatedAt: string | null;
};

type ApiMeResponse = { data: ApiAuthUser };

function mapApiUserToClientUser(api: ApiAuthUser): User {
  const firstName = api.firstName?.trim() || undefined;
  const lastName = api.lastName?.trim() || undefined;
  const fullName = api.name?.trim() || [firstName, lastName].filter(Boolean).join(" ").trim();

  return {
    id: api.id,
    name: fullName || undefined,
    firstName,
    lastName,
    email: api.email,
    avatarUrl: api.avatarUrl,
    createdAt: api.createdAt,
    trialEndsAt: api.trialEndsAt,
    isPro: api.isPro,
    proActivatedAt: api.proActivatedAt,
  };
}

/** Obtiene el perfil del usuario actual desde la API (crea el usuario local en el primer login). */
export async function getMe(token: string): Promise<User> {
  const response = await apiRequest<ApiMeResponse>("/auth/me", { token });
  return mapApiUserToClientUser(response.data);
}

type UpdateMePayload = {
  name?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
};

export async function updateMe(token: string, payload: UpdateMePayload): Promise<User> {
  const body: Record<string, string | null> = {};

  if (payload.firstName !== undefined) {
    body.firstName = payload.firstName.trim();
  }
  if (payload.lastName !== undefined) {
    body.lastName = payload.lastName.trim();
  }
  const fullName =
    payload.name?.trim() ||
    [payload.firstName, payload.lastName].filter(Boolean).join(" ").trim();
  if (fullName) {
    body.name = fullName;
  }
  if (payload.avatarUrl !== undefined) {
    body.avatarUrl = payload.avatarUrl;
  }

  const response = await apiRequest<ApiMeResponse>("/auth/me", {
    method: "PATCH",
    token,
    body,
  });
  return mapApiUserToClientUser(response.data);
}
