import { apiClient } from '@/lib/api';
import { asPaginated } from '@/types';
import type {
  Case,
  CaseCreate,
  CaseListParams,
  CaseUpdate,
  DeedType,
  DeedTypeCreate,
  DeedTypeUpdate,
  Paginated,
} from '@/types';

export async function listCases(params: CaseListParams = {}): Promise<Paginated<Case>> {
  const { data } = await apiClient.get<Case[] | Paginated<Case>>('/cases', { params });
  return asPaginated(data);
}

export async function getCase(id: string): Promise<Case> {
  const { data } = await apiClient.get<Case>(`/cases/${id}`);
  return data;
}

export async function createCase(payload: CaseCreate): Promise<Case> {
  const { data } = await apiClient.post<Case>('/cases', payload);
  return data;
}

export async function updateCase(id: string, payload: CaseUpdate): Promise<Case> {
  const { data } = await apiClient.put<Case>(`/cases/${id}`, payload);
  return data;
}

export async function addParty(
  caseId: string,
  payload: { client_id?: string | null; role_in_case: string; order_index?: number; notes?: string | null },
): Promise<{ id: string; role_in_case: string }> {
  const { data } = await apiClient.post(`/cases/${caseId}/parties`, payload);
  return data;
}

export async function listDeedTypes(): Promise<DeedType[]> {
  const { data } = await apiClient.get<DeedType[]>('/deed-types');
  return data;
}

export async function listAllDeedTypes(): Promise<DeedType[]> {
  const { data } = await apiClient.get<DeedType[]>('/deed-types', {
    params: { include_inactive: true },
  });
  return data;
}

export async function createDeedType(payload: DeedTypeCreate): Promise<DeedType> {
  const { data } = await apiClient.post<DeedType>('/deed-types', payload);
  return data;
}

export async function updateDeedType(id: string, payload: DeedTypeUpdate): Promise<DeedType> {
  const { data } = await apiClient.patch<DeedType>(`/deed-types/${id}`, payload);
  return data;
}
