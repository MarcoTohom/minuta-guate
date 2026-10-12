import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CurrencyInput } from '@/features/forms/fields/CurrencyInput';
import { makeField } from './fixtures';

const currencyField = makeField({ key: 'monto', field_type: 'currency', required: true });

function Harness({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState<unknown>(initial);
  return <CurrencyInput field={currencyField} value={value} onChange={setValue} id="field-monto" />;
}

describe('CurrencyInput', () => {
  it('muestra el símbolo Q y dos decimales al perder el foco', () => {
    render(<CurrencyInput field={currencyField} value="1234.5" onChange={vi.fn()} id="field-monto" />);
    expect(screen.getByText('Q')).toBeInTheDocument();
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toMatch(/1[.,]234[.,]50/);
  });

  it('normaliza las comas y completa a dos decimales', () => {
    render(<Harness />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '12,5' } });
    expect(input.value).toBe('12.5');
    fireEvent.blur(input);
    expect(input.value).toMatch(/12[.,]50/);
  });

  it('guarda el monto como texto sin símbolos', () => {
    const onChange = vi.fn();
    render(<CurrencyInput field={currencyField} value="" onChange={onChange} id="field-monto" />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Q 100.00abc' } });
    expect(onChange).toHaveBeenCalledWith('100.00');
  });
});
