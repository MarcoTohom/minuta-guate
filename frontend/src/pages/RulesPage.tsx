import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus } from 'lucide-react';
import { z } from 'zod';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import {
  useAllDeedTypes,
  useCreateDeedType,
  useUpdateDeedType,
  useUpdateValidationRule,
  useValidationRules,
} from '@/hooks/useRules';
import { PERMISSIONS } from '@/lib/permissions';
import { RULE_SEVERITIES } from '@/types';
import type { DeedType, RuleSeverity, ValidationRule } from '@/types';

const SEVERITY_VARIANT: Record<string, 'critical' | 'error' | 'warning' | 'info'> = {
  CRITICAL: 'critical',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

const deedTypeSchema = z.object({
  code: z.string().min(2, 'Mínimo 2 caracteres.').max(60, 'Máximo 60 caracteres.'),
  name: z.string().min(3, 'Ingrese el nombre.'),
  description: z.string().optional(),
});

const deedTypeEditSchema = z.object({
  name: z.string().min(3, 'Ingrese el nombre.'),
  description: z.string().optional(),
  active: z.boolean(),
});

type DeedTypeValues = z.infer<typeof deedTypeSchema>;
type DeedTypeEditValues = z.infer<typeof deedTypeEditSchema>;

interface RuleDraft {
  severity: RuleSeverity | string;
  active: boolean;
  appliesToAll: boolean;
  codes: string[];
}

export default function RulesPage() {
  const { hasPermission } = useAuth();
  const canUpdateRules = hasPermission(PERMISSIONS.rulesUpdate);
  const canCreateDeedTypes = hasPermission(PERMISSIONS.deedTypesCreate);
  const canUpdateDeedTypes = hasPermission(PERMISSIONS.deedTypesUpdate);

  const [deedTypeFilter, setDeedTypeFilter] = useState('');
  const { data: deedTypes, isLoading: loadingDeedTypes } = useAllDeedTypes();
  const { data: rules, isLoading: loadingRules } = useValidationRules(
    deedTypeFilter || undefined,
  );

  const updateRule = useUpdateValidationRule();
  const createDeedType = useCreateDeedType();
  const updateDeedType = useUpdateDeedType();

  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ValidationRule | null>(null);
  const [ruleDraft, setRuleDraft] = useState<RuleDraft>({
    severity: 'ERROR',
    active: true,
    appliesToAll: true,
    codes: [],
  });

  const [deedTypeDialogOpen, setDeedTypeDialogOpen] = useState(false);
  const [editingDeedType, setEditingDeedType] = useState<DeedType | null>(null);

  const createForm = useForm<DeedTypeValues>({
    resolver: zodResolver(deedTypeSchema),
    defaultValues: { code: '', name: '', description: '' },
  });

  const editForm = useForm<DeedTypeEditValues>({
    resolver: zodResolver(deedTypeEditSchema),
    defaultValues: { name: '', description: '', active: true },
  });

  const openRuleEditor = (rule: ValidationRule) => {
    setEditingRule(rule);
    setRuleDraft({
      severity: rule.severity,
      active: rule.active,
      appliesToAll: rule.applies_to_all,
      codes: rule.deed_type_codes ? [...rule.deed_type_codes] : [],
    });
    setRuleDialogOpen(true);
  };

  const toggleRuleCode = (code: string) => {
    setRuleDraft((draft) => ({
      ...draft,
      codes: draft.codes.includes(code)
        ? draft.codes.filter((c) => c !== code)
        : [...draft.codes, code],
    }));
  };

  const saveRule = async () => {
    if (!editingRule) return;
    await updateRule.mutateAsync({
      ruleId: editingRule.rule_id,
      payload: {
        severity: ruleDraft.severity,
        active: ruleDraft.active,
        deed_type_codes: ruleDraft.appliesToAll ? null : ruleDraft.codes,
      },
    });
    setRuleDialogOpen(false);
  };

  const openCreateDeedType = () => {
    setEditingDeedType(null);
    createForm.reset({ code: '', name: '', description: '' });
    setDeedTypeDialogOpen(true);
  };

  const openEditDeedType = (deedType: DeedType) => {
    setEditingDeedType(deedType);
    editForm.reset({
      name: deedType.name,
      description: deedType.description ?? '',
      active: deedType.active ?? true,
    });
    setDeedTypeDialogOpen(true);
  };

  const onCreateDeedType = createForm.handleSubmit(async (values) => {
    await createDeedType.mutateAsync({
      code: values.code.trim().toUpperCase(),
      name: values.name,
      description: values.description?.trim() ? values.description : null,
    });
    setDeedTypeDialogOpen(false);
  });

  const onEditDeedType = editForm.handleSubmit(async (values) => {
    if (!editingDeedType) return;
    await updateDeedType.mutateAsync({
      id: editingDeedType.id,
      payload: {
        name: values.name,
        description: values.description?.trim() ? values.description : null,
        active: values.active,
      },
    });
    setDeedTypeDialogOpen(false);
  });

  const scopeLabel = (rule: ValidationRule) => {
    if (rule.applies_to_all) return 'Todos los tipos';
    const names = (rule.deed_type_codes ?? []).map(
      (code) => deedTypes?.find((d) => d.code === code)?.name ?? code,
    );
    return names.join(', ');
  };

  return (
    <div>
      <PageHeader
        title="Reglas y tipos de escritura"
        description="Administre qué reglas de validación aplican a cada tipo de escritura y gestione el catálogo de tipos."
      />

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">Reglas de validación</TabsTrigger>
          <TabsTrigger value="deed-types">Tipos de escritura</TabsTrigger>
        </TabsList>

        <TabsContent value="rules">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <label htmlFor="deed-type-filter" className="text-sm font-medium">
              Filtrar por tipo de escritura
            </label>
            <Select
              id="deed-type-filter"
              aria-label="Filtrar por tipo de escritura"
              className="max-w-xs"
              value={deedTypeFilter}
              onChange={(event) => setDeedTypeFilter(event.target.value)}
            >
              <option value="">Todos los tipos</option>
              {deedTypes?.map((deedType) => (
                <option key={deedType.id} value={deedType.code}>
                  {deedType.name}
                </option>
              ))}
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              {loadingRules ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-10" />
                  ))}
                </div>
              ) : !rules || rules.length === 0 ? (
                <EmptyState
                  title="Sin reglas"
                  description="No hay reglas de validación para el filtro seleccionado."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Regla</TableHead>
                      <TableHead>Severidad</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Tipos de escritura</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.rule_id}>
                        <TableCell>
                          <p className="font-medium">{rule.rule_id}</p>
                          <p className="text-xs text-muted-foreground">{rule.name}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={SEVERITY_VARIANT[rule.severity] ?? 'secondary'}>
                            {rule.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={rule.active ? 'success' : 'secondary'}>
                            {rule.active ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {scopeLabel(rule)}
                        </TableCell>
                        <TableCell className="text-right">
                          {canUpdateRules ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => openRuleEditor(rule)}
                            >
                              <Pencil className="h-4 w-4" />
                              Editar
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deed-types">
          <Card>
            <CardContent className="p-0">
              {loadingDeedTypes ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-10" />
                  ))}
                </div>
              ) : !deedTypes || deedTypes.length === 0 ? (
                <EmptyState title="Sin tipos" description="No hay tipos de escritura registrados." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deedTypes.map((deedType) => (
                      <TableRow key={deedType.id}>
                        <TableCell className="font-medium">{deedType.code}</TableCell>
                        <TableCell>{deedType.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {deedType.description ?? '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={deedType.active ? 'success' : 'secondary'}>
                            {deedType.active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {canUpdateDeedTypes ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDeedType(deedType)}
                            >
                              <Pencil className="h-4 w-4" />
                              Editar
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {canCreateDeedTypes ? (
            <div className="mt-4">
              <Button type="button" onClick={openCreateDeedType}>
                <Plus className="h-4 w-4" />
                Nuevo tipo de escritura
              </Button>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>

      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent onClose={() => setRuleDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>
              Editar regla {editingRule ? editingRule.rule_id : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{editingRule?.description}</p>

            <FormField label="Severidad" htmlFor="rule_severity">
              <Select
                id="rule_severity"
                value={ruleDraft.severity}
                onChange={(event) =>
                  setRuleDraft((draft) => ({ ...draft, severity: event.target.value }))
                }
              >
                {RULE_SEVERITIES.map((severity) => (
                  <option key={severity} value={severity}>
                    {severity}
                  </option>
                ))}
              </Select>
            </FormField>

            <div className="flex items-center gap-2">
              <Checkbox
                id="rule_active"
                checked={ruleDraft.active}
                onCheckedChange={(checked) =>
                  setRuleDraft((draft) => ({ ...draft, active: checked }))
                }
              />
              <label htmlFor="rule_active" className="text-sm font-medium">
                Regla activa
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="rule_all_types"
                checked={ruleDraft.appliesToAll}
                onCheckedChange={(checked) =>
                  setRuleDraft((draft) => ({ ...draft, appliesToAll: checked }))
                }
              />
              <label htmlFor="rule_all_types" className="text-sm font-medium">
                Aplica a todos los tipos de escritura
              </label>
            </div>

            {!ruleDraft.appliesToAll ? (
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Tipos de escritura</legend>
                {deedTypes?.map((deedType) => (
                  <div key={deedType.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`rule-type-${deedType.code}`}
                      checked={ruleDraft.codes.includes(deedType.code)}
                      onCheckedChange={() => toggleRuleCode(deedType.code)}
                    />
                    <label htmlFor={`rule-type-${deedType.code}`} className="text-sm">
                      {deedType.name}
                    </label>
                  </div>
                ))}
              </fieldset>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRuleDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={saveRule} loading={updateRule.isPending}>
                Guardar
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deedTypeDialogOpen} onOpenChange={setDeedTypeDialogOpen}>
        <DialogContent onClose={() => setDeedTypeDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>
              {editingDeedType ? 'Editar tipo de escritura' : 'Nuevo tipo de escritura'}
            </DialogTitle>
          </DialogHeader>

          {editingDeedType ? (
            <form className="space-y-4" onSubmit={onEditDeedType} noValidate>
              <FormField
                label="Nombre"
                htmlFor="edit_deed_type_name"
                required
                error={editForm.formState.errors.name?.message}
              >
                <Input id="edit_deed_type_name" {...editForm.register('name')} />
              </FormField>
              <FormField
                label="Descripción"
                htmlFor="edit_deed_type_description"
                error={editForm.formState.errors.description?.message}
              >
                <Textarea
                  id="edit_deed_type_description"
                  rows={3}
                  {...editForm.register('description')}
                />
              </FormField>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit_deed_type_active"
                  checked={editForm.watch('active')}
                  onCheckedChange={(checked) => editForm.setValue('active', checked)}
                />
                <label htmlFor="edit_deed_type_active" className="text-sm font-medium">
                  Tipo activo
                </label>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeedTypeDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" loading={updateDeedType.isPending}>
                  Guardar
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={onCreateDeedType} noValidate>
              <FormField
                label="Código"
                htmlFor="new_deed_type_code"
                required
                error={createForm.formState.errors.code?.message}
              >
                <Input id="new_deed_type_code" {...createForm.register('code')} />
              </FormField>
              <FormField
                label="Nombre"
                htmlFor="new_deed_type_name"
                required
                error={createForm.formState.errors.name?.message}
              >
                <Input id="new_deed_type_name" {...createForm.register('name')} />
              </FormField>
              <FormField
                label="Descripción"
                htmlFor="new_deed_type_description"
                error={createForm.formState.errors.description?.message}
              >
                <Textarea
                  id="new_deed_type_description"
                  rows={3}
                  {...createForm.register('description')}
                />
              </FormField>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeedTypeDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" loading={createDeedType.isPending}>
                  Crear
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
