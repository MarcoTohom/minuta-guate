import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ListInput } from '@/features/forms/fields/ListInput';
import type { TemplateField } from '@/types';
import { makeField } from './fixtures';

const listField = makeField({ key: 'compradores', label: 'Compradores', field_type: 'list' });

function Harness({ field = listField, initial = [] }: { field?: TemplateField; initial?: unknown }) {
  const [value, setValue] = useState<unknown>(initial);
  return <ListInput field={field} value={value} onChange={setValue} id={`field-${field.key}`} />;
}

describe('ListInput', () => {
  it('permite agregar y eliminar elementos', () => {
    render(<Harness />);
    expect(screen.getByText(/Sin elementos/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Agregar/ }));
    expect(screen.getByText('Elemento 1')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Aporte/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar elemento 1' }));
    expect(screen.queryByText('Elemento 1')).not.toBeInTheDocument();
  });

  it('valida los subcampos obligatorios de cada elemento', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: /Agregar/ }));
    expect(screen.getByRole('alert')).toHaveTextContent('Campos obligatorios: Nombre.');
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'Ana' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('permite reordenar elementos', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: /Agregar/ }));
    fireEvent.click(screen.getByRole('button', { name: /Agregar/ }));

    const names = () => screen.getAllByLabelText(/Nombre/).map((input) => (input as HTMLInputElement).value);
    fireEvent.change(screen.getAllByLabelText(/Nombre/)[0]!, { target: { value: 'Ana' } });
    fireEvent.change(screen.getAllByLabelText(/Nombre/)[1]!, { target: { value: 'Luis' } });
    expect(names()).toEqual(['Ana', 'Luis']);

    fireEvent.click(screen.getByRole('button', { name: 'Subir elemento 2' }));
    expect(names()).toEqual(['Luis', 'Ana']);

    fireEvent.click(screen.getByRole('button', { name: 'Bajar elemento 1' }));
    expect(names()).toEqual(['Ana', 'Luis']);
  });

  it('respeta los subcampos declarados en options_json', () => {
    const field = makeField({
      key: 'socios',
      field_type: 'list',
      options_json: [
        { key: 'nombre', label: 'Nombre del socio', field_type: 'text', required: true },
        { key: 'es_socio', label: 'Es socio', field_type: 'boolean' },
      ],
    });
    render(<Harness field={field} />);
    fireEvent.click(screen.getByRole('button', { name: /Agregar/ }));
    expect(screen.getByLabelText(/Nombre del socio/)).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('deshabilita la edición y reordenamiento cuando está en solo lectura', () => {
    render(
      <Harness
        field={makeField({ key: 'compradores', field_type: 'list', readonly: true })}
        initial={[{ nombre: 'Ana', aporte: '' }]}
      />,
    );
    expect(screen.getByRole('button', { name: /Agregar/ })).toBeDisabled();
    expect(screen.getByLabelText(/Nombre/)).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Eliminar elemento 1' })).toBeDisabled();
  });
});
