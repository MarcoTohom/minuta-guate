import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PERMISSIONS } from '@/lib/permissions';
import { isValidDpi, isValidNit } from '@/lib/validators';
import { useAuth } from '@/hooks/useAuth';
import { useCreateClient, useClients, useDeleteClient, useUpdateClient } from '@/hooks/useClients';
import { useDebounce } from '@/hooks/useDebounce';
import type { Client, ClientCreate } from '@/types';

const PAGE_SIZE = 10;

const clientSchema = z.object({
  tipo_cliente: z.enum(['INDIVIDUAL', 'JURIDICA']),
  nombres: z.string().optional(),
  apellidos: z.string().optional(),
  razon_social: z.string().optional(),
  nombre_comercial: z.string().optional(),
  dpi: z
    .string()
    .optional()
    .refine((value) => !value || isValidDpi(value), 'El DPI debe tener 13 dígitos.'),
  nit: z
    .string()
    .optional()
    .refine((value) => !value || isValidNit(value), 'NIT no válido (ej. 12345678-K o CF).'),
  telefono: z.string().optional(),
  correo: z
    .string()
    .optional()
    .refine((value) => !value || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value), 'Correo no válido.'),
  direccion: z.string().optional(),
  departamento: z.string().optional(),
  municipio: z.string().optional(),
  representante_legal: z.string().optional(),
});

type ClientValues = z.infer<typeof clientSchema>;

function emptyValues(): ClientValues {
  return {
    tipo_cliente: 'INDIVIDUAL',
    nombres: '',
    apellidos: '',
    razon_social: '',
    nombre_comercial: '',
    dpi: '',
    nit: '',
    telefono: '',
    correo: '',
    direccion: '',
    departamento: '',
    municipio: '',
    representante_legal: '',
  };
}

function toFormValues(client: Client): ClientValues {
  const person = client.person;
  const entity = client.legal_entity;
  return {
    tipo_cliente: client.tipo_cliente,
    nombres: person?.nombres ?? '',
    apellidos: person?.apellidos ?? '',
    razon_social: entity?.razon_social ?? '',
    nombre_comercial: entity?.nombre_comercial ?? '',
    dpi: person?.dpi ?? '',
    nit: person?.nit ?? entity?.nit ?? '',
    telefono: person?.telefono ?? '',
    correo: person?.correo ?? '',
    direccion: person?.direccion ?? '',
    departamento: person?.departamento ?? '',
    municipio: person?.municipio ?? '',
    representante_legal: entity?.representante_legal ?? '',
  };
}

function toPayload(values: ClientValues): ClientCreate {
  if (values.tipo_cliente === 'JURIDICA') {
    return {
      tipo_cliente: 'JURIDICA',
      legal_entity: {
        razon_social: values.razon_social ?? '',
        nombre_comercial: values.nombre_comercial ?? null,
        nit: values.nit || null,
        representante_legal: values.representante_legal ?? null,
      },
    };
  }
  return {
    tipo_cliente: 'INDIVIDUAL',
    person: {
      nombres: values.nombres ?? '',
      apellidos: values.apellidos ?? '',
      dpi: values.dpi || null,
      nit: values.nit || null,
      telefono: values.telefono || null,
      correo: values.correo || null,
      direccion: values.direccion || null,
      departamento: values.departamento || null,
      municipio: values.municipio || null,
    },
  };
}

export default function ClientsPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERMISSIONS.clientsCreate);
  const canUpdate = hasPermission(PERMISSIONS.clientsUpdate);
  const canDelete = hasPermission(PERMISSIONS.clientsDelete);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useClients({ skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE, q: debounced || undefined });
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  const form = useForm<ClientValues>({ resolver: zodResolver(clientSchema), defaultValues: emptyValues() });
  const tipo = form.watch('tipo_cliente');

  const openCreate = () => {
    setEditing(null);
    form.reset(emptyValues());
    setOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditing(client);
    form.reset(toFormValues(client));
    setOpen(true);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = toPayload(values);
    if (editing) {
      await updateClient.mutateAsync({ id: editing.id, payload });
    } else {
      await createClient.mutateAsync(payload);
    }
    setOpen(false);
  });

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Personas individuales y jurídicas reutilizables en expedientes y documentos."
        actions={
          canCreate ? (
            <Button type="button" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Nuevo cliente
            </Button>
          ) : null
        }
      />

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, DPI o NIT…"
              className="pl-9"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-10" />
              ))}
            </div>
          ) : !data || data.items.length === 0 ? (
            <EmptyState title="Sin clientes" description="No se encontraron clientes con los criterios actuales." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>DPI</TableHead>
                    <TableHead>NIT</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.display_name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{client.tipo_cliente}</Badge>
                      </TableCell>
                      <TableCell>{client.person?.dpi ?? '—'}</TableCell>
                      <TableCell>{client.person?.nit ?? client.legal_entity?.nit ?? '—'}</TableCell>
                      <TableCell>{client.status}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {canUpdate ? (
                            <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(client)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          ) : null}
                          {canDelete ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (window.confirm(`¿Eliminar a ${client.display_name}?`)) {
                                  void deleteClient.mutateAsync(client.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          ) : null}
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
        <DialogContent onClose={() => setOpen(false)} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <FormField label="Tipo de cliente" htmlFor="tipo_cliente" required>
              <Select id="tipo_cliente" disabled={Boolean(editing)} {...form.register('tipo_cliente')}>
                <option value="INDIVIDUAL">Persona individual</option>
                <option value="JURIDICA">Persona jurídica</option>
              </Select>
            </FormField>

            {tipo === 'JURIDICA' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Razón social" htmlFor="razon_social" required>
                  <Input id="razon_social" {...form.register('razon_social')} />
                </FormField>
                <FormField label="Nombre comercial" htmlFor="nombre_comercial">
                  <Input id="nombre_comercial" {...form.register('nombre_comercial')} />
                </FormField>
                <FormField label="Representante legal" htmlFor="representante_legal">
                  <Input id="representante_legal" {...form.register('representante_legal')} />
                </FormField>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Nombres" htmlFor="nombres" required>
                  <Input id="nombres" {...form.register('nombres')} />
                </FormField>
                <FormField label="Apellidos" htmlFor="apellidos" required>
                  <Input id="apellidos" {...form.register('apellidos')} />
                </FormField>
                <FormField label="DPI" htmlFor="dpi" error={form.formState.errors.dpi?.message}>
                  <Input id="dpi" inputMode="numeric" maxLength={13} {...form.register('dpi')} />
                </FormField>
                <FormField label="Teléfono" htmlFor="telefono">
                  <Input id="telefono" {...form.register('telefono')} />
                </FormField>
                <FormField label="Correo" htmlFor="correo" error={form.formState.errors.correo?.message}>
                  <Input id="correo" type="email" {...form.register('correo')} />
                </FormField>
                <FormField label="Departamento" htmlFor="departamento">
                  <Input id="departamento" {...form.register('departamento')} />
                </FormField>
                <FormField label="Municipio" htmlFor="municipio">
                  <Input id="municipio" {...form.register('municipio')} />
                </FormField>
              </div>
            )}

            <FormField label="NIT" htmlFor="nit" error={form.formState.errors.nit?.message}>
              <Input id="nit" {...form.register('nit')} />
            </FormField>
            <FormField label="Dirección" htmlFor="direccion">
              <Input id="direccion" {...form.register('direccion')} />
            </FormField>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" loading={createClient.isPending || updateClient.isPending}>
                {editing ? 'Guardar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
