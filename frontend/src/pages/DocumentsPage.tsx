import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useSearchParams } from 'react-router-dom';
import { FileText, Plus, Search } from 'lucide-react';
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
import { PERMISSIONS } from '@/lib/permissions';
import { cn, formatDateTime } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useCases } from '@/hooks/useCases';
import { useCreateDocument, useDocuments } from '@/hooks/useDocuments';
import { useTemplates } from '@/hooks/useTemplates';

const PAGE_SIZE = 10;

const documentSchema = z.object({
  case_id: z.string().min(1, 'Seleccione un expediente.'),
  title: z.string().min(3, 'Ingrese un título.'),
  template_id: z.string().optional(),
  template_version_id: z.string().optional(),
});

type DocumentValues = z.infer<typeof documentSchema>;

const STATUSES = ['BORRADOR', 'EN_REVISION', 'VALIDADO', 'GENERADO', 'ANULADO'];

export default function DocumentsPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERMISSIONS.documentsCreate);

  const [searchParams] = useSearchParams();
  const caseFilter = searchParams.get('case_id') ?? undefined;

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { data, isLoading } = useDocuments({
    skip: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    case_id: caseFilter,
    status: status || undefined,
  });
  const { data: cases } = useCases({ limit: 100 });
  const { data: templates } = useTemplates({ limit: 100 });
  const createDocument = useCreateDocument();

  const [open, setOpen] = useState(false);
  const form = useForm<DocumentValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: { case_id: caseFilter ?? '', title: '', template_id: '', template_version_id: '' },
  });

  const selectedTemplateId = form.watch('template_id');
  const selectedTemplate = useMemo(
    () => templates?.items.find((template) => template.id === selectedTemplateId),
    [templates, selectedTemplateId],
  );

  const onSubmit = form.handleSubmit(async (values) => {
    const created = await createDocument.mutateAsync({
      case_id: values.case_id,
      title: values.title,
      template_version_id: values.template_version_id || null,
    });
    setOpen(false);
    form.reset();
    if (created?.id) {
      window.location.assign(`/documents/${created.id}`);
    }
  });

  return (
    <div>
      <PageHeader
        title="Borradores"
        description="Borradores de escrituras con validación de inconsistencias."
        actions={
          canCreate ? (
            <Button
              type="button"
              onClick={() => {
                form.reset({ case_id: caseFilter ?? '', title: '', template_id: '', template_version_id: '' });
                setOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Nuevo borrador
            </Button>
          ) : null
        }
      />

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-xs flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Select
                className="pl-9"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
                aria-label="Filtrar por estado"
              >
                <option value="">Todos los estados</option>
                {STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-10" />
              ))}
            </div>
          ) : !data || data.items.length === 0 ? (
            <EmptyState title="Sin borradores" description="Cree un borrador a partir de un expediente." icon={FileText} />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Versiones</TableHead>
                    <TableHead>Inconsistencias</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell className="font-medium">{document.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{document.status}</Badge>
                      </TableCell>
                      <TableCell>{document.versions.length}</TableCell>
                      <TableCell>{document.validation_results.length}</TableCell>
                      <TableCell>{formatDateTime(document.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Link
                          to={`/documents/${document.id}`}
                          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                        >
                          Abrir
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
            <DialogTitle>Nuevo borrador</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <FormField label="Expediente" htmlFor="case_id" required error={form.formState.errors.case_id?.message}>
              <Select id="case_id" {...form.register('case_id')}>
                <option value="">Seleccione…</option>
                {cases?.items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.numero_expediente}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Título" htmlFor="title" required error={form.formState.errors.title?.message}>
              <Input id="title" {...form.register('title')} />
            </FormField>
            <FormField label="Plantilla" htmlFor="template_id">
              <Select
                id="template_id"
                {...form.register('template_id', {
                  onChange: () => form.setValue('template_version_id', ''),
                })}
              >
                <option value="">Sin plantilla</option>
                {templates?.items.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </Select>
            </FormField>
            {selectedTemplate ? (
              <FormField label="Versión de plantilla" htmlFor="template_version_id">
                <Select id="template_version_id" {...form.register('template_version_id')}>
                  <option value="">Versión activa</option>
                  {selectedTemplate.versions.map((version) => (
                    <option key={version.id} value={version.id}>
                      v{version.version_number}
                      {version.is_active ? ' (activa)' : ''}
                    </option>
                  ))}
                </Select>
              </FormField>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" loading={createDocument.isPending}>
                Crear
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
