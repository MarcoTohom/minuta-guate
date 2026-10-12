import { Input } from '@/components/ui/input';
import { normalizeDecimal } from '@/lib/validators';
import { errorInputClass, asString } from './shared';
import type { FieldControlProps } from './types';

/** Número decimal escribible (se conserva como texto). */
export function DecimalInput({ field, value, onChange, onBlur, error, disabled, id }: FieldControlProps) {
  return (
    <Input
      id={id}
      type="text"
      inputMode="decimal"
      value={asString(value)}
      placeholder={field.help_text ?? undefined}
      disabled={disabled || field.readonly}
      aria-invalid={Boolean(error)}
      className={errorInputClass(Boolean(error))}
      onChange={(event) => onChange(normalizeDecimal(event.target.value))}
      onBlur={onBlur}
    />
  );
}
