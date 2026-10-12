import { describe, expect, it } from 'vitest';
import { PERMISSIONS, ROLE_PERMISSIONS, roleHasPermission } from '@/lib/permissions';

describe('roleHasPermission', () => {
  it('concede todos los permisos al administrador', () => {
    expect(roleHasPermission('ADMINISTRADOR', 'documents.generate')).toBe(true);
    expect(roleHasPermission('ADMINISTRADOR', PERMISSIONS.usersUpdate)).toBe(true);
  });

  it('respeta el catálogo de cada rol', () => {
    expect(roleHasPermission('ABOGADO_NOTARIO', PERMISSIONS.documentsGenerate)).toBe(true);
    expect(roleHasPermission('AUXILIAR', PERMISSIONS.documentsGenerate)).toBe(false);
    expect(roleHasPermission('AUXILIAR', PERMISSIONS.clientsDelete)).toBe(false);
    expect(roleHasPermission('ADMINISTRACION', PERMISSIONS.paymentsCreate)).toBe(true);
  });

  it('niega el acceso cuando no hay rol o es desconocido', () => {
    expect(roleHasPermission(null, 'clients.read')).toBe(false);
    expect(roleHasPermission(undefined, 'clients.read')).toBe(false);
    expect(roleHasPermission('ROL_INEXISTENTE', 'clients.read')).toBe(false);
  });

  it('expone el mapa completo de roles', () => {
    expect(Object.keys(ROLE_PERMISSIONS)).toContain('ADMINISTRADOR');
    expect(ROLE_PERMISSIONS.ADMINISTRADOR).toEqual(['*']);
  });
});
