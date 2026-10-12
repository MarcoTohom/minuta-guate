import { Input } from '@/components/ui/input';
import { errorInputClass, asString } from './shared';
import type { FieldControlProps } from './types';

/** Teléfono: dígitos con un "+" inicial opcional. */
export function PhoneInput({ field, value, onChange, onBlur, error, disabled, id }: FieldControlProps) {
  return (
    <Input
      id={id}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      value={asString(value)}
      placeholder={field.help_text ?? '+502 5555 5555'}
      disabled={disabled || field.readonly}
      aria-invalid={Boolean(error)}
      className={errorInputClass(Boolean(error))}
      onChange={(event) => {
        const raw = event.target.value;
        const plus = raw.trimStart().startsWith('+') ? '+' : '';
        onChange(plus + raw.replace(/\D/g, '').slice(0, 15));
      }}
      onBlur={onBlur}
    />
  );
}
