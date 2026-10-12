import { apiClient } from '@/lib/api';
import type { Quote, QuoteCreate, QuoteUpdate } from '@/types';

export async function listQuotes(
  params: { skip?: number; limit?: number; client_id?: string } = {},
): Promise<Quote[]> {
  const { data } = await apiClient.get<Quote[]>('/quotes', { params });
  return data;
}

export async function getQuote(id: string): Promise<Quote> {
  const { data } = await apiClient.get<Quote>(`/quotes/${id}`);
  return data;
}

export async function createQuote(payload: QuoteCreate): Promise<Quote> {
  const { data } = await apiClient.post<Quote>('/quotes', payload);
  return data;
}

export async function updateQuote(id: string, payload: QuoteUpdate): Promise<Quote> {
  const { data } = await apiClient.put<Quote>(`/quotes/${id}`, payload);
  return data;
}

export async function duplicateQuote(id: string): Promise<Quote> {
  const { data } = await apiClient.post<Quote>(`/quotes/${id}/duplicate`);
  return data;
}
