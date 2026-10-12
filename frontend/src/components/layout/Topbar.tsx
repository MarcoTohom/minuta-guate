import { useState } from 'react';
import { LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { initials } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from './Sidebar';

export function Topbar() {
  const { user, role, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b bg-card px-4">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Abrir menú"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium text-muted-foreground">
            Sistema de borradores de escrituras públicas
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-none">{user?.full_name || user?.username}</p>
            <p className="text-xs text-muted-foreground">{role ?? 'Sin rol'}</p>
          </div>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground"
            aria-hidden="true"
          >
            {initials(user?.full_name || user?.username)}
          </div>
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

      {menuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" aria-hidden="true" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 border-r bg-background">
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
