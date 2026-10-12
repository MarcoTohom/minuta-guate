import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@/features/auth/AuthContext';
import LoginPage from '@/pages/LoginPage';
import * as authService from '@/services/auth';

vi.mock('@/services/auth', () => ({
  login: vi.fn(),
  getMe: vi.fn(),
  listRoles: vi.fn(),
  logout: vi.fn(),
}));

const mockedAuth = vi.mocked(authService);

function renderLogin() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<div>Panel principal</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    mockedAuth.login.mockResolvedValue({
      access_token: 'token-123',
      token_type: 'bearer',
      user_id: 'user-1',
      username: 'admin',
      role: 'ADMINISTRADOR',
    });
    mockedAuth.getMe.mockResolvedValue({
      id: 'user-1',
      username: 'admin',
      email: 'admin@example.com',
      full_name: 'Administrador',
      status: 'ACTIVE',
      role_id: 'role-1',
    });
    mockedAuth.listRoles.mockResolvedValue([{ id: 'role-1', name: 'ADMINISTRADOR' }]);
  });

  it('exige usuario y contraseña antes de enviar', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('Ingrese su usuario.')).toBeInTheDocument();
    expect(screen.getByText('Ingrese su contraseña.')).toBeInTheDocument();
    expect(mockedAuth.login).not.toHaveBeenCalled();
  });

  it('inicia sesión y navega al panel', async () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText(/Usuario/), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { value: 'Admin123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Panel principal')).toBeInTheDocument();
    expect(mockedAuth.login).toHaveBeenCalledWith('admin', 'Admin123!');
  });

  it('muestra el error cuando las credenciales son inválidas', async () => {
    mockedAuth.login.mockRejectedValue(new Error('Credenciales inválidas'));
    renderLogin();
    fireEvent.change(screen.getByLabelText(/Usuario/), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { value: 'malísima' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas');
  });
});
