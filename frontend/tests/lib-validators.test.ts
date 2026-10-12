import { describe, expect, it } from 'vitest';
import {
  DPI_LENGTH,
  formatDpi,
  isValidDpi,
  isValidEmail,
  isValidNit,
  isValidPhone,
  normalizeDecimal,
  normalizeDpi,
  normalizeInteger,
  normalizeName,
  normalizeNit,
} from '@/lib/validators';

describe('validadores de DPI', () => {
  it('normaliza el DPI dejando solo dígitos', () => {
    expect(normalizeDpi('1234-5678 9012 3')).toBe('1234567890123');
    expect(normalizeDpi(null)).toBe('');
  });

  it('aplica la máscara visual sin alterar los dígitos', () => {
    expect(formatDpi('1234567890123')).toBe('1234 56789 0123');
    expect(formatDpi('1234')).toBe('1234');
  });

  it('exige exactamente 13 dígitos', () => {
    expect(isValidDpi('1234567890123')).toBe(true);
    expect(isValidDpi('1234 56789 0123')).toBe(true);
    expect(isValidDpi('123456789012')).toBe(false);
    expect(isValidDpi('12345678901234')).toBe(false);
    expect(isValidDpi('12345678901AB')).toBe(false);
    expect(DPI_LENGTH).toBe(13);
  });
});

describe('validadores de NIT', () => {
  it('acepta el formato guatemalteco y el consumidor final', () => {
    expect(isValidNit('1234567-8')).toBe(true);
    expect(isValidNit('12345678')).toBe(true);
    expect(isValidNit('1234567K')).toBe(true);
    expect(isValidNit('cf')).toBe(true);
    expect(isValidNit('CF')).toBe(true);
  });

  it('rechaza formatos inválidos', () => {
    expect(isValidNit('1234567890')).toBe(false);
    expect(isValidNit('ABC')).toBe(false);
    expect(isValidNit('')).toBe(false);
    expect(isValidNit(null)).toBe(false);
  });

  it('normaliza quitando espacios, guiones y pasando K a mayúscula', () => {
    expect(normalizeNit(' 1234-567 k ')).toBe('1234567K');
    expect(normalizeNit(null)).toBe('');
  });
});

describe('validadores varios', () => {
  it('valida teléfonos, correos y colapsa nombres', () => {
    expect(isValidPhone('+502 1234 5678')).toBe(true);
    expect(isValidPhone('12345678')).toBe(true);
    expect(isValidPhone('12')).toBe(false);
    expect(isValidEmail('juan@example.com')).toBe(true);
    expect(isValidEmail('juan@example')).toBe(false);
    expect(normalizeName('  Juan   Pérez  ')).toBe('Juan Pérez');
  });

  it('normaliza enteros y decimales como texto escribible', () => {
    expect(normalizeInteger('-12a3')).toBe('-123');
    expect(normalizeInteger('0012')).toBe('0012');
    expect(normalizeDecimal('12,5')).toBe('12.5');
    expect(normalizeDecimal('-3.50')).toBe('-3.50');
    expect(normalizeDecimal('abc')).toBe('');
  });
});
