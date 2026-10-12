import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/queryClient';
import * as casesService from '@/services/cases';
import type { CaseCreate, CaseListParams, CaseUpdate } from '@/types';

export function useCases(params: CaseListParams = {}) {
  return useQuery({
    queryKey: queryKeys.cases(params),
    queryFn: () => casesService.listCases(params),
  });
}

export function useCase(id?: string) {
  return useQuery({
    queryKey: queryKeys.case(id ?? ''),
    queryFn: () => casesService.getCase(id as string),
    enabled: Boolean(id),
  });
}

export function useDeedTypes() {
  return useQuery({
    queryKey: queryKeys.deedTypes,
    queryFn: () => casesService.listDeedTypes(),
    staleTime: 5 * 60_000,
  });
}

export function useCreateCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CaseCreate) => casesService.createCase(payload),
    onSuccess: () => {
      toast({ title: 'Expediente creado', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
    onError: (error) =>
      toast({ title: 'No se pudo crear el expediente', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useUpdateCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CaseUpdate }) =>
      casesService.updateCase(id, payload),
    onSuccess: () => {
      toast({ title: 'Expediente actualizado', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
    onError: (error) =>
      toast({ title: 'No se pudo actualizar el expediente', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useAddParty(caseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { client_id?: string | null; role_in_case: string; order_index?: number; notes?: string | null }) =>
      casesService.addParty(caseId, payload),
    onSuccess: () => {
      toast({ title: 'Participante agregado', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: queryKeys.case(caseId) });
    },
    onError: (error) =>
      toast({ title: 'No se pudo agregar el participante', description: getErrorMessage(error), variant: 'error' }),
  });
}
