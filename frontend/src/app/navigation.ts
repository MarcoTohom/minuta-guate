import {
  BarChart3,
  Calculator,
  ClipboardList,
  FileStack,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Receipt,
  Settings,
  Upload,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PERMISSIONS } from '@/lib/permissions';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  permission?: string;
}

/** Elementos de navegación del panel principal, cada uno con su permiso. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Panel', icon: LayoutDashboard, permission: PERMISSIONS.reportsRead },
  { to: '/clients', label: 'Clientes', icon: Users, permission: PERMISSIONS.clientsRead },
  { to: '/cases', label: 'Expedientes', icon: FolderKanban, permission: PERMISSIONS.casesRead },
  { to: '/templates', label: 'Plantillas', icon: FileText, permission: PERMISSIONS.templatesRead },
  { to: '/documents', label: 'Documentos', icon: FileStack, permission: PERMISSIONS.documentsRead },
  { to: '/imports', label: 'Importaciones', icon: Upload, permission: PERMISSIONS.documentsRead },
  { to: '/quotes', label: 'Cotizaciones', icon: ClipboardList, permission: PERMISSIONS.quotesRead },
  { to: '/budgets', label: 'Presupuestos', icon: Calculator, permission: PERMISSIONS.budgetsRead },
  { to: '/charges', label: 'Cargos', icon: Receipt, permission: PERMISSIONS.chargesRead },
  { to: '/payments', label: 'Pagos', icon: Wallet, permission: PERMISSIONS.paymentsRead },
  { to: '/reports', label: 'Reportes', icon: BarChart3, permission: PERMISSIONS.reportsRead },
  { to: '/users', label: 'Usuarios', icon: UserCog, permission: PERMISSIONS.usersRead },
  { to: '/settings', label: 'Configuración', icon: Settings },
];
