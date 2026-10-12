import * as React from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: string;
}

type Listener = (toast: ToastItem) => void;

const listeners = new Set<Listener>();

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Emisor imperativo de notificaciones; funciona fuera de componentes React. */
export function toast(options: ToastOptions): void {
  const item: ToastItem = { id: createId(), duration: 5000, ...options };
  listeners.forEach((listener) => listener(item));
}

const variantStyles: Record<ToastVariant, string> = {
  default: 'border-border bg-background text-foreground',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
};

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === 'success') return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
  if (variant === 'error') return <XCircle className="h-5 w-5 text-red-600" />;
  if (variant === 'warning') return <AlertTriangle className="h-5 w-5 text-amber-600" />;
  if (variant === 'info') return <Info className="h-5 w-5 text-sky-600" />;
  return <Info className="h-5 w-5 text-muted-foreground" />;
}

/** Contenedor de notificaciones. Debe montarse una sola vez en la app. */
export function Toaster() {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    const listener: Listener = (item) => {
      setItems((prev) => [...prev, item]);
      if (item.duration && item.duration > 0) {
        window.setTimeout(() => {
          setItems((prev) => prev.filter((t) => t.id !== item.id));
        }, item.duration);
      }
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
    >
      {items.map((item) => (
        <div
          key={item.id}
          role="status"
          data-variant={item.variant ?? 'default'}
          className={cn(
            'pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg',
            variantStyles[item.variant ?? 'default'],
          )}
        >
          <ToastIcon variant={item.variant ?? 'default'} />
          <div className="flex-1">
            <p className="text-sm font-semibold">{item.title}</p>
            {item.description ? <p className="mt-1 text-sm opacity-90">{item.description}</p> : null}
          </div>
          <button
            type="button"
            aria-label="Cerrar notificación"
            onClick={() => dismiss(item.id)}
            className="opacity-60 transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

/** Acceso a la API de notificaciones desde componentes. */
export function useToast(): { toast: typeof toast } {
  return { toast };
}
