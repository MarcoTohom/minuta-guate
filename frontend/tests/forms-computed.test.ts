import { describe, expect, it } from 'vitest';
import { evaluateExpression } from '@/features/forms/computed';

describe('evaluateExpression', () => {
  it('resuelve aritmética con identificadores y paréntesis', () => {
    expect(evaluateExpression('a + b * 2', { a: 1, b: 3 })).toBe(7);
    expect(evaluateExpression('(a + b) * 2', { a: 1, b: 3 })).toBe(8);
    expect(evaluateExpression('-a + 10', { a: 4 })).toBe(6);
  });

  it('suma listas de objetos usando distintas claves de monto', () => {
    expect(
      evaluateExpression('sum(items)', {
        items: [{ aporte: '10.50' }, { aporte: 4.5 }],
      }),
    ).toBeCloseTo(15);
    expect(evaluateExpression('sum(numeros)', { numeros: [1, 2, 3] })).toBe(6);
    expect(evaluateExpression('sum(valores)', { valores: [{ valor: 'Q 100' }] })).toBe(100);
  });

  it('devuelve null ante expresiones no resolubles', () => {
    expect(evaluateExpression('', {})).toBeNull();
    expect(evaluateExpression(null, {})).toBeNull();
    expect(evaluateExpression('a $ b', { a: 1, b: 2 })).toBeNull();
    expect(evaluateExpression('a / 0', { a: 10 })).toBeNull();
    expect(evaluateExpression('desconocido + 1', {})).toBeNull();
    expect(evaluateExpression('sum(items)', { items: [{ otro: 1 }] })).toBeNull();
    expect(evaluateExpression('otra(a)', { a: 1 })).toBeNull();
  });
});
