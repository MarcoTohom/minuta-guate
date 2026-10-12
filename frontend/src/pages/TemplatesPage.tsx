import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { FileStack, Plus } from 'lucide-react';
import { z } from 'zod';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { PERMISSIONS } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useDeedTypes } from '@/hooks/useCases';
import { useCreateTemplate, useTemplates } from '@/hooks/useTemplates';

const PAGE_SIZE = 10;

const templateSchema = z.object({
  name: z.string().min(3, 'Ingrese el nombre de la plantilla.'),
  description: z.string().optional(),
  deed_type_id: z.string().optional(),
});

type TemplateValues = z.infer<typeof templateSchema>;

export default function TemplatesPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERMISSIONS.templatesCreate);

  const [page, setPage] = useState(1);
  const { data, isLoading } = useTemplates({ skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE });
  const { data: deedTypes } = useDeedTypes();
  const createTemplate = useCreateTemplate();

  const [open, setOpen] = useState(false);
  const form = useForm<TemplateValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: { name: '', description: '', deed_type_id: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await createTemplate.mutateAsync({
      name: values.name,
      description: values.description || null,
      deed_type_id: values.deed_type_id || null,
    });
    form.reset();
    setOpen(false);
  });

  return (
    <div>
      <PageHeader
        title="Plantillas"
        description="Plantillas DOCX versionadas con sus campos dinámicos."
        actions={
          canCreate ? (
            <Button
              type="button"
              onClick={() => {
                form.reset();
                setOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Nueva plantilla
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
            <EmptyState title="Sin plantillas" description="Cree una plantilla y cargue su primer DOCX." icon={FileStack} />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Versiones</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell className="text-muted-foreground">{template.description ?? '—'}</TableCell>
                      <TableCell>{template.versions.length}</TableCell>
                      <TableCell>
                        <Badge variant={template.active ? 'success' : 'secondary'}>
                          {template.active ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          to={`/templates/${template.id}`}
                          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                        >
                          Administrar
                        </Link>
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
            <DialogTitle>Nueva plantilla</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <FormField label="Nombre" htmlFor="name" required error={form.formState.errors.name?.message}>
              <Input id="name" {...form.register('name')} />
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
            <FormField label="Descripción" htmlFor="description">
              <Textarea id="description" {...form.register('description')} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" loading={createTemplate.isPending}>
                Crear
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
