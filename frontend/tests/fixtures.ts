import type { Charge, Client, Quote, TemplateField, ValidationResult } from '@/types';

let fieldSeq = 0;

/** Crea una definición de campo de plantilla completa con valores por defecto. */
export function makeField(overrides: Partial<TemplateField> = {}): TemplateField {
  fieldSeq += 1;
  return {
    id: `field-${fieldSeq}`,
    template_version_id: 'version-1',
    key: 'campo',
    label: 'Campo',
    field_type: 'text',
    required: false,
    nullable: true,
    default_value: null,
    min_length: null,
    max_length: null,
    min_value: null,
    max_value: null,
    regex: null,
    mask: null,
    format: null,
    options_json: null,
    source: null,
    source_reference: null,
    readonly: false,
    calculated: false,
    calculation_expression: null,
    docx_variable: null,
    display_order: 0,
    help_text: null,
    group_key: null,
    parent_key: null,
    active: true,
    ...overrides,
  };
}

/** Crea un cliente individual de ejemplo. */
export function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: 'client-1',
    tipo_cliente: 'INDIVIDUAL',
    status: 'ACTIVO',
    observaciones: null,
    display_name: 'Juan Pérez',
    person: {
      id: 'person-1',
      nombres: 'Juan',
      apellidos: 'Pérez',
      nombre_completo: 'Juan Pérez',
      dpi: '1234567890123',
      nit: '1234567-8',
      telefono: '5555-5555',
      correo: 'juan@example.com',
      direccion: 'Zona 1',
    },
    legal_entity: null,
    ...overrides,
  };
}

/** Crea un resultado de validación de ejemplo. */
export function makeValidationResult(overrides: Partial<ValidationResult> = {}): ValidationResult {
  return {
    id: 'result-1',
    rule_id: 'RULE_DPI',
    severity: 'ERROR',
    field_key: 'dpi',
    message: 'El DPI no coincide con el cliente.',
    current_value: '123',
    expected_value: '1234567890123',
    location: null,
    reviewed: false,
    correction_note: null,
    ...overrides,
  };
}

/** Crea un cobro de ejemplo. */
export function makeCharge(overrides: Partial<Charge> = {}): Charge {
  return {
    id: 'charge-1',
    client_id: 'client-1',
    concepto: 'Honorarios notariales',
    monto: 1000,
    monto_pagado: 400,
    saldo: 600,
    estado: 'PENDIENTE',
    fecha_emision: '2024-01-15',
    payments: [],
    ...overrides,
  };
}

/** Crea una cotización de ejemplo. */
export function makeQuote(overrides: Partial<Quote> = {}): Quote {
  return {
    id: 'quote-1',
    numero: 'COT-0001',
    client_id: 'client-1',
    fecha: '2024-01-15',
    subtotal: 500,
    descuento: 0,
    total: 500,
    estado: 'BORRADOR',
    observaciones: null,
    items: [],
    ...overrides,
  };
}
