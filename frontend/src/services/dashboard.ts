import { apiClient } from '@/lib/api';
import type { AuditPage, Dashboard } from '@/types';

export async function getDashboard(): Promise<Dashboard> {
  const { data } = await apiClient.get<Dashboard>('/dashboard');
  return data;
}

export async function listAudit(
  params: { skip?: number; limit?: number; module?: string; action?: string } = {},
): Promise<AuditPage> {
  const { data } = await apiClient.get<AuditPage>('/audit', { params });
  return data;
}
