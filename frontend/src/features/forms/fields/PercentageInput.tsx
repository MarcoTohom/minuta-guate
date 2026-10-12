import { Input } from '@/components/ui/input';
import { normalizePercentage } from '@/lib/validators';
import { errorInputClass, asString } from './shared';
import type { FieldControlProps } from './types';

/** Porcentaje (0–100 enteramente configurable por reglas del campo). */
export function PercentageInput({ field, value, onChange, onBlur, error, disabled, id }: FieldControlProps) {
  return (
    <div className="relative">
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        value={asString(value)}
        placeholder={field.help_text ?? '0'}
        disabled={disabled || field.readonly}
        aria-invalid={Boolean(error)}
        className={`pr-8 ${errorInputClass(Boolean(error))}`}
        onChange={(event) => onChange(normalizePercentage(event.target.value))}
        onBlur={onBlur}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        %
      </span>
    </div>
  );
}
