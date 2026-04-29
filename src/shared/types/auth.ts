// Define los tipos de datos para autenticacion y usuario.
export type User = {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  avatarUrl?: string | null;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

