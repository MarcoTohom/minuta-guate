import { apiClient } from '@/lib/api';
import type { User, UserCreate, UserUpdate } from '@/types';

export async function listUsers(params: { skip?: number; limit?: number } = {}): Promise<User[]> {
  const { data } = await apiClient.get<User[]>('/users', { params });
  return data;
}

export async function getUser(id: string): Promise<User> {
  const { data } = await apiClient.get<User>(`/users/${id}`);
  return data;
}

export async function createUser(payload: UserCreate): Promise<User> {
  const { data } = await apiClient.post<User>('/users', payload);
  return data;
}

export async function updateUser(id: string, payload: UserUpdate): Promise<User> {
  const { data } = await apiClient.put<User>(`/users/${id}`, payload);
  return data;
}
