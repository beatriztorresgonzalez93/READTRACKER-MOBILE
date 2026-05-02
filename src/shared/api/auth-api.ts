// Cliente de endpoints de perfil de usuario (sesión = Firebase ID token).
import { apiRequest } from "@/shared/api/client";
import type { User } from "@/shared/types/auth";

export async function getMe(token: string): Promise<User> {
  const response = await apiRequest<{ data?: User } | User>("/auth/me", { token });
  if ("data" in response && response.data) return response.data;
  return response as User;
}

type UpdateMePayload = {
  name?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
};

export async function updateMe(token: string, payload: UpdateMePayload): Promise<User> {
  const attempts: { method: "PATCH" | "PUT"; path: string; body: Record<string, unknown> }[] = [
    { method: "PATCH", path: "/auth/me", body: payload },
    { method: "PUT", path: "/auth/me", body: payload },
    { method: "PATCH", path: "/users/me", body: payload },
    { method: "PUT", path: "/users/me", body: payload },
    {
      method: "PATCH",
      path: "/auth/me",
      body: {
        name: payload.name,
        first_name: payload.firstName,
        last_name: payload.lastName,
        avatar_url: payload.avatarUrl
      }
    }
  ];

  const errors: string[] = [];
  for (const attempt of attempts) {
    try {
      const response = await apiRequest<{ data?: User } | User>(attempt.path, {
        method: attempt.method,
        token,
        body: attempt.body
      });
      if ("data" in response && response.data) return response.data;
      return response as User;
    } catch (error) {
      errors.push((error as Error).message);
    }
  }

  throw new Error(errors[0] ?? "No se pudo actualizar el perfil.");
}
