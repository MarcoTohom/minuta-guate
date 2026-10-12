import { AxiosError } from 'axios';

interface FastApiValidationError {
  loc?: (string | number)[];
  msg?: string;
  type?: string;
}

interface FastApiErrorBody {
  detail?: string | FastApiValidationError[];
  message?: string;
}

/**
 * Extrae un mensaje legible de un error de Axios / FastAPI.
 * Maneja los distintos formatos de error del backend (detail string,
 * lista de errores de validación Pydantic, 403 de permisos, 422 de generación).
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return 'Ocurrió un error inesperado.';

  if (error instanceof AxiosError) {
    const body = error.response?.data as FastApiErrorBody | undefined;
    const status = error.response?.status;

    if (body) {
      if (typeof body.detail === 'string' && body.detail.trim()) {
        return body.detail;
      }
      if (Array.isArray(body.detail) && body.detail.length > 0) {
        return body.detail
          .map((item) => {
            const field = item.loc?.filter((part) => part !== 'body').join('.') ?? '';
            return field ? `${field}: ${item.msg ?? 'valor inválido'}` : item.msg ?? 'Error de validación';
          })
          .join(' · ');
      }
      if (typeof body.message === 'string' && body.message.trim()) {
        return body.message;
      }
    }

    if (status === 401) return 'Sesión expirada o credenciales incorrectas.';
    if (status === 403) return 'No tiene permisos para realizar esta acción.';
    if (status === 404) return 'El recurso solicitado no existe.';
    if (status === 413) return 'El archivo excede el tamaño máximo permitido.';
    if (status === 422) return 'Los datos enviados no son válidos.';
    if (status && status >= 500) return 'Error interno del servidor. Intente nuevamente.';
    if (error.message) return error.message;
  }

  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Ocurrió un error inesperado.';
}

/** Devuelve el status HTTP de un error de Axios, si existe. */
export function getErrorStatus(error: unknown): number | undefined {
  if (error instanceof AxiosError) return error.response?.status;
  return undefined;
}
