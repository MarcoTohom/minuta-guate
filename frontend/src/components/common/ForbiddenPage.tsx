import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ForbiddenPageProps {
  permission?: string;
}

/**
 * Mensaje claro cuando el backend o la interfaz bloquean una acción por falta de
 * permisos. El backend SIEMPRE vuelve a validar los permisos.
 */
export function ForbiddenPage({ permission }: ForbiddenPageProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            <CardTitle>Acceso denegado</CardTitle>
          </div>
          <CardDescription>No tiene permisos para acceder a esta sección o realizar esta acción.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {permission ? (
            <p className="text-sm text-muted-foreground">
              Permiso requerido: <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{permission}</code>
            </p>
          ) : null}
          <Link to="/dashboard" className={buttonVariants({ variant: 'outline' })}>
            Volver al inicio
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
