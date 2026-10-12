import { useMemo, useState } from 'react';
import { CheckCircle2, FileSpreadsheet, Upload } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PERMISSIONS } from '@/lib/permissions';
import { useAuth } from '@/hooks/useAuth';
import {
  useConfirmImport,
  useCreateImport,
  useImportRows,
  useImports,
  usePreviewImport,
  useProcessImport,
} from '@/hooks/useImports';
import { IMPORT_TARGET_FIELDS } from '@/types';

export default function ImportsPage() {
  const { hasPermission } = useAuth();
  const canImport = hasPermission(PERMISSIONS.clientsCreate);

  const { data: imports, isLoading } = useImports();
  const createImport = useCreateImport();

  const [selectedId, setSelectedId] = useState<string>('');
  const [targetModule, setTargetModule] = useState('clients');
  const [file, setFile] = useState<File | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const preview = usePreviewImport(selectedId);
  const processImport = useProcessImport(selectedId);
  const confirmImport = useConfirmImport(selectedId);
  const { data: rows } = useImportRows(selectedId);

  const targetFields = useMemo(() => IMPORT_TARGET_FIELDS[targetModule] ?? [], [targetModule]);

  const columns = preview.data?.columns ?? [];

  const handleUpload = async () => {
    if (!file) return;
    const job = await createImport.mutateAsync({ file, targetModule });
    setSelectedId(job.id);
    setMapping({});
    setFile(null);
  };

  const handleProcess = async () => {
    await processImport.mutateAsync(mapping);
  };

  return (
    <div>
      <PageHeader
        title="Importaciones"
        description="Carga de XLSX/CSV con previsualización, mapeo de columnas y confirmación."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Nuevo archivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select
              aria-label="Módulo destino"
              value={targetModule}
              onChange={(event) => setTargetModule(event.target.value)}
            >
              <option value="clients">Clientes</option>
            </Select>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              aria-label="Archivo a importar"
              className="block w-full text-sm"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              className="w-full"
              disabled={!canImport || !file}
              loading={createImport.isPending}
              onClick={() => void handleUpload()}
            >
              <Upload className="h-4 w-4" />
              Cargar
            </Button>

            <div className="border-t pt-3">
              <p className="mb-2 text-sm font-medium">Importaciones recientes</p>
              {isLoading ? (
                <Skeleton className="h-20" />
              ) : !imports || imports.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin importaciones.</p>
              ) : (
                <ul className="space-y-1">
                  {imports.map((job) => (
                    <li key={job.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(job.id);
                          setMapping(job.column_mapping ?? {});
                        }}
                        className={`flex w-full items-center justify-between rounded-md border p-2 text-left text-sm ${
                          selectedId === job.id ? 'border-primary bg-accent' : 'hover:bg-accent'
                        }`}
                      >
                        <span className="truncate">{job.file_type}</span>
                        <Badge variant="secondary">{job.status}</Badge>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          {!selectedId ? (
            <Card>
              <CardContent className="p-6">
                <EmptyState
                  icon={FileSpreadsheet}
                  title="Seleccione una importación"
                  description="Cargue un archivo o elija una importación reciente para continuar."
                />
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">Previsualización</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    loading={preview.isPending}
                    onClick={() => void preview.mutateAsync()}
                  >
                    Previsualizar
                  </Button>
                </CardHeader>
                <CardContent>
                  {!preview.data ? (
                    <p className="text-sm text-muted-foreground">Pulse «Previsualizar» para ver el contenido.</p>
                  ) : (
                    <div className="space-y-2">
                      {preview.data.error ? (
                        <p className="text-sm text-destructive">{preview.data.error}</p>
                      ) : null}
                      {preview.data.message ? (
                        <p className="text-sm text-muted-foreground">{preview.data.message}</p>
                      ) : null}
                      <div className="overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {columns.map((column) => (
                                <TableHead key={column}>{column}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(preview.data.preview_rows ?? []).slice(0, 8).map((row, index) => (
                              <TableRow key={index}>
                                {columns.map((column) => (
                                  <TableCell key={column}>{String(row[column] ?? '')}</TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Mapeo de columnas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {columns.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Previsualice el archivo para conocer sus columnas.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {columns.map((column) => (
                        <div key={column} className="flex items-center gap-3">
                          <span className="w-40 shrink-0 truncate text-sm font-medium">{column}</span>
                          <Select
                            aria-label={`Destino para ${column}`}
                            value={mapping[column] ?? ''}
                            onChange={(event) =>
                              setMapping((prev) => ({ ...prev, [column]: event.target.value }))
                            }
                          >
                            <option value="">Ignorar</option>
                            {targetFields.map((field) => (
                              <option key={field} value={field}>
                                {field}
                              </option>
                            ))}
                          </Select>
                        </div>
                      ))}
                      <Button
                        type="button"
                        loading={processImport.isPending}
                        onClick={() => void handleProcess()}
                      >
                        Procesar mapeo
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">Filas procesadas</CardTitle>
                  <Button
                    type="button"
                    variant="success"
                    size="sm"
                    loading={confirmImport.isPending}
                    onClick={() => void confirmImport.mutateAsync()}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Confirmar importación
                  </Button>
                </CardHeader>
                <CardContent>
                  {!rows || rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay filas procesadas todavía.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fila</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Errores</TableHead>
                          <TableHead>Importada</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.slice(0, 50).map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>{row.row_number}</TableCell>
                            <TableCell>
                              <Badge variant={row.status === 'OK' || row.status === 'VALID' ? 'success' : 'warning'}>
                                {row.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-destructive">
                              {(row.errors ?? []).map((error) => error.mensaje ?? error.tipo_error).join(' · ') || '—'}
                            </TableCell>
                            <TableCell>{row.imported ? 'Sí' : 'No'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
