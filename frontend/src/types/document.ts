/** Tipos de documentos, versiones y resultados de validación. */

import type { Severity } from './common';

export interface ValidationResult {
  id: string;
  rule_id: string;
  severity: Severity;
  field_key?: string | null;
  message: string;
  current_value?: string | null;
  expected_value?: string | null;
  location?: string | null;
  reviewed: boolean;
  correction_note?: string | null;
}

export interface ValidationSummary {
  total: number;
  critical: number;
  error: number;
  warning: number;
  info: number;
  can_generate: boolean;
  results: ValidationResult[];
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  file_path?: string | null;
  validation_status?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface DocumentDraft {
  id: string;
  case_id: string;
  template_version_id?: string | null;
  title: string;
  status: string;
  field_data?: Record<string, unknown> | null;
  created_at: string;
  versions: DocumentVersion[];
  validation_results: ValidationResult[];
}

export interface DocumentCreate {
  case_id: string;
  template_version_id?: string | null;
  title: string;
  field_data?: Record<string, unknown> | null;
}

export interface DocumentUpdate {
  title?: string;
  template_version_id?: string | null;
  field_data?: Record<string, unknown> | null;
  status?: string;
}

export interface DocumentListParams {
  skip?: number;
  limit?: number;
  case_id?: string;
  status?: string;
}

export interface ValidationResultReview {
  reviewed: boolean;
  correction_note?: string | null;
}
