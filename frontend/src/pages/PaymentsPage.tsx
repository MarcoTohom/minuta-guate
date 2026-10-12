import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { z } from 'zod';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
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
import { formatCurrency, formatDate, todayISO } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useCharges, useCreatePayment, usePayments } from '@/hooks/useBilling';
import { MEDIOS_PAGO } from '@/types';

const paymentSchema = z.object({
  charge_id: z.string().min(1, 'Seleccione un cobro.'),
  fecha: z.string().min(1),
  monto: z.coerce.number().positive('El monto debe ser mayor que cero.'),
  medio_pago: z.string().min(1),
  referencia: z.string().optional(),
});

type PaymentValues = z.infer<typeof paymentSchema>;

export default function PaymentsPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERMISSIONS.paymentsCreate);

  const { data: payments, isLoading } = usePayments();
  const { data: charges } = useCharges();
  const createPayment = useCreatePayment();

  const [open, setOpen] = useState(false);
  const form = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { charge_id: '', fecha: todayISO(), monto: 0, medio_pago: 'EFECTIVO', referencia: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await createPayment.mutateAsync({
      charge_id: values.charge_id,
      fecha: values.fecha,
      monto: Number(values.monto),
      medio_pago: values.medio_pago,
      referencia: values.referencia || null,
    });
    form.reset({ charge_id: '', fecha: todayISO(), monto: 0, medio_pago: 'EFECTIVO', referencia: '' });
    setOpen(false);
  });

  const chargeLabel = (chargeId: string) => {
    const charge = charges?.find((item) => item.id === chargeId);
    return charge ? `${charge.concepto} (${formatCurrency(charge.monto)})` : chargeId.slice(0, 8);
  };

  return (
    <div>
      <PageHeader
        title="Pagos"
        description="Pagos registrados sobre los cobros del despacho."
        actions={
          canCreate ? (
            <Button type="button" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Registrar pago
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
          ) : !payments || payments.length === 0 ? (
            <EmptyState title="Sin pagos" description="No se han registrado pagos." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cobro</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Medio</TableHead>
                  <TableHead>Referencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{chargeLabel(payment.charge_id)}</TableCell>
                    <TableCell>{formatDate(payment.fecha)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(payment.monto)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{payment.medio_pago}</Badge>
                    </TableCell>
                    <TableCell>{payment.referencia ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <FormField label="Cobro" htmlFor="pay_charge" required error={form.formState.errors.charge_id?.message}>
              <Select id="pay_charge" {...form.register('charge_id')}>
                <option value="">Seleccione…</option>
                {charges?.map((charge) => (
                  <option key={charge.id} value={charge.id}>
                    {charge.concepto} · {formatCurrency(charge.saldo)} pendiente
                  </option>
                ))}
              </Select>
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Fecha" htmlFor="pay_fecha" required error={form.formState.errors.fecha?.message}>
                <Input id="pay_fecha" type="date" {...form.register('fecha')} />
              </FormField>
              <FormField label="Monto" htmlFor="pay_monto" required error={form.formState.errors.monto?.message}>
                <Input id="pay_monto" type="number" step="0.01" min="0" {...form.register('monto')} />
              </FormField>
            </div>
            <FormField label="Medio de pago" htmlFor="pay_medio" required>
              <Select id="pay_medio" {...form.register('medio_pago')}>
                {MEDIOS_PAGO.map((medio) => (
                  <option key={medio} value={medio}>
                    {medio}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Referencia" htmlFor="pay_ref">
              <Input id="pay_ref" {...form.register('referencia')} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" loading={createPayment.isPending}>
                Registrar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
