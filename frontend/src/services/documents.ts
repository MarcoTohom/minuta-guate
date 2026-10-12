import { apiClient, downloadFile } from '@/lib/api';
import { asPaginated } from '@/types';
import type {
  DocumentCreate,
  DocumentDraft,
  DocumentListParams,
  DocumentUpdate,
  DocumentVersion,
  Paginated,
  ValidationResult,
  ValidationSummary,
} from '@/types';

export async function listDocuments(
  params: DocumentListParams = {},
): Promise<Paginated<DocumentDraft>> {
  const { data } = await apiClient.get<DocumentDraft[] | Paginated<DocumentDraft>>('/documents', {
    params,
  });
  return asPaginated(data);
}

export async function getDocument(id: string): Promise<DocumentDraft> {
  const { data } = await apiClient.get<DocumentDraft>(`/documents/${id}`);
  return data;
}

export async function createDocument(payload: DocumentCreate): Promise<DocumentDraft> {
  const { data } = await apiClient.post<DocumentDraft>('/documents', payload);
  return data;
}

export async function updateDocument(id: string, payload: DocumentUpdate): Promise<DocumentDraft> {
  const { data } = await apiClient.put<DocumentDraft>(`/documents/${id}`, payload);
  return data;
}

export async function validateDocument(id: string): Promise<ValidationSummary> {
  const { data } = await apiClient.post<ValidationSummary>(`/documents/${id}/validate`);
  return data;
}

export async function getValidations(id: string): Promise<ValidationSummary> {
  const { data } = await apiClient.get<ValidationSummary>(`/documents/${id}/validations`);
  return data;
}

export async function reviewValidationResult(
  documentId: string,
  resultId: string,
  payload: { reviewed: boolean; correction_note?: string | null },
): Promise<ValidationResult> {
  const { data } = await apiClient.post<ValidationResult>(
    `/documents/${documentId}/validations/${resultId}/review`,
    payload,
  );
  return data;
}

export async function generateDocument(id: string): Promise<DocumentVersion> {
  const { data } = await apiClient.post<DocumentVersion>(`/documents/${id}/generate`);
  return data;
}

export async function listDocumentVersions(id: string): Promise<DocumentVersion[]> {
  const { data } = await apiClient.get<DocumentVersion[]>(`/documents/${id}/versions`);
  return data;
}

export async function downloadDocumentVersion(
  documentId: string,
  versionId: string,
  filename: string,
): Promise<void> {
  await downloadFile(`/documents/${documentId}/versions/${versionId}/download`, filename);
}
