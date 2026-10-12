/** Almacenamiento del token JWT y del rol del usuario en localStorage. */

const TOKEN_KEY = 'escrituras.token';
const ROLE_KEY = 'escrituras.role';
const USERNAME_KEY = 'escrituras.username';

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* almacenamiento no disponible (modo privado) */
  }
}

function safeRemove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignorar */
  }
}

export const tokenStorage = {
  getToken(): string | null {
    return safeGet(TOKEN_KEY);
  },
  setToken(token: string): void {
    safeSet(TOKEN_KEY, token);
  },
  getRole(): string | null {
    return safeGet(ROLE_KEY);
  },
  setRole(role: string | null): void {
    if (role) safeSet(ROLE_KEY, role);
    else safeRemove(ROLE_KEY);
  },
  getUsername(): string | null {
    return safeGet(USERNAME_KEY);
  },
  setUsername(username: string | null): void {
    if (username) safeSet(USERNAME_KEY, username);
    else safeRemove(USERNAME_KEY);
  },
  clear(): void {
    safeRemove(TOKEN_KEY);
    safeRemove(ROLE_KEY);
    safeRemove(USERNAME_KEY);
  },
};
