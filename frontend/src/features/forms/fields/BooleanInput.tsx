import { Checkbox } from '@/components/ui/checkbox';
import { asBoolean } from './shared';
import type { FieldControlProps } from './types';

/** Interruptor booleano (sí/no) con etiqueta clicable. */
export function BooleanInput({ field, value, onChange, onBlur, error, disabled, id }: FieldControlProps) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={asBoolean(value)}
        disabled={disabled || field.readonly}
        aria-invalid={Boolean(error)}
        onCheckedChange={(checked) => onChange(checked)}
        onBlur={onBlur}
      />
      <label htmlFor={id} className="text-sm text-muted-foreground">
        {field.help_text || 'Sí'}
      </label>
    </div>
  );
}
