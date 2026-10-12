import type { TemplateField } from '@/types';
import type { FieldControlProps } from './types';
import { TextInput } from './TextInput';
import { TextArea } from './TextArea';
import { NameInput } from './NameInput';
import { DpiInput } from './DpiInput';
import { NitInput } from './NitInput';
import { PhoneInput } from './PhoneInput';
import { EmailInput } from './EmailInput';
import { IntegerInput } from './IntegerInput';
import { DecimalInput } from './DecimalInput';
import { CurrencyInput } from './CurrencyInput';
import { PercentageInput } from './PercentageInput';
import { DateInput } from './DateInput';
import { DateTimeInput } from './DateTimeInput';
import { BooleanInput } from './BooleanInput';
import { SelectInput } from './SelectInput';
import { RelationInput } from './RelationInput';
import { FileInput } from './FileInput';
import { ListInput } from './ListInput';
import { ComputedInput } from './ComputedInput';
import { RichTextInput } from './RichTextInput';

export type { FieldControlProps } from './types';
export { TextInput, TextArea, NameInput, DpiInput, NitInput, PhoneInput, EmailInput };
export { IntegerInput, DecimalInput, CurrencyInput, PercentageInput, DateInput, DateTimeInput };
export { BooleanInput, SelectInput, RelationInput, FileInput, ListInput, ComputedInput, RichTextInput };

/** Devuelve el componente de control adecuado para un tipo de campo. */
export function FieldControl(props: FieldControlProps) {
  switch (props.field.field_type) {
    case 'textarea':
      return <TextArea {...props} />;
    case 'name':
      return <NameInput {...props} />;
    case 'dpi':
      return <DpiInput {...props} />;
    case 'nit':
      return <NitInput {...props} />;
    case 'phone':
      return <PhoneInput {...props} />;
    case 'email':
      return <EmailInput {...props} />;
    case 'integer':
      return <IntegerInput {...props} />;
    case 'decimal':
      return <DecimalInput {...props} />;
    case 'currency':
      return <CurrencyInput {...props} />;
    case 'percentage':
      return <PercentageInput {...props} />;
    case 'date':
      return <DateInput {...props} />;
    case 'datetime':
      return <DateTimeInput {...props} />;
    case 'boolean':
      return <BooleanInput {...props} />;
    case 'select':
      return <SelectInput {...props} />;
    case 'relation':
      return <RelationInput {...props} />;
    case 'file':
      return <FileInput {...props} />;
    case 'list':
      return <ListInput {...props} />;
    case 'computed':
      return <ComputedInput {...props} />;
    case 'richtext':
      return <RichTextInput {...props} />;
    case 'text':
    default:
      return <TextInput {...props} />;
  }
}

/** Tipos de campo que el motor reconoce explícitamente. */
export const KNOWN_FIELD_TYPES = [
  'text',
  'textarea',
  'name',
  'dpi',
  'nit',
  'phone',
  'email',
  'integer',
  'decimal',
  'currency',
  'percentage',
  'date',
  'datetime',
  'boolean',
  'select',
  'relation',
  'file',
  'list',
  'computed',
  'richtext',
] as const;

/** Nombre legible del control que se usará para un campo. */
export function controlNameForField(field: TemplateField): string {
  const map: Record<string, string> = {
    text: 'TextInput',
    textarea: 'TextArea',
    name: 'NameInput',
    dpi: 'DpiInput',
    nit: 'NitInput',
    phone: 'PhoneInput',
    email: 'EmailInput',
    integer: 'IntegerInput',
    decimal: 'DecimalInput',
    currency: 'CurrencyInput',
    percentage: 'PercentageInput',
    date: 'DateInput',
    datetime: 'DateTimeInput',
    boolean: 'BooleanInput',
    select: 'SelectInput',
    relation: 'RelationInput',
    file: 'FileInput',
    list: 'ListInput',
    computed: 'ComputedInput',
    richtext: 'RichTextInput',
  };
  return map[field.field_type] ?? 'TextInput';
}
