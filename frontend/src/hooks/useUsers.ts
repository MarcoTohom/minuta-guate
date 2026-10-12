import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/queryClient';
import * as authService from '@/services/auth';
import * as usersService from '@/services/users';
import type { UserCreate, UserUpdate } from '@/types';

export function useUsers(params: { skip?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.users(params),
    queryFn: () => usersService.listUsers(params),
  });
}

export function useRoles() {
  return useQuery({
    queryKey: queryKeys.roles,
    queryFn: () => authService.listRoles(),
    staleTime: 5 * 60_000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserCreate) => usersService.createUser(payload),
    onSuccess: () => {
      toast({ title: 'Usuario creado', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) =>
      toast({ title: 'No se pudo crear el usuario', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UserUpdate }) =>
      usersService.updateUser(id, payload),
    onSuccess: () => {
      toast({ title: 'Usuario actualizado', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) =>
      toast({ title: 'No se pudo actualizar el usuario', description: getErrorMessage(error), variant: 'error' }),
  });
}
