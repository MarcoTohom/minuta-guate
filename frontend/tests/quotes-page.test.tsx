import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import QuotesPage from '@/pages/QuotesPage';
import { useClients } from '@/hooks/useClients';
import { useCreateQuote, useQuotes, useUpdateQuote } from '@/hooks/useBilling';
import { makeClient, makeQuote } from './fixtures';

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
  useQuotes: vi.fn(),
  useCreateQuote: vi.fn(),
  useUpdateQuote: vi.fn(),
}));

const mockedUseClients = vi.mocked(useClients);
const mockedUseQuotes = vi.mocked(useQuotes);
const mockedUseCreateQuote = vi.mocked(useCreateQuote);
const mockedUseUpdateQuote = vi.mocked(useUpdateQuote);

const createQuote = vi.fn().mockResolvedValue(undefined);
const updateQuote = vi.fn().mockResolvedValue(undefined);

const client = makeClient({ id: 'client-1', display_name: 'Juan Pérez' });

beforeEach(() => {
  mockedUseClients.mockReturnValue({
    data: { items: [client], total: 1, page: 1, page_size: 1, pages: 1 },
    isLoading: false,
  } as unknown as ReturnType<typeof useClients>);
  mockedUseQuotes.mockReturnValue({
    data: [makeQuote()],
    isLoading: false,
  } as unknown as ReturnType<typeof useQuotes>);
  mockedUseCreateQuote.mockReturnValue({
    mutateAsync: createQuote,
    isPending: false,
  } as unknown as ReturnType<typeof useCreateQuote>);
  mockedUseUpdateQuote.mockReturnValue({
    mutateAsync: updateQuote,
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateQuote>);
});

describe('QuotesPage', () => {
  it('abre el formulario de nueva cotización', () => {
    render(<QuotesPage />);
    fireEvent.click(screen.getByRole('button', { name: /Nueva cotización/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Nueva cotización' })).toBeInTheDocument();
  });

  it('valida el cliente y los ítems obligatorios', async () => {
    render(<QuotesPage />);
    fireEvent.click(screen.getByRole('button', { name: /Nueva cotización/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Crear cotización' }));
    expect(await screen.findByText('Seleccione un cliente.')).toBeInTheDocument();
    expect(screen.getByText('Describa el servicio.')).toBeInTheDocument();
    expect(createQuote).not.toHaveBeenCalled();
  });

  it('calcula los totales y envía la cotización', async () => {
    render(<QuotesPage />);
    fireEvent.click(screen.getByRole('button', { name: /Nueva cotización/ }));

    fireEvent.change(screen.getByLabelText(/Cliente/), { target: { value: 'client-1' } });
    fireEvent.change(screen.getByPlaceholderText('Descripción'), { target: { value: 'Trámite de compraventa' } });
    fireEvent.change(screen.getByPlaceholderText('Cant.'), { target: { value: '2' } });
    fireEvent.change(screen.getByPlaceholderText('Precio'), { target: { value: '100' } });

    await waitFor(() => {
      expect(screen.getAllByText(/Q\s?200[.,]00/).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Crear cotización' }));

    await waitFor(() => {
      expect(createQuote).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: 'client-1',
          descuento: 0,
          items: [
            {
              descripcion: 'Trámite de compraventa',
              cantidad: 2,
              precio_unitario: 100,
              order_index: 0,
            },
          ],
        }),
      );
    });
  });

  it('permite agregar y quitar ítems', () => {
    render(<QuotesPage />);
    fireEvent.click(screen.getByRole('button', { name: /Nueva cotización/ }));
    expect(screen.getByRole('button', { name: 'Quitar ítem 1' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /Agregar/ }));
    expect(screen.getByRole('button', { name: 'Quitar ítem 1' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Quitar ítem 2' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Quitar ítem 2' }));
    expect(screen.queryByRole('button', { name: 'Quitar ítem 2' })).not.toBeInTheDocument();
  });
});
