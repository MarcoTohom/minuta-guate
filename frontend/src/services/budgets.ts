import { apiClient } from '@/lib/api';
import type { Budget, BudgetCreate } from '@/types';

export async function listBudgets(
  params: { skip?: number; limit?: number; case_id?: string } = {},
): Promise<Budget[]> {
  const { data } = await apiClient.get<Budget[]>('/budgets', { params });
  return data;
}

export async function getBudget(id: string): Promise<Budget> {
  const { data } = await apiClient.get<Budget>(`/budgets/${id}`);
  return data;
}

export async function createBudget(payload: BudgetCreate): Promise<Budget> {
  const { data } = await apiClient.post<Budget>('/budgets', payload);
  return data;
}

export async function updateBudget(id: string, payload: BudgetCreate): Promise<Budget> {
  const { data } = await apiClient.put<Budget>(`/budgets/${id}`, payload);
  return data;
}
