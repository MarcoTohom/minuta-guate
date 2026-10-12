/** Tipos de autenticación, usuarios y roles. */

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  username: string;
  role: string | null;
}

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  status: string;
  role_id: string | null;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
}

export interface UserCreate {
  username: string;
  email: string;
  full_name: string;
  password: string;
  role_id?: string | null;
}

export interface UserUpdate {
  full_name?: string;
  email?: string;
  role_id?: string | null;
  status?: string;
}

/** Usuario enriquecido en el cliente con el nombre de su rol. */
export interface AuthUser extends User {
  role_name: string | null;
}
