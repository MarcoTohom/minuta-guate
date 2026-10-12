import { Select } from '@/components/ui/select';
import { normalizeOptions } from '../fieldOptions';
import { errorInputClass, asString } from './shared';
import type { FieldControlProps } from './types';

/** Lista desplegable con opciones provenientes de la plantilla (o catálogo). */
export function SelectInput({ field, value, onChange, onBlur, error, disabled, id }: FieldControlProps) {
  const options = normalizeOptions(field);
  const current = asString(value);

  return (
    <Select
      id={id}
      value={current}
      disabled={disabled || field.readonly}
      aria-invalid={Boolean(error)}
      className={errorInputClass(Boolean(error))}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
    >
      <option value="">Seleccione…</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}
