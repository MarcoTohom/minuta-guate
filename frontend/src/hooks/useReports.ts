import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/queryClient';
import * as dashboardService from '@/services/dashboard';
import * as reportsService from '@/services/reports';
import type { TestExecutionCreate } from '@/services/reports';

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => dashboardService.getDashboard(),
  });
}

export function useAudit(params: { skip?: number; limit?: number; module?: string; action?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.audit(params),
    queryFn: () => dashboardService.listAudit(params),
  });
}

export function useExperimentalReport() {
  return useQuery({
    queryKey: queryKeys.experimentalReport,
    queryFn: () => reportsService.getExperimentalReport(),
  });
}

export function useTestCases(params: { skip?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ['reports', 'test-cases', params],
    queryFn: () => reportsService.listTestCases(params),
  });
}

export function useCreateTestExecution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TestExecutionCreate) => reportsService.createTestExecution(payload),
    onSuccess: () => {
      toast({ title: 'Medición registrada', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: queryKeys.experimentalReport });
    },
    onError: (error) =>
      toast({ title: 'No se pudo registrar la medición', description: getErrorMessage(error), variant: 'error' }),
  });
}
