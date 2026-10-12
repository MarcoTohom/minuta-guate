import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PERMISSIONS } from '@/lib/permissions';
import { formatCurrency, round2 } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useBudgets, useCreateBudget } from '@/hooks/useBilling';
import { useCases } from '@/hooks/useCases';
import { BUDGET_ITEM_TIPOS } from '@/types';

const budgetSchema = z.object({
  case_id: z.string().min(1, 'Seleccione un expediente.'),
  nombre: z.string().min(3, 'Ingrese un nombre.'),
  items: z
    .array(
      z.object({
        tipo: z.enum(['INGRESO', 'GASTO', 'OTRO']),
        descripcion: z.string().min(1, 'Describa el concepto.'),
        monto: z.coerce.number().min(0, 'Monto no válido.'),
      }),
    )
    .min(1, 'Agregue al menos un ítem.'),
});

type BudgetValues = z.infer<typeof budgetSchema>;

export default function BudgetsPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERMISSIONS.budgetsCreate);

  const { data: budgets, isLoading } = useBudgets();
  const { data: cases } = useCases({ limit: 100 });
  const createBudget = useCreateBudget();

  const [open, setOpen] = useState(false);
  const form = useForm<BudgetValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      case_id: '',
      nombre: '',
      items: [{ tipo: 'INGRESO', descripcion: '', monto: 0 }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });

  const items = form.watch('items');
  const totals = (items ?? []).reduce(
    (acc, item) => {
      const monto = Number(item.monto) || 0;
      if (item.tipo === 'INGRESO') acc.ingresos += monto;
      else if (item.tipo === 'GASTO') acc.gastos += monto;
      else acc.otros += monto;
      return acc;
    },
    { ingresos: 0, gastos: 0, otros: 0 },
  );
  const margen = round2(totals.ingresos - totals.gastos - totals.otros);

  const onSubmit = form.handleSubmit(async (values) => {
    await createBudget.mutateAsync({
      case_id: values.case_id,
      nombre: values.nombre,
      items: values.items.map((item, index) => ({
        tipo: item.tipo,
        descripcion: item.descripcion,
        monto: Number(item.monto),
        order_index: index,
      })),
    });
    form.reset({ case_id: '', nombre: '', items: [{ tipo: 'INGRESO', descripcion: '', monto: 0 }] });
    setOpen(false);
  });

  const caseNumber = (caseId: string) =>
    cases?.items.find((item) => item.id === caseId)?.numero_expediente ?? caseId.slice(0, 8);

  return (
    <div>
      <PageHeader
        title="Presupuestos"
        description="Presupuestos por expediente con ingresos, gastos y margen proyectado."
        actions={
          canCreate ? (
            <Button type="button" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Nuevo presupuesto
            </Button>
          ) : null
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-10" />
              ))}
            </div>
          ) : !budgets || budgets.length === 0 ? (
            <EmptyState title="Sin presupuestos" description="Cree el primer presupuesto." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Expediente</TableHead>
                  <TableHead>Ingresos</TableHead>
                  <TableHead>Gastos</TableHead>
                  <TableHead>Otros</TableHead>
                  <TableHead>Margen</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.map((budget) => (
                  <TableRow key={budget.id}>
                    <TableCell className="font-medium">{budget.nombre}</TableCell>
                    <TableCell>{caseNumber(budget.case_id)}</TableCell>
                    <TableCell>{formatCurrency(budget.total_ingresos)}</TableCell>
                    <TableCell>{formatCurrency(budget.total_gastos)}</TableCell>
                    <TableCell>{formatCurrency(budget.total_otros)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(budget.margen_proyectado)}</TableCell>
                    <TableCell>{budget.estado}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nuevo presupuesto</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Expediente" htmlFor="b_case" required error={form.formState.errors.case_id?.message}>
                <Select id="b_case" {...form.register('case_id')}>
                  <option value="">Seleccione…</option>
                  {cases?.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.numero_expediente}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Nombre" htmlFor="b_nombre" required error={form.formState.errors.nombre?.message}>
                <Input id="b_nombre" {...form.register('nombre')} />
              </FormField>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Conceptos</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ tipo: 'INGRESO', descripcion: '', monto: 0 })}
                >
                  <Plus className="h-4 w-4" />
                  Agregar
                </Button>
              </div>
              {fields.map((field, index) => (
                <div key={field.id} className="grid items-end gap-2 sm:grid-cols-[130px_1fr_120px_36px]">
                  <Select aria-label={`Tipo ${index + 1}`} {...form.register(`items.${index}.tipo`)}>
                    {BUDGET_ITEM_TIPOS.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </Select>
                  <Input placeholder="Descripción" {...form.register(`items.${index}.descripcion`)} />
                  <Input type="number" step="0.01" min="0" placeholder="Monto" {...form.register(`items.${index}.monto`)} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Quitar concepto ${index + 1}`}
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="rounded-md bg-muted p-3 text-sm">
              <div className="flex justify-between">
                <span>Ingresos</span>
                <span>{formatCurrency(totals.ingresos)}</span>
              </div>
              <div className="flex justify-between">
                <span>Gastos</span>
                <span>{formatCurrency(totals.gastos)}</span>
              </div>
              <div className="flex justify-between">
                <span>Otros</span>
                <span>{formatCurrency(totals.otros)}</span>
              </div>
              <div className="mt-1 flex justify-between font-semibold">
                <span>Margen proyectado</span>
                <span>{formatCurrency(margen)}</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" loading={createBudget.isPending}>
                Crear presupuesto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
