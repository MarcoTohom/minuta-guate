import { Input } from '@/components/ui/input';
import { evaluateExpression } from '../computed';
import type { FieldControlProps } from './types';

function formatComputed(value: number | null): string {
  if (value === null) return '';
  return value.toLocaleString('es-GT', { maximumFractionDigits: 2 });
}

/**
 * Campo calculado de solo lectura. Muestra el resultado de la expresión
 * declarada en la plantilla. La sincronización del valor en el formulario la
 * coordina `DynamicForm`.
 */
export function ComputedInput({ field, value, formValues, id }: FieldControlProps) {
  const computed = evaluateExpression(field.calculation_expression, formValues ?? {});
  const shown = computed !== null ? computed : value;

  return (
    <Input
      id={id}
      type="text"
      readOnly
      tabIndex={-1}
      value={typeof shown === 'number' ? formatComputed(shown) : String(shown ?? '')}
      className="bg-muted"
    />
  );
}
