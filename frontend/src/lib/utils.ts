import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Une clases de Tailwind resolviendo conflictos. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Formatea una fecha ISO (YYYY-MM-DD) a dd/mm/aaaa para presentación. */
export function formatDate(value?: string | null): string {
  if (!value) return '';
  const iso = value.slice(0, 10);
  const [year, month, day] = iso.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

/** Formatea una fecha-hora ISO a dd/mm/aaaa hh:mm. */
export function formatDateTime(value?: string | null): string {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('es-GT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Formatea un número como quetzales con dos decimales. */
export function formatCurrency(value: number | string | null | undefined): string {
  const num = toNumber(value);
  if (num === null) return '';
  return `Q ${num.toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Convierte un valor a número tolerando separadores de miles. */
export function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const normalized = String(value).replace(/[,\s]/g, '').replace(/[^\d.-]/g, '');
  if (normalized === '' || normalized === '-' || normalized === '.' || normalized === '-.') return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Redondea a dos decimales evitando errores de punto flotante. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Devuelve las iniciales de un nombre para avatares. */
export function initials(name?: string | null): string {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** Genera la fecha de hoy en formato ISO (YYYY-MM-DD). */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Elimina acentos y normaliza para comparación/búsqueda. */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Trunca un texto con puntos suspensivos. */
export function truncate(value: string, max = 40): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/** Construye una cadena de query string omitiendo valores vacíos. */
export function buildQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

/** Aplana un error desconocido a un mensaje legible. */
export function humanizeUnknownError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Ocurrió un error inesperado.';
}
