import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { normalizeDecimal } from '@/lib/validators';
import { errorInputClass, asString } from './shared';
import type { FieldControlProps } from './types';

function formatCurrencyText(value: string): string {
  const parsed = Number(value.replace(/,/g, ''));
  if (value.trim() === '' || !Number.isFinite(parsed)) return '';
  return parsed.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Monto en quetzales. Se muestra con el prefijo "Q" y dos decimales al
 * perder el foco; internamente se guarda un texto decimal sin símbolos.
 */
export function CurrencyInput({ field, value, onChange, onBlur, error, disabled, id }: FieldControlProps) {
  const raw = asString(value);
  const [editing, setEditing] = useState<string | null>(null);
  const shown = editing ?? formatCurrencyText(raw);

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        Q
      </span>
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        value={shown}
        placeholder={field.help_text ?? '0.00'}
        disabled={disabled || field.readonly}
        aria-invalid={Boolean(error)}
        className={`pl-7 ${errorInputClass(Boolean(error))}`}
        onFocus={() => setEditing(raw)}
        onChange={(event) => {
          const next = normalizeDecimal(event.target.value);
          setEditing(next);
          onChange(next);
        }}
        onBlur={() => {
          const normalized = editing !== null ? normalizeDecimal(editing) : raw;
          const parsed = Number(normalized);
          setEditing(null);
          onChange(normalized === '' ? '' : Number.isFinite(parsed) ? parsed.toFixed(2) : normalized);
          onBlur?.();
        }}
      />
    </div>
  );
}
