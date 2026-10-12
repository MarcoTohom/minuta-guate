import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { getErrorMessage } from '@/lib/errors';
import { useAuth } from '@/hooks/useAuth';

const loginSchema = z.object({
  username: z.string().min(1, 'Ingrese su usuario.'),
  password: z.string().min(1, 'Ingrese su contraseña.'),
});

type LoginValues = z.infer<typeof loginSchema>;

const DEMO_USERS = [
  { user: 'admin', pass: 'Admin123!', role: 'Administrador' },
  { user: 'notario.demo', pass: 'Notario123!', role: 'Abogado/Notario' },
  { user: 'auxiliar.demo', pass: 'Auxiliar123!', role: 'Auxiliar' },
  { user: 'adminfin.demo', pass: 'Adminfin123!', role: 'Administración' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const onSubmit = async (values: LoginValues) => {
    setError(null);
    try {
      await login(values.username, values.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sistema de borradores de escrituras públicas</h1>
          <p className="text-sm text-muted-foreground">Tesis · Facultad de Ingeniería</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Iniciar sesión</CardTitle>
            <CardDescription>Ingrese sus credenciales para continuar.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <FormField label="Usuario" htmlFor="username" required error={errors.username?.message}>
                <Input id="username" autoComplete="username" {...register('username')} />
              </FormField>
              <FormField label="Contraseña" htmlFor="password" required error={errors.password?.message}>
                <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
              </FormField>

              {error ? (
                <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              ) : null}

              <Button type="submit" className="w-full" loading={isSubmitting}>
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Usuarios de demostración</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-1 text-xs text-muted-foreground">
            {DEMO_USERS.map((demo) => (
              <button
                key={demo.user}
                type="button"
                className="flex items-center justify-between rounded px-2 py-1 text-left hover:bg-accent"
                onClick={() => {
                  setValue('username', demo.user, { shouldValidate: true });
                  setValue('password', demo.pass, { shouldValidate: true });
                }}
              >
                <span className="font-medium text-foreground">{demo.user}</span>
                <span>{demo.pass}</span>
                <span>{demo.role}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
