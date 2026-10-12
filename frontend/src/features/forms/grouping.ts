import type { TemplateField } from '@/types';

export interface FieldGroup {
  key: string;
  label: string;
  fields: TemplateField[];
}

const GENERAL_KEY = '__general__';

/** Convierte "datos_generales" en "Datos generales". */
function humanize(value: string): string {
  const spaced = value.replace(/[._-]+/g, ' ').trim();
  if (!spaced) return 'Datos generales';
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

/** Prefijo de sección de una clave (antes del punto o del primer guion bajo). */
function prefixOf(key: string): string {
  const dot = key.indexOf('.');
  if (dot > 0) return key.slice(0, dot);
  const underscore = key.indexOf('_');
  if (underscore > 0) return key.slice(0, underscore);
  return '';
}

/**
 * Agrupa los campos por secciones.
 *
 * Regla: un `group_key` explícito siempre gana. Si no existe, se deriva la
 * sección del prefijo de la clave cuando al menos dos campos lo comparten
 * (p. ej. `comprador_nombre`, `comprador_dpi` → sección "Comprador").
 */
export function groupFields(fields: TemplateField[]): FieldGroup[] {
  const prefixCounts: Record<string, number> = {};
  fields.forEach((field) => {
    const prefix = prefixOf(field.key);
    if (prefix) prefixCounts[prefix] = (prefixCounts[prefix] ?? 0) + 1;
  });

  const groups = new Map<string, FieldGroup>();

  fields.forEach((field) => {
    let key = field.group_key?.trim() ?? '';
    let label = key ? humanize(key) : '';

    if (!key) {
      const prefix = prefixOf(field.key);
      if (prefix && (prefixCounts[prefix] ?? 0) >= 2) {
        key = prefix;
        label = humanize(prefix);
      }
    }

    if (!key) {
      key = GENERAL_KEY;
      label = 'Datos generales';
    }

    let group = groups.get(key);
    if (!group) {
      group = { key, label, fields: [] };
      groups.set(key, group);
    }
    group.fields.push(field);
  });

  return Array.from(groups.values());
}

/** Ordena los campos por `display_order` y, en empate, por etiqueta. */
export function sortFields(fields: TemplateField[]): TemplateField[] {
  return [...fields].sort((a, b) => {
    const orderDiff = (a.display_order ?? 0) - (b.display_order ?? 0);
    if (orderDiff !== 0) return orderDiff;
    return a.label.localeCompare(b.label);
  });
}
