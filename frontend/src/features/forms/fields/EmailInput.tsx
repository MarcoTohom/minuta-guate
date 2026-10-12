import { Input } from '@/components/ui/input';
import { errorInputClass, asString } from './shared';
import type { FieldControlProps } from './types';

/** Correo electrónico (validación laxa de formato). */
export function EmailInput({ field, value, onChange, onBlur, error, disabled, id }: FieldControlProps) {
  return (
    <Input
      id={id}
      type="email"
      autoComplete="email"
      value={asString(value)}
      placeholder={field.help_text ?? 'correo@dominio.com'}
      disabled={disabled || field.readonly}
      aria-invalid={Boolean(error)}
      className={errorInputClass(Boolean(error))}
      onChange={(event) => onChange(event.target.value.trim())}
      onBlur={onBlur}
    />
  );
}
