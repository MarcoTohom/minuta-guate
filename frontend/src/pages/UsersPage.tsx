import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus } from 'lucide-react';
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
import { useAuth } from '@/hooks/useAuth';
import { useCreateUser, useRoles, useUpdateUser, useUsers } from '@/hooks/useUsers';
import type { User } from '@/types';

const createSchema = z.object({
  username: z.string().min(3, 'Mínimo 3 caracteres.'),
  email: z.string().email('Correo no válido.'),
  full_name: z.string().min(3, 'Ingrese el nombre completo.'),
  password: z.string().min(8, 'Mínimo 8 caracteres.'),
  role_id: z.string().min(1, 'Seleccione un rol.'),
});

const editSchema = z.object({
  full_name: z.string().min(3, 'Ingrese el nombre completo.'),
  email: z.string().email('Correo no válido.'),
  role_id: z.string().min(1, 'Seleccione un rol.'),
  status: z.string().min(1),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

export default function UsersPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERMISSIONS.usersCreate);
  const canUpdate = hasPermission(PERMISSIONS.usersUpdate);

  const { data: users, isLoading } = useUsers();
  const { data: roles } = useRoles();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { username: '', email: '', full_name: '', password: '', role_id: '' },
  });

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { full_name: '', email: '', role_id: '', status: 'ACTIVE' },
  });

  const roleName = (roleId: string | null) => roles?.find((role) => role.id === roleId)?.name ?? '—';

  const openCreate = () => {
    setEditing(null);
    createForm.reset({ username: '', email: '', full_name: '', password: '', role_id: roles?.[0]?.id ?? '' });
    setOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    editForm.reset({
      full_name: user.full_name,
      email: user.email,
      role_id: user.role_id ?? '',
      status: user.status,
    });
    setOpen(true);
  };

  const onCreate = createForm.handleSubmit(async (values) => {
    await createUser.mutateAsync(values);
    setOpen(false);
  });

  const onEdit = editForm.handleSubmit(async (values) => {
    if (!editing) return;
    await updateUser.mutateAsync({ id: editing.id, payload: values });
    setOpen(false);
  });

  return (
    <div>
      <PageHeader
        title="Usuarios"
        description="Administración de usuarios, roles y estado de las cuentas."
        actions={
          canCreate ? (
            <Button type="button" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Nuevo usuario
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
          ) : !users || users.length === 0 ? (
            <EmptyState title="Sin usuarios" description="No hay usuarios registrados." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{roleName(user.role_id)}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'ACTIVE' ? 'success' : 'secondary'}>{user.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canUpdate ? (
                        <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(user)}>
                          <Pencil className="h-4 w-4" />
                          Editar
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
            <DialogTitle>{editing ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
          </DialogHeader>

          {editing ? (
            <form className="space-y-4" onSubmit={onEdit} noValidate>
              <FormField label="Nombre completo" htmlFor="edit_full_name" required error={editForm.formState.errors.full_name?.message}>
                <Input id="edit_full_name" {...editForm.register('full_name')} />
              </FormField>
              <FormField label="Correo" htmlFor="edit_email" required error={editForm.formState.errors.email?.message}>
                <Input id="edit_email" type="email" {...editForm.register('email')} />
              </FormField>
              <FormField label="Rol" htmlFor="edit_role" required error={editForm.formState.errors.role_id?.message}>
                <Select id="edit_role" {...editForm.register('role_id')}>
                  <option value="">Seleccione…</option>
                  {roles?.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Estado" htmlFor="edit_status" required>
                <Select id="edit_status" {...editForm.register('status')}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </Select>
              </FormField>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" loading={updateUser.isPending}>
                  Guardar
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={onCreate} noValidate>
              <FormField label="Usuario" htmlFor="new_username" required error={createForm.formState.errors.username?.message}>
                <Input id="new_username" {...createForm.register('username')} />
              </FormField>
              <FormField label="Nombre completo" htmlFor="new_full_name" required error={createForm.formState.errors.full_name?.message}>
                <Input id="new_full_name" {...createForm.register('full_name')} />
              </FormField>
              <FormField label="Correo" htmlFor="new_email" required error={createForm.formState.errors.email?.message}>
                <Input id="new_email" type="email" {...createForm.register('email')} />
              </FormField>
              <FormField label="Contraseña" htmlFor="new_password" required error={createForm.formState.errors.password?.message}>
                <Input id="new_password" type="password" {...createForm.register('password')} />
              </FormField>
              <FormField label="Rol" htmlFor="new_role" required error={createForm.formState.errors.role_id?.message}>
                <Select id="new_role" {...createForm.register('role_id')}>
                  <option value="">Seleccione…</option>
                  {roles?.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" loading={createUser.isPending}>
                  Crear
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
