/** Tipos de clientes: personas individuales y jurídicas. */

export interface Person {
  id: string;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  dpi?: string | null;
  nit?: string | null;
  fecha_nacimiento?: string | null;
  nacionalidad?: string | null;
  estado_civil?: string | null;
  profesion?: string | null;
  direccion?: string | null;
  departamento?: string | null;
  municipio?: string | null;
  telefono?: string | null;
  correo?: string | null;
}

export interface LegalEntity {
  id: string;
  razon_social: string;
  nombre_comercial?: string | null;
  nit?: string | null;
  tipo_sociedad?: string | null;
  representante_legal?: string | null;
}

export interface Client {
  id: string;
  tipo_cliente: 'INDIVIDUAL' | 'JURIDICA';
  status: string;
  observaciones?: string | null;
  display_name: string;
  person?: Person | null;
  legal_entity?: LegalEntity | null;
}

export interface PersonInput {
  nombres: string;
  apellidos: string;
  dpi?: string | null;
  nit?: string | null;
  fecha_nacimiento?: string | null;
  nacionalidad?: string | null;
  estado_civil?: string | null;
  profesion?: string | null;
  direccion?: string | null;
  departamento?: string | null;
  municipio?: string | null;
  telefono?: string | null;
  correo?: string | null;
}

export interface LegalEntityInput {
  razon_social: string;
  nombre_comercial?: string | null;
  nit?: string | null;
  tipo_sociedad?: string | null;
  numero_inscripcion?: string | null;
  datos_registrales?: string | null;
  direccion?: string | null;
  departamento?: string | null;
  municipio?: string | null;
  telefono?: string | null;
  correo?: string | null;
  representante_legal?: string | null;
  cargo_representante?: string | null;
}

export interface ClientCreate {
  tipo_cliente: 'INDIVIDUAL' | 'JURIDICA';
  observaciones?: string | null;
  person?: PersonInput | null;
  legal_entity?: LegalEntityInput | null;
}

export interface ClientUpdate {
  observaciones?: string | null;
  status?: string;
  person?: PersonInput | null;
  legal_entity?: LegalEntityInput | null;
}

export interface ClientListParams {
  skip?: number;
  limit?: number;
  q?: string;
  tipo?: string;
}
