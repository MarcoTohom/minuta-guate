import { describe, expect, it } from 'vitest';
import {
  clientDisplayName,
  emptyListItem,
  normalizeOptions,
  resolveListItemFields,
} from '@/features/forms/fieldOptions';
import { makeClient, makeField } from './fixtures';

describe('normalizeOptions', () => {
  it('normaliza arreglos de cadenas y de objetos', () => {
    expect(normalizeOptions(makeField({ options_json: ['A', 'B'] }))).toEqual([
      { label: 'A', value: 'A' },
      { label: 'B', value: 'B' },
    ]);
    expect(
      normalizeOptions(
        makeField({ options_json: [{ value: 'X', label: 'Equis' }, { value: 'Y', active: false }] }),
      ),
    ).toEqual([{ label: 'Equis', value: 'X' }]);
  });

  it('acepta el envoltorio { options: [...] }', () => {
    expect(
      normalizeOptions(
        makeField({ options_json: { options: [{ value: 'Z', label: 'Zeta' }] } as unknown as unknown[] }),
      ),
    ).toEqual([{ label: 'Zeta', value: 'Z' }]);
  });

  it('recurre al catálogo por defecto según la clave', () => {
    const options = normalizeOptions(makeField({ key: 'estado_civil' }));
    expect(options.map((option) => option.value)).toContain('Casado(a)');
    expect(normalizeOptions(makeField({ key: 'departamento' })).length).toBeGreaterThan(0);
  });

  it('devuelve vacío para una clave sin catálogo ni opciones', () => {
    expect(normalizeOptions(makeField({ key: 'sin_catalogo' }))).toEqual([]);
  });
});

describe('resolveListItemFields', () => {
  it('usa la estructura genérica por defecto', () => {
    const fields = resolveListItemFields(makeField({ key: 'lista', field_type: 'list' }));
    expect(fields.map((item) => item.key)).toEqual(['nombre', 'aporte']);
  });

  it('interpreta definiciones de subcampos en options_json', () => {
    const fields = resolveListItemFields(
      makeField({
        key: 'lista',
        field_type: 'list',
        options_json: [
          { key: 'nombre', label: 'Nombre', field_type: 'name', required: true },
          { key: 'es_socio', label: '¿Socio?', field_type: 'boolean' },
        ],
      }),
    );
    expect(fields).toHaveLength(2);
    expect(fields[0]).toEqual({ key: 'nombre', label: 'Nombre', field_type: 'name', required: true });
    expect(fields[1]?.field_type).toBe('boolean');
  });

  it('cae en la estructura genérica si options_json no parece de campos', () => {
    const fields = resolveListItemFields(
      makeField({ key: 'lista', field_type: 'list', options_json: ['uno', 'dos'] }),
    );
    expect(fields.map((item) => item.key)).toEqual(['nombre', 'aporte']);
  });

  it('crea elementos vacíos respetando los tipos', () => {
    expect(emptyListItem(resolveListItemFields(makeField({ field_type: 'list' })))).toEqual({
      nombre: '',
      aporte: '',
    });
    expect(
      emptyListItem([{ key: 'activo', label: 'Activo', field_type: 'boolean', required: false }]),
    ).toEqual({ activo: false });
  });
});

describe('clientDisplayName', () => {
  it('devuelve el nombre visible del cliente', () => {
    expect(clientDisplayName(makeClient())).toBe('Juan Pérez');
  });
});
