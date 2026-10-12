import { z, type ZodTypeAny } from 'zod';
import type { TemplateField } from '@/types';
import {
  isValidDpi,
  isValidEmail,
  isValidNit,
  isValidPhone,
} from '@/lib/validators';
import { resolveListItemFields } from './fieldOptions';

const REQUIRED_MESSAGE = 'Este campo es obligatorio.';

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[,\sQ%]/g, '');
    if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Aplica una regla de longitud mínima/máxima a un esquema de cadena. */
function applyLength(schema: z.ZodString, field: TemplateField): z.ZodString {
  let result = schema;
  if (field.min_length && field.min_length > 0) {
    result = result.min(field.min_length, `Debe tener al menos ${field.min_length} caracteres.`);
  }
  if (field.max_length && field.max_length > 0) {
    result = result.max(field.max_length, `Debe tener como máximo ${field.max_length} caracteres.`);
  }
  return result;
}

/** Aplica una expresión regular configurada a un esquema de cadena. */
function applyRegex(schema: z.ZodString, field: TemplateField): z.ZodString {
  if (!field.regex) return schema;
  try {
    const regex = new RegExp(field.regex);
    return schema.regex(regex, 'El formato no es válido.');
  } catch {
    return schema;
  }
}

function buildStringSchema(field: TemplateField): ZodTypeAny {
  let schema = z.string();
  const optional = !field.required;

  // Los campos numéricos se manejan como texto en el formulario.
  const numericTypes = ['integer', 'decimal', 'currency', 'percentage'];
  if (numericTypes.includes(String(field.field_type))) {
    const base = z.string().refine(
      (value) => {
        if (value === '' || value === null || value === undefined) return optional;
        if (String(field.field_type) === 'integer') return /^-?\d+$/.test(value);
        return parseNumber(value) !== null;
      },
      { message: String(field.field_type) === 'integer' ? 'Debe ser un número entero.' : 'Debe ser un número válido.' },
    );
    return applyRange(base, field, optional);
  }

  if (!optional) {
    schema = schema.min(1, REQUIRED_MESSAGE);
  }

  schema = applyLength(schema, field);
  schema = applyRegex(schema, field);

  let refined: ZodTypeAny = schema;
  switch (field.field_type) {
    case 'dpi':
      refined = schema.refine(
        (value) => (optional && !value ? true : isValidDpi(value)),
        { message: 'El DPI debe contener 13 dígitos.' },
      );
      break;
    case 'nit':
      refined = schema.refine(
        (value) => (optional && !value ? true : isValidNit(value)),
        { message: 'El NIT no tiene un formato válido (ej. 12345678-K o CF).' },
      );
      break;
    case 'phone':
      refined = schema.refine(
        (value) => (optional && !value ? true : isValidPhone(value)),
        { message: 'El teléfono debe tener entre 8 y 15 dígitos.' },
      );
      break;
    case 'email':
      refined = schema.refine(
        (value) => (optional && !value ? true : isValidEmail(value)),
        { message: 'El correo electrónico no es válido.' },
      );
      break;
    default:
      break;
  }

  return optional ? refined.optional().or(z.literal('')) : refined;
}

/** Aplica rango min/max a un esquema de cadena numérica. */
function applyRange(
  schema: ZodTypeAny,
  field: TemplateField,
  optional: boolean,
): ZodTypeAny {
  const min = field.min_value !== null && field.min_value !== undefined ? parseNumber(field.min_value) : null;
  const max = field.max_value !== null && field.max_value !== undefined ? parseNumber(field.max_value) : null;
  if (min === null && max === null) return schema;

  const fn = (value: string): boolean => {
    if (value === '') return optional;
    const parsed = parseNumber(value);
    if (parsed === null) return false;
    if (min !== null && parsed < min) return false;
    if (max !== null && parsed > max) return false;
    return true;
  };

  const parts: string[] = [];
  if (min !== null && max !== null) parts.push(`entre ${min} y ${max}`);
  else if (min !== null) parts.push(`mayor o igual a ${min}`);
  else if (max !== null) parts.push(`menor o igual a ${max}`);

  return schema.refine(fn, { message: `El valor debe ser ${parts.join(' ')}.` });
}

function buildDateSchema(field: TemplateField): ZodTypeAny {
  const optional = !field.required;
  const base = z.string().refine(
    (value) => {
      if (!value) return optional;
      return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
    },
    { message: 'Seleccione una fecha válida.' },
  );
  return base;
}

function buildDateTimeSchema(field: TemplateField): ZodTypeAny {
  const optional = !field.required;
  return z.string().refine(
    (value) => {
      if (!value) return optional;
      return !Number.isNaN(Date.parse(value));
    },
    { message: 'Seleccione una fecha y hora válidas.' },
  );
}

function buildSelectSchema(field: TemplateField): ZodTypeAny {
  const optional = !field.required;
  return z.string().refine((value) => (optional && !value ? true : value.length > 0), {
    message: REQUIRED_MESSAGE,
  });
}

function buildBooleanSchema(): ZodTypeAny {
  return z.boolean().optional();
}

function buildListSchema(field: TemplateField): ZodTypeAny {
  const itemFields = resolveListItemFields(field);
  const itemSchema = z.object(
    itemFields.reduce<Record<string, ZodTypeAny>>((acc, item) => {
      if (item.required) {
        acc[item.key] = z.string().min(1, `"${item.label}" es obligatorio.`);
      } else {
        acc[item.key] = z.string().optional().or(z.literal(''));
      }
      return acc;
    }, {}),
  );
  const arraySchema = z.array(itemSchema);
  if (field.required) {
    return arraySchema.min(1, 'Agregue al menos un elemento.');
  }
  return arraySchema.optional();
}

/** Construye el esquema de un campo individual según su tipo. */
export function buildFieldSchema(field: TemplateField): ZodTypeAny {
  switch (field.field_type) {
    case 'boolean':
      return buildBooleanSchema();
    case 'list':
      return buildListSchema(field);
    case 'computed':
      return z.unknown().optional();
    case 'date':
      return buildDateSchema(field);
    case 'datetime':
      return buildDateTimeSchema(field);
    case 'select':
      return buildSelectSchema(field);
    default:
      return buildStringSchema(field);
  }
}

/** Construye el esquema Zod completo del formulario dinámico. */
export function buildSchema(fields: TemplateField[]): z.ZodObject<Record<string, ZodTypeAny>> {
  const shape = fields.reduce<Record<string, ZodTypeAny>>((acc, field) => {
    acc[field.key] = buildFieldSchema(field);
    return acc;
  }, {});
  return z.object(shape);
}

/** Valor inicial de un campo según su tipo y la definición de la plantilla. */
export function defaultValueForField(field: TemplateField): unknown {
  if (field.default_value !== null && field.default_value !== undefined && field.default_value !== '') {
    if (field.field_type === 'boolean') {
      return field.default_value === 'true' || field.default_value === '1';
    }
    return field.default_value;
  }
  switch (field.field_type) {
    case 'boolean':
      return false;
    case 'list':
      return [];
    default:
      return '';
  }
}

/** Construye el objeto de valores iniciales para todas las definiciones. */
export function buildDefaultValues(
  fields: TemplateField[],
  provided?: Record<string, unknown>,
): Record<string, unknown> {
  return fields.reduce<Record<string, unknown>>((acc, field) => {
    if (provided && provided[field.key] !== undefined && provided[field.key] !== null) {
      acc[field.key] = provided[field.key];
    } else {
      acc[field.key] = defaultValueForField(field);
    }
    return acc;
  }, {});
}
