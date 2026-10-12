import { Input } from '@/components/ui/input';
import { normalizeNit } from '@/lib/validators';
import { errorInputClass, asString } from './shared';
import type { FieldControlProps } from './types';

/**
 * NIT: se maneja como texto. Admite "CF" (consumidor final) y el dígito
 * verificador "K". Nunca se convierte a número.
 */
export function NitInput({ field, value, onChange, onBlur, error, disabled, id }: FieldControlProps) {
  return (
    <Input
      id={id}
      type="text"
      autoComplete="off"
      value={asString(value)}
      placeholder={field.help_text ?? 'ej. 12345678-K o CF'}
      disabled={disabled || field.readonly}
      aria-invalid={Boolean(error)}
      className={errorInputClass(Boolean(error))}
      onChange={(event) => onChange(event.target.value.toUpperCase())}
      onBlur={() => {
        onChange(normalizeNit(asString(value)));
        onBlur?.();
      }}
    />
  );
}
