import {
  AlertCircle,
  CheckCircle2,
  Download,
  Upload,
  Users,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { FileUpload } from '@/app/components/FileUpload/FileUpload';
import { useHandleUpload } from '@/hooks/useHandleUpload';
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getCollaboratorTemplateService,
  uploadExcelCollaboratorsService,
} from '../services/collaboratorServices';
import { toast } from 'sonner';

/* ── Tipos de archivo aceptados ──────────────────────────── */
const EXCEL_ACCEPT = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    '.xlsx',
  ],
  'application/vnd.ms-excel': ['.xls'],
};

async function downloadTemplate(setIsDownloading) {
  setIsDownloading(true);
  const { status, url, errors } = await getCollaboratorTemplateService();
  setIsDownloading(false);

  if (!status || !url) {
    toast.error(
      errors || 'No se pudo obtener el template. Intenta nuevamente.'
    );
    return;
  }

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', '');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* ── Modal de loader fullscreen ─────────────────────────── */
function UploadingOverlay() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-5 rounded-2xl bg-white px-10 py-10 shadow-2xl max-w-sm w-full mx-4 text-center">
        <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center">
          <span className="w-8 h-8 border-4 border-brand/30 border-t-brand rounded-full animate-spin block" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-bold text-foreground">
            Cargando colaboradores…
          </p>
          <p className="text-sm text-muted-foreground">
            Esto puede tardar unos momentos.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700 font-medium text-left">
            Por favor, no cierres ni recargues la página mientras se procesa el
            archivo.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Modal de resumen ────────────────────────────────────── */
function ResultDialog({ open, onClose, result, uploadError }) {
  if (!result && !uploadError) return null;

  const { summary, created = [], failed = [] } = result ?? {};

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {uploadError ? (
              <>
                <XCircle className="w-5 h-5 text-destructive" />
                Error en la carga
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Resumen de la carga masiva
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* Error global */}
          {uploadError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
              {uploadError}
            </p>
          )}

          {/* Tarjetas de resumen */}
          {summary && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-center">
                <p className="text-2xl font-bold text-foreground">
                  {summary.total}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Total</p>
              </div>
              <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-center">
                <p className="text-2xl font-bold text-green-700">
                  {summary.created}
                </p>
                <p className="text-xs text-green-600 mt-0.5">Creados</p>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center">
                <p className="text-2xl font-bold text-red-700">
                  {summary.failed}
                </p>
                <p className="text-xs text-red-600 mt-0.5">Fallidos</p>
              </div>
            </div>
          )}

          {/* Colaboradores creados */}
          {created.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Creados exitosamente
              </p>
              <div className="space-y-2">
                {created.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-xs space-y-0.5"
                  >
                    <p className="font-medium text-green-800">
                      Fila {item.row} — {item.fullName}
                    </p>
                    {item.documentNumber && (
                      <p className="text-green-700">
                        Doc: {item.documentNumber}
                      </p>
                    )}
                    {item.email && (
                      <p className="text-green-700">{item.email}</p>
                    )}
                    {item.phone && (
                      <p className="text-green-700">{item.phone}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Colaboradores fallidos */}
          {failed.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-destructive" />
                Con errores
              </p>
              <div className="space-y-2 mt-1">
                {failed.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs space-y-0.5"
                  >
                    <p className="font-medium text-red-800">
                      Fila {item.row} — {item.fullName}
                    </p>
                    {item.documentNumber && item.documentNumber !== 'N/A' && (
                      <p className="text-red-700">Doc: {item.documentNumber}</p>
                    )}
                    <p className="text-red-700">{item.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t border-border">
          <Button
            type="button"
            className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Drawer ──────────────────────────────────────────────── */
/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onSuccess: () => void,
 * }} props
 */
export function BulkUploadDrawer({ open, onClose, onSuccess }) {
  const { docs, handleUploadChange, handleUploadDelete, handleClearUploads } =
    useHandleUpload();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [showResult, setShowResult] = useState(false);

  function handleOpenChange(isOpen) {
    if (!isOpen && !isSubmitting) {
      handleClearUploads();
      onClose();
    }
  }

  function handleResultClose() {
    setShowResult(false);
    setUploadResult(null);
    setUploadError(null);
    handleClearUploads();
    onClose();
    if (uploadResult?.summary?.created > 0) {
      onSuccess?.();
    }
  }

  async function handleConfirm() {
    if (docs.length === 0) return;
    setIsSubmitting(true);
    setUploadResult(null);
    setUploadError(null);

    const { status, result, errors } = await uploadExcelCollaboratorsService(
      docs[0]
    );

    setIsSubmitting(false);

    if (!status) {
      setUploadError(errors);
      setShowResult(true);
      return;
    }

    setUploadResult(result);
    setShowResult(true);
  }

  return (
    <>
      {/* Loader fullscreen mientras se procesa */}
      {isSubmitting && <UploadingOverlay />}

      {/* Modal de resumen */}
      <ResultDialog
        open={showResult}
        onClose={handleResultClose}
        result={uploadResult}
        uploadError={uploadError}
      />

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
          {/* Header */}
          <SheetHeader className="pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-brand" />
              </div>
              <div>
                <SheetTitle className="text-base font-bold">
                  Carga masiva de colaboradores
                </SheetTitle>
                <SheetDescription className="text-xs mt-0.5">
                  Descarga el template, complétalo y súbelo.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {/* Paso 1 — Descargar template */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                1. Descarga el template
              </p>
              <p className="text-xs text-muted-foreground">
                El archivo incluye las columnas requeridas con el formato
                esperado.
              </p>
              <Button
                type="button"
                variant="outline"
                className="gap-2 w-full"
                disabled={isDownloading}
                onClick={() => downloadTemplate(setIsDownloading)}
              >
                {isDownloading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-foreground/20 border-t-foreground/70 rounded-full animate-spin" />
                    Obteniendo template…
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Descargar template
                  </>
                )}
              </Button>
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Paso 2 — Subir archivo */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                2. Sube el archivo completado
              </p>
              <FileUpload
                label="Archivo Excel"
                files={docs}
                handleUploadChange={handleUploadChange}
                handleUploadDelete={handleUploadDelete}
                accept={EXCEL_ACCEPT}
                acceptText="XLSX, XLS"
                maxFiles={1}
              />
            </div>
          </div>

          {/* Footer */}
          <SheetFooter className="flex-col gap-2 pt-4 border-t border-border sm:flex-col">
            <Button
              type="button"
              disabled={docs.length === 0 || isSubmitting}
              className="w-full bg-brand text-brand-foreground hover:bg-brand/90 gap-2"
              onClick={handleConfirm}
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Cargando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Confirmar carga
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isSubmitting}
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
