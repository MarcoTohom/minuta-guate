import { QueryClient } from '@tanstack/react-query';

/** Cliente global de TanStack Query con políticas razonables para uso local. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
    mutations: {
      retry: 0,
    },
  },
});

/** Claves de consulta centralizadas para invalidaciones consistentes. */
export const queryKeys = {
  me: ['auth', 'me'] as const,
  roles: ['roles'] as const,
  users: (params?: unknown) => ['users', params ?? {}] as const,
  clients: (params?: unknown) => ['clients', params ?? {}] as const,
  client: (id: string) => ['clients', id] as const,
  cases: (params?: unknown) => ['cases', params ?? {}] as const,
  case: (id: string) => ['cases', id] as const,
  deedTypes: ['deed-types'] as const,
  allDeedTypes: ['deed-types', 'all'] as const,
  fieldTypes: ['field-types'] as const,
  templates: (params?: unknown) => ['templates', params ?? {}] as const,
  template: (id: string) => ['templates', id] as const,
  templateVersions: (id: string) => ['templates', id, 'versions'] as const,
  templateAnalysis: (id: string, versionId?: string) =>
    ['templates', id, 'analysis', versionId ?? 'latest'] as const,
  templateFields: (versionId?: string) => ['template-fields', versionId ?? 'all'] as const,
  documents: (params?: unknown) => ['documents', params ?? {}] as const,
  document: (id: string) => ['documents', id] as const,
  documentValidations: (id: string) => ['documents', id, 'validations'] as const,
  documentVersions: (id: string) => ['documents', id, 'versions'] as const,
  imports: (params?: unknown) => ['imports', params ?? {}] as const,
  importDetail: (id: string) => ['imports', id] as const,
  importRows: (id: string) => ['imports', id, 'rows'] as const,
  quotes: (params?: unknown) => ['quotes', params ?? {}] as const,
  quote: (id: string) => ['quotes', id] as const,
  budgets: (params?: unknown) => ['budgets', params ?? {}] as const,
  budget: (id: string) => ['budgets', id] as const,
  charges: (params?: unknown) => ['charges', params ?? {}] as const,
  charge: (id: string) => ['charges', id] as const,
  payments: (params?: unknown) => ['payments', params ?? {}] as const,
  dashboard: ['dashboard'] as const,
  experimentalReport: ['reports', 'experimental'] as const,
  audit: (params?: unknown) => ['audit', params ?? {}] as const,
  validationRules: (params?: unknown) => ['validation-rules', params ?? {}] as const,
};
