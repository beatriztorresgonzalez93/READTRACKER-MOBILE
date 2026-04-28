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

