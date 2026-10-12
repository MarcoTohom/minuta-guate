/** Tipos de importación de archivos. */

export interface ImportJob {
  id: string;
  file_id?: string | null;
  file_type: string;
  status: string;
  total_rows?: number | null;
  valid_rows?: number | null;
  error_rows?: number | null;
  column_mapping?: Record<string, string> | null;
  target_module?: string | null;
  created_at: string;
}

export interface ImportRowError {
  fila?: number;
  columna?: string;
  valor?: string;
  tipo_error?: string;
  mensaje?: string;
}

export interface ImportRow {
  id: string;
  row_number: number;
  status: string;
  mapped_data?: Record<string, unknown> | null;
  errors?: ImportRowError[] | null;
  imported: boolean;
}

export interface ImportPreview {
  columns?: string[];
  preview_rows?: Record<string, unknown>[];
  total_rows?: number | null;
  message?: string | null;
  error?: string | null;
}

export interface ColumnMapping {
  mapping: Record<string, string>;
}

/**
 * Campos destino disponibles por módulo de importación.
 * Deben coincidir con los nombres aceptados por el backend.
 */
export const IMPORT_TARGET_FIELDS: Record<string, string[]> = {
  clients: [
    'nombres',
    'apellidos',
    'dpi',
    'nit',
    'telefono',
    'correo',
    'direccion',
    'departamento',
    'municipio',
  ],
};
