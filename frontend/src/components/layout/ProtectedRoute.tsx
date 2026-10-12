import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingState } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/useAuth';

/**
 * Protege las rutas privadas: mientras se restaura la sesión muestra un
 * indicador de carga y, si no hay sesión, redirige a /login.
 */
export function ProtectedRoute({ permission }: { permission?: string }) {
  const { isAuthenticated, isLoading, hasPermission } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState label="Restaurando sesión…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 text-center">
        <p className="text-lg font-semibold">Acceso restringido</p>
        <p className="text-sm text-muted-foreground">
          Su rol no tiene permiso para acceder a este módulo.
        </p>
      </div>
    );
  }

  return <Outlet />;
}
