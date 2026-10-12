import { apiClient } from '@/lib/api';
import type { Payment, PaymentCreate } from '@/types';

export async function listPayments(params: { skip?: number; limit?: number } = {}): Promise<Payment[]> {
  const { data } = await apiClient.get<Payment[]>('/payments', { params });
  return data;
}

export async function getPayment(id: string): Promise<Payment> {
  const { data } = await apiClient.get<Payment>(`/payments/${id}`);
  return data;
}

export async function createPayment(payload: PaymentCreate): Promise<Payment> {
  const { data } = await apiClient.post<Payment>('/payments', payload);
  return data;
}
