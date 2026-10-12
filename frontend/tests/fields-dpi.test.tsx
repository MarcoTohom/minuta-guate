import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DpiInput } from '@/features/forms/fields/DpiInput';
import { makeField } from './fixtures';

const dpiField = makeField({ key: 'dpi', field_type: 'dpi', required: true });

function Harness({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState<unknown>(initial);
  return <DpiInput field={dpiField} value={value} onChange={setValue} id="field-dpi" />;
}

describe('DpiInput', () => {
  it('muestra el DPI con máscara fuera de foco', () => {
    render(<DpiInput field={dpiField} value="1234567890123" onChange={vi.fn()} id="field-dpi" />);
    expect(screen.getByRole('textbox')).toHaveValue('1234 56789 0123');
  });

  it('emite solo dígitos al cambiar y nunca un número', () => {
    const onChange = vi.fn();
    render(<DpiInput field={dpiField} value="" onChange={onChange} id="field-dpi" />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '0000 1111 2222 3' } });
    expect(onChange).toHaveBeenCalledWith('0000111122223');
    expect(typeof onChange.mock.calls[0]?.[0]).toBe('string');
  });

  it('limita el valor a 13 dígitos y vuelve a la máscara al perder el foco', () => {
    render(<Harness />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '00001111222239999' } });
    expect(input).toHaveValue('0000111122223');
    fireEvent.blur(input);
    expect(input).toHaveValue('0000 11112 2223');
  });

  it('marca el control como inválido ante un error', () => {
    render(<DpiInput field={dpiField} value="123" onChange={vi.fn()} error="El DPI debe contener 13 dígitos." id="field-dpi" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });
});
