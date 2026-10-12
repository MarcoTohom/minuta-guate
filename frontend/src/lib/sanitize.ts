/**
 * Saneador de HTML para el campo de texto enriquecido.
 *
 * Se permite un subconjunto mínimo de etiquetas de formato y se elimina
 * cualquier atributo (incluidos los manejadores `on*`), de modo que el
 * contenido no pueda ejecutar HTML/JS. Las etiquetas potencialmente peligrosas
 * se descartan por completo.
 */

const ALLOWED_TAGS = new Set([
  'B',
  'I',
  'U',
  'STRONG',
  'EM',
  'BR',
  'P',
  'UL',
  'OL',
  'LI',
  'DIV',
  'SPAN',
]);

const DROP_TAGS = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META']);

/** Elimina todas las etiquetas dejando solo el texto. */
function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

function sanitizeElement(element: Element, doc: Document): void {
  Array.from(element.children).forEach((child) => {
    if (DROP_TAGS.has(child.tagName)) {
      child.remove();
      return;
    }
    if (!ALLOWED_TAGS.has(child.tagName)) {
      child.replaceWith(doc.createTextNode(child.textContent ?? ''));
      return;
    }
    Array.from(child.attributes).forEach((attr) => child.removeAttribute(attr.name));
    sanitizeElement(child, doc);
  });
}

/** Devuelve HTML saneado según la lista blanca de etiquetas. */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';
  if (typeof DOMParser === 'undefined') return stripTags(html);
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) return '';
  sanitizeElement(root, doc);
  return root.innerHTML;
}

/** Convierte HTML saneado a texto plano (para vistas de solo lectura). */
export function htmlToText(html: string | null | undefined): string {
  if (!html) return '';
  if (typeof DOMParser === 'undefined') return stripTags(html);
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  return doc.body.textContent ?? '';
}
