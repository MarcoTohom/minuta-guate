/** Tipos del dashboard, reportes experimentales y mediciones. */

export interface DashboardCounters {
  clientes_activos: number;
  expedientes_activos: number;
  borradores: number;
  validaciones_pendientes: number;
  cotizaciones_abiertas: number;
  cobros_pendientes: number;
}

export interface ThesisDashboard {
  casos_evaluados: number;
  tiempo_tradicional_promedio?: number | null;
  tiempo_sistema_promedio?: number | null;
  reduccion_porcentual?: number | null;
  inconsistencias_detectadas: number;
  baseline_minutes: number;
  target_minutes: number;
}

export interface Dashboard {
  counters: DashboardCounters;
  thesis: ThesisDashboard;
}

export interface ExperimentalReport {
  cases_evaluated: number;
  traditional_samples: number;
  system_samples: number;
  traditional_minutes_avg?: number | null;
  system_minutes_avg?: number | null;
  reduction_percentage?: number | null;
  inconsistencies_detected: number;
  errors_found_total: number;
  errors_missed_total: number;
  corrections_total: number;
  target_minutes: number;
  baseline_minutes: number;
  note: string;
}

export interface TestCase {
  id: string;
  code: string;
  deed_type_code: string;
  title: string;
  description?: string | null;
  inconsistency_types?: string | null;
  expected_errors: number;
  document_id?: string | null;
}

export interface AuditLogEntry {
  id: string;
  username?: string | null;
  action: string;
  module: string;
  record_id?: string | null;
  result?: string | null;
  detail?: string | null;
  created_at: string;
}

export interface AuditPage {
  items: AuditLogEntry[];
  total: number;
}
