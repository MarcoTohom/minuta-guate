import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { queryKeys } from '@/lib/queryClient';
import * as clientsService from '@/services/clients';
import type { Client } from '@/types';
import { errorInputClass, asString } from './shared';
import type { FieldControlProps } from './types';

/**
 * Campo de relación con autocompletado de clientes (`GET /clients`).
 *
 * Al seleccionar un cliente se guarda su nombre visible como valor y se
 * notifica mediante `onRelationSelect` para que el formulario autocomplete los
 * campos relacionados (DPI, NIT, etc.).
 */
export function RelationInput({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  id,
  onRelationSelect,
}: FieldControlProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const current = asString(value);
  const isDisabled = disabled || field.readonly;

  const { data, isFetching } = useQuery({
    queryKey: queryKeys.clients({ q: query, relation: field.key }),
    queryFn: () => clientsService.listClients({ q: query || undefined, limit: 10 }),
    enabled: open && !isDisabled,
    staleTime: 60_000,
  });

  const items = data?.items ?? [];

  const select = (client: Client) => {
    onChange(client.display_name);
    onRelationSelect?.(field, client);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type="text"
          autoComplete="off"
          value={open ? query : current}
          placeholder={field.help_text ?? 'Buscar cliente…'}
          disabled={isDisabled}
          aria-invalid={Boolean(error)}
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          role="combobox"
          className={`pl-9 ${errorInputClass(Boolean(error))}`}
          onFocus={() => {
            setOpen(true);
            setQuery('');
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
            onBlur?.();
          }}
        />
      </div>
      {open ? (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {isFetching ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">Buscando…</li>
          ) : items.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</li>
          ) : (
            items.map((client) => (
              <li key={client.id} role="option" aria-selected={false}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-accent"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => select(client)}
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{client.display_name}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
