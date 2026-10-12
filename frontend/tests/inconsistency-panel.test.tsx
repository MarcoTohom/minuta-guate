import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { InconsistencyPanel } from '@/features/validation/InconsistencyPanel';
import type { ValidationSummary } from '@/types';
import { makeValidationResult } from './fixtures';

const summary: ValidationSummary = {
  total: 2,
  critical: 0,
  error: 1,
  warning: 1,
  info: 0,
  can_generate: false,
  results: [
    makeValidationResult({
      id: 'r1',
      rule_id: 'RULE_DPI',
      severity: 'ERROR',
      field_key: 'dpi',
      message: 'El DPI no coincide con el cliente.',
      current_value: '123',
      expected_value: '1234567890123',
    }),
    makeValidationResult({
      id: 'r2',
      rule_id: 'RULE_DIR',
      severity: 'WARNING',
      field_key: 'direccion',
      message: 'La dirección está vacía.',
      current_value: '',
      expected_value: null,
      reviewed: true,
    }),
  ],
};

function renderPanel(overrides: Partial<ComponentProps<typeof InconsistencyPanel>> = {}) {
  const props = {
    summary,
    onGoToField: vi.fn(),
    onCorrect: vi.fn(),
    onMarkReviewed: vi.fn(),
    ...overrides,
  };
  render(<InconsistencyPanel {...props} />);
  return props;
}

describe('InconsistencyPanel', () => {
  it('invita a ejecutar la validación cuando no hay resultados', () => {
    renderPanel({ summary: null });
    expect(screen.getByText(/Ejecute la validación/)).toBeInTheDocument();
  });

  it('muestra el resumen, severidades y valores encontrado/esperado', () => {
    renderPanel();
    expect(screen.getByText('El DPI no coincide con el cliente.')).toBeInTheDocument();
    expect(screen.getByText('1234567890123')).toBeInTheDocument();
    expect(screen.getByText('2 de 2')).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(within(items[0]!).getByText('ERROR')).toBeInTheDocument();
    expect(within(items[1]!).getByText('ADVERTENCIA')).toBeInTheDocument();
    expect(screen.getByText('Revisada')).toBeInTheDocument();
  });

  it('permite ir al campo y corregir un resultado con valor esperado', () => {
    const props = renderPanel();
    const items = screen.getAllByRole('listitem');
    const firstItem = items[0]!;

    fireEvent.click(within(firstItem).getByRole('button', { name: /Ir al campo/ }));
    expect(props.onGoToField).toHaveBeenCalledWith('dpi');

    fireEvent.click(within(firstItem).getByRole('button', { name: /Corregir/ }));
    expect(props.onCorrect).toHaveBeenCalledWith(expect.objectContaining({ id: 'r1' }));

    fireEvent.click(within(firstItem).getByRole('button', { name: /Marcar como revisada/ }));
    expect(props.onMarkReviewed).toHaveBeenCalledWith(expect.objectContaining({ id: 'r1' }), true);
  });

  it('no ofrece corregir cuando no hay valor esperado', () => {
    renderPanel();
    const secondItem = screen.getAllByRole('listitem')[1]!;
    expect(within(secondItem).queryByRole('button', { name: /Corregir/ })).not.toBeInTheDocument();
  });

  it('permite quitar la revisión de un resultado ya revisado', () => {
    const props = renderPanel();
    const secondItem = screen.getAllByRole('listitem')[1]!;
    fireEvent.click(within(secondItem).getByRole('button', { name: /Quitar revisión/ }));
    expect(props.onMarkReviewed).toHaveBeenCalledWith(expect.objectContaining({ id: 'r2' }), false);
  });

  it('filtra por severidad y por campo', () => {
    renderPanel();
    fireEvent.change(screen.getByLabelText('Filtrar por severidad'), { target: { value: 'WARNING' } });
    expect(screen.getByText('1 de 2')).toBeInTheDocument();
    expect(screen.getByText('La dirección está vacía.')).toBeInTheDocument();
    expect(screen.queryByText('El DPI no coincide con el cliente.')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Filtrar por severidad'), { target: { value: 'ALL' } });
    fireEvent.change(screen.getByLabelText('Filtrar por campo'), { target: { value: 'dpi' } });
    expect(screen.getByText('El DPI no coincide con el cliente.')).toBeInTheDocument();
    expect(screen.queryByText('La dirección está vacía.')).not.toBeInTheDocument();
  });

  it('avisa cuando los filtros no arrojan resultados', () => {
    renderPanel();
    fireEvent.change(screen.getByLabelText('Filtrar por severidad'), { target: { value: 'CRITICAL' } });
    expect(screen.getByText(/No hay inconsistencias con los filtros/)).toBeInTheDocument();
    expect(screen.getByText('0 de 2')).toBeInTheDocument();
  });
});
