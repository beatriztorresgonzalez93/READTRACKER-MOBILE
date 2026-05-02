// Tipos compartidos del dominio de autenticación.
export interface AuthUser {
  id: string;
  name: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  trialEndsAt: string | null;
  isPro: boolean;
  proActivatedAt: string | null;
}

/** Cuerpo de `PATCH /auth/me` (campos opcionales; solo se actualizan los enviados). */
export interface UpdateProfileDto {
  name?: string;
  lastName?: string;
  avatarUrl?: string | null;
}
