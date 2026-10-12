/**
 * Formateadores y normalizadores de campos tipados.
 *
 * Regla invariante del proyecto: DPI y NIT se manejan SIEMPRE como texto.
 * Nunca se convierten a número, porque se perderían ceros a la izquierda y la
 * letra verificadora "K" del NIT.
 */

export const DPI_LENGTH = 13;
export const DPI_MASK = '0000 00000 0000';
export const NIT_REGEX = /^\d{1,8}-?[\dKk]$/;
export const NIT_CF_REGEX = /^CF$/i;
export const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const PHONE_REGEX = /^\+?\d{8,15}$/;

/** Deja solo dígitos. */
export function normalizeDpi(value: string | null | undefined): string {
  if (!value) return '';
  return String(value).replace(/\D/g, '');
}

/** Aplica una máscara visual al DPI (solo presentación). */
export function formatDpi(value: string | null | undefined, mask: string = DPI_MASK): string {
  const digits = normalizeDpi(value);
  const out: string[] = [];
  let i = 0;
  for (const ch of mask) {
    if (ch === '0' || ch === '#') {
      if (i >= digits.length) break;
      out.push(digits[i]);
      i += 1;
    } else if (i < digits.length) {
      // Solo se conservan los separadores de la máscara cuando aún quedan
      // dígitos por mostrar; así no se agregan espacios finales.
      out.push(ch);
    }
  }
  return out.join('') + digits.slice(i);
}

/** Valida el formato del DPI: exactamente 13 dígitos. */
export function isValidDpi(value: string | null | undefined): boolean {
  return new RegExp(`^\\d{${DPI_LENGTH}}$`).test(normalizeDpi(value));
}

/** Normaliza un NIT: sin espacios ni guiones, "K" en mayúscula. */
export function normalizeNit(value: string | null | undefined): string {
  if (!value) return '';
  return String(value).replace(/[\s-]/g, '').toUpperCase();
}

/** Valida el formato del NIT. Acepta "CF" (consumidor final). */
export function isValidNit(value: string | null | undefined): boolean {
  const raw = normalizeNit(value);
  if (!raw) return false;
  return NIT_REGEX.test(raw) || NIT_CF_REGEX.test(raw);
}

/** Valida un teléfono (8 a 15 dígitos, con "+" inicial opcional). */
export function isValidPhone(value: string | null | undefined): boolean {
  if (!value) return false;
  const raw = String(value).trim();
  const plus = raw.startsWith('+');
  const digits = raw.replace(/\D/g, '');
  return PHONE_REGEX.test((plus ? '+' : '') + digits);
}

/** Valida un correo electrónico de forma laxa. */
export function isValidEmail(value: string | null | undefined): boolean {
  if (!value) return false;
  return EMAIL_REGEX.test(String(value).trim().toLowerCase());
}

/** Colapsa espacios repetidos y aplica trim. */
export function normalizeName(value: string | null | undefined): string {
  if (!value) return '';
  return String(value).split(/\s+/).filter(Boolean).join(' ');
}

/** Solo dígitos, opcionalmente con signo. */
export function normalizeInteger(value: string | null | undefined): string {
  if (!value) return '';
  const negative = String(value).trim().startsWith('-');
  const digits = String(value).replace(/\D/g, '');
  return (negative ? '-' : '') + digits;
}

/** Deja un número decimal escribible (dígitos y un punto). */
export function normalizeDecimal(value: string | null | undefined): string {
  if (!value) return '';
  let text = String(value).replace(/,/g, '.').replace(/[^\d.-]/g, '');
  const negative = text.startsWith('-');
  text = text.replace(/-/g, '');
  const [intPart, ...rest] = text.split('.');
  const decimals = rest.join('');
  let result = intPart;
  if (rest.length > 0) {
    result += `.${decimals}`;
  }
  return (negative ? '-' : '') + result;
}

/** Deja un porcentaje escribible (dígitos y un punto). */
export function normalizePercentage(value: string | null | undefined): string {
  return normalizeDecimal(String(value ?? '').replace('%', ''));
}
