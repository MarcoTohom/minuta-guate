import { apiClient } from '@/lib/api';
import type { ValidationRule, ValidationRuleUpdate } from '@/types';

export async function listValidationRules(deedTypeCode?: string): Promise<ValidationRule[]> {
  const { data } = await apiClient.get<ValidationRule[]>('/validation-rules', {
    params: deedTypeCode ? { deed_type_code: deedTypeCode } : undefined,
  });
  return data;
}

export async function updateValidationRule(
  ruleId: string,
  payload: ValidationRuleUpdate,
): Promise<ValidationRule> {
  const { data } = await apiClient.patch<ValidationRule>(`/validation-rules/${ruleId}`, payload);
  return data;
}
