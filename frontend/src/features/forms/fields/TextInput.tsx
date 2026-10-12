import { Input } from '@/components/ui/input';
import { errorInputClass, asString } from './shared';
import type { FieldControlProps } from './types';

/** Campo de texto de una sola línea. */
export function TextInput({ field, value, onChange, onBlur, error, disabled, id }: FieldControlProps) {
  return (
    <Input
      id={id}
      type="text"
      value={asString(value)}
      placeholder={field.help_text ?? undefined}
      disabled={disabled || field.readonly}
      maxLength={field.max_length ?? undefined}
      aria-invalid={Boolean(error)}
      className={errorInputClass(Boolean(error))}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
    />
  );
}
