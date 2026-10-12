import { Input } from '@/components/ui/input';
import { normalizeName } from '@/lib/validators';
import { errorInputClass, asString } from './shared';
import type { FieldControlProps } from './types';

/**
 * Nombre de persona. Normaliza espacios y recorta al perder el foco, pero
 * durante la escritura conserva lo que el usuario teclea.
 */
export function NameInput({ field, value, onChange, onBlur, error, disabled, id }: FieldControlProps) {
  return (
    <Input
      id={id}
      type="text"
      autoComplete="name"
      value={asString(value)}
      placeholder={field.help_text ?? undefined}
      disabled={disabled || field.readonly}
      aria-invalid={Boolean(error)}
      className={errorInputClass(Boolean(error))}
      onChange={(event) => onChange(event.target.value)}
      onBlur={() => {
        onChange(normalizeName(asString(value)));
        onBlur?.();
      }}
    />
  );
}
