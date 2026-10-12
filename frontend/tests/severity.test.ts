import { describe, expect, it } from 'vitest';
import { SEVERITIES, severityBadgeVariant, severityLabel } from '@/features/validation/severity';

describe('features/validation/severity', () => {
  it('expone las severidades en orden de prioridad', () => {
    expect(SEVERITIES).toEqual(['CRITICAL', 'ERROR', 'WARNING', 'INFO']);
  });

  it('traduce las severidades al español', () => {
    expect(severityLabel('CRITICAL')).toBe('ERROR CRÍTICO');
    expect(severityLabel('ERROR')).toBe('ERROR');
    expect(severityLabel('WARNING')).toBe('ADVERTENCIA');
    expect(severityLabel('INFO')).toBe('INFORMACIÓN');
  });

  it('asigna una variante de insignia por severidad', () => {
    expect(severityBadgeVariant('CRITICAL')).toBe('critical');
    expect(severityBadgeVariant('ERROR')).toBe('error');
    expect(severityBadgeVariant('WARNING')).toBe('warning');
    expect(severityBadgeVariant('INFO')).toBe('info');
  });
});
