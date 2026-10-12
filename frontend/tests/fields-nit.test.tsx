import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NitInput } from '@/features/forms/fields/NitInput';
import { makeField } from './fixtures';

const nitField = makeField({ key: 'nit', field_type: 'nit', required: true });

function Harness() {
  const [value, setValue] = useState<unknown>('');
  return <NitInput field={nitField} value={value} onChange={setValue} id="field-nit" />;
}

describe('NitInput', () => {
  it('convierte a mayúsculas al escribir', () => {
    const onChange = vi.fn();
    render(<NitInput field={nitField} value="" onChange={onChange} id="field-nit" />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'cf' } });
    expect(onChange).toHaveBeenCalledWith('CF');
  });

  it('normaliza el NIT al perder el foco (sin espacios ni guiones)', () => {
    render(<Harness />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '1234-567 K' } });
    expect(input).toHaveValue('1234-567 K');
    fireEvent.blur(input);
    expect(input).toHaveValue('1234567K');
  });

  it('acepta CF como valor válido de texto', () => {
    render(<NitInput field={nitField} value="CF" onChange={vi.fn()} id="field-nit" />);
    expect(screen.getByRole('textbox')).toHaveValue('CF');
  });
});
