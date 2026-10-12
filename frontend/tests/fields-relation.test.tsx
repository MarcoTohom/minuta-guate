import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RelationInput } from '@/features/forms/fields/RelationInput';
import * as clientsService from '@/services/clients';
import type { Client } from '@/types';
import { makeClient, makeField } from './fixtures';

vi.mock('@/services/clients', () => ({
  listClients: vi.fn(),
}));

const mockedListClients = vi.mocked(clientsService.listClients);

function renderRelation(options: {
  field?: ReturnType<typeof makeField>;
  value?: string;
  onChange?: (value: unknown) => void;
  onRelationSelect?: (field: ReturnType<typeof makeField>, client: Client) => void;
} = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const field = options.field ?? makeField({ key: 'comprador_id', field_type: 'relation', label: 'Comprador' });
  return render(
    <QueryClientProvider client={queryClient}>
      <RelationInput
        field={field}
        value={options.value ?? ''}
        onChange={options.onChange ?? vi.fn()}
        onRelationSelect={options.onRelationSelect}
        id="field-comprador_id"
      />
    </QueryClientProvider>,
  );
}

describe('RelationInput', () => {
  it('busca clientes en /clients al abrir el autocompletado', async () => {
    mockedListClients.mockResolvedValue({
      items: [makeClient({ id: 'c1', display_name: 'Ana López' })],
      total: 1,
      page: 1,
      page_size: 1,
      pages: 1,
    });
    renderRelation();
    fireEvent.focus(screen.getByRole('combobox'));
    expect(await screen.findByRole('option')).toHaveTextContent('Ana López');
    expect(mockedListClients).toHaveBeenCalled();
  });

  it('guarda el nombre visible y notifica la selección de un cliente', async () => {
    const client = makeClient({ id: 'c1', display_name: 'Ana López' });
    mockedListClients.mockResolvedValue({ items: [client], total: 1, page: 1, page_size: 1, pages: 1 });
    const onChange = vi.fn();
    const onRelationSelect = vi.fn();
    renderRelation({ onChange, onRelationSelect });

    fireEvent.focus(screen.getByRole('combobox'));
    const option = await screen.findByRole('option');
    fireEvent.click(option.querySelector('button')!);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('Ana López');
    });
    expect(onRelationSelect).toHaveBeenCalledWith(expect.objectContaining({ key: 'comprador_id' }), client);
  });

  it('muestra un mensaje cuando no hay resultados', async () => {
    mockedListClients.mockResolvedValue({ items: [], total: 0, page: 1, page_size: 0, pages: 0 });
    renderRelation();
    fireEvent.focus(screen.getByRole('combobox'));
    expect(await screen.findByText('Sin resultados')).toBeInTheDocument();
  });
});
