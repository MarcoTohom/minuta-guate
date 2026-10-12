import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROLE_PERMISSIONS } from '@/lib/permissions';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
  const { user, role } = useAuth();
  const permissions = role ? ROLE_PERMISSIONS[role] ?? [] : [];

  return (
    <div>
      <PageHeader title="Configuración" description="Datos de la sesión y permisos del rol actual." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Usuario</span>
              <span className="font-medium">{user?.username ?? '—'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Nombre completo</span>
              <span className="font-medium">{user?.full_name || '—'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Correo</span>
              <span className="font-medium">{user?.email || '—'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Rol</span>
              <Badge variant="secondary">{role ?? 'Sin rol'}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Permisos del rol</CardTitle>
          </CardHeader>
          <CardContent>
            {permissions.includes('*') ? (
              <p className="text-sm text-muted-foreground">Este rol tiene acceso completo al sistema.</p>
            ) : permissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay permisos definidos para este rol.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {permissions.map((permission) => (
                  <Badge key={permission} variant="outline">
                    {permission}
                  </Badge>
                ))}
              </div>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Nota: el backend valida siempre los permisos; esta vista es informativa para la interfaz.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
