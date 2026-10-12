import { apiClient } from '@/lib/api';
import type { ColumnMapping, ImportJob, ImportPreview, ImportRow } from '@/types';

export async function listImports(params: { skip?: number; limit?: number } = {}): Promise<ImportJob[]> {
  const { data } = await apiClient.get<ImportJob[]>('/imports', { params });
  return data;
}

export async function getImport(id: string): Promise<ImportJob> {
  const { data } = await apiClient.get<ImportJob>(`/imports/${id}`);
  return data;
}

export async function createImport(file: File, targetModule = 'clients'): Promise<ImportJob> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post<ImportJob>('/imports', form, {
    params: { target_module: targetModule },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function getImportRows(id: string): Promise<ImportRow[]> {
  const { data } = await apiClient.get<ImportRow[]>(`/imports/${id}/rows`);
  return data;
}

export async function previewImport(id: string): Promise<ImportPreview> {
  const { data } = await apiClient.post<ImportPreview>(`/imports/${id}/preview`);
  return data;
}

export async function processImport(id: string, mapping: Record<string, string>): Promise<ImportJob> {
  const body: ColumnMapping = { mapping };
  const { data } = await apiClient.post<ImportJob>(`/imports/${id}/process`, body);
  return data;
}

export async function confirmImport(id: string): Promise<ImportJob> {
  const { data } = await apiClient.post<ImportJob>(`/imports/${id}/confirm`);
  return data;
}
