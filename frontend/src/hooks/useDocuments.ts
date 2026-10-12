import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/queryClient';
import * as documentsService from '@/services/documents';
import type { DocumentCreate, DocumentListParams, DocumentUpdate } from '@/types';

export function useDocuments(params: DocumentListParams = {}) {
  return useQuery({
    queryKey: queryKeys.documents(params),
    queryFn: () => documentsService.listDocuments(params),
  });
}

export function useDocument(id?: string) {
  return useQuery({
    queryKey: queryKeys.document(id ?? ''),
    queryFn: () => documentsService.getDocument(id as string),
    enabled: Boolean(id),
  });
}

export function useDocumentValidations(id?: string) {
  return useQuery({
    queryKey: queryKeys.documentValidations(id ?? ''),
    queryFn: () => documentsService.getValidations(id as string),
    enabled: Boolean(id),
  });
}

export function useDocumentVersions(id?: string) {
  return useQuery({
    queryKey: queryKeys.documentVersions(id ?? ''),
    queryFn: () => documentsService.listDocumentVersions(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DocumentCreate) => documentsService.createDocument(payload),
    onSuccess: () => {
      toast({ title: 'Borrador creado', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error) =>
      toast({ title: 'No se pudo crear el borrador', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useUpdateDocument(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DocumentUpdate) => documentsService.updateDocument(id, payload),
    onSuccess: () => {
      toast({ title: 'Borrador guardado', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['documents'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.document(id) });
    },
    onError: (error) =>
      toast({ title: 'No se pudo guardar el borrador', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useValidateDocument(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => documentsService.validateDocument(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.documentValidations(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.document(id) });
    },
    onError: (error) =>
      toast({ title: 'No se pudo validar', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useGenerateDocument(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => documentsService.generateDocument(id),
    onSuccess: () => {
      toast({ title: 'Documento generado', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: queryKeys.documentVersions(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.document(id) });
    },
    onError: (error) =>
      toast({ title: 'No se pudo generar el documento', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useReviewValidation(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ resultId, reviewed, correctionNote }: { resultId: string; reviewed: boolean; correctionNote?: string | null }) =>
      documentsService.reviewValidationResult(documentId, resultId, {
        reviewed,
        correction_note: correctionNote ?? null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.documentValidations(documentId) });
    },
    onError: (error) =>
      toast({ title: 'No se pudo registrar la revisión', description: getErrorMessage(error), variant: 'error' }),
  });
}
