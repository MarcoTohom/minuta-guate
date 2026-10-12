import { Paperclip } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { errorInputClass, asString } from './shared';
import type { FieldControlProps } from './types';

/**
 * Referencia a un archivo. No sube datos por sí mismo: guarda el nombre del
 * archivo seleccionado para que el expediente/documento lo referencie.
 */
export function FileInput({ field, value, onChange, onBlur, error, disabled, id }: FieldControlProps) {
  const current = asString(value);
  return (
    <div className="space-y-1.5">
      <Input
        id={id}
        type="file"
        disabled={disabled || field.readonly}
        aria-invalid={Boolean(error)}
        className={errorInputClass(Boolean(error))}
        onChange={(event) => {
          const file = event.target.files?.[0];
          onChange(file ? file.name : '');
        }}
        onBlur={onBlur}
      />
      {current ? (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Paperclip className="h-3 w-3" />
          {current}
        </p>
      ) : null}
    </div>
  );
}
