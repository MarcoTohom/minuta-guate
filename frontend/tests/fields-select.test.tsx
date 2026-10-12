import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SelectInput } from '@/features/forms/fields/SelectInput';
import { makeField } from './fixtures';

describe('SelectInput', () => {
  it('renderiza las opciones declaradas en la plantilla', () => {
    const field = makeField({
      key: 'tipo',
      field_type: 'select',
      options_json: [
        { value: 'A', label: 'Opción A' },
        { value: 'B', label: 'Opción B' },
      ],
    });
    render(<SelectInput field={field} value="A" onChange={vi.fn()} id="field-tipo" />);
    expect(screen.getByRole('option', { name: 'Opción A' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Opción B' })).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('A');
  });

  it('notifica el cambio de valor', () => {
    const onChange = vi.fn();
    const field = makeField({
      key: 'tipo',
      field_type: 'select',
      options_json: [{ value: 'A', label: 'Opción A' }],
    });
    render(<SelectInput field={field} value="" onChange={onChange} id="field-tipo" />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'A' } });
    expect(onChange).toHaveBeenCalledWith('A');
  });

  it('usa el catálogo por defecto cuando no hay opciones', () => {
    render(<SelectInput field={makeField({ key: 'estado_civil', field_type: 'select' })} value="" onChange={vi.fn()} id="field-ec" />);
    expect(screen.getByRole('option', { name: 'Casado(a)' })).toBeInTheDocument();
  });

  it('se deshabilita si el campo es de solo lectura', () => {
    render(<SelectInput field={makeField({ key: 'tipo', field_type: 'select', readonly: true })} value="" onChange={vi.fn()} id="field-tipo" />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});
