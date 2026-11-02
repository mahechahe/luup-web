import { useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  LoaderCircle,
  MinusCircle,
  PencilLine,
  PlusCircle,
  RefreshCw,
  Upload,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  confirmAssignmentImportService,
  downloadAssignmentImportReportService,
  downloadAssignmentTemplateService,
  previewAssignmentImportService,
} from '../../services/eventServices';

const XLSX_ACCEPT = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    '.xlsx',
  ],
};

const STATUS = {
  create: {
    label: 'Nueva',
    className:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    icon: PlusCircle,
  },
  update: {
    label: 'Cambia',
    className:
      'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    icon: PencilLine,
  },
  unchanged: {
    label: 'Sin cambios',
    className: 'bg-muted text-muted-foreground',
    icon: CheckCircle2,
  },
  error: {
    label: 'Error',
    className: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
    icon: XCircle,
  },
};

const FILTERS = [
  { value: 'attention', label: 'Por revisar' },
  { value: 'all', label: 'Todas' },
];

const saveBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const StepTitle = ({ number, title, description, done }) => (
  <div className="flex items-start gap-3">
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        done ? 'bg-emerald-600 text-white' : 'bg-primary/10 text-primary'
      }`}
    >
      {done ? <CheckCircle2 className="h-4 w-4" /> : number}
    </span>
    <div className="min-w-0">
      <p className="text-sm font-bold text-foreground">{title}</p>
      {description && (
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  </div>
);

const SummaryTile = ({ label, value, tone }) => (
  <div className={`rounded-xl px-3 py-2.5 ${tone}`}>
    <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
      {label}
    </p>
    <p className="text-xl font-extrabold tabular-nums">{value}</p>
  </div>
);

/**
 * Asignación masiva por Excel: descargar plantilla → subir → revisar → confirmar.
 * Nada se guarda hasta "Confirmar importación".
 */
export function AssignmentExcelSheet({
  open,
  onClose,
  eventId,
  hasUnsavedChanges,
  onImported,
}) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [templateDownloaded, setTemplateDownloaded] = useState(false);
  const [filter, setFilter] = useState('attention');

  const reset = () => {
    setFile(null);
    setPreview(null);
    setFilter('attention');
  };

  const handleClose = () => {
    if (confirming) return;
    reset();
    setTemplateDownloaded(false);
    onClose();
  };

  const analyze = async (nextFile) => {
    setFile(nextFile);
    setPreview(null);
    setAnalyzing(true);
    const result = await previewAssignmentImportService(eventId, nextFile);
    setAnalyzing(false);
    if (!result.status) {
      toast.error(result.errors);
      setFile(null);
      return;
    }
    setPreview(result.preview);
    setFilter(
      result.preview?.summary?.errors || result.preview?.fileErrors?.length
        ? 'attention'
        : 'all'
    );
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: XLSX_ACCEPT,
    multiple: false,
    maxSize: 10 * 1024 * 1024,
    disabled: analyzing || confirming,
    onDropAccepted: ([accepted]) => accepted && analyze(accepted),
    onDropRejected: ([rejection]) => {
      const code = rejection?.errors?.[0]?.code;
      toast.error(
        code === 'file-too-large'
          ? 'El archivo no puede pesar más de 10 MB.'
          : 'El archivo debe ser un Excel .xlsx. Si es .xls, ábrelo y guárdalo como .xlsx.'
      );
    },
  });

  const downloadTemplate = async () => {
    setDownloadingTemplate(true);
    const result = await downloadAssignmentTemplateService(eventId);
    setDownloadingTemplate(false);
    if (!result.status) {
      toast.error(result.errors);
      return;
    }
    saveBlob(result.blob, result.fileName);
    setTemplateDownloaded(true);
  };

  const downloadReport = async () => {
    if (!file) return;
    setDownloadingReport(true);
    const result = await downloadAssignmentImportReportService(eventId, file);
    setDownloadingReport(false);
    if (!result.status) {
      toast.error(result.errors);
      return;
    }
    saveBlob(result.blob, result.fileName);
  };

  const confirmImport = async () => {
    if (!file || !preview?.canConfirm) return;
    setConfirming(true);
    const result = await confirmAssignmentImportService(eventId, file);
    setConfirming(false);
    if (!result.status) {
      toast.error(result.errors);
      if (result.preview?.summary) {
        setPreview(result.preview);
        setFilter('attention');
      }
      return;
    }
    const { created = 0, updated = 0, removed = 0 } = result.result ?? {};
    const parts = [
      created && `${created} nueva${created === 1 ? '' : 's'}`,
      updated && `${updated} actualizada${updated === 1 ? '' : 's'}`,
      removed && `${removed} quitada${removed === 1 ? '' : 's'}`,
    ].filter(Boolean);
    toast.success(
      `Importación completada${parts.length ? `: ${parts.join(', ')}` : ''}.`
    );
    reset();
    setTemplateDownloaded(false);
    onImported?.();
    onClose();
  };

  const summary = preview?.summary;
  const visibleRows = useMemo(() => {
    const rows = preview?.rows ?? [];
    if (filter === 'all') return rows;
    return rows.filter((row) => row.status !== 'unchanged');
  }, [filter, preview?.rows]);

  const changes = summary
    ? summary.create + summary.update + summary.remove
    : 0;
  const blockReason = !preview
    ? null
    : preview.fileErrors?.length || summary.errors
      ? 'Corrige los errores en el Excel y vuelve a subirlo.'
      : !changes
        ? 'El archivo no trae cambios frente a lo que ya está guardado.'
        : null;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5 pr-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600/10">
              <FileSpreadsheet className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold">
                Asignación por Excel
              </SheetTitle>
              <SheetDescription className="text-xs">
                Nada se guarda hasta que confirmes la vista previa.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {hasUnsavedChanges && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Tienes filas nuevas en la tabla que no has guardado. Al
                importar, la tabla se recarga y esas filas se pierden.
              </span>
            </div>
          )}

          {/* Paso 1 */}
          <section className="space-y-3">
            <StepTitle
              number={1}
              done={templateDownloaded}
              title="Descarga la plantilla"
              description="Trae las asignaciones actuales del evento y listas desplegables de zonas, roles y turnos. Edítala en Excel o Google Sheets."
            />
            <Button
              type="button"
              variant="outline"
              onClick={downloadTemplate}
              disabled={downloadingTemplate}
              className="ml-10 gap-2"
            >
              {downloadingTemplate ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Descargar plantilla
            </Button>
          </section>

          {/* Paso 2 */}
          <section className="space-y-3">
            <StepTitle
              number={2}
              done={Boolean(preview)}
              title="Sube el archivo lleno"
              description="Una fila por persona y zona. Un coordinador con varias zonas va en varias filas con la misma cédula."
            />
            <div className="ml-10">
              {file ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-3.5 py-3">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
                    {analyzing ? (
                      <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-primary" />
                    ) : (
                      <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-600" />
                    )}
                    <span className="truncate">{file.name}</span>
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={analyzing || confirming}
                      onClick={() => analyze(file)}
                      className="gap-1.5"
                      title="Volver a analizar"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={analyzing || confirming}
                      onClick={reset}
                    >
                      Cambiar
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  {...getRootProps()}
                  className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors ${
                    isDragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/60'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-7 w-7 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">
                    Haz clic o arrastra el Excel aquí
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Formato .xlsx · máx. 10 MB · hasta 1000 filas
                  </p>
                </div>
              )}
              {analyzing && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Revisando el archivo…
                </p>
              )}
            </div>
          </section>

          {/* Paso 3 */}
          {preview && summary && (
            <section className="space-y-4">
              <StepTitle
                number={3}
                title="Revisa y confirma"
                description="Cada persona del archivo queda exactamente como dice el archivo. Las personas que no aparecen no se modifican."
              />

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                <SummaryTile
                  label="Nuevas"
                  value={summary.create}
                  tone="bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200"
                />
                <SummaryTile
                  label="Cambian"
                  value={summary.update}
                  tone="bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200"
                />
                <SummaryTile
                  label="Se quitan"
                  value={summary.remove}
                  tone="bg-orange-50 text-orange-800 dark:bg-orange-500/10 dark:text-orange-200"
                />
                <SummaryTile
                  label="Sin cambios"
                  value={summary.unchanged}
                  tone="bg-muted text-muted-foreground"
                />
                <SummaryTile
                  label="Errores"
                  value={summary.errors}
                  tone={
                    summary.errors
                      ? 'bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-200'
                      : 'bg-muted text-muted-foreground'
                  }
                />
              </div>

              {preview.fileErrors?.length > 0 && (
                <div className="space-y-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs leading-5 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                  {preview.fileErrors.map((message) => (
                    <p key={message} className="flex items-start gap-2">
                      <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {message}
                    </p>
                  ))}
                </div>
              )}

              {(summary.errors > 0 || preview.fileErrors?.length > 0) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadReport}
                  disabled={downloadingReport}
                  className="w-full gap-2"
                >
                  {downloadingReport ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Descargar Excel con los errores marcados
                </Button>
              )}

              {preview.removals?.length > 0 && (
                <div className="rounded-xl border border-orange-200 bg-orange-50/60 px-3.5 py-3 dark:border-orange-500/30 dark:bg-orange-500/10">
                  <p className="flex items-center gap-2 text-xs font-bold text-orange-800 dark:text-orange-200">
                    <MinusCircle className="h-4 w-4" />
                    Se quitarán estas zonas (no aparecen en el archivo para esa
                    persona)
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-orange-900 dark:text-orange-100">
                    {preview.removals.map((removal) => (
                      <li
                        key={`${removal.cedula}-${removal.zone}-${removal.role}`}
                      >
                        <span className="font-semibold">{removal.name}</span>{' '}
                        (CC {removal.cedula}) · {removal.zone} · {removal.role}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                {FILTERS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFilter(option.value)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      filter === option.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/70'
                    }`}
                  >
                    {option.label}
                    {option.value === 'attention'
                      ? ` (${summary.rows - summary.unchanged})`
                      : ` (${summary.rows})`}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {visibleRows.length === 0 ? (
                  <p className="rounded-xl bg-muted/50 px-3.5 py-4 text-center text-xs text-muted-foreground">
                    {summary.rows === 0
                      ? 'El archivo no tiene filas con datos.'
                      : 'Ninguna fila cambia frente a lo guardado.'}
                  </p>
                ) : (
                  visibleRows.map((row) => {
                    const status = STATUS[row.status] ?? STATUS.error;
                    const StatusIcon = status.icon;
                    return (
                      <div
                        key={row.rowNumber}
                        className={`rounded-xl border px-3.5 py-3 ${
                          row.status === 'error'
                            ? 'border-red-200 dark:border-red-500/30'
                            : 'border-border'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {row.name || 'Sin nombre'}
                              {row.cedula && (
                                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                  CC {row.cedula}
                                </span>
                              )}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {[row.zone, row.role, row.shift]
                                .filter(Boolean)
                                .join(' · ') || '—'}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.className}`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Fila {row.rowNumber}
                            </span>
                          </div>
                        </div>
                        {row.messages?.length > 0 && (
                          <ul
                            className={`mt-2 space-y-1 text-xs leading-5 ${
                              row.status === 'error'
                                ? 'text-red-700 dark:text-red-300'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {row.messages.map((message) => (
                              <li key={message}>• {message}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          )}
        </div>

        <SheetFooter className="border-t border-border bg-muted/30 px-5 py-4">
          {blockReason && (
            <p className="text-xs text-muted-foreground">{blockReason}</p>
          )}
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={confirming}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={confirmImport}
              disabled={!preview?.canConfirm || confirming || analyzing}
              className="gap-2"
            >
              {confirming ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {confirming
                ? 'Guardando…'
                : changes
                  ? `Confirmar importación (${changes})`
                  : 'Confirmar importación'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
