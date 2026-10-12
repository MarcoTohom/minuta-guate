import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Plus, Trash2, Upload, Wand2 } from 'lucide-react';
import { z } from 'zod';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/ui/spinner';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PERMISSIONS } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  useActivateVersion,
  useCreateFieldsFromVariables,
  useCreateTemplateField,
  useDeleteTemplateField,
  useFieldTypes,
  useTemplate,
  useUpdateTemplateField,
  useUploadTemplateVersion,
} from '@/hooks/useTemplates';
import * as templatesService from '@/services/templates';
import type { DetectedVariable, TemplateAnalysis, TemplateField, TemplateVersion } from '@/types';

const FALLBACK_FIELD_TYPES = [
  'text',
  'textarea',
  'name',
  'dpi',
  'nit',
  'phone',
  'email',
  'integer',
  'decimal',
  'currency',
  'percentage',
  'date',
  'datetime',
  'boolean',
  'select',
  'relation',
  'file',
  'list',
  'computed',
  'richtext',
];

const fieldSchema = z.object({
  key: z.string().min(1, 'La clave es obligatoria.').regex(/^[a-z][a-z0-9_]*$/, 'Use minúsculas, números y guion bajo.'),
  label: z.string().min(1, 'La etiqueta es obligatoria.'),
  field_type: z.string().min(1),
  required: z.boolean(),
  group_key: z.string().optional(),
  help_text: z.string().optional(),
  display_order: z.coerce.number().int().optional(),
});

type FieldValues = z.infer<typeof fieldSchema>;

export default function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();
  const canUpdate = hasPermission(PERMISSIONS.templatesUpdate);
  const canActivate = hasPermission(PERMISSIONS.templatesActivate);

  const { data: template, isLoading } = useTemplate(id);
  const { data: fieldTypes } = useFieldTypes();
  const uploadVersion = useUploadTemplateVersion(id ?? '');
  const activateVersion = useActivateVersion(id ?? '');

  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [analysis, setAnalysis] = useState<TemplateAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);

  const versions: TemplateVersion[] = useMemo(() => template?.versions ?? [], [template?.versions]);
  const selectedVersion = versions.find((version) => version.id === selectedVersionId) ?? versions[0];

  useEffect(() => {
    if (!selectedVersionId && versions.length > 0) {
      const active = versions.find((version) => version.is_active) ?? versions[0];
      setSelectedVersionId(active.id);
    }
  }, [versions, selectedVersionId]);

  const analysisAction = useCreateFieldsFromVariables(id ?? '', selectedVersion?.id ?? '');
  const createField = useCreateTemplateField(selectedVersion?.id ?? '');
  const updateField = useUpdateTemplateField(selectedVersion?.id ?? '');
  const deleteField = useDeleteTemplateField(selectedVersion?.id ?? '');

  const [open, setOpen] = useState(false);
  const [editingField, setEditingField] = useState<TemplateField | null>(null);

  const form = useForm<FieldValues>({
    resolver: zodResolver(fieldSchema),
    defaultValues: { key: '', label: '', field_type: 'text', required: false, group_key: '', help_text: '', display_order: 0 },
  });

  const typeOptions = useMemo(
    () => (fieldTypes && fieldTypes.length > 0 ? fieldTypes.map((entry) => entry.key) : FALLBACK_FIELD_TYPES),
    [fieldTypes],
  );

  if (isLoading) return <LoadingState label="Cargando plantilla…" />;
  if (!template) return <EmptyState title="Plantilla no encontrada" description="El recurso solicitado no existe." />;

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const version = await uploadVersion.mutateAsync({ file, notes: notes || undefined });
    setSelectedVersionId(version.id);
    setNotes('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!selectedVersion) return;
    setAnalyzing(true);
    try {
      const result = await templatesService.analyzeTemplate(template.id, selectedVersion.id);
      setAnalysis(result);
      setSelectedVariables(result.variables.map((variable) => variable.variable));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateFields = async () => {
    if (!selectedVersion) return;
    await analysisAction.mutateAsync({ variables: selectedVariables, replaceExisting: false });
    setAnalysis(null);
  };

  const openCreateField = () => {
    setEditingField(null);
    form.reset({
      key: '',
      label: '',
      field_type: 'text',
      required: false,
      group_key: '',
      help_text: '',
      display_order: (selectedVersion?.fields.length ?? 0) + 1,
    });
    setOpen(true);
  };

  const openEditField = (field: TemplateField) => {
    setEditingField(field);
    form.reset({
      key: field.key,
      label: field.label,
      field_type: field.field_type,
      required: field.required,
      group_key: field.group_key ?? '',
      help_text: field.help_text ?? '',
      display_order: field.display_order,
    });
    setOpen(true);
  };

  const onSubmitField = form.handleSubmit(async (values) => {
    const payload = {
      key: values.key,
      label: values.label,
      field_type: values.field_type,
      required: values.required,
      group_key: values.group_key || null,
      help_text: values.help_text || null,
      display_order: values.display_order ?? 0,
    };
    if (editingField) {
      await updateField.mutateAsync({ id: editingField.id, payload });
    } else if (selectedVersion) {
      await createField.mutateAsync(payload);
    }
    setOpen(false);
  });

  return (
    <div>
      <PageHeader
        title={template.name}
        description={template.description ?? 'Plantilla DOCX versionada.'}
        actions={
          <Link to="/templates" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Versiones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {versions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no hay versiones cargadas.</p>
            ) : (
              <ul className="space-y-2">
                {versions.map((version) => (
                  <li key={version.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedVersionId(version.id)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-md border p-2 text-left text-sm transition-colors',
                        selectedVersion?.id === version.id ? 'border-primary bg-accent' : 'hover:bg-accent',
                      )}
                    >
                      <span>
                        <span className="font-medium">v{version.version_number}</span>
                        <span className="ml-2 text-muted-foreground">{version.file_original_name ?? '—'}</span>
                      </span>
                      {version.is_active ? <Badge variant="success">Activa</Badge> : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {canActivate && selectedVersion && !selectedVersion.is_active ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                loading={activateVersion.isPending}
                onClick={() => void activateVersion.mutateAsync(selectedVersion.id)}
              >
                <Check className="h-4 w-4" />
                Activar esta versión
              </Button>
            ) : null}

            <div className="space-y-2 border-t pt-3">
              <p className="text-sm font-medium">Cargar nueva versión</p>
              <input
                ref={fileRef}
                type="file"
                accept=".docx"
                className="block w-full text-sm"
                aria-label="Archivo DOCX"
              />
              <Input
                placeholder="Notas (opcional)"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
              <Button
                type="button"
                size="sm"
                className="w-full"
                disabled={!canUpdate}
                loading={uploadVersion.isPending}
                onClick={() => void handleUpload()}
              >
                <Upload className="h-4 w-4" />
                Subir versión
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Campos de la versión</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!selectedVersion}
                loading={analyzing}
                onClick={() => void handleAnalyze()}
              >
                <Wand2 className="h-4 w-4" />
                Analizar
              </Button>
              <Button type="button" size="sm" disabled={!selectedVersion || !canUpdate} onClick={openCreateField}>
                <Plus className="h-4 w-4" />
                Campo
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis ? (
              <div className="rounded-md border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Variables detectadas ({analysis.variables.length})
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    loading={analysisAction.isPending}
                    disabled={selectedVariables.length === 0}
                    onClick={() => void handleGenerateFields()}
                  >
                    Generar campos
                  </Button>
                </div>
                {analysis.variables.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No se detectaron variables en el documento.</p>
                ) : (
                  <ul className="grid gap-1 sm:grid-cols-2">
                    {analysis.variables.map((variable: DetectedVariable) => (
                      <li key={variable.variable} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={selectedVariables.includes(variable.variable)}
                          onCheckedChange={(checked) =>
                            setSelectedVariables((prev) =>
                              checked
                                ? [...prev, variable.variable]
                                : prev.filter((item) => item !== variable.variable),
                            )
                          }
                        />
                        <span className="truncate">{variable.variable}</span>
                        <Badge variant="outline">{variable.suggested_field_type}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}

            {!selectedVersion || selectedVersion.fields.length === 0 ? (
              <EmptyState
                title="Sin campos"
                description="Analice el documento y genere campos, o cree uno manualmente."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clave</TableHead>
                    <TableHead>Etiqueta</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Sección</TableHead>
                    <TableHead>Req.</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedVersion.fields.map((field) => (
                    <TableRow key={field.id}>
                      <TableCell className="font-mono text-xs">{field.key}</TableCell>
                      <TableCell>{field.label}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{field.field_type}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{field.group_key ?? '—'}</TableCell>
                      <TableCell>{field.required ? 'Sí' : 'No'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={!canUpdate}
                            onClick={() => openEditField(field)}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={!canUpdate}
                            onClick={() => {
                              if (window.confirm(`¿Eliminar el campo ${field.key}?`)) {
                                void deleteField.mutateAsync(field.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
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
            <DialogTitle>{editingField ? 'Editar campo' : 'Nuevo campo'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={onSubmitField} noValidate>
            <FormField label="Clave" htmlFor="field_key" required error={form.formState.errors.key?.message}>
              <Input id="field_key" {...form.register('key')} />
            </FormField>
            <FormField label="Etiqueta" htmlFor="field_label" required error={form.formState.errors.label?.message}>
              <Input id="field_label" {...form.register('label')} />
            </FormField>
            <FormField label="Tipo" htmlFor="field_type" required>
              <Select id="field_type" {...form.register('field_type')}>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Sección (group_key)" htmlFor="field_group">
              <Input id="field_group" {...form.register('group_key')} />
            </FormField>
            <FormField label="Texto de ayuda" htmlFor="field_help">
              <Input id="field_help" {...form.register('help_text')} />
            </FormField>
            <FormField label="Orden" htmlFor="field_order">
              <Input id="field_order" type="number" {...form.register('display_order')} />
            </FormField>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.watch('required')}
                onCheckedChange={(checked) => form.setValue('required', checked)}
              />
              Campo obligatorio
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" loading={createField.isPending || updateField.isPending}>
                {editingField ? 'Guardar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
