/** Tipos de cotizaciones, presupuestos, cobros y pagos. */

export interface QuoteItem {
  id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Quote {
  id: string;
  numero: string;
  client_id: string;
  case_id?: string | null;
  fecha: string;
  estado: string;
  subtotal: number;
  descuento: number;
  total: number;
  observaciones?: string | null;
  items: QuoteItem[];
}

export interface QuoteItemInput {
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  order_index?: number;
}

export interface QuoteCreate {
  client_id: string;
  case_id?: string | null;
  fecha: string;
  fecha_vencimiento?: string | null;
  descuento?: number;
  observaciones?: string | null;
  items: QuoteItemInput[];
}

export interface QuoteUpdate {
  estado?: string;
  descuento?: number;
  observaciones?: string | null;
  fecha_vencimiento?: string | null;
}

export const QUOTE_ESTADOS = [
  'BORRADOR',
  'ENVIADA',
  'ACEPTADA',
  'RECHAZADA',
  'VENCIDA',
  'CANCELADA',
] as const;

export interface BudgetItem {
  id: string;
  tipo: string;
  descripcion: string;
  monto: number;
}

export interface Budget {
  id: string;
  case_id: string;
  nombre: string;
  estado: string;
  total_ingresos: number;
  total_gastos: number;
  total_otros: number;
  margen_proyectado: number;
  items: BudgetItem[];
}

export interface BudgetItemInput {
  tipo: string;
  descripcion: string;
  monto: number;
  order_index?: number;
}

export interface BudgetCreate {
  case_id: string;
  nombre: string;
  observaciones?: string | null;
  items: BudgetItemInput[];
}

export const BUDGET_ITEM_TIPOS = ['INGRESO', 'GASTO', 'OTRO'] as const;

export interface Payment {
  id: string;
  charge_id: string;
  fecha: string;
  monto: number;
  medio_pago: string;
  referencia?: string | null;
}

export interface Charge {
  id: string;
  client_id: string;
  case_id?: string | null;
  concepto: string;
  monto: number;
  monto_pagado: number;
  saldo: number;
  fecha_emision: string;
  estado: string;
  payments: Payment[];
}

export interface ChargeCreate {
  client_id: string;
  case_id?: string | null;
  concepto: string;
  monto: number;
  fecha_emision: string;
  fecha_vencimiento?: string | null;
}

export interface PaymentCreate {
  charge_id: string;
  fecha: string;
  monto: number;
  medio_pago: string;
  referencia?: string | null;
  observaciones?: string | null;
}

export const CHARGE_ESTADOS = ['PENDIENTE', 'PARCIAL', 'PAGADO', 'VENCIDO', 'ANULADO'] as const;

export const MEDIOS_PAGO = ['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'TARJETA', 'OTRO'] as const;
