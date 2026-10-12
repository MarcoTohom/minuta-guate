import { useRef } from 'react';
import { Bold, Italic, List, Underline } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sanitizeHtml } from '@/lib/sanitize';
import { errorInputClass, asString } from './shared';
import type { FieldControlProps } from './types';

/**
 * Texto enriquecido con saneado. El valor almacenado es HTML restringido a un
 * subconjunto seguro de etiquetas; nunca se inyecta HTML sin sanear.
 */
export function RichTextInput({ field, value, onChange, onBlur, error, disabled, id }: FieldControlProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isDisabled = disabled || field.readonly;

  const emit = () => {
    if (!ref.current) return;
    onChange(sanitizeHtml(ref.current.innerHTML));
  };

  const runCommand = (command: string) => {
    if (isDisabled || typeof document === 'undefined') return;
    ref.current?.focus();
    try {
      document.execCommand(command);
    } catch {
      /* comando no soportado por el navegador */
    }
    emit();
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Negrita"
          disabled={isDisabled}
          onClick={() => runCommand('bold')}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Cursiva"
          disabled={isDisabled}
          onClick={() => runCommand('italic')}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Subrayado"
          disabled={isDisabled}
          onClick={() => runCommand('underline')}
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Lista"
          disabled={isDisabled}
          onClick={() => runCommand('insertUnorderedList')}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
      <div
        id={id}
        ref={ref}
        role="textbox"
        aria-multiline="true"
        aria-invalid={Boolean(error)}
        contentEditable={!isDisabled}
        suppressContentEditableWarning
        className={`min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${errorInputClass(
          Boolean(error),
        )}`}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(asString(value)) }}
        onInput={emit}
        onBlur={() => {
          emit();
          onBlur?.();
        }}
      />
      <p className="text-xs text-muted-foreground">
        Se permite negrita, cursiva, subrayado y listas. El contenido se sanea automáticamente.
      </p>
    </div>
  );
}
