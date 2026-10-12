/**
 * Tipos comunes de la API (paginación, respuestas de mensaje, errores).
 */

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface MessageResponse {
  message: string;
  success: boolean;
}

export interface PaginationParams {
  skip?: number;
  limit?: number;
}

/** Normaliza una respuesta que puede venir como lista plana o paginada. */
export function asPaginated<T>(data: T[] | Paginated<T>): Paginated<T> {
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      page: 1,
      page_size: data.length || 10,
      pages: data.length ? 1 : 0,
    };
  }
  return data;
}

export type Severity = 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';
