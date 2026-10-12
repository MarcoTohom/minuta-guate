import type { Severity } from '@/types';

export const SEVERITIES: Severity[] = ['CRITICAL', 'ERROR', 'WARNING', 'INFO'];

/** Etiqueta en español para cada severidad. */
export function severityLabel(severity: Severity): string {
  switch (severity) {
    case 'CRITICAL':
      return 'ERROR CRÍTICO';
    case 'ERROR':
      return 'ERROR';
    case 'WARNING':
      return 'ADVERTENCIA';
    case 'INFO':
      return 'INFORMACIÓN';
    default:
      return String(severity);
  }
}

/** Variante de Badge adecuada para cada severidad. */
export function severityBadgeVariant(
  severity: Severity,
): 'critical' | 'error' | 'warning' | 'info' {
  switch (severity) {
    case 'CRITICAL':
      return 'critical';
    case 'ERROR':
      return 'error';
    case 'WARNING':
      return 'warning';
    default:
      return 'info';
  }
}
