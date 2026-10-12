import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChargesPage from '@/pages/ChargesPage';
import { useClients } from '@/hooks/useClients';
import { useCharges, useCreateCharge, useRegisterChargePayment } from '@/hooks/useBilling';
import { makeCharge, makeClient } from './fixtures';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'u1', username: 'admin', full_name: 'Admin', email: '', status: 'ACTIVE', role_id: 'r1', role_name: 'ADMINISTRADOR' },
    role: 'ADMINISTRADOR',
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    hasPermission: () => true,
  }),
}));

vi.mock('@/hooks/useClients', () => ({ useClients: vi.fn() }));
vi.mock('@/hooks/useBilling', () => ({
  useCharges: vi.fn(),
  useCreateCharge: vi.fn(),
  useRegisterChargePayment: vi.fn(),
}));

const mockedUseClients = vi.mocked(useClients);
const mockedUseCharges = vi.mocked(useCharges);
const mockedUseCreateCharge = vi.mocked(useCreateCharge);
const mockedUseRegisterPayment = vi.mocked(useRegisterChargePayment);

const createCharge = vi.fn().mockResolvedValue(undefined);
const registerPayment = vi.fn().mockResolvedValue(undefined);

const client = makeClient({ id: 'client-1', display_name: 'Juan Pérez' });

beforeEach(() => {
  mockedUseClients.mockReturnValue({
    data: { items: [client], total: 1, page: 1, page_size: 1, pages: 1 },
    isLoading: false,
  } as unknown as ReturnType<typeof useClients>);
  mockedUseCharges.mockReturnValue({
    data: [makeCharge({ id: 'charge-1', monto: 1000, monto_pagado: 400, saldo: 600 })],
    isLoading: false,
  } as unknown as ReturnType<typeof useCharges>);
  mockedUseCreateCharge.mockReturnValue({
    mutateAsync: createCharge,
    isPending: false,
  } as unknown as ReturnType<typeof useCreateCharge>);
  mockedUseRegisterPayment.mockReturnValue({
    mutateAsync: registerPayment,
    isPending: false,
  } as unknown as ReturnType<typeof useRegisterChargePayment>);
});

describe('ChargesPage', () => {
  it('valida cliente, concepto y monto al crear un cobro', async () => {
    render(<ChargesPage />);
    fireEvent.click(screen.getByRole('button', { name: /Nuevo cobro/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Crear cobro' }));

    expect(await screen.findByText('Seleccione un cliente.')).toBeInTheDocument();
    expect(screen.getByText('Ingrese el concepto.')).toBeInTheDocument();
    expect(screen.getByText('El monto debe ser mayor que cero.')).toBeInTheDocument();
    expect(createCharge).not.toHaveBeenCalled();
  });

  it('crea un cobro con el monto convertido a número', async () => {
    render(<ChargesPage />);
    fireEvent.click(screen.getByRole('button', { name: /Nuevo cobro/ }));

    fireEvent.change(screen.getByLabelText(/Cliente/), { target: { value: 'client-1' } });
    fireEvent.change(screen.getByLabelText(/Concepto/), { target: { value: 'Honorarios notariales' } });
    fireEvent.change(screen.getByLabelText(/Monto/), { target: { value: '1500.50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear cobro' }));

    await waitFor(() => {
      expect(createCharge).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: 'client-1',
          concepto: 'Honorarios notariales',
          monto: 1500.5,
        }),
      );
    });
  });

  it('registra un pago sobre un cobro con saldo pendiente', async () => {
    render(<ChargesPage />);
    fireEvent.click(screen.getByRole('button', { name: /Registrar pago/ }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('Saldo');

    fireEvent.change(screen.getByLabelText(/^Monto/), { target: { value: '600' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    await waitFor(() => {
      expect(registerPayment).toHaveBeenCalledWith(
        expect.objectContaining({ charge_id: 'charge-1', monto: 600 }),
      );
    });
  });
});
