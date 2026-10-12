import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCard, Plus } from 'lucide-react';
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
import { useCharges, useCreateCharge, useRegisterChargePayment } from '@/hooks/useBilling';
import { useClients } from '@/hooks/useClients';
import { MEDIOS_PAGO, type Charge } from '@/types';

const chargeSchema = z.object({
  client_id: z.string().min(1, 'Seleccione un cliente.'),
  concepto: z.string().min(3, 'Ingrese el concepto.'),
  monto: z.coerce.number().positive('El monto debe ser mayor que cero.'),
  fecha_emision: z.string().min(1),
});

const paymentSchema = z.object({
  fecha: z.string().min(1),
  monto: z.coerce.number().positive('El monto debe ser mayor que cero.'),
  medio_pago: z.string().min(1),
  referencia: z.string().optional(),
});

type ChargeValues = z.infer<typeof chargeSchema>;
type PaymentValues = z.infer<typeof paymentSchema>;

export default function ChargesPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERMISSIONS.chargesCreate);
  const canPay = hasPermission(PERMISSIONS.paymentsCreate);

  const { data: charges, isLoading } = useCharges();
  const { data: clients } = useClients({ limit: 100 });
  const createCharge = useCreateCharge();

  const [open, setOpen] = useState(false);
  const [payingCharge, setPayingCharge] = useState<Charge | null>(null);

  const chargeForm = useForm<ChargeValues>({
    resolver: zodResolver(chargeSchema),
    defaultValues: { client_id: '', concepto: '', monto: 0, fecha_emision: todayISO() },
  });

  const registerPayment = useRegisterChargePayment(payingCharge?.id ?? '');
  const paymentForm = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { fecha: todayISO(), monto: 0, medio_pago: 'EFECTIVO', referencia: '' },
  });

  const onCreate = chargeForm.handleSubmit(async (values) => {
    await createCharge.mutateAsync({
      client_id: values.client_id,
      concepto: values.concepto,
      monto: Number(values.monto),
      fecha_emision: values.fecha_emision,
    });
    chargeForm.reset({ client_id: '', concepto: '', monto: 0, fecha_emision: todayISO() });
    setOpen(false);
  });

  const onPay = paymentForm.handleSubmit(async (values) => {
    if (!payingCharge) return;
    await registerPayment.mutateAsync({
      charge_id: payingCharge.id,
      fecha: values.fecha,
      monto: Number(values.monto),
      medio_pago: values.medio_pago,
      referencia: values.referencia || null,
    });
    paymentForm.reset({ fecha: todayISO(), monto: 0, medio_pago: 'EFECTIVO', referencia: '' });
    setPayingCharge(null);
  });

  const clientName = (clientId: string) =>
    clients?.items.find((client) => client.id === clientId)?.display_name ?? clientId.slice(0, 8);

  return (
    <div>
      <PageHeader
        title="Cobros"
        description="Cobros por cliente con actualización de saldo y estados."
        actions={
          canCreate ? (
            <Button type="button" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Nuevo cobro
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
          ) : !charges || charges.length === 0 ? (
            <EmptyState title="Sin cobros" description="Registre el primer cobro." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Pagado</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Emisión</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {charges.map((charge) => (
                  <TableRow key={charge.id}>
                    <TableCell>{clientName(charge.client_id)}</TableCell>
                    <TableCell className="font-medium">{charge.concepto}</TableCell>
                    <TableCell>{formatCurrency(charge.monto)}</TableCell>
                    <TableCell>{formatCurrency(charge.monto_pagado)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(charge.saldo)}</TableCell>
                    <TableCell>
                      <Badge variant={charge.estado === 'PAGADO' ? 'success' : 'warning'}>{charge.estado}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(charge.fecha_emision)}</TableCell>
                    <TableCell className="text-right">
                      {canPay && charge.saldo > 0 ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            paymentForm.reset({
                              fecha: todayISO(),
                              monto: charge.saldo,
                              medio_pago: 'EFECTIVO',
                              referencia: '',
                            });
                            setPayingCharge(charge);
                          }}
                        >
                          <CreditCard className="h-4 w-4" />
                          Registrar pago
                        </Button>
                      ) : null}
                    </TableCell>
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
            <DialogTitle>Nuevo cobro</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={onCreate} noValidate>
            <FormField label="Cliente" htmlFor="c_client" required error={chargeForm.formState.errors.client_id?.message}>
              <Select id="c_client" {...chargeForm.register('client_id')}>
                <option value="">Seleccione…</option>
                {clients?.items.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.display_name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Concepto" htmlFor="c_concepto" required error={chargeForm.formState.errors.concepto?.message}>
              <Input id="c_concepto" {...chargeForm.register('concepto')} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Monto" htmlFor="c_monto" required error={chargeForm.formState.errors.monto?.message}>
                <Input id="c_monto" type="number" step="0.01" min="0" {...chargeForm.register('monto')} />
              </FormField>
              <FormField label="Fecha de emisión" htmlFor="c_fecha" required>
                <Input id="c_fecha" type="date" {...chargeForm.register('fecha_emision')} />
              </FormField>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" loading={createCharge.isPending}>
                Crear cobro
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(payingCharge)} onOpenChange={(value) => !value && setPayingCharge(null)}>
        <DialogContent onClose={() => setPayingCharge(null)}>
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
          </DialogHeader>
          {payingCharge ? (
            <p className="text-sm text-muted-foreground">
              Cobro: {payingCharge.concepto} · Saldo {formatCurrency(payingCharge.saldo)}
            </p>
          ) : null}
          <form className="space-y-4" onSubmit={onPay} noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Fecha" htmlFor="p_fecha" required error={paymentForm.formState.errors.fecha?.message}>
                <Input id="p_fecha" type="date" {...paymentForm.register('fecha')} />
              </FormField>
              <FormField label="Monto" htmlFor="p_monto" required error={paymentForm.formState.errors.monto?.message}>
                <Input id="p_monto" type="number" step="0.01" min="0" {...paymentForm.register('monto')} />
              </FormField>
            </div>
            <FormField label="Medio de pago" htmlFor="p_medio" required>
              <Select id="p_medio" {...paymentForm.register('medio_pago')}>
                {MEDIOS_PAGO.map((medio) => (
                  <option key={medio} value={medio}>
                    {medio}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Referencia" htmlFor="p_ref">
              <Input id="p_ref" {...paymentForm.register('referencia')} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPayingCharge(null)}>
                Cancelar
              </Button>
              <Button type="submit" loading={registerPayment.isPending}>
                Registrar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
