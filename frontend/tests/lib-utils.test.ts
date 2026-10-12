import { describe, expect, it } from 'vitest';
import {
  buildQuery,
  cn,
  formatCurrency,
  formatDate,
  humanizeUnknownError,
  initials,
  normalizeText,
  round2,
  toNumber,
  todayISO,
  truncate,
} from '@/lib/utils';

describe('utilidades de formato', () => {
  it('formatea fechas ISO a dd/mm/aaaa', () => {
    expect(formatDate('2024-03-05')).toBe('05/03/2024');
    expect(formatDate('2024-03-05T10:00:00')).toBe('05/03/2024');
    expect(formatDate('')).toBe('');
    expect(formatDate(null)).toBe('');
  });

  it('convierte texto a número tolerando separadores y símbolos', () => {
    expect(toNumber('Q 1,234.56')).toBeCloseTo(1234.56);
    expect(toNumber('1500')).toBe(1500);
    expect(toNumber('')).toBeNull();
    expect(toNumber('abc')).toBeNull();
  });

  it('formatea montos con prefijo Q y dos decimales', () => {
    expect(formatCurrency(2)).toMatch(/^Q\s?2[.,]00$/);
    expect(formatCurrency(null)).toBe('');
  });

  it('redondea a dos decimales sin errores de punto flotante', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(10.005)).toBeCloseTo(10.01, 2);
  });
});

describe('utilidades de texto', () => {
  it('genera iniciales para avatares', () => {
    expect(initials('Juan Pérez')).toBe('JP');
    expect(initials('')).toBe('?');
  });

  it('normaliza acentos y mayúsculas para búsqueda', () => {
    expect(normalizeText('Árbol')).toBe('arbol');
  });

  it('trunca texto agregando puntos suspensivos', () => {
    expect(truncate('abcdefgh', 4)).toBe('abc…');
    expect(truncate('abc', 10)).toBe('abc');
  });

  it('construye query strings omitiendo valores vacíos', () => {
    expect(buildQuery({ a: 1, b: '', c: null, d: 'x' })).toBe('?a=1&d=x');
    expect(buildQuery({ a: undefined })).toBe('');
  });

  it('produce la fecha de hoy en ISO', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('combina clases de Tailwind resolviendo conflictos', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-sm', false && 'hidden', 'font-bold')).toBe('text-sm font-bold');
  });

  it('humaniza errores desconocidos', () => {
    expect(humanizeUnknownError(new Error('boom'))).toBe('boom');
    expect(humanizeUnknownError('texto')).toBe('texto');
    expect(humanizeUnknownError(42)).toBe('Ocurrió un error inesperado.');
  });
});
