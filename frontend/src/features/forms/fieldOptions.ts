import type { Client, TemplateField } from '@/types';

/** Opción normalizada para campos select. */
export interface NormalizedOption {
  label: string;
  value: string;
}

/**
 * Catálogos por defecto para ciertas claves cuando el campo select no trae
 * `options_json`. Se usan únicamente como respaldo de interfaz; el backend
 * valida contra sus propios catálogos.
 */
const CATALOGS: Record<string, string[]> = {
  departamento: [
    'Guatemala',
    'Sacatepéquez',
    'Chimaltenango',
    'Escuintla',
    'Quetzaltenango',
    'Huehuetenango',
    'Petén',
    'Izabal',
    'Zacapa',
    'Suchitepéquez',
  ],
  municipio: [
    'Guatemala',
    'Mixco',
    'Villa Nueva',
    'Antigua Guatemala',
    'Quetzaltenango',
    'Cobán',
    'Flores',
    'Puerto Barrios',
    'Zacapa',
    'Mazatenango',
  ],
  estado_civil: ['Soltero(a)', 'Casado(a)', 'Divorciado(a)', 'Viudo(a)', 'Unido(a) de hecho'],
  tipo_cliente: ['INDIVIDUAL', 'JURIDICA'],
  tipo_sociedad: ['SOCIEDAD_ANONIMA', 'SOCIEDAD_LIMITADA', 'SOCIEDAD_COLECTIVA'],
  medio_pago: ['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'TARJETA', 'OTRO'],
  nacionalidad: ['Guatemalteca', 'Extranjera'],
};

/** Convierte `options_json` a una lista normalizada de opciones. */
export function normalizeOptions(field: TemplateField): NormalizedOption[] {
  const raw = field.options_json;

  if (Array.isArray(raw)) {
    return raw
      .map((entry) => {
        if (typeof entry === 'string') return { label: entry, value: entry };
        if (entry && typeof entry === 'object') {
          const obj = entry as Record<string, unknown>;
          const value = String(obj.value ?? obj.key ?? obj.label ?? '');
          const label = String(obj.label ?? obj.value ?? obj.key ?? value);
          const active = obj.active === undefined ? true : Boolean(obj.active);
          if (!value || !active) return null;
          return { label, value };
        }
        return null;
      })
      .filter((option): option is NormalizedOption => option !== null);
  }

  if (raw && typeof raw === 'object' && Array.isArray((raw as { options?: unknown[] }).options)) {
    return normalizeOptions({ ...field, options_json: (raw as { options: unknown[] }).options });
  }

  const fallback = CATALOGS[field.key];
  if (fallback) {
    return fallback.map((value) => ({ label: value, value }));
  }

  return [];
}

/** Campos hijos de un campo de tipo lista (repetidor). */
export interface ListItemField {
  key: string;
  label: string;
  field_type: string;
  required: boolean;
}

const DEFAULT_LIST_ITEM_FIELDS: ListItemField[] = [
  { key: 'nombre', label: 'Nombre', field_type: 'name', required: true },
  { key: 'aporte', label: 'Aporte', field_type: 'currency', required: false },
];

/**
 * Determina la estructura de cada elemento de un campo lista. Si el campo
 * declara `options_json` con definiciones de subcampos, se usan; en caso
 * contrario se emplea una estructura genérica (nombre + aporte).
 */
export function resolveListItemFields(field: TemplateField): ListItemField[] {
  const raw = field.options_json;
  if (Array.isArray(raw) && raw.length > 0) {
    const looksLikeFields = raw.every(
      (entry) => entry && typeof entry === 'object' && 'key' in (entry as Record<string, unknown>) && 'field_type' in (entry as Record<string, unknown>),
    );
    if (looksLikeFields) {
      return raw.map((entry) => {
        const obj = entry as Record<string, unknown>;
        return {
          key: String(obj.key),
          label: String(obj.label ?? obj.key),
          field_type: String(obj.field_type ?? 'text'),
          required: obj.required === undefined ? false : Boolean(obj.required),
        };
      });
    }
  }
  return DEFAULT_LIST_ITEM_FIELDS;
}

/** Extrae el nombre a mostrar de un cliente para el autocompletado. */
export function clientDisplayName(client: Client): string {
  return client.display_name;
}

/** Crea un elemento vacío para un campo lista. */
export function emptyListItem(itemFields: ListItemField[]): Record<string, unknown> {
  return itemFields.reduce<Record<string, unknown>>((acc, item) => {
    acc[item.key] = item.field_type === 'boolean' ? false : '';
    return acc;
  }, {});
}
