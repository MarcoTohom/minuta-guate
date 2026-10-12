import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { z } from 'zod';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PERMISSIONS } from '@/lib/permissions';
import { useAuth } from '@/hooks/useAuth';
import { useCreateTestExecution, useExperimentalReport, useTestCases } from '@/hooks/useReports';

const executionSchema = z.object({
  test_case_id: z.string().min(1, 'Seleccione un caso de prueba.'),
  method: z.enum(['TRADITIONAL', 'SYSTEM']),
  duration_minutes: z.coerce.number().min(0, 'Duración no válida.').optional(),
  errors_found: z.coerce.number().int().min(0).optional(),
  errors_missed: z.coerce.number().int().min(0).optional(),
  corrections: z.coerce.number().int().min(0).optional(),
});

type ExecutionValues = z.infer<typeof executionSchema>;

export default function ReportsPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERMISSIONS.reportsRead);

  const { data: report, isLoading } = useExperimentalReport();
  const { data: testCases } = useTestCases();
  const createExecution = useCreateTestExecution();

  const [open, setOpen] = useState(false);
  const form = useForm<ExecutionValues>({
    resolver: zodResolver(executionSchema),
    defaultValues: {
      test_case_id: '',
      method: 'SYSTEM',
      duration_minutes: 0,
      errors_found: 0,
      errors_missed: 0,
      corrections: 0,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await createExecution.mutateAsync({
      test_case_id: values.test_case_id,
      method: values.method,
      measurement: {
        duration_minutes: values.duration_minutes ?? 0,
        errors_found: values.errors_found ?? 0,
        errors_missed: values.errors_missed ?? 0,
        corrections: values.corrections ?? 0,
      },
    });
    form.reset({
      test_case_id: '',
      method: 'SYSTEM',
      duration_minutes: 0,
      errors_found: 0,
      errors_missed: 0,
      corrections: 0,
    });
    setOpen(false);
  });

  return (
    <div>
      <PageHeader
        title="Reportes"
        description="Medición experimental de la tesis: reducción de tiempos e inconsistencias detectadas."
        actions={
          <Button type="button" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Registrar medición
          </Button>
        }
      />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reporte experimental</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32" />
            ) : !report ? (
              <EmptyState title="Sin datos" description="Aún no hay mediciones registradas." />
            ) : (
              <div className="space-y-4">
                <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-sm text-muted-foreground">Casos evaluados</dt>
                    <dd className="text-xl font-semibold">{report.cases_evaluated}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Tradicional (min)</dt>
                    <dd className="text-xl font-semibold">{report.traditional_minutes_avg ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Con sistema (min)</dt>
                    <dd className="text-xl font-semibold">{report.system_minutes_avg ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Reducción</dt>
                    <dd className="text-xl font-semibold text-emerald-600">
                      {report.reduction_percentage != null ? `${report.reduction_percentage}%` : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Inconsistencias detectadas</dt>
                    <dd className="text-xl font-semibold">{report.inconsistencies_detected}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Errores encontrados</dt>
                    <dd className="text-xl font-semibold">{report.errors_found_total}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Errores omitidos</dt>
                    <dd className="text-xl font-semibold">{report.errors_missed_total}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Correcciones</dt>
                    <dd className="text-xl font-semibold">{report.corrections_total}</dd>
                  </div>
                </dl>
                <p className="text-xs text-muted-foreground">
                  Meta: {report.target_minutes} min · Línea base: {report.baseline_minutes} min. {report.note}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Casos de prueba sintéticos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!testCases || testCases.length === 0 ? (
              <EmptyState title="Sin casos de prueba" description="No hay casos sintéticos cargados." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Inconsistencias</TableHead>
                    <TableHead>Errores esperados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testCases.map((testCase) => (
                    <TableRow key={testCase.id}>
                      <TableCell className="font-mono text-xs">{testCase.code}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{testCase.deed_type_code}</Badge>
                      </TableCell>
                      <TableCell>{testCase.title}</TableCell>
                      <TableCell className="text-muted-foreground">{testCase.inconsistency_types ?? '—'}</TableCell>
                      <TableCell>{testCase.expected_errors}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle>Registrar medición</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <FormField label="Caso de prueba" htmlFor="m_case" required error={form.formState.errors.test_case_id?.message}>
              <Select id="m_case" {...form.register('test_case_id')}>
                <option value="">Seleccione…</option>
                {testCases?.map((testCase) => (
                  <option key={testCase.id} value={testCase.id}>
                    {testCase.code} · {testCase.title}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Método" htmlFor="m_method" required>
              <Select id="m_method" {...form.register('method')}>
                <option value="TRADITIONAL">Tradicional</option>
                <option value="SYSTEM">Con el sistema</option>
              </Select>
            </FormField>
            <FormField label="Duración (min)" htmlFor="m_duration">
              <Input id="m_duration" type="number" step="0.1" min="0" {...form.register('duration_minutes')} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="Errores encontrados" htmlFor="m_found">
                <Input id="m_found" type="number" min="0" {...form.register('errors_found')} />
              </FormField>
              <FormField label="Errores omitidos" htmlFor="m_missed">
                <Input id="m_missed" type="number" min="0" {...form.register('errors_missed')} />
              </FormField>
              <FormField label="Correcciones" htmlFor="m_corrections">
                <Input id="m_corrections" type="number" min="0" {...form.register('corrections')} />
              </FormField>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" loading={createExecution.isPending} disabled={!canCreate}>
                Registrar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
