/**
 * Mapa de permisos por rol.
 *
 * El backend SIEMPRE valida los permisos; este mapa solo se usa para ocultar o
 * deshabilitar controles en la interfaz. Ante cualquier 403 la UI también debe
 * reaccionar con un mensaje claro.
 */

export type RoleName = 'ADMINISTRADOR' | 'ABOGADO_NOTARIO' | 'AUXILIAR' | 'ADMINISTRACION' | string;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMINISTRADOR: ['*'],
  ABOGADO_NOTARIO: [
    'clients.read', 'clients.create', 'clients.update', 'clients.delete',
    'cases.read', 'cases.create', 'cases.update', 'cases.delete',
    'templates.read', 'templates.create', 'templates.update', 'templates.activate',
    'documents.read', 'documents.create', 'documents.update', 'documents.generate',
    'validations.read', 'validations.execute',
    'quotes.read', 'quotes.create', 'quotes.update',
    'budgets.read', 'budgets.create', 'budgets.update',
    'charges.read', 'charges.create', 'charges.update',
    'payments.read', 'payments.create',
    'reports.read',
  ],
  AUXILIAR: [
    'clients.read', 'clients.create', 'clients.update',
    'cases.read', 'cases.create', 'cases.update',
    'templates.read', 'documents.read', 'documents.create', 'documents.update',
    'validations.read', 'validations.execute',
    'quotes.read', 'charges.read', 'reports.read',
  ],
  ADMINISTRACION: [
    'clients.read', 'cases.read', 'templates.read', 'documents.read',
    'quotes.read', 'quotes.create', 'quotes.update',
    'budgets.read', 'budgets.create', 'budgets.update',
    'charges.read', 'charges.create', 'charges.update',
    'payments.read', 'payments.create', 'reports.read',
  ],
};

/** Indica si un rol tiene un permiso determinado. */
export function roleHasPermission(role: string | null | undefined, permission: string): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes('*') || permissions.includes(permission);
}

export const PERMISSIONS = {
  usersRead: 'users.read',
  usersCreate: 'users.create',
  usersUpdate: 'users.update',
  clientsRead: 'clients.read',
  clientsCreate: 'clients.create',
  clientsUpdate: 'clients.update',
  clientsDelete: 'clients.delete',
  casesRead: 'cases.read',
  casesCreate: 'cases.create',
  casesUpdate: 'cases.update',
  templatesRead: 'templates.read',
  templatesCreate: 'templates.create',
  templatesUpdate: 'templates.update',
  templatesActivate: 'templates.activate',
  documentsRead: 'documents.read',
  documentsCreate: 'documents.create',
  documentsUpdate: 'documents.update',
  documentsGenerate: 'documents.generate',
  validationsRead: 'validations.read',
  validationsExecute: 'validations.execute',
  quotesRead: 'quotes.read',
  quotesCreate: 'quotes.create',
  quotesUpdate: 'quotes.update',
  budgetsRead: 'budgets.read',
  budgetsCreate: 'budgets.create',
  budgetsUpdate: 'budgets.update',
  chargesRead: 'charges.read',
  chargesCreate: 'charges.create',
  chargesUpdate: 'charges.update',
  paymentsRead: 'payments.read',
  paymentsCreate: 'payments.create',
  reportsRead: 'reports.read',
  auditRead: 'audit.read',
} as const;
