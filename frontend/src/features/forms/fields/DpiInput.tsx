import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { DPI_LENGTH, DPI_MASK, formatDpi, normalizeDpi } from '@/lib/validators';
import { errorInputClass, asString } from './shared';
import type { FieldControlProps } from './types';

/**
 * DPI: SIEMPRE se maneja como texto de 13 dígitos.
 *
 * El valor emitido (`onChange`) son solo los dígitos sin espacios; en pantalla,
 * fuera de foco, se muestra con la máscara configurada.
 */
export function DpiInput({ field, value, onChange, onBlur, error, disabled, id }: FieldControlProps) {
  const digits = normalizeDpi(asString(value)).slice(0, DPI_LENGTH);
  const [editing, setEditing] = useState<string | null>(null);
  const mask = field.mask && field.mask.trim() ? field.mask : DPI_MASK;
  const shown = editing ?? formatDpi(digits, mask);

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={shown}
      placeholder={mask}
      disabled={disabled || field.readonly}
      aria-invalid={Boolean(error)}
      className={errorInputClass(Boolean(error))}
      onFocus={() => setEditing(digits)}
      onChange={(event) => {
        const next = normalizeDpi(event.target.value).slice(0, DPI_LENGTH);
        setEditing(next);
        onChange(next);
      }}
      onBlur={() => {
        setEditing(null);
        onBlur?.();
      }}
    />
  );
}
