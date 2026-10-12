import { Input } from '@/components/ui/input';
import { errorInputClass, asString } from './shared';
import type { FieldControlProps } from './types';

/** Fecha en formato ISO (YYYY-MM-DD). */
export function DateInput({ value, onChange, onBlur, error, disabled, id, field }: FieldControlProps) {
  return (
    <Input
      id={id}
      type="date"
      value={asString(value)}
      disabled={disabled || field.readonly}
      aria-invalid={Boolean(error)}
      className={errorInputClass(Boolean(error))}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
    />
  );
}
