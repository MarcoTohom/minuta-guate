import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';
import { tokenStorage } from '@/lib/tokenStorage';
import * as authService from '@/services/auth';

vi.mock('@/services/auth', () => ({
  login: vi.fn(),
  getMe: vi.fn(),
  listRoles: vi.fn(),
  logout: vi.fn(),
}));

const mockedAuth = vi.mocked(authService);

function renderAt(path: string) {
  window.history.pushState({}, '', path);
  return render(<App />);
}

function authenticateAs(roleName: string) {
  tokenStorage.setToken('token-xyz');
  tokenStorage.setRole(roleName);
  const roleId = roleName === 'AUXILIAR' ? 'role-aux' : 'role-admin';
  mockedAuth.getMe.mockResolvedValue({
    id: 'user-1',
    username: roleName.toLowerCase(),
    email: 'user@example.com',
    full_name: 'Usuario de prueba',
    status: 'ACTIVE',
    role_id: roleId,
  });
  mockedAuth.listRoles.mockResolvedValue([{ id: roleId, name: roleName }]);
}

describe('rutas de la aplicación', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  afterEach(() => {
    tokenStorage.clear();
  });

  it('redirige al login cuando no hay sesión', async () => {
    renderAt('/dashboard');
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('permite el acceso a una ruta protegida con sesión activa', async () => {
    authenticateAs('ADMINISTRADOR');
    renderAt('/settings');
    expect(await screen.findByRole('heading', { name: 'Configuración' })).toBeInTheDocument();
    expect(screen.getAllByText('ADMINISTRADOR').length).toBeGreaterThan(0);
  });

  it('bloquea módulos para los que el rol no tiene permiso', async () => {
    authenticateAs('AUXILIAR');
    renderAt('/users');
    expect(await screen.findByText('Acceso restringido')).toBeInTheDocument();
  });
});
