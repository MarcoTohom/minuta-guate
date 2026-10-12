import { apiClient } from '@/lib/api';
import type { Role, TokenResponse, User } from '@/types';

/** Autentica con username/password (form-urlencoded) y devuelve el JWT. */
export async function login(username: string, password: string): Promise<TokenResponse> {
  const body = new URLSearchParams();
  body.set('username', username);
  body.set('password', password);
  body.set('grant_type', 'password');
  const { data } = await apiClient.post<TokenResponse>('/auth/login', body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return data;
}

/** Devuelve el usuario autenticado. */
export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<User>('/auth/me');
  return data;
}

/** Registra el cierre de sesión en auditoría. */
export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

/** Lista los roles disponibles. */
export async function listRoles(): Promise<Role[]> {
  const { data } = await apiClient.get<Role[]>('/roles');
  return data;
}
