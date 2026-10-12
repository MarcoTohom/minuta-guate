import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/queryClient';
import * as templatesService from '@/services/templates';
import type { TemplateCreate, TemplateFieldInput } from '@/types';

export function useTemplates(params: { skip?: number; limit?: number; deed_type_id?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.templates(params),
    queryFn: () => templatesService.listTemplates(params),
  });
}

export function useTemplate(id?: string) {
  return useQuery({
    queryKey: queryKeys.template(id ?? ''),
    queryFn: () => templatesService.getTemplate(id as string),
    enabled: Boolean(id),
  });
}

export function useFieldTypes() {
  return useQuery({
    queryKey: queryKeys.fieldTypes,
    queryFn: () => templatesService.listFieldTypes(),
    staleTime: 5 * 60_000,
  });
}

export function useTemplateFields(versionId?: string) {
  return useQuery({
    queryKey: queryKeys.templateFields(versionId),
    queryFn: () => templatesService.listTemplateFields(versionId),
    enabled: Boolean(versionId),
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TemplateCreate) => templatesService.createTemplate(payload),
    onSuccess: () => {
      toast({ title: 'Plantilla creada', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (error) =>
      toast({ title: 'No se pudo crear la plantilla', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useUploadTemplateVersion(templateId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, notes }: { file: File; notes?: string }) =>
      templatesService.uploadTemplateVersion(templateId, file, notes),
    onSuccess: () => {
      toast({ title: 'Versión cargada', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: queryKeys.template(templateId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.templateVersions(templateId) });
    },
    onError: (error) =>
      toast({ title: 'No se pudo cargar la versión', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useActivateVersion(templateId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (versionId: string) => templatesService.activateVersion(templateId, versionId),
    onSuccess: () => {
      toast({ title: 'Versión activada', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: queryKeys.template(templateId) });
    },
    onError: (error) =>
      toast({ title: 'No se pudo activar la versión', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useCreateFieldsFromVariables(templateId: string, versionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ variables, replaceExisting }: { variables: string[]; replaceExisting?: boolean }) =>
      templatesService.createFieldsFromVariables(templateId, versionId, variables, replaceExisting),
    onSuccess: () => {
      toast({ title: 'Campos generados', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: queryKeys.template(templateId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.templateFields(versionId) });
    },
    onError: (error) =>
      toast({ title: 'No se pudieron generar los campos', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useCreateTemplateField(versionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TemplateFieldInput) =>
      templatesService.createTemplateField(versionId, payload),
    onSuccess: () => {
      toast({ title: 'Campo creado', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: queryKeys.templateFields(versionId) });
    },
    onError: (error) =>
      toast({ title: 'No se pudo crear el campo', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useUpdateTemplateField(versionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TemplateFieldInput }) =>
      templatesService.updateTemplateField(id, payload),
    onSuccess: () => {
      toast({ title: 'Campo actualizado', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: queryKeys.templateFields(versionId) });
    },
    onError: (error) =>
      toast({ title: 'No se pudo actualizar el campo', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useDeleteTemplateField(versionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => templatesService.deleteTemplateField(id),
    onSuccess: () => {
      toast({ title: 'Campo eliminado', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: queryKeys.templateFields(versionId) });
    },
    onError: (error) =>
      toast({ title: 'No se pudo eliminar el campo', description: getErrorMessage(error), variant: 'error' }),
  });
}
