import * as React from 'react';
import { setUnauthorizedHandler } from '@/lib/api';
import { roleHasPermission } from '@/lib/permissions';
import { tokenStorage } from '@/lib/tokenStorage';
import { queryClient } from '@/lib/queryClient';
import * as authService from '@/services/auth';
import type { AuthUser } from '@/types';

interface AuthContextValue {
  user: AuthUser | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [role, setRole] = React.useState<string | null>(tokenStorage.getRole());
  const [isLoading, setIsLoading] = React.useState(true);

  const clearSession = React.useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    setRole(null);
    queryClient.clear();
  }, []);

  // Carga la sesión persistida al iniciar la aplicación.
  React.useEffect(() => {
    let active = true;

    async function bootstrap() {
      const token = tokenStorage.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const [me, roles] = await Promise.all([authService.getMe(), authService.listRoles()]);
        if (!active) return;
        const roleName =
          roles.find((item) => item.id === me.role_id)?.name ?? tokenStorage.getRole() ?? null;
        tokenStorage.setRole(roleName);
        setRole(roleName);
        setUser({ ...me, role_name: roleName });
      } catch {
        if (active) clearSession();
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void bootstrap();
    return () => {
      active = false;
    };
  }, [clearSession]);

  // Ante un 401 el interceptor de axios notifica aquí.
  React.useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const login = React.useCallback(async (username: string, password: string) => {
    const token = await authService.login(username, password);
    tokenStorage.setToken(token.access_token);
    tokenStorage.setRole(token.role);
    tokenStorage.setUsername(token.username);
    setRole(token.role);

    let roleName = token.role;
    try {
      const [me, roles] = await Promise.all([authService.getMe(), authService.listRoles()]);
      roleName = roles.find((item) => item.id === me.role_id)?.name ?? token.role;
      tokenStorage.setRole(roleName);
      setRole(roleName);
      const authUser: AuthUser = { ...me, role_name: roleName };
      setUser(authUser);
      return authUser;
    } catch {
      // Si /auth/me falla, se conserva la información mínima del token.
      const fallback: AuthUser = {
        id: token.user_id,
        username: token.username,
        email: '',
        full_name: token.username,
        status: 'ACTIVE',
        role_id: null,
        role_name: roleName,
      };
      setUser(fallback);
      return fallback;
    }
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      /* el cierre de sesión local no debe fallar por la red */
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const hasPermission = React.useCallback(
    (permission: string) => roleHasPermission(role, permission),
    [role],
  );

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      hasPermission,
    }),
    [user, role, isLoading, login, logout, hasPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  }
  return context;
}
