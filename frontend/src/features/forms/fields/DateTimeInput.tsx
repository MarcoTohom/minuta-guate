import { Input } from '@/components/ui/input';
import { errorInputClass, asString } from './shared';
import type { FieldControlProps } from './types';

/** Fecha y hora (formato local del navegador). */
export function DateTimeInput({ value, onChange, onBlur, error, disabled, id, field }: FieldControlProps) {
  return (
    <Input
      id={id}
      type="datetime-local"
      value={asString(value)}
      disabled={disabled || field.readonly}
      aria-invalid={Boolean(error)}
      className={errorInputClass(Boolean(error))}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
    />
  );
}
