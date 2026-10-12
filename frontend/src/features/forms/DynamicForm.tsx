import * as React from 'react';
import { Controller, useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '@/components/ui/form-field';
import type { Client, TemplateField } from '@/types';
import { buildDefaultValues, buildSchema } from './buildSchema';
import { evaluateExpression } from './computed';
import { groupFields, sortFields } from './grouping';
import { FieldControl } from './fields';

export interface DynamicFormHandle {
  /** Devuelve todos los valores actuales. */
  getValues: () => Record<string, unknown>;
  /** Establece el valor de un campo por su clave. */
  setValue: (key: string, value: unknown) => void;
  /** Lleva el foco (y hace scroll) al control de un campo. */
  focusField: (key: string) => void;
  /** Ejecuta la validación y resuelve con el resultado. */
  trigger: () => Promise<boolean>;
  /** Reinicia el formulario con nuevos valores (o los predeterminados). */
  reset: (values?: Record<string, unknown>) => void;
  /** Envía el formulario programáticamente. */
  submit: () => void;
}

export interface DynamicFormProps {
  fields: TemplateField[];
  defaultValues?: Record<string, unknown>;
  onSubmit?: (values: Record<string, unknown>) => void | Promise<void>;
  onRelationSelect?: (field: TemplateField, client: Client) => void;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  footer?: React.ReactNode;
}

const WIDE_TYPES = new Set(['list', 'richtext', 'textarea', 'computed']);

/**
 * Motor de formulario dinámico.
 *
 * Recibe las definiciones de campos de una plantilla y renderiza el control
 * especializado correspondiente a cada `field_type`, validando con un esquema
 * Zod construido a partir de dichas definiciones.
 */
export const DynamicForm = React.forwardRef<DynamicFormHandle, DynamicFormProps>(function DynamicForm(
  {
    fields,
    defaultValues,
    onSubmit,
    onRelationSelect,
    disabled = false,
    readOnly = false,
    className,
    footer,
  },
  ref,
) {
  const orderedFields = React.useMemo(() => sortFields(fields), [fields]);
  const groups = React.useMemo(() => groupFields(orderedFields), [orderedFields]);
  const computedFields = React.useMemo(
    () => orderedFields.filter((field) => field.field_type === 'computed' || field.calculated),
    [orderedFields],
  );

  const initialValues = React.useMemo(
    () => buildDefaultValues(orderedFields, defaultValues),
    [orderedFields, defaultValues],
  );

  const {
    control,
    getValues,
    setValue,
    trigger,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<Record<string, unknown>>({
    resolver: zodResolver(buildSchema(orderedFields)) as Resolver<Record<string, unknown>>,
    defaultValues: initialValues,
    mode: 'onBlur',
  });

  const allValues = useWatch({ control }) as Record<string, unknown>;

  // Sincroniza el resultado de los campos calculados con el formulario.
  React.useEffect(() => {
    computedFields.forEach((field) => {
      const result = evaluateExpression(field.calculation_expression, allValues);
      if (result === null) return;
      const current = getValues(field.key);
      if (String(current ?? '') !== String(result)) {
        setValue(field.key, result, { shouldDirty: false });
      }
    });
  }, [allValues, computedFields, getValues, setValue]);

  const handleRelationSelect = React.useCallback(
    (field: TemplateField, client: Client) => {
      const base = field.key.replace(/(_id|\.id)$/i, '') || field.key;
      const suffixValues: Record<string, unknown> = {
        id: client.id,
        nombre: client.display_name,
        nombres: client.display_name,
        nombre_completo: client.display_name,
        dpi: client.person?.dpi ?? '',
        nit: client.person?.nit ?? client.legal_entity?.nit ?? '',
        telefono: client.person?.telefono ?? '',
        correo: client.person?.correo ?? '',
        email: client.person?.correo ?? '',
        direccion: client.person?.direccion ?? '',
      };

      orderedFields.forEach((candidate) => {
        if (candidate.key === field.key) return;
        const normalized = candidate.key.replace(/\./g, '_');
        if (!normalized.startsWith(`${base}_`)) return;
        const suffix = normalized.slice(base.length + 1);
        if (suffix in suffixValues) {
          setValue(candidate.key, suffixValues[suffix], { shouldDirty: true });
        }
      });

      onRelationSelect?.(field, client);
    },
    [orderedFields, setValue, onRelationSelect],
  );

  const focusField = React.useCallback((key: string) => {
    const element = document.getElementById(`field-${key}`);
    if (!element) return;
    element.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    (element as HTMLElement).focus?.();
  }, []);

  const rhfSubmit = handleSubmit((values) => {
    void onSubmit?.(values);
  });

  React.useImperativeHandle(
    ref,
    () => ({
      getValues: () => getValues(),
      setValue: (key, value) => setValue(key, value, { shouldDirty: true }),
      focusField,
      trigger: () => trigger(),
      reset: (values) =>
        reset(values ? buildDefaultValues(orderedFields, values) : buildDefaultValues(orderedFields)),
      submit: () => {
        void rhfSubmit();
      },
    }),
    [getValues, setValue, focusField, trigger, reset, orderedFields, rhfSubmit],
  );

  const errorFor = (key: string): string | null => {
    const entry = (errors as Record<string, { message?: string } | undefined>)[key];
    return entry?.message ?? null;
  };

  return (
    <form className={className} onSubmit={rhfSubmit} noValidate>
      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.key} className="space-y-4">
            <h3 className="border-b pb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {group.label}
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {group.fields.map((field) => (
                <Controller
                  key={field.key}
                  name={field.key}
                  control={control}
                  render={({ field: rhf }) => (
                    <FormField
                      label={field.label}
                      htmlFor={`field-${field.key}`}
                      required={field.required}
                      helpText={field.help_text}
                      error={errorFor(field.key)}
                      className={WIDE_TYPES.has(field.field_type) ? 'md:col-span-2' : undefined}
                    >
                      <FieldControl
                        field={field}
                        id={`field-${field.key}`}
                        value={rhf.value}
                        onChange={rhf.onChange}
                        onBlur={rhf.onBlur}
                        error={errorFor(field.key)}
                        disabled={disabled || readOnly}
                        onRelationSelect={handleRelationSelect}
                        formValues={allValues}
                      />
                    </FormField>
                  )}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
      {footer}
    </form>
  );
});
