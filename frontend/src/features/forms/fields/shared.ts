/** Utilidades compartidas por los controles especializados de campo. */

/** Convierte un valor desconocido a cadena sin producir "[object Object]". */
export function asString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

/** Interpreta un valor como booleano tolerando "true"/"1". */
export function asBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return value === 'true' || value === '1';
  return false;
}

/** Garantiza un arreglo de objetos para los campos de tipo lista. */
export function asList(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) =>
    item && typeof item === 'object' ? (item as Record<string, unknown>) : {},
  );
}

/** Clases para reflejar el estado de error en los controles. */
export function errorInputClass(hasError: boolean): string {
  return hasError ? 'border-destructive focus-visible:ring-destructive' : '';
}
