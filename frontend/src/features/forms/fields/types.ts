import type { Client, TemplateField } from '@/types';

/**
 * Propiedades comunes de todos los controles especializados.
 *
 * `onChange` recibe el valor "crudo" que se guardará en el formulario; los
 * controles se encargan de normalizarlo (por ejemplo, el DPI emite solo
 * dígitos como texto).
 */
export interface FieldControlProps {
  /** Definición del campo de plantilla. */
  field: TemplateField;
  /** Valor actual del campo. */
  value: unknown;
  /** Notifica un cambio de valor. */
  onChange: (value: unknown) => void;
  /** Notifica que el control perdió el foco (para marcar como tocado). */
  onBlur?: () => void;
  /** Mensaje de error de validación, si existe. */
  error?: string | null;
  /** Deshabilita el control. */
  disabled?: boolean;
  /** Identificador DOM estable para localizar el control. */
  id: string;
  /**
   * Se invoca cuando un campo de relación selecciona un cliente; permite al
   * formulario autocompletar campos relacionados.
   */
  onRelationSelect?: (field: TemplateField, client: Client) => void;
  /** Valores actuales del formulario (usado por campos calculados). */
  formValues?: Record<string, unknown>;
}
