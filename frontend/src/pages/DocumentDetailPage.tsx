import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, FileCheck2, Save, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/ui/spinner';
import { PERMISSIONS } from '@/lib/permissions';
import { cn, formatDateTime } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  useDocument,
  useDocumentValidations,
  useDocumentVersions,
  useGenerateDocument,
  useReviewValidation,
  useUpdateDocument,
  useValidateDocument,
} from '@/hooks/useDocuments';
import { useTemplateFields } from '@/hooks/useTemplates';
import { DynamicForm, type DynamicFormHandle } from '@/features/forms/DynamicForm';
import { InconsistencyPanel } from '@/features/validation/InconsistencyPanel';
import * as documentsService from '@/services/documents';
import type { ValidationResult } from '@/types';

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const documentId = id ?? '';
  const { hasPermission } = useAuth();

  const { data: document, isLoading } = useDocument(documentId);
  const versionId = document?.template_version_id ?? undefined;
  const { data: fields, isLoading: fieldsLoading } = useTemplateFields(versionId);
  const validations = useDocumentValidations(documentId);
  const versions = useDocumentVersions(documentId);

  const updateDocument = useUpdateDocument(documentId);
  const validateDocument = useValidateDocument(documentId);
  const generateDocument = useGenerateDocument(documentId);
  const reviewValidation = useReviewValidation(documentId);

  const formRef = useRef<DynamicFormHandle>(null);
  const initializedRef = useRef<string>('');
  const [title, setTitle] = useState('');

  const fieldList = useMemo(() => fields ?? [], [fields]);

  const initializedKey = document ? `${document.id}:${document.template_version_id ?? ''}` : '';

  useEffect(() => {
    if (document && fieldList.length > 0 && initializedRef.current !== initializedKey) {
      formRef.current?.reset(document.field_data ?? {});
      initializedRef.current = initializedKey;
    }
  }, [document, fieldList, initializedKey]);

  useEffect(() => {
    if (document?.id) setTitle(document.title);
  }, [document?.id, document?.title]);

  if (isLoading) return <LoadingState label="Cargando borrador…" />;
  if (!document) {
    return <EmptyState title="Borrador no encontrado" description="El recurso solicitado no existe." />;
  }

  const summary = validations.data ?? null;
  const canGenerate = Boolean(summary?.can_generate);

  const save = async () => {
    const values = formRef.current?.getValues() ?? document.field_data ?? {};
    await updateDocument.mutateAsync({ title, field_data: values });
  };

  const handleSave = () => void save();

  const handleValidate = async () => {
    await save();
    await validateDocument.mutateAsync();
  };

  const handleGenerate = async () => {
    await save();
    await generateDocument.mutateAsync();
  };

  const handleCorrect = (result: ValidationResult) => {
    if (!result.field_key || result.expected_value == null) return;
    formRef.current?.setValue(result.field_key, result.expected_value);
    formRef.current?.focusField(result.field_key);
  };

  const canUpdate = hasPermission(PERMISSIONS.documentsUpdate);
  const canGeneratePermission = hasPermission(PERMISSIONS.documentsGenerate);

  return (
    <div>
      <PageHeader
        title={document.title}
        description={`Borrador · ${document.status}`}
        actions={
          <Link to="/documents" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos del documento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  aria-label="Título del borrador"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="max-w-md"
                />
                <Badge variant="secondary">{document.status}</Badge>
                {document.template_version_id ? (
                  <Badge variant="outline">Plantilla v{document.template_version_id.slice(0, 8)}</Badge>
                ) : (
                  <Badge variant="warning">Sin plantilla</Badge>
                )}
              </div>

              {fieldsLoading ? (
                <LoadingState label="Cargando campos…" />
              ) : !document.template_version_id ? (
                <EmptyState
                  title="Sin plantilla asignada"
                  description="Asigne una versión de plantilla al borrador para capturar datos."
                />
              ) : fieldList.length === 0 ? (
                <EmptyState
                  title="Sin campos definidos"
                  description="La versión de plantilla no tiene campos configurados."
                />
              ) : (
                <DynamicForm ref={formRef} fields={fieldList} defaultValues={document.field_data ?? {}} />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Validación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {summary ? (
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-600">✓</span>
                    {summary.total - summary.critical - summary.error - summary.warning - summary.info} sin problemas
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-amber-500">⚠</span>
                    {summary.warning} advertencias
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-orange-600">✕</span>
                    {summary.error} errores
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-600">⛔</span>
                    {summary.critical} críticos
                  </li>
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Aún no se ha validado el borrador.</p>
              )}

              <div className="flex flex-col gap-2">
                <Button type="button" variant="outline" disabled={!canUpdate} loading={updateDocument.isPending} onClick={handleSave}>
                  <Save className="h-4 w-4" />
                  Guardar
                </Button>
                <Button type="button" variant="secondary" loading={validateDocument.isPending} onClick={() => void handleValidate()}>
                  <ShieldCheck className="h-4 w-4" />
                  Validar
                </Button>
                <Button
                  type="button"
                  variant="success"
                  disabled={!canGeneratePermission || !canGenerate}
                  loading={generateDocument.isPending}
                  onClick={() => void handleGenerate()}
                  title={canGenerate ? 'Generar DOCX' : 'Requiere validación sin errores críticos'}
                >
                  <FileCheck2 className="h-4 w-4" />
                  Generar DOCX
                </Button>
                {!canGenerate ? (
                  <p className="text-xs text-muted-foreground">
                    El botón de generación se habilita cuando no existan errores críticos.
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Versiones generadas</CardTitle>
            </CardHeader>
            <CardContent>
              {!versions.data || versions.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">Todavía no se ha generado ninguna versión.</p>
              ) : (
                <ul className="space-y-2">
                  {versions.data.map((version) => (
                    <li key={version.id} className="flex items-center justify-between gap-2 text-sm">
                      <span>
                        v{version.version_number} · {formatDateTime(version.created_at)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          void documentsService.downloadDocumentVersion(
                            documentId,
                            version.id,
                            `${document.title}-v${version.version_number}.docx`,
                          )
                        }
                      >
                        <Download className="h-4 w-4" />
                        Descargar
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-4">
        <InconsistencyPanel
          summary={summary}
          onGoToField={(fieldKey) => formRef.current?.focusField(fieldKey)}
          onCorrect={handleCorrect}
          onMarkReviewed={(result, reviewed) =>
            reviewValidation.mutate({ resultId: result.id, reviewed })
          }
          busyResultId={reviewValidation.isPending ? reviewValidation.variables?.resultId ?? null : null}
        />
      </div>
    </div>
  );
}
