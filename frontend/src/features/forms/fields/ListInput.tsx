import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { normalizeDecimal, normalizeInteger } from '@/lib/validators';
import { emptyListItem, resolveListItemFields, type ListItemField } from '../fieldOptions';
import { asList, asString } from './shared';
import type { FieldControlProps } from './types';

function SubField({
  itemField,
  value,
  itemId,
  disabled,
  invalid,
  onChange,
}: {
  itemField: ListItemField;
  value: unknown;
  itemId: string;
  disabled: boolean;
  invalid: boolean;
  onChange: (value: unknown) => void;
}) {
  const className = invalid ? 'border-destructive focus-visible:ring-destructive' : '';

  if (itemField.field_type === 'boolean') {
    return (
      <Checkbox
        id={itemId}
        checked={value === true || value === 'true'}
        disabled={disabled}
        onCheckedChange={(checked) => onChange(checked)}
      />
    );
  }

  if (itemField.field_type === 'date') {
    return (
      <Input id={itemId} type="date" value={asString(value)} disabled={disabled} className={className} onChange={(event) => onChange(event.target.value)} />
    );
  }

  const inputMode =
    itemField.field_type === 'integer'
      ? 'numeric'
      : itemField.field_type === 'decimal' || itemField.field_type === 'currency'
        ? 'decimal'
        : 'text';

  return (
    <Input
      id={itemId}
      type="text"
      inputMode={inputMode}
      value={asString(value)}
      disabled={disabled}
      className={className}
      onChange={(event) => {
        const raw = event.target.value;
        if (itemField.field_type === 'integer') onChange(normalizeInteger(raw));
        else if (itemField.field_type === 'decimal' || itemField.field_type === 'currency') {
          onChange(normalizeDecimal(raw));
        } else onChange(raw);
      }}
    />
  );
}

/**
 * Campo repetible (listas de compradores, accionistas, bienes…).
 *
 * Permite agregar, editar, eliminar y reordenar elementos, y valida cada
 * elemento de forma independiente.
 */
export function ListInput({ field, value, onChange, error, disabled, id }: FieldControlProps) {
  const items = asList(value);
  const itemFields = resolveListItemFields(field);
  const isDisabled = disabled || field.readonly;

  const update = (next: Record<string, unknown>[]) => onChange(next);

  const addItem = () => update([...items, emptyListItem(itemFields)]);

  const removeItem = (index: number) => update(items.filter((_, i) => i !== index));

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    update(next);
  };

  const setItemField = (index: number, key: string, fieldValue: unknown) => {
    const next = items.map((item, i) => (i === index ? { ...item, [key]: fieldValue } : item));
    update(next);
  };

  return (
    <div className="space-y-3" data-testid={`list-${field.key}`}>
      {items.length === 0 ? (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          Sin elementos. Use «Agregar» para incorporar el primero.
        </p>
      ) : null}

      {items.map((item, index) => {
        const itemErrors = itemFields
          .filter((itemField) => itemField.required && asString(item[itemField.key]).trim() === '')
          .map((itemField) => itemField.label);

        return (
          <div key={index} className="rounded-md border p-3" data-testid={`list-${field.key}-item-${index}`}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Elemento {index + 1}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Subir elemento ${index + 1}`}
                  disabled={isDisabled || index === 0}
                  onClick={() => moveItem(index, -1)}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Bajar elemento ${index + 1}`}
                  disabled={isDisabled || index === items.length - 1}
                  onClick={() => moveItem(index, 1)}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Eliminar elemento ${index + 1}`}
                  disabled={isDisabled}
                  onClick={() => removeItem(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {itemFields.map((itemField) => {
                const controlId = `${id}-${index}-${itemField.key}`;
                const invalid = itemField.required && asString(item[itemField.key]).trim() === '';
                return (
                  <div key={itemField.key} className="space-y-1">
                    <label htmlFor={controlId} className="text-sm font-medium">
                      {itemField.label}
                      {itemField.required ? <span className="ml-0.5 text-destructive">*</span> : null}
                    </label>
                    <SubField
                      itemField={itemField}
                      value={item[itemField.key]}
                      itemId={controlId}
                      disabled={isDisabled}
                      invalid={invalid}
                      onChange={(fieldValue) => setItemField(index, itemField.key, fieldValue)}
                    />
                  </div>
                );
              })}
            </div>

            {itemErrors.length > 0 ? (
              <p role="alert" className="mt-2 text-xs font-medium text-destructive">
                Campos obligatorios: {itemErrors.join(', ')}.
              </p>
            ) : null}
          </div>
        );
      })}

      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={isDisabled} onClick={addItem}>
          <Plus className="h-4 w-4" />
          Agregar
        </Button>
        {error ? (
          <span role="alert" className="text-xs font-medium text-destructive">
            {error}
          </span>
        ) : null}
      </div>
    </div>
  );
}
