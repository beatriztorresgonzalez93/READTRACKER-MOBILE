// Cliente de endpoints de autenticacion y perfil de usuario.
import { apiRequest } from "@/shared/api/client";
import type { AuthResponse, LoginPayload, RegisterPayload, User } from "@/shared/types/auth";

type AuthEnvelope = {
  data?: AuthResponse;
  token?: string;
  user?: User;
};

function unwrapAuthResponse(payload: AuthEnvelope | AuthResponse): AuthResponse {
  if ("data" in payload && payload.data?.token) {
    return payload.data;
  }
  if ("token" in payload && payload.token && payload.user) {
    return {
      token: payload.token,
      user: payload.user,
    };
  }
  return payload as AuthResponse;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const response = await apiRequest<AuthEnvelope | AuthResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });
  return unwrapAuthResponse(response);
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await apiRequest<AuthEnvelope | AuthResponse>("/auth/register", {
    method: "POST",
    body: payload,
  });
  return unwrapAuthResponse(response);
}

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
  const attempts: Array<{ method: "PATCH" | "PUT"; path: string; body: Record<string, unknown> }> = [
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
        avatar_url: payload.avatarUrl,
      },
    },
  ];

  const errors: string[] = [];
  for (const attempt of attempts) {
    try {
      const response = await apiRequest<{ data?: User } | User>(attempt.path, {
        method: attempt.method,
        token,
        body: attempt.body,
      });
      if ("data" in response && response.data) return response.data;
      return response as User;
    } catch (error) {
      errors.push((error as Error).message);
    }
  }

  throw new Error(errors[0] ?? "No se pudo actualizar el perfil.");
}

