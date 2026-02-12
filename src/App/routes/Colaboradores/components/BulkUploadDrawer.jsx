import { Download, Upload, Users } from 'lucide-react';
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

/* ── Tipos de archivo aceptados ──────────────────────────── */
const EXCEL_ACCEPT = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    '.xlsx',
  ],
  'application/vnd.ms-excel': ['.xls'],
};

/* ── Columnas del template ───────────────────────────────── */
const TEMPLATE_HEADERS = [
  'firstName',
  'lastName',
  'phone',
  'cedula',
  'typeDocument',
  'email',
  'age',
  'gender',
];

function downloadTemplate() {
  const csv = TEMPLATE_HEADERS.join(',') + '\n';
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'template_colaboradores.csv';
  link.click();
  URL.revokeObjectURL(url);
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

  function handleOpenChange(isOpen) {
    if (!isOpen) {
      handleClearUploads();
      onClose();
    }
  }

  async function handleConfirm() {
    if (docs.length === 0) return;
    setIsSubmitting(true);
    // TODO: llamar al servicio de carga masiva con docs[0]
    setIsSubmitting(false);
  }

  return (
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
              onClick={downloadTemplate}
            >
              <Download className="w-4 h-4" />
              Descargar template
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
  );
}
