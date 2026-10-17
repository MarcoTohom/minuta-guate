/** Tipos de expedientes y catálogo de tipos de escritura. */

export interface DeedType {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  active?: boolean;
}

export interface DeedTypeCreate {
  code: string;
  name: string;
  description?: string | null;
}

export interface DeedTypeUpdate {
  name?: string;
  description?: string | null;
  active?: boolean;
}

export interface Case {
  id: string;
  numero_expediente: string;
  client_id: string;
  deed_type_id?: string | null;
  responsable_id?: string | null;
  estado: string;
  fecha_apertura: string;
  fecha_cierre?: string | null;
  observaciones?: string | null;
  deed_type?: DeedType | null;
}

export interface CaseCreate {
  client_id: string;
  deed_type_id?: string | null;
  responsable_id?: string | null;
  observaciones?: string | null;
}

export interface CaseUpdate {
  deed_type_id?: string | null;
  responsable_id?: string | null;
  estado?: string;
  observaciones?: string | null;
  fecha_cierre?: string | null;
}

export interface CaseListParams {
  skip?: number;
  limit?: number;
  estado?: string;
  client_id?: string;
}

export const CASE_ESTADOS = [
  'ABIERTO',
  'EN_REVISION',
  'PENDIENTE',
  'FINALIZADO',
  'CANCELADO',
] as const;
