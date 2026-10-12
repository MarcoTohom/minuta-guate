/** Tipos de plantillas, versiones y campos dinámicos. */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'name'
  | 'dpi'
  | 'nit'
  | 'phone'
  | 'email'
  | 'integer'
  | 'decimal'
  | 'currency'
  | 'percentage'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'select'
  | 'relation'
  | 'file'
  | 'list'
  | 'computed'
  | 'richtext';

export interface SelectOption {
  label: string;
  value: string;
  active?: boolean;
  order?: number;
}

/** Definición de un campo tipado de una plantilla. */
export interface TemplateField {
  id: string;
  template_version_id: string;
  key: string;
  label: string;
  field_type: FieldType | string;
  required: boolean;
  nullable: boolean;
  default_value?: string | null;
  min_length?: number | null;
  max_length?: number | null;
  min_value?: string | null;
  max_value?: string | null;
  regex?: string | null;
  mask?: string | null;
  format?: string | null;
  options_json?: unknown[] | null;
  source?: string | null;
  source_reference?: string | null;
  readonly: boolean;
  calculated: boolean;
  calculation_expression?: string | null;
  docx_variable?: string | null;
  display_order: number;
  help_text?: string | null;
  group_key?: string | null;
  parent_key?: string | null;
  active: boolean;
}

export interface TemplateFieldInput {
  key: string;
  label: string;
  field_type: string;
  required?: boolean;
  nullable?: boolean;
  default_value?: string | null;
  min_length?: number | null;
  max_length?: number | null;
  min_value?: string | null;
  max_value?: string | null;
  regex?: string | null;
  mask?: string | null;
  format?: string | null;
  options_json?: unknown[] | null;
  source?: string | null;
  source_reference?: string | null;
  readonly?: boolean;
  calculated?: boolean;
  calculation_expression?: string | null;
  docx_variable?: string | null;
  display_order?: number;
  help_text?: string | null;
  group_key?: string | null;
  parent_key?: string | null;
}

export interface TemplateVersion {
  id: string;
  template_id: string;
  version_number: number;
  is_active: boolean;
  file_original_name?: string | null;
  variables_detected?: unknown[] | null;
  notes?: string | null;
  fields: TemplateField[];
}

export interface Template {
  id: string;
  name: string;
  description?: string | null;
  deed_type_id?: string | null;
  active: boolean;
  versions: TemplateVersion[];
}

export interface TemplateCreate {
  name: string;
  description?: string | null;
  deed_type_id?: string | null;
}

export interface DetectedVariable {
  variable: string;
  suggested_key: string;
  suggested_label: string;
  suggested_field_type: string;
  is_container: boolean;
}

export interface TemplateAnalysis {
  version_id: string;
  variables: DetectedVariable[];
  markers: DetectedVariable[];
}

export interface FieldTypesCatalogEntry {
  key: string;
  label: string;
  python_type: string;
  widget: string;
  supports_options: boolean;
  supports_calc: boolean;
  is_list: boolean;
}
