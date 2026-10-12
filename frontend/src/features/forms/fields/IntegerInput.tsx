import { Input } from '@/components/ui/input';
import { normalizeInteger } from '@/lib/validators';
import { errorInputClass, asString } from './shared';
import type { FieldControlProps } from './types';

/** Número entero (se conserva como texto para no perder precisión). */
export function IntegerInput({ field, value, onChange, onBlur, error, disabled, id }: FieldControlProps) {
  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      value={asString(value)}
      placeholder={field.help_text ?? undefined}
      disabled={disabled || field.readonly}
      aria-invalid={Boolean(error)}
      className={errorInputClass(Boolean(error))}
      onChange={(event) => onChange(normalizeInteger(event.target.value))}
      onBlur={onBlur}
    />
  );
}
