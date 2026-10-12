import { apiClient } from '@/lib/api';
import { asPaginated } from '@/types';
import type {
  Client,
  ClientCreate,
  ClientListParams,
  ClientUpdate,
  Paginated,
} from '@/types';

export async function listClients(params: ClientListParams = {}): Promise<Paginated<Client>> {
  const { data } = await apiClient.get<Client[] | Paginated<Client>>('/clients', { params });
  return asPaginated(data);
}

export async function getClient(id: string): Promise<Client> {
  const { data } = await apiClient.get<Client>(`/clients/${id}`);
  return data;
}

export async function createClient(payload: ClientCreate): Promise<Client> {
  const { data } = await apiClient.post<Client>('/clients', payload);
  return data;
}

export async function updateClient(id: string, payload: ClientUpdate): Promise<Client> {
  const { data } = await apiClient.put<Client>(`/clients/${id}`, payload);
  return data;
}

export async function deleteClient(id: string): Promise<void> {
  await apiClient.delete(`/clients/${id}`);
}
