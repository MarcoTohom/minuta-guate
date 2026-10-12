import { apiClient } from '@/lib/api';
import type { Charge, ChargeCreate, Payment, PaymentCreate } from '@/types';

export async function listCharges(
  params: { skip?: number; limit?: number; client_id?: string; estado?: string } = {},
): Promise<Charge[]> {
  const { data } = await apiClient.get<Charge[]>('/charges', { params });
  return data;
}

export async function getCharge(id: string): Promise<Charge> {
  const { data } = await apiClient.get<Charge>(`/charges/${id}`);
  return data;
}

export async function createCharge(payload: ChargeCreate): Promise<Charge> {
  const { data } = await apiClient.post<Charge>('/charges', payload);
  return data;
}

export async function updateCharge(id: string, payload: ChargeCreate): Promise<Charge> {
  const { data } = await apiClient.put<Charge>(`/charges/${id}`, payload);
  return data;
}

/** Registra un pago sobre un cobro existente. */
export async function registerChargePayment(chargeId: string, payload: PaymentCreate): Promise<Payment> {
  const { data } = await apiClient.post<Payment>(`/charges/${chargeId}/payments`, payload);
  return data;
}
