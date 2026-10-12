import { apiClient } from '@/lib/api';
import { asPaginated } from '@/types';
import type {
  FieldTypesCatalogEntry,
  Paginated,
  Template,
  TemplateAnalysis,
  TemplateCreate,
  TemplateField,
  TemplateFieldInput,
  TemplateVersion,
} from '@/types';

export async function listTemplates(params: { skip?: number; limit?: number; deed_type_id?: string } = {}): Promise<
  Paginated<Template>
> {
  const { data } = await apiClient.get<Template[] | Paginated<Template>>('/templates', { params });
  return asPaginated(data);
}

export async function getTemplate(id: string): Promise<Template> {
  const { data } = await apiClient.get<Template>(`/templates/${id}`);
  return data;
}

export async function createTemplate(payload: TemplateCreate): Promise<Template> {
  const { data } = await apiClient.post<Template>('/templates', payload);
  return data;
}

export async function listTemplateVersions(id: string): Promise<TemplateVersion[]> {
  const { data } = await apiClient.get<TemplateVersion[]>(`/templates/${id}/versions`);
  return data;
}

export async function uploadTemplateVersion(
  templateId: string,
  file: File,
  notes?: string,
): Promise<TemplateVersion> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post<TemplateVersion>(`/templates/${templateId}/versions`, form, {
    params: notes ? { notes } : undefined,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function analyzeTemplate(id: string, versionId?: string): Promise<TemplateAnalysis> {
  const { data } = await apiClient.get<TemplateAnalysis>(`/templates/${id}/analysis`, {
    params: versionId ? { version_id: versionId } : undefined,
  });
  return data;
}

export async function createFieldsFromVariables(
  templateId: string,
  versionId: string,
  variables: string[],
  replaceExisting = false,
): Promise<TemplateField[]> {
  const { data } = await apiClient.post<TemplateField[]>(
    `/templates/${templateId}/versions/${versionId}/fields`,
    { variables, replace_existing: replaceExisting },
  );
  return data;
}

export async function activateVersion(templateId: string, versionId: string): Promise<TemplateVersion> {
  const { data } = await apiClient.post<TemplateVersion>(`/templates/${templateId}/activate`, {
    version_id: versionId,
  });
  return data;
}

export async function listTemplateFields(templateVersionId?: string): Promise<TemplateField[]> {
  const { data } = await apiClient.get<TemplateField[]>('/template-fields', {
    params: templateVersionId ? { template_version_id: templateVersionId } : undefined,
  });
  return data;
}

export async function createTemplateField(
  templateVersionId: string,
  payload: TemplateFieldInput,
): Promise<TemplateField> {
  const { data } = await apiClient.post<TemplateField>('/template-fields', payload, {
    params: { template_version_id: templateVersionId },
  });
  return data;
}

export async function updateTemplateField(
  fieldId: string,
  payload: TemplateFieldInput,
): Promise<TemplateField> {
  const { data } = await apiClient.put<TemplateField>(`/template-fields/${fieldId}`, payload);
  return data;
}

export async function deleteTemplateField(fieldId: string): Promise<void> {
  await apiClient.delete(`/template-fields/${fieldId}`);
}

export async function listFieldTypes(): Promise<FieldTypesCatalogEntry[]> {
  const { data } = await apiClient.get<FieldTypesCatalogEntry[]>('/field-types');
  return data;
}
