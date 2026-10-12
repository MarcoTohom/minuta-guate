import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  FileText,
  FolderOpen,
  Receipt,
  Users,
  Wallet,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboard } from '@/hooks/useReports';

function StatCard({
  title,
  value,
  icon: Icon,
  to,
}: {
  title: string;
  value: number;
  icon: typeof Users;
  to?: string;
}) {
  const content = (
    <Card className="h-full transition-colors hover:border-primary">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
        <div className="rounded-full bg-secondary p-2 text-secondary-foreground">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();

  return (
    <div>
      <PageHeader title="Panel" description="Resumen general del despacho notarial." />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
      ) : isError || !data ? (
        <EmptyState title="No se pudo cargar el panel" description="Intente nuevamente más tarde." />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Clientes activos" value={data.counters.clientes_activos} icon={Users} to="/clients" />
            <StatCard title="Expedientes activos" value={data.counters.expedientes_activos} icon={FolderOpen} to="/cases" />
            <StatCard title="Borradores" value={data.counters.borradores} icon={FileText} to="/documents" />
            <StatCard
              title="Validaciones pendientes"
              value={data.counters.validaciones_pendientes}
              icon={BadgeCheck}
              to="/documents"
            />
            <StatCard title="Cotizaciones abiertas" value={data.counters.cotizaciones_abiertas} icon={Receipt} to="/quotes" />
            <StatCard title="Cobros pendientes" value={data.counters.cobros_pendientes} icon={Wallet} to="/charges" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Medición experimental</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-sm text-muted-foreground">Casos evaluados</dt>
                  <dd className="text-xl font-semibold">{data.thesis.casos_evaluados}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Tiempo tradicional (min)</dt>
                  <dd className="text-xl font-semibold">{data.thesis.tiempo_tradicional_promedio ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Tiempo con el sistema (min)</dt>
                  <dd className="text-xl font-semibold">{data.thesis.tiempo_sistema_promedio ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Reducción</dt>
                  <dd className="text-xl font-semibold text-emerald-600">
                    {data.thesis.reduccion_porcentual !== null && data.thesis.reduccion_porcentual !== undefined
                      ? `${data.thesis.reduccion_porcentual}%`
                      : '—'}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-muted-foreground">
                Inconsistencias detectadas: {data.thesis.inconsistencias_detectadas}. Meta: {data.thesis.target_minutes} min
                (línea base {data.thesis.baseline_minutes} min).
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
