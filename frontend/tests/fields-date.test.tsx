import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DateInput } from '@/features/forms/fields/DateInput';
import { DateTimeInput } from '@/features/forms/fields/DateTimeInput';
import { makeField } from './fixtures';

describe('DateInput', () => {
  it('renderiza un control de fecha ISO y notifica el cambio', () => {
    const onChange = vi.fn();
    render(<DateInput field={makeField({ key: 'fecha', field_type: 'date' })} value="2024-03-05" onChange={onChange} id="field-fecha" />);
    const input = screen.getByDisplayValue('2024-03-05');
    expect(input).toHaveAttribute('type', 'date');
    fireEvent.change(input, { target: { value: '2024-04-01' } });
    expect(onChange).toHaveBeenCalledWith('2024-04-01');
  });

  it('respeta el estado deshabilitado', () => {
    render(<DateInput field={makeField({ key: 'fecha', field_type: 'date', readonly: true })} value="" onChange={vi.fn()} id="field-fecha" />);
    expect(document.querySelector('input[type=date]')).toBeDisabled();
  });
});

describe('DateTimeInput', () => {
  it('renderiza un control de fecha y hora', () => {
    const onChange = vi.fn();
    render(<DateTimeInput field={makeField({ key: 'inicio', field_type: 'datetime' })} value="2024-03-05T10:30" onChange={onChange} id="field-inicio" />);
    const input = screen.getByDisplayValue('2024-03-05T10:30');
    expect(input).toHaveAttribute('type', 'datetime-local');
    fireEvent.change(input, { target: { value: '2024-03-06T09:00' } });
    expect(onChange).toHaveBeenCalledWith('2024-03-06T09:00');
  });
});
