import { describe, expect, it } from 'vitest';
import {
  buildDefaultValues,
  buildFieldSchema,
  buildSchema,
  defaultValueForField,
} from '@/features/forms/buildSchema';
import { makeField } from './fixtures';

describe('buildSchema', () => {
  it('exige los campos obligatorios de texto', () => {
    const schema = buildFieldSchema(makeField({ key: 'nombre', field_type: 'text', required: true }));
    const result = schema.safeParse('');
    expect(result.success).toBe(false);
    expect(result.success ? '' : result.error.issues[0]?.message).toBe('Este campo es obligatorio.');
  });

  it('permite vacíos en campos opcionales', () => {
    const schema = buildFieldSchema(makeField({ key: 'nombre', required: false }));
    expect(schema.safeParse('').success).toBe(true);
    expect(schema.safeParse(undefined).success).toBe(true);
  });

  it('valida el DPI como texto de 13 dígitos, nunca como número', () => {
    const required = buildFieldSchema(makeField({ key: 'dpi', field_type: 'dpi', required: true }));
    expect(required.safeParse('123').success).toBe(false);
    expect(required.safeParse('1234567890123').success).toBe(true);
    expect(required.safeParse(1234567890123).success).toBe(false);

    const optional = buildFieldSchema(makeField({ key: 'dpi', field_type: 'dpi', required: false }));
    expect(optional.safeParse('').success).toBe(true);
  });

  it('valida el NIT admitiendo CF', () => {
    const schema = buildFieldSchema(makeField({ key: 'nit', field_type: 'nit', required: true }));
    expect(schema.safeParse('1234567-8').success).toBe(true);
    expect(schema.safeParse('CF').success).toBe(true);
    expect(schema.safeParse('ABC').success).toBe(false);
  });

  it('valida montos y enteros como texto', () => {
    const currency = buildFieldSchema(makeField({ key: 'monto', field_type: 'currency', required: true }));
    expect(currency.safeParse('Q 1,234.50').success).toBe(true);
    expect(currency.safeParse('abc').success).toBe(false);

    const integer = buildFieldSchema(makeField({ key: 'cantidad', field_type: 'integer', required: true }));
    expect(integer.safeParse('12').success).toBe(true);
    expect(integer.safeParse('12.5').success).toBe(false);
  });

  it('aplica el rango min/max configurado', () => {
    const schema = buildFieldSchema(
      makeField({ key: 'porcentaje', field_type: 'decimal', required: true, min_value: '0', max_value: '100' }),
    );
    expect(schema.safeParse('50').success).toBe(true);
    expect(schema.safeParse('-5').success).toBe(false);
    expect(schema.safeParse('150').success).toBe(false);
  });

  it('valida fechas ISO', () => {
    const schema = buildFieldSchema(makeField({ key: 'fecha', field_type: 'date', required: true }));
    expect(schema.safeParse('2024-03-05').success).toBe(true);
    expect(schema.safeParse('2024-13-05').success).toBe(false);
    expect(schema.safeParse('').success).toBe(false);
  });

  it('valida listas repetibles con subcampos obligatorios', () => {
    const schema = buildFieldSchema(makeField({ key: 'compradores', field_type: 'list', required: true }));
    expect(schema.safeParse([]).success).toBe(false);
    expect(schema.safeParse([{ nombre: '' }]).success).toBe(false);
    expect(schema.safeParse([{ nombre: 'Ana' }]).success).toBe(true);
  });

  it('trata los booleanos como opcionales', () => {
    const schema = buildFieldSchema(makeField({ key: 'activo', field_type: 'boolean' }));
    expect(schema.safeParse(false).success).toBe(true);
    expect(schema.safeParse(undefined).success).toBe(true);
  });

  it('construye el objeto completo a partir de las definiciones', () => {
    const schema = buildSchema([
      makeField({ key: 'nombre', required: true }),
      makeField({ key: 'dpi', field_type: 'dpi' }),
    ]);
    expect(schema.safeParse({ nombre: 'Ana', dpi: '1234567890123' }).success).toBe(true);
    expect(schema.safeParse({ nombre: '', dpi: '' }).success).toBe(false);
  });
});

describe('valores iniciales', () => {
  it('deriva el valor por defecto según el tipo', () => {
    expect(defaultValueForField(makeField({ field_type: 'boolean' }))).toBe(false);
    expect(defaultValueForField(makeField({ field_type: 'list' }))).toEqual([]);
    expect(defaultValueForField(makeField({ field_type: 'text' }))).toBe('');
    expect(defaultValueForField(makeField({ field_type: 'boolean', default_value: 'true' }))).toBe(true);
    expect(defaultValueForField(makeField({ field_type: 'text', default_value: 'X' }))).toBe('X');
  });

  it('respeta los valores provistos y conserva los tipos', () => {
    const fields = [
      makeField({ key: 'nombre', default_value: 'Base' }),
      makeField({ key: 'dpi' }),
      makeField({ key: 'compradores', field_type: 'list' }),
    ];
    expect(buildDefaultValues(fields, { dpi: '1234567890123' })).toEqual({
      nombre: 'Base',
      dpi: '1234567890123',
      compradores: [],
    });
    expect(buildDefaultValues(fields).dpi).toBe('');
  });
});
