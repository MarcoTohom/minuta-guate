import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Calculator,
  CreditCard,
  FileStack,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Receipt,
  Settings,
  Shield,
  Upload,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  permission?: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Panel', icon: LayoutDashboard },
  { to: '/clients', label: 'Clientes', icon: Users, permission: 'clients.read' },
  { to: '/cases', label: 'Expedientes', icon: FolderOpen, permission: 'cases.read' },
  { to: '/templates', label: 'Plantillas', icon: FileStack, permission: 'templates.read' },
  { to: '/documents', label: 'Borradores', icon: FileText, permission: 'documents.read' },
  { to: '/imports', label: 'Importaciones', icon: Upload, permission: 'clients.create' },
  { to: '/quotes', label: 'Cotizaciones', icon: Receipt, permission: 'quotes.read' },
  { to: '/budgets', label: 'Presupuestos', icon: Calculator, permission: 'budgets.read' },
  { to: '/charges', label: 'Cobros', icon: Wallet, permission: 'charges.read' },
  { to: '/payments', label: 'Pagos', icon: CreditCard, permission: 'payments.read' },
  { to: '/reports', label: 'Reportes', icon: BarChart3, permission: 'reports.read' },
  { to: '/users', label: 'Usuarios', icon: Shield, permission: 'users.read' },
  { to: '/settings', label: 'Configuración', icon: Settings },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { hasPermission } = useAuth();
  const items = NAV_ITEMS.filter((item) => !item.permission || hasPermission(item.permission));

  return (
    <nav className="flex h-full flex-col gap-1 overflow-y-auto p-3" aria-label="Navegación principal">
      <div className="mb-2 flex items-center gap-2 px-2 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
          BE
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Borradores</p>
          <p className="text-xs text-muted-foreground">Escrituras públicas</p>
        </div>
      </div>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
