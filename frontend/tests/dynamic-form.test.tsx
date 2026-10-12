import { createRef } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DynamicForm, type DynamicFormHandle } from '@/features/forms/DynamicForm';
import type { TemplateField } from '@/types';
import { makeField } from './fixtures';

const fields: TemplateField[] = [
  makeField({ key: 'nombre', label: 'Nombre completo', field_type: 'text', required: true, display_order: 1 }),
  makeField({ key: 'dpi', label: 'DPI', field_type: 'dpi', required: true, display_order: 2 }),
  makeField({ key: 'base', label: 'Base', field_type: 'integer', display_order: 3 }),
  makeField({ key: 'extra', label: 'Extra', field_type: 'integer', display_order: 4 }),
  makeField({
    key: 'total',
    label: 'Total',
    field_type: 'computed',
    calculation_expression: 'base + extra',
    display_order: 5,
  }),
];

function renderForm(onSubmit = vi.fn()) {
  render(
    <DynamicForm
      fields={fields}
      onSubmit={onSubmit}
      footer={
        <button type="submit" data-testid="submit">
          Guardar
        </button>
      }
    />,
  );
  return onSubmit;
}

describe('DynamicForm', () => {
  it('renderiza el control especializado por tipo y agrupa los campos', () => {
    renderForm();
    expect(screen.getByText('Datos generales')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre completo/)).toBeInTheDocument();
    expect(screen.getByLabelText(/DPI/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Base/)).toBeInTheDocument();
    expect((screen.getByLabelText(/Total/) as HTMLInputElement)).toHaveAttribute('readonly');
  });

  it('muestra los mensajes de error al enviar campos obligatorios vacíos', async () => {
    renderForm();
    fireEvent.click(screen.getByTestId('submit'));
    expect((await screen.findAllByText('Este campo es obligatorio.')).length).toBeGreaterThan(0);
  });

  it('valida el DPI con un mensaje específico', async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/Nombre completo/), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText(/DPI/), { target: { value: '123' } });
    fireEvent.click(screen.getByTestId('submit'));
    expect(await screen.findByText('El DPI debe contener 13 dígitos.')).toBeInTheDocument();
  });

  it('sincroniza los campos calculados y envía los valores', async () => {
    const onSubmit = renderForm();
    fireEvent.change(screen.getByLabelText(/Nombre completo/), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText(/DPI/), { target: { value: '1234567890123' } });
    fireEvent.change(screen.getByLabelText(/Base/), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText(/Extra/), { target: { value: '3' } });

    await waitFor(() => {
      expect((screen.getByLabelText(/Total/) as HTMLInputElement).value).toBe('5');
    });

    fireEvent.click(screen.getByTestId('submit'));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: 'Ana', dpi: '1234567890123', base: '2', extra: '3' }),
      );
    });
  });

  it('expone un manejador imperativo para leer y escribir valores', () => {
    const ref = createRef<DynamicFormHandle>();
    render(<DynamicForm ref={ref} fields={fields} />);

    act(() => {
      ref.current?.setValue('nombre', 'Luis');
    });
    expect(ref.current?.getValues().nombre).toBe('Luis');

    act(() => {
      ref.current?.reset({ nombre: 'Carlos' });
    });
    expect(ref.current?.getValues().nombre).toBe('Carlos');
  });
});
