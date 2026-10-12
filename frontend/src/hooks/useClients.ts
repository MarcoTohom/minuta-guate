import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/queryClient';
import * as clientsService from '@/services/clients';
import type { ClientCreate, ClientListParams, ClientUpdate } from '@/types';

/** Lista clientes (paginados) según los filtros indicados. */
export function useClients(params: ClientListParams = {}) {
  return useQuery({
    queryKey: queryKeys.clients(params),
    queryFn: () => clientsService.listClients(params),
  });
}

/** Obtiene un cliente por id. */
export function useClient(id?: string) {
  return useQuery({
    queryKey: queryKeys.client(id ?? ''),
    queryFn: () => clientsService.getClient(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClientCreate) => clientsService.createClient(payload),
    onSuccess: () => {
      toast({ title: 'Cliente creado', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error) =>
      toast({ title: 'No se pudo crear el cliente', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ClientUpdate }) =>
      clientsService.updateClient(id, payload),
    onSuccess: () => {
      toast({ title: 'Cliente actualizado', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error) =>
      toast({ title: 'No se pudo actualizar el cliente', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientsService.deleteClient(id),
    onSuccess: () => {
      toast({ title: 'Cliente eliminado', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error) =>
      toast({ title: 'No se pudo eliminar el cliente', description: getErrorMessage(error), variant: 'error' }),
  });
}
