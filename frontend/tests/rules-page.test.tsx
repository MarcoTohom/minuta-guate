import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RulesPage from '@/pages/RulesPage';
import {
  useAllDeedTypes,
  useCreateDeedType,
  useUpdateDeedType,
  useUpdateValidationRule,
  useValidationRules,
} from '@/hooks/useRules';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'u1', username: 'admin', full_name: 'Admin', email: '', status: 'ACTIVE', role_id: 'r1' },
    role: 'ADMINISTRADOR',
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    hasPermission: () => true,
  }),
}));

vi.mock('@/hooks/useRules', () => ({
  useValidationRules: vi.fn(),
  useUpdateValidationRule: vi.fn(),
  useAllDeedTypes: vi.fn(),
  useCreateDeedType: vi.fn(),
  useUpdateDeedType: vi.fn(),
}));

const mockedUseValidationRules = vi.mocked(useValidationRules);
const mockedUseAllDeedTypes = vi.mocked(useAllDeedTypes);
const mockedUpdateRule = vi.mocked(useUpdateValidationRule);
const mockedCreateDeedType = vi.mocked(useCreateDeedType);
const mockedUpdateDeedType = vi.mocked(useUpdateDeedType);

const updateRule = vi.fn().mockResolvedValue(undefined);
const createDeedType = vi.fn().mockResolvedValue(undefined);
const updateDeedType = vi.fn().mockResolvedValue(undefined);

const DEED_TYPES = [
  {
    id: 'dt-1',
    code: 'COMPRAVENTA_INMUEBLE',
    name: 'Compraventa de inmueble',
    description: 'Traslado de dominio.',
    active: true,
  },
  {
    id: 'dt-2',
    code: 'CONSTITUCION_SOCIEDAD',
    name: 'Constitución de sociedad',
    description: 'Sociedad anónima.',
    active: false,
  },
];

const RULES = [
  {
    rule_id: 'RULE-001',
    name: 'Campos obligatorios por tipo de escritura',
    description: 'Cada tipo exige sus campos.',
    severity: 'ERROR',
    active: true,
    deed_type_codes: null,
    applies_to_all: true,
    default_deed_type_codes: null,
  },
  {
    rule_id: 'RULE-004',
    name: 'Consistencia de DPI del comprador',
    description: 'DPI contra expediente.',
    severity: 'CRITICAL',
    active: true,
    deed_type_codes: ['COMPRAVENTA_INMUEBLE'],
    applies_to_all: false,
    default_deed_type_codes: ['COMPRAVENTA_INMUEBLE'],
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseValidationRules.mockReturnValue({
    data: RULES,
    isLoading: false,
  } as unknown as ReturnType<typeof useValidationRules>);
  mockedUseAllDeedTypes.mockReturnValue({
    data: DEED_TYPES,
    isLoading: false,
  } as unknown as ReturnType<typeof useAllDeedTypes>);
  mockedUpdateRule.mockReturnValue({
    mutateAsync: updateRule,
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateValidationRule>);
  mockedCreateDeedType.mockReturnValue({
    mutateAsync: createDeedType,
    isPending: false,
  } as unknown as ReturnType<typeof useCreateDeedType>);
  mockedUpdateDeedType.mockReturnValue({
    mutateAsync: updateDeedType,
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateDeedType>);
});

describe('RulesPage', () => {
  it('muestra las reglas con su severidad y alcance', () => {
    render(<RulesPage />);
    const table = within(screen.getByRole('table'));
    expect(table.getByText('RULE-001')).toBeInTheDocument();
    expect(table.getByText('RULE-004')).toBeInTheDocument();
    expect(table.getByText('Todos los tipos')).toBeInTheDocument();
    expect(table.getByText('Compraventa de inmueble')).toBeInTheDocument();
  });

  it('permite activar o desactivar una regla', async () => {
    render(<RulesPage />);
    fireEvent.click(screen.getAllByRole('button', { name: /Editar/ })[0]);

    const activeToggle = screen.getByLabelText('Regla activa');
    fireEvent.click(activeToggle);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(updateRule).toHaveBeenCalledWith({
        ruleId: 'RULE-001',
        payload: { severity: 'ERROR', active: false, deed_type_codes: null },
      });
    });
  });

  it('permite limitar una regla a tipos de escritura concretos', async () => {
    render(<RulesPage />);
    fireEvent.click(screen.getAllByRole('button', { name: /Editar/ })[1]);

    // RULE-004 empieza limitada a compraventa; se cambia a constitución.
    fireEvent.click(screen.getByLabelText('Compraventa de inmueble'));
    fireEvent.click(screen.getByLabelText('Constitución de sociedad'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(updateRule).toHaveBeenCalledWith({
        ruleId: 'RULE-004',
        payload: { severity: 'CRITICAL', active: true, deed_type_codes: ['CONSTITUCION_SOCIEDAD'] },
      });
    });
  });

  it('crea un tipo de escritura con el código en mayúsculas', async () => {
    render(<RulesPage />);
    fireEvent.click(screen.getByRole('tab', { name: 'Tipos de escritura' }));
    fireEvent.click(screen.getByRole('button', { name: /Nuevo tipo de escritura/ }));

    fireEvent.change(screen.getByLabelText(/Código/), { target: { value: 'nuevo_tipo' } });
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'Nuevo tipo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    await waitFor(() => {
      expect(createDeedType).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'NUEVO_TIPO', name: 'Nuevo tipo' }),
      );
    });
  });

  it('valida los campos obligatorios al crear un tipo', async () => {
    render(<RulesPage />);
    fireEvent.click(screen.getByRole('tab', { name: 'Tipos de escritura' }));
    fireEvent.click(screen.getByRole('button', { name: /Nuevo tipo de escritura/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    expect(await screen.findByText('Mínimo 2 caracteres.')).toBeInTheDocument();
    expect(screen.getByText('Ingrese el nombre.')).toBeInTheDocument();
    expect(createDeedType).not.toHaveBeenCalled();
  });

  it('edita un tipo de escritura existente', async () => {
    render(<RulesPage />);
    fireEvent.click(screen.getByRole('tab', { name: 'Tipos de escritura' }));
    fireEvent.click(screen.getAllByRole('button', { name: /Editar/ })[1]);

    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'Constitución renombrada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(updateDeedType).toHaveBeenCalledWith({
        id: 'dt-2',
        payload: expect.objectContaining({ name: 'Constitución renombrada', active: false }),
      });
    });
  });
});
