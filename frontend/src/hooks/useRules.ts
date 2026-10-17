import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/queryClient';
import * as casesService from '@/services/cases';
import * as rulesService from '@/services/rules';
import type { DeedTypeCreate, DeedTypeUpdate, ValidationRuleUpdate } from '@/types';

export function useValidationRules(deedTypeCode?: string) {
  return useQuery({
    queryKey: queryKeys.validationRules(deedTypeCode ?? 'all'),
    queryFn: () => rulesService.listValidationRules(deedTypeCode),
  });
}

export function useUpdateValidationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleId, payload }: { ruleId: string; payload: ValidationRuleUpdate }) =>
      rulesService.updateValidationRule(ruleId, payload),
    onSuccess: () => {
      toast({ title: 'Regla actualizada', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['validation-rules'] });
    },
    onError: (error) =>
      toast({
        title: 'No se pudo actualizar la regla',
        description: getErrorMessage(error),
        variant: 'error',
      }),
  });
}

export function useAllDeedTypes() {
  return useQuery({
    queryKey: queryKeys.allDeedTypes,
    queryFn: () => casesService.listAllDeedTypes(),
    staleTime: 5 * 60_000,
  });
}

export function useCreateDeedType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeedTypeCreate) => casesService.createDeedType(payload),
    onSuccess: () => {
      toast({ title: 'Tipo de escritura creado', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: queryKeys.deedTypes });
      void queryClient.invalidateQueries({ queryKey: ['validation-rules'] });
    },
    onError: (error) =>
      toast({
        title: 'No se pudo crear el tipo de escritura',
        description: getErrorMessage(error),
        variant: 'error',
      }),
  });
}

export function useUpdateDeedType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DeedTypeUpdate }) =>
      casesService.updateDeedType(id, payload),
    onSuccess: () => {
      toast({ title: 'Tipo de escritura actualizado', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: queryKeys.deedTypes });
    },
    onError: (error) =>
      toast({
        title: 'No se pudo actualizar el tipo de escritura',
        description: getErrorMessage(error),
        variant: 'error',
      }),
  });
}
