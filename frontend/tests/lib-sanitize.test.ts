import { describe, expect, it } from 'vitest';
import { htmlToText, sanitizeHtml } from '@/lib/sanitize';

describe('sanitizeHtml', () => {
  it('conserva las etiquetas permitidas de formato', () => {
    expect(sanitizeHtml('<p>Hola <strong>mundo</strong></p>')).toBe('<p>Hola <strong>mundo</strong></p>');
    expect(sanitizeHtml('<ul><li>Uno</li><li>Dos</li></ul>')).toBe('<ul><li>Uno</li><li>Dos</li></ul>');
  });

  it('elimina por completo etiquetas peligrosas', () => {
    expect(sanitizeHtml('<script>alert(1)</script>Hola')).toBe('Hola');
    expect(sanitizeHtml('<style>body{}</style>Texto')).toBe('Texto');
    expect(sanitizeHtml('<iframe src="x"></iframe>')).toBe('');
  });

  it('descarta atributos y manejadores en línea', () => {
    expect(sanitizeHtml('<p onclick="hack()">Texto</p>')).toBe('<p>Texto</p>');
    expect(sanitizeHtml('<strong style="color:red">Negrita</strong>')).toBe('<strong>Negrita</strong>');
  });

  it('degrada etiquetas no permitidas a texto plano', () => {
    expect(sanitizeHtml('<a href="https://x.com">enlace</a>')).toBe('enlace');
    expect(sanitizeHtml('<img src="x" onerror="alert(1)">Texto')).toContain('Texto');
  });

  it('maneja entradas vacías', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
  });
});

describe('htmlToText', () => {
  it('convierte HTML a texto plano', () => {
    expect(htmlToText('<p>Hola <strong>mundo</strong></p>')).toBe('Hola mundo');
    expect(htmlToText('<ul><li>A</li><li>B</li></ul>')).toBe('AB');
    expect(htmlToText(null)).toBe('');
  });
});
