import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/queryClient';
import * as budgetsService from '@/services/budgets';
import * as chargesService from '@/services/charges';
import * as paymentsService from '@/services/payments';
import * as quotesService from '@/services/quotes';
import type {
  BudgetCreate,
  ChargeCreate,
  PaymentCreate,
  QuoteCreate,
  QuoteUpdate,
} from '@/types';

/* ----------------------------------- Cotizaciones ---------------------------------- */

export function useQuotes(params: { skip?: number; limit?: number; client_id?: string } = {}) {
  return useQuery({ queryKey: queryKeys.quotes(params), queryFn: () => quotesService.listQuotes(params) });
}

export function useQuote(id?: string) {
  return useQuery({
    queryKey: queryKeys.quote(id ?? ''),
    queryFn: () => quotesService.getQuote(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: QuoteCreate) => quotesService.createQuote(payload),
    onSuccess: () => {
      toast({ title: 'Cotización creada', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
    onError: (error) =>
      toast({ title: 'No se pudo crear la cotización', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useUpdateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: QuoteUpdate }) =>
      quotesService.updateQuote(id, payload),
    onSuccess: () => {
      toast({ title: 'Cotización actualizada', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
    onError: (error) =>
      toast({ title: 'No se pudo actualizar la cotización', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useDuplicateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quotesService.duplicateQuote(id),
    onSuccess: () => {
      toast({ title: 'Cotización duplicada', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
    onError: (error) =>
      toast({ title: 'No se pudo duplicar la cotización', description: getErrorMessage(error), variant: 'error' }),
  });
}

/* ---------------------------------- Presupuestos ---------------------------------- */

export function useBudgets(params: { skip?: number; limit?: number; case_id?: string } = {}) {
  return useQuery({ queryKey: queryKeys.budgets(params), queryFn: () => budgetsService.listBudgets(params) });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BudgetCreate) => budgetsService.createBudget(payload),
    onSuccess: () => {
      toast({ title: 'Presupuesto creado', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
    onError: (error) =>
      toast({ title: 'No se pudo crear el presupuesto', description: getErrorMessage(error), variant: 'error' }),
  });
}

/* ------------------------------------ Cobros -------------------------------------- */

export function useCharges(
  params: { skip?: number; limit?: number; client_id?: string; estado?: string } = {},
) {
  return useQuery({ queryKey: queryKeys.charges(params), queryFn: () => chargesService.listCharges(params) });
}

export function useCreateCharge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ChargeCreate) => chargesService.createCharge(payload),
    onSuccess: () => {
      toast({ title: 'Cobro creado', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['charges'] });
    },
    onError: (error) =>
      toast({ title: 'No se pudo crear el cobro', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useRegisterChargePayment(chargeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PaymentCreate) => chargesService.registerChargePayment(chargeId, payload),
    onSuccess: () => {
      toast({ title: 'Pago registrado', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['charges'] });
      void queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error) =>
      toast({ title: 'No se pudo registrar el pago', description: getErrorMessage(error), variant: 'error' }),
  });
}

/* ------------------------------------ Pagos --------------------------------------- */

export function usePayments(params: { skip?: number; limit?: number } = {}) {
  return useQuery({ queryKey: queryKeys.payments(params), queryFn: () => paymentsService.listPayments(params) });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PaymentCreate) => paymentsService.createPayment(payload),
    onSuccess: () => {
      toast({ title: 'Pago registrado', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['payments'] });
      void queryClient.invalidateQueries({ queryKey: ['charges'] });
    },
    onError: (error) =>
      toast({ title: 'No se pudo registrar el pago', description: getErrorMessage(error), variant: 'error' }),
  });
}
