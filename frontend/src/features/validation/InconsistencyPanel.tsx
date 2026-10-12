import { useMemo, useState } from 'react';
import { CheckCircle2, Crosshair, Pencil, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Severity, ValidationResult, ValidationSummary } from '@/types';
import { SEVERITIES, severityBadgeVariant, severityLabel } from './severity';

export interface InconsistencyPanelProps {
  summary: ValidationSummary | null;
  onGoToField: (fieldKey: string) => void;
  onCorrect: (result: ValidationResult) => void;
  onMarkReviewed: (result: ValidationResult, reviewed: boolean) => void;
  busyResultId?: string | null;
  className?: string;
}

/**
 * Panel de inconsistencias: muestra los resultados de validación, permite
 * filtrarlos por severidad y campo, ir al control afectado, corregir el valor
 * esperado y marcar el resultado como revisado.
 */
export function InconsistencyPanel({
  summary,
  onGoToField,
  onCorrect,
  onMarkReviewed,
  busyResultId,
  className,
}: InconsistencyPanelProps) {
  const [severityFilter, setSeverityFilter] = useState<Severity | 'ALL'>('ALL');
  const [fieldFilter, setFieldFilter] = useState<string>('ALL');

  const results = useMemo(() => summary?.results ?? [], [summary]);

  const fieldKeys = useMemo(
    () => Array.from(new Set(results.map((result) => result.field_key).filter(Boolean) as string[])),
    [results],
  );

  const filtered = results.filter((result) => {
    if (severityFilter !== 'ALL' && result.severity !== severityFilter) return false;
    if (fieldFilter !== 'ALL' && result.field_key !== fieldFilter) return false;
    return true;
  });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Panel de inconsistencias</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!summary ? (
          <p className="text-sm text-muted-foreground">
            Ejecute la validación para detectar inconsistencias.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div className="rounded-md bg-red-50 px-3 py-2">
                <p className="text-xs text-muted-foreground">Críticos</p>
                <p className="font-semibold text-red-700">{summary.critical}</p>
              </div>
              <div className="rounded-md bg-orange-50 px-3 py-2">
                <p className="text-xs text-muted-foreground">Errores</p>
                <p className="font-semibold text-orange-700">{summary.error}</p>
              </div>
              <div className="rounded-md bg-amber-50 px-3 py-2">
                <p className="text-xs text-muted-foreground">Advertencias</p>
                <p className="font-semibold text-amber-700">{summary.warning}</p>
              </div>
              <div className="rounded-md bg-sky-50 px-3 py-2">
                <p className="text-xs text-muted-foreground">Información</p>
                <p className="font-semibold text-sky-700">{summary.info}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                aria-label="Filtrar por severidad"
                value={severityFilter}
                onChange={(event) => setSeverityFilter(event.target.value as Severity | 'ALL')}
                className="max-w-[180px]"
              >
                <option value="ALL">Todas las severidades</option>
                {SEVERITIES.map((severity) => (
                  <option key={severity} value={severity}>
                    {severityLabel(severity)}
                  </option>
                ))}
              </Select>
              <Select
                aria-label="Filtrar por campo"
                value={fieldFilter}
                onChange={(event) => setFieldFilter(event.target.value)}
                className="max-w-[220px]"
              >
                <option value="ALL">Todos los campos</option>
                {fieldKeys.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </Select>
              <span className="text-sm text-muted-foreground">
                {filtered.length} de {results.length}
              </span>
            </div>

            {filtered.length === 0 ? (
              <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                No hay inconsistencias con los filtros seleccionados.
              </p>
            ) : (
              <ul className="space-y-3">
                {filtered.map((result) => (
                  <li key={result.id} className="rounded-lg border p-3">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant={severityBadgeVariant(result.severity)}>
                        {severityLabel(result.severity)}
                      </Badge>
                      {result.reviewed ? (
                        <Badge variant="success">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Revisada
                        </Badge>
                      ) : null}
                      <span className="text-xs text-muted-foreground">{result.rule_id}</span>
                    </div>

                    <p className="text-sm font-medium">{result.message}</p>

                    <dl className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
                      <div>
                        <dt className="text-muted-foreground">Valor encontrado</dt>
                        <dd className="font-mono">{result.current_value || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Valor esperado</dt>
                        <dd className="font-mono">{result.expected_value || '—'}</dd>
                      </div>
                    </dl>

                    {result.location ? (
                      <p className="mt-1 text-xs text-muted-foreground">Ubicación: {result.location}</p>
                    ) : null}
                    {result.correction_note ? (
                      <p className="mt-1 text-xs text-muted-foreground">Corrección: {result.correction_note}</p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {result.field_key ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onGoToField(result.field_key as string)}
                        >
                          <Crosshair className="h-4 w-4" />
                          Ir al campo
                        </Button>
                      ) : null}
                      {result.field_key && result.expected_value ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onCorrect(result)}
                        >
                          <Pencil className="h-4 w-4" />
                          Corregir
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant={result.reviewed ? 'ghost' : 'secondary'}
                        size="sm"
                        loading={busyResultId === result.id}
                        className={cn(result.reviewed && 'text-muted-foreground')}
                        onClick={() => onMarkReviewed(result, !result.reviewed)}
                      >
                        <Check className="h-4 w-4" />
                        {result.reviewed ? 'Quitar revisión' : 'Marcar como revisada'}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
