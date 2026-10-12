import { describe, expect, it } from 'vitest';
import { groupFields, sortFields } from '@/features/forms/grouping';
import { makeField } from './fixtures';

describe('groupFields', () => {
  it('agrupa por prefijo cuando al menos dos campos lo comparten', () => {
    const fields = [
      makeField({ key: 'comprador_nombre', label: 'Nombre' }),
      makeField({ key: 'comprador_dpi', label: 'DPI', field_type: 'dpi' }),
      makeField({ key: 'vendedor_nombre', label: 'Vendedor' }),
    ];
    const groups = groupFields(fields);
    const comprador = groups.find((group) => group.key === 'comprador');
    expect(comprador?.label).toBe('Comprador');
    expect(comprador?.fields).toHaveLength(2);

    const general = groups.find((group) => group.label === 'Datos generales');
    expect(general?.fields.map((field) => field.key)).toEqual(['vendedor_nombre']);
  });

  it('prioriza un group_key explícito', () => {
    const fields = [
      makeField({ key: 'a', group_key: 'datos_generales' }),
      makeField({ key: 'b', group_key: 'datos_generales' }),
    ];
    const groups = groupFields(fields);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.label).toBe('Datos generales');
  });

  it('usa un solo grupo general cuando no hay prefijos repetidos', () => {
    const groups = groupFields([makeField({ key: 'nombre' }), makeField({ key: 'edad', field_type: 'integer' })]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.key).toBe('__general__');
  });
});

describe('sortFields', () => {
  it('ordena por display_order y luego por etiqueta', () => {
    const fields = [
      makeField({ key: 'c', label: 'Zeta', display_order: 2 }),
      makeField({ key: 'a', label: 'Beta', display_order: 1 }),
      makeField({ key: 'b', label: 'Alfa', display_order: 1 }),
    ];
    expect(sortFields(fields).map((field) => field.key)).toEqual(['b', 'a', 'c']);
  });

  it('no muta el arreglo original', () => {
    const fields = [makeField({ key: 'a', display_order: 2 }), makeField({ key: 'b', display_order: 1 })];
    sortFields(fields);
    expect(fields.map((field) => field.key)).toEqual(['a', 'b']);
  });
});
