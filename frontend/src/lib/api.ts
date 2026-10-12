import axios, { type AxiosInstance } from 'axios';
import { tokenStorage } from './tokenStorage';

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

/** Permite que AuthContext registre el cierre de sesión ante un 401. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
});

// Adjunta el token JWT a cada petición.
apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Ante un 401 limpia la sesión y notifica al AuthContext.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url ?? '';
    const isAuthAttempt = url.includes('/auth/login');
    if (status === 401 && !isAuthAttempt) {
      tokenStorage.clear();
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  },
);

/** Descarga un archivo binario (DOCX) respetando el token. */
export async function downloadFile(url: string, filename: string): Promise<void> {
  const response = await apiClient.get(url, { responseType: 'blob' });
  const blobUrl = window.URL.createObjectURL(response.data as Blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}
