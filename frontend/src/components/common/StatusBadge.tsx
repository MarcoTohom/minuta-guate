import { Badge, type BadgeProps } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Variant = BadgeProps['variant'];

const STATUS_VARIANTS: Record<string, Variant> = {
  ABIERTO: 'info',
  EN_REVISION: 'warning',
  PENDIENTE: 'warning',
  FINALIZADO: 'success',
  CANCELADO: 'destructive',
  CANCELADA: 'destructive',
  BORRADOR: 'secondary',
  ENVIADA: 'info',
  ACEPTADA: 'success',
  RECHAZADA: 'destructive',
  VENCIDA: 'warning',
  VENCIDO: 'destructive',
  PARCIAL: 'warning',
  PAGADO: 'success',
  ANULADO: 'secondary',
  ACTIVO: 'success',
  ACTIVE: 'success',
  ACTIVA: 'success',
  INACTIVO: 'secondary',
  INACTIVE: 'secondary',
  GENERADO: 'success',
  ERROR: 'destructive',
  FALLIDO: 'destructive',
  CONFIRMADO: 'success',
  PROCESANDO: 'info',
  REVISANDO: 'warning',
  RECIBIDO: 'info',
};

/** Etiqueta de estado con color consistente por palabra clave. */
export function StatusBadge({ status, className }: { status?: string | null; className?: string }) {
  if (!status) return null;
  const key = status.toUpperCase();
  return (
    <Badge variant={STATUS_VARIANTS[key] ?? 'outline'} className={cn('uppercase', className)}>
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}
