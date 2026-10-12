import { apiClient } from '@/lib/api';
import type { ExperimentalReport, TestCase } from '@/types';

export async function getExperimentalReport(): Promise<ExperimentalReport> {
  const { data } = await apiClient.get<ExperimentalReport>('/reports/experimental');
  return data;
}

export async function listTestCases(params: { skip?: number; limit?: number } = {}): Promise<TestCase[]> {
  const { data } = await apiClient.get<TestCase[]>('/measurements/test-cases', { params });
  return data;
}

export interface TestExecutionCreate {
  test_case_id: string;
  method: 'TRADITIONAL' | 'SYSTEM';
  notes?: string | null;
  measurement?: {
    started_at?: string | null;
    finished_at?: string | null;
    duration_minutes?: number | null;
    errors_found?: number;
    errors_missed?: number;
    corrections?: number;
    notes?: string | null;
  } | null;
}

export async function createTestExecution(payload: TestExecutionCreate): Promise<{ id: string; method: string }> {
  const { data } = await apiClient.post<{ id: string; method: string }>(
    '/measurements/executions',
    payload,
  );
  return data;
}
