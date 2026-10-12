import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/queryClient';
import * as importsService from '@/services/imports';

export function useImports(params: { skip?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.imports(params),
    queryFn: () => importsService.listImports(params),
  });
}

export function useImport(id?: string) {
  return useQuery({
    queryKey: queryKeys.importDetail(id ?? ''),
    queryFn: () => importsService.getImport(id as string),
    enabled: Boolean(id),
  });
}

export function useImportRows(id?: string) {
  return useQuery({
    queryKey: queryKeys.importRows(id ?? ''),
    queryFn: () => importsService.getImportRows(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, targetModule }: { file: File; targetModule?: string }) =>
      importsService.createImport(file, targetModule ?? 'clients'),
    onSuccess: () => {
      toast({ title: 'Archivo cargado', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['imports'] });
    },
    onError: (error) =>
      toast({ title: 'No se pudo cargar el archivo', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function usePreviewImport(id: string) {
  return useMutation({
    mutationFn: () => importsService.previewImport(id),
    onError: (error) =>
      toast({ title: 'No se pudo previsualizar', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useProcessImport(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mapping: Record<string, string>) => importsService.processImport(id, mapping),
    onSuccess: () => {
      toast({ title: 'Mapeo aplicado', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: queryKeys.importDetail(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.importRows(id) });
    },
    onError: (error) =>
      toast({ title: 'No se pudo procesar la importación', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useConfirmImport(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => importsService.confirmImport(id),
    onSuccess: () => {
      toast({ title: 'Importación confirmada', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['imports'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.importDetail(id) });
    },
    onError: (error) =>
      toast({ title: 'No se pudo confirmar la importación', description: getErrorMessage(error), variant: 'error' }),
  });
}
