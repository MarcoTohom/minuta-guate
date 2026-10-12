import * as React from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '@/app/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn, initials } from '@/lib/utils';

function roleLabel(role: string | null): string {
  if (!role) return 'Sin rol';
  return role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Marco de la aplicación: barra lateral de navegación y barra superior. */
export function AppLayout() {
  const { user, role, logout, hasPermission } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navItems = React.useMemo(
    () => NAV_ITEMS.filter((item) => !item.permission || hasPermission(item.permission)),
    [hasPermission],
  );

  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const displayName = user?.full_name || user?.username || 'Usuario';

  return (
    <div className="flex min-h-screen bg-muted/30">
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r bg-background transition-transform lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            E
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Escrituras</p>
            <p className="truncate text-xs text-muted-foreground">Borradores notariales</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden"
            aria-label="Cerrar menú"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="space-y-1 p-3" aria-label="Navegación principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background px-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Abrir menú"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{displayName}</p>
              <p className="text-xs text-muted-foreground">{user?.username}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {initials(displayName)}
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {roleLabel(role)}
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void logout();
              }}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
