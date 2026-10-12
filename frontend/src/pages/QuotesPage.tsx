import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { PERMISSIONS } from '@/lib/permissions';
import { formatCurrency, formatDate, round2, todayISO } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useClients } from '@/hooks/useClients';
import { useCreateQuote, useQuotes, useUpdateQuote } from '@/hooks/useBilling';
import { QUOTE_ESTADOS } from '@/types';

const quoteSchema = z.object({
  client_id: z.string().min(1, 'Seleccione un cliente.'),
  fecha: z.string().min(1, 'Seleccione la fecha.'),
  descuento: z.coerce.number().min(0, 'No puede ser negativo.').optional(),
  observaciones: z.string().optional(),
  items: z
    .array(
      z.object({
        descripcion: z.string().min(1, 'Describa el servicio.'),
        cantidad: z.coerce.number().positive('Cantidad mayor que cero.'),
        precio_unitario: z.coerce.number().min(0, 'Precio no válido.'),
      }),
    )
    .min(1, 'Agregue al menos un ítem.'),
});

type QuoteValues = z.infer<typeof quoteSchema>;

export default function QuotesPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERMISSIONS.quotesCreate);
  const canUpdate = hasPermission(PERMISSIONS.quotesUpdate);

  const { data: quotes, isLoading } = useQuotes();
  const { data: clients } = useClients({ limit: 100 });
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();

  const [open, setOpen] = useState(false);
  const form = useForm<QuoteValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      client_id: '',
      fecha: todayISO(),
      descuento: 0,
      observaciones: '',
      items: [{ descripcion: '', cantidad: 1, precio_unitario: 0 }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });

  const watchedItems = form.watch('items');
  const descuento = form.watch('descuento') ?? 0;
  const subtotal = round2(
    (watchedItems ?? []).reduce(
      (acc, item) => acc + (Number(item.cantidad) || 0) * (Number(item.precio_unitario) || 0),
      0,
    ),
  );
  const total = round2(Math.max(subtotal - (Number(descuento) || 0), 0));

  const onSubmit = form.handleSubmit(async (values) => {
    await createQuote.mutateAsync({
      client_id: values.client_id,
      fecha: values.fecha,
      descuento: Number(values.descuento) || 0,
      observaciones: values.observaciones || null,
      items: values.items.map((item, index) => ({
        descripcion: item.descripcion,
        cantidad: Number(item.cantidad),
        precio_unitario: Number(item.precio_unitario),
        order_index: index,
      })),
    });
    form.reset({
      client_id: '',
      fecha: todayISO(),
      descuento: 0,
      observaciones: '',
      items: [{ descripcion: '', cantidad: 1, precio_unitario: 0 }],
    });
    setOpen(false);
  });

  const clientName = (clientId: string) =>
    clients?.items.find((client) => client.id === clientId)?.display_name ?? clientId.slice(0, 8);

  return (
    <div>
      <PageHeader
        title="Cotizaciones"
        description="Cotizaciones de servicios notariales con cálculo de totales."
        actions={
          canCreate ? (
            <Button type="button" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Nueva cotización
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
          ) : !quotes || quotes.length === 0 ? (
            <EmptyState title="Sin cotizaciones" description="Cree la primera cotización." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.numero}</TableCell>
                    <TableCell>{clientName(quote.client_id)}</TableCell>
                    <TableCell>{formatDate(quote.fecha)}</TableCell>
                    <TableCell>{formatCurrency(quote.subtotal)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(quote.total)}</TableCell>
                    <TableCell>
                      {canUpdate ? (
                        <Select
                          aria-label={`Estado de ${quote.numero}`}
                          value={quote.estado}
                          onChange={(event) =>
                            void updateQuote.mutateAsync({ id: quote.id, payload: { estado: event.target.value } })
                          }
                          className="max-w-[160px]"
                        >
                          {QUOTE_ESTADOS.map((estado) => (
                            <option key={estado} value={estado}>
                              {estado}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <Badge variant="secondary">{quote.estado}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)} className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Nueva cotización</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Cliente" htmlFor="q_client" required error={form.formState.errors.client_id?.message}>
                <Select id="q_client" {...form.register('client_id')}>
                  <option value="">Seleccione…</option>
                  {clients?.items.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.display_name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Fecha" htmlFor="q_fecha" required error={form.formState.errors.fecha?.message}>
                <Input id="q_fecha" type="date" {...form.register('fecha')} />
              </FormField>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Servicios</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ descripcion: '', cantidad: 1, precio_unitario: 0 })}
                >
                  <Plus className="h-4 w-4" />
                  Agregar
                </Button>
              </div>
              {fields.map((field, index) => {
                const itemErrors = form.formState.errors.items?.[index];
                const itemError = itemErrors?.descripcion?.message;
                return (
                  <div key={field.id} className="space-y-1">
                    <div className="grid items-end gap-2 sm:grid-cols-[1fr_90px_120px_36px]">
                      <Input placeholder="Descripción" {...form.register(`items.${index}.descripcion`)} />
                      <Input type="number" step="1" min="1" placeholder="Cant." {...form.register(`items.${index}.cantidad`)} />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Precio"
                        {...form.register(`items.${index}.precio_unitario`)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Quitar ítem ${index + 1}`}
                        disabled={fields.length === 1}
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    {itemError ? (
                      <p role="alert" className="text-xs text-destructive">
                        {itemError}
                      </p>
                    ) : null}
                  </div>
                );
              })}
              {form.formState.errors.items?.message ? (
                <p role="alert" className="text-xs text-destructive">
                  {form.formState.errors.items.message}
                </p>
              ) : null}
            </div>

            <FormField label="Descuento" htmlFor="q_descuento">
              <Input id="q_descuento" type="number" step="0.01" min="0" {...form.register('descuento')} />
            </FormField>
            <FormField label="Observaciones" htmlFor="q_obs">
              <Textarea id="q_obs" {...form.register('observaciones')} />
            </FormField>

            <div className="rounded-md bg-muted p-3 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Descuento</span>
                <span>{formatCurrency(Number(descuento) || 0)}</span>
              </div>
              <div className="mt-1 flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" loading={createQuote.isPending}>
                Crear cotización
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
