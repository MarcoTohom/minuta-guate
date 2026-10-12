import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Eye, Plus } from 'lucide-react';
import { z } from 'zod';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { FormField } from '@/components/ui/form-field';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { PERMISSIONS } from '@/lib/permissions';
import { cn, formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useCases, useCreateCase, useDeedTypes, useUpdateCase } from '@/hooks/useCases';
import { useClients } from '@/hooks/useClients';
import { CASE_ESTADOS, type Case } from '@/types';

const PAGE_SIZE = 10;

const caseSchema = z.object({
  client_id: z.string().min(1, 'Seleccione un cliente.'),
  deed_type_id: z.string().optional(),
  observaciones: z.string().optional(),
});

type CaseValues = z.infer<typeof caseSchema>;

export default function CasesPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERMISSIONS.casesCreate);
  const canUpdate = hasPermission(PERMISSIONS.casesUpdate);

  const [page, setPage] = useState(1);
  const { data, isLoading } = useCases({ skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE });
  const { data: clients } = useClients({ limit: 100 });
  const { data: deedTypes } = useDeedTypes();
  const createCase = useCreateCase();
  const updateCase = useUpdateCase();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Case | null>(null);

  const form = useForm<CaseValues>({
    resolver: zodResolver(caseSchema),
    defaultValues: { client_id: '', deed_type_id: '', observaciones: '' },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({ client_id: '', deed_type_id: '', observaciones: '' });
    setOpen(true);
  };

  const openEdit = (item: Case) => {
    setEditing(item);
    form.reset({
      client_id: item.client_id,
      deed_type_id: item.deed_type_id ?? '',
      observaciones: item.observaciones ?? '',
    });
    setOpen(true);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (editing) {
      await updateCase.mutateAsync({
        id: editing.id,
        payload: { deed_type_id: values.deed_type_id || null, observaciones: values.observaciones || null },
      });
    } else {
      await createCase.mutateAsync({
        client_id: values.client_id,
        deed_type_id: values.deed_type_id || null,
        observaciones: values.observaciones || null,
      });
    }
    setOpen(false);
  });

  return (
    <div>
      <PageHeader
        title="Expedientes"
        description="Gestión de expedientes notariales asociados a clientes."
        actions={
          canCreate ? (
            <Button type="button" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Nuevo expediente
            </Button>
          ) : null
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-10" />
              ))}
            </div>
          ) : !data || data.items.length === 0 ? (
            <EmptyState title="Sin expedientes" description="Cree el primer expediente para comenzar." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Expediente</TableHead>
                    <TableHead>Tipo de escritura</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Apertura</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.numero_expediente}</TableCell>
                      <TableCell>{item.deed_type?.name ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.estado}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(item.fecha_apertura)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {canUpdate ? (
                            <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(item)}>
                              Editar
                            </Button>
                          ) : null}
                          <Link
                            to={`/documents?case_id=${item.id}`}
                            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                          >
                            <Eye className="h-4 w-4" />
                            Borradores
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                page={data.page}
                pages={data.pages}
                total={data.total}
                pageSize={data.page_size || PAGE_SIZE}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar expediente' : 'Nuevo expediente'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <FormField label="Cliente" htmlFor="client_id" required error={form.formState.errors.client_id?.message}>
              <Select id="client_id" disabled={Boolean(editing)} {...form.register('client_id')}>
                <option value="">Seleccione…</option>
                {clients?.items.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.display_name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Tipo de escritura" htmlFor="deed_type_id">
              <Select id="deed_type_id" {...form.register('deed_type_id')}>
                <option value="">Sin especificar</option>
                {deedTypes?.map((deedType) => (
                  <option key={deedType.id} value={deedType.id}>
                    {deedType.name}
                  </option>
                ))}
              </Select>
            </FormField>
            {editing ? (
              <FormField label="Estado" htmlFor="estado">
                <Select
                  id="estado"
                  value={editing.estado}
                  onChange={(event) => {
                    setEditing({ ...editing, estado: event.target.value });
                  }}
                >
                  {CASE_ESTADOS.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </Select>
              </FormField>
            ) : null}
            <FormField label="Observaciones" htmlFor="observaciones">
              <Textarea id="observaciones" {...form.register('observaciones')} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" loading={createCase.isPending || updateCase.isPending}>
                {editing ? 'Guardar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
