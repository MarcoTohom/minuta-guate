import { Textarea } from '@/components/ui/textarea';
import { errorInputClass, asString } from './shared';
import type { FieldControlProps } from './types';

/** Campo de texto multilínea. */
export function TextArea({ field, value, onChange, onBlur, error, disabled, id }: FieldControlProps) {
  return (
    <Textarea
      id={id}
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
