import { cn } from '@/lib/utils';

/** Campo de formulario con etiqueta, ayuda y mensaje de error. */
interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  helpText?: string | null;
  error?: string | null;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  htmlFor,
  required,
  helpText,
  error,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <label htmlFor={htmlFor} className="text-sm font-medium leading-none">
          {label}
          {required ? <span className="ml-0.5 text-destructive">*</span> : null}
        </label>
      ) : null}
      {children}
      {helpText && !error ? <p className="text-xs text-muted-foreground">{helpText}</p> : null}
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
