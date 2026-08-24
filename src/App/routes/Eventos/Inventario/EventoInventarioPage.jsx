import {
  AlertCircle,
  ArrowLeft,
  Boxes,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Loader2,
  PackageOpen,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getInventoryItemsService } from '@/App/routes/Inventario/services/Inventoryservices';
import {
  listEventInventoryService,
  upsertEventInventoryService,
  deleteEventInventoryService,
  uploadEventInventoryExcelService,
  getEventInventoryTemplateService,
} from '../services/inventoryServices';

// ── Modal: cargar / editar la cantidad de un ítem para el evento ───────────
function LoadItemModal({ open, onClose, eventId, editingRow, onSuccess }) {
  const isEdit = !!editingRow;
  const [search, setSearch] = useState('');
  const [catalog, setCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [cantidad, setCantidad] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setCantidad(isEdit ? String(editingRow.cantidadCargada) : '');
    setSelectedItem(
      isEdit
        ? {
            id: editingRow.inventoryItemId,
            nombre: editingRow.nombre,
            descripcion: editingRow.descripcion,
            cantidad: editingRow.cantidadGlobal,
          }
        : null
    );
  }, [open, isEdit, editingRow]);

  useEffect(() => {
    if (!open || isEdit) return;
    setLoadingCatalog(true);
    const timeout = setTimeout(() => {
      getInventoryItemsService({
        page: 1,
        limit: 50,
        nombre: search || undefined,
      }).then((res) => {
        if (res.status) setCatalog(res.items);
        setLoadingCatalog(false);
      });
    }, 250);
    return () => clearTimeout(timeout);
  }, [open, isEdit, search]);

  const handleSubmit = async () => {
    if (!selectedItem || cantidad === '' || Number(cantidad) < 0) {
      toast.error('Selecciona un ítem e ingresa la cantidad.');
      return;
    }
    if (!Number.isInteger(Number(cantidad))) {
      toast.error('La cantidad debe ser un número entero.');
      return;
    }
    setSaving(true);
    // Sin id es un ítem nuevo: el API lo crea en el catálogo por nombre.
    const res = await upsertEventInventoryService({
      eventId,
      inventoryItemId: selectedItem.id ?? undefined,
      nombre: selectedItem.nombre,
      cantidadCargada: Number(cantidad),
    });
    if (res.status) {
      toast.success(
        isEdit ? 'Inventario actualizado.' : 'Ítem cargado al evento.'
      );
      onSuccess();
      onClose();
    } else {
      toast.error(res.errors ?? 'Error al guardar.');
    }
    setSaving(false);
  };

  const trimmedSearch = search.trim();
  // Solo se ofrece crear si el nombre escrito no existe ya en el catálogo.
  const canCreateNew =
    !isEdit &&
    trimmedSearch !== '' &&
    !loadingCatalog &&
    !catalog.some(
      (it) => it.nombre.trim().toLowerCase() === trimmedSearch.toLowerCase()
    );
  const isNewSelected = selectedItem != null && selectedItem.id == null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90dvh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border shrink-0">
          <DialogTitle>
            {isEdit ? 'Editar cantidad cargada' : 'Cargar ítem al evento'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Ajusta cuántas unidades de "${editingRow.nombre}" tiene disponibles este evento.`
              : 'Busca un ítem del catálogo o escribe uno nuevo, y define cuántas unidades tiene disponibles este evento.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {!isEdit && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">
                Ítem
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Buscar o escribir un ítem nuevo..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    // El ítem nuevo se nombra con lo escrito: al cambiarlo la
                    // selección anterior deja de corresponder.
                    if (isNewSelected) setSelectedItem(null);
                  }}
                />
              </div>

              {/* Un nombre que no está en el catálogo se puede crear al vuelo. */}
              {canCreateNew && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedItem({ id: null, nombre: trimmedSearch })
                  }
                  className={`w-full text-left rounded-xl border-2 border-dashed px-3 py-2.5 bg-card transition-all ${
                    isNewSelected
                      ? 'border-brand'
                      : 'border-border hover:border-muted-foreground/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        Crear &quot;{trimmedSearch}&quot;
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        No está en el catálogo. Se agrega al crearlo.
                      </p>
                    </div>
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        isNewSelected
                          ? 'bg-brand border-transparent'
                          : 'border-muted-foreground/30'
                      }`}
                    >
                      {isNewSelected && (
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      )}
                    </span>
                  </div>
                </button>
              )}

              {loadingCatalog ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-12 bg-muted rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              ) : catalog.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 border border-border rounded-xl">
                  {trimmedSearch
                    ? 'No hay ítems del catálogo con ese nombre.'
                    : 'El catálogo está vacío. Escribe un nombre para crear el primer ítem.'}
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {catalog.map((it) => {
                    const selected = selectedItem?.id === it.id;
                    return (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => setSelectedItem(it)}
                        className={`w-full text-left rounded-xl border-2 px-3 py-2.5 bg-card transition-all ${
                          selected
                            ? 'border-brand'
                            : 'border-border hover:border-muted-foreground/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {it.nombre}
                            </p>
                            {it.descripcion && (
                              <p className="text-xs text-muted-foreground truncate">
                                {it.descripcion}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                              {it.cantidad} unidad
                              {it.cantidad !== 1 ? 'es' : ''} en catálogo
                            </p>
                          </div>
                          <span
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              selected
                                ? 'bg-brand border-transparent'
                                : 'border-muted-foreground/30'
                            }`}
                          >
                            {selected && (
                              <Check className="w-3 h-3 text-white stroke-[3]" />
                            )}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">
              Cantidad para este evento{' '}
              <span className="text-destructive">*</span>
            </label>
            <Input
              type="number"
              min="0"
              step="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="ej. 4"
            />
            <p className="text-xs text-muted-foreground">
              Es el tope de unidades que este evento puede asignar. No depende
              de las existencias del catálogo.
            </p>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border flex justify-end gap-2 shrink-0">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !selectedItem || cantidad === ''}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
            {saving
              ? 'Guardando...'
              : isEdit
                ? 'Guardar cambios'
                : 'Cargar ítem'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Modal: carga masiva desde Excel ───────────────────────────────────────
function BulkUploadModal({ open, onClose, eventId, onSuccess }) {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setResult(null);
    setUploading(false);
  }, [open]);

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    const res = await getEventInventoryTemplateService();
    setDownloading(false);
    if (res.status && res.url) {
      window.open(res.url, '_blank', 'noopener,noreferrer');
    } else {
      toast.error(res.errors ?? 'No se pudo generar la plantilla.');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const res = await uploadEventInventoryExcelService({ eventId, file });
    setUploading(false);

    if (!res.status) {
      toast.error(res.errors ?? 'No se pudo procesar el archivo.');
      return;
    }

    setResult(res.data);
    // La lista de atrás se refresca aunque queden filas con error.
    onSuccess();
  };

  const resumen = result?.resumen;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90dvh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border shrink-0">
          <DialogTitle>
            {result ? 'Resumen de la carga' : 'Carga masiva de inventario'}
          </DialogTitle>
          <DialogDescription>
            {result
              ? 'Esto fue lo que se cargó. Las filas con error no se guardaron.'
              : 'Sube un Excel con los ítems y sus cantidades. Descarga la plantilla si no la tienes.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {!result ? (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-1.5"
                onClick={handleDownloadTemplate}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {downloading ? 'Generando...' : 'Descargar plantilla'}
              </Button>

              <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1.5">
                <p className="text-xs font-semibold text-foreground">
                  Cómo llenarla
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                  <li>
                    <span className="font-medium text-foreground">
                      Nombre del ítem
                    </span>{' '}
                    y{' '}
                    <span className="font-medium text-foreground">
                      Cantidad
                    </span>{' '}
                    son obligatorios; la descripción es opcional.
                  </li>
                  <li>Si el ítem no existe en el catálogo, se crea solo.</li>
                  <li>
                    Si ya está cargado en este evento, la cantidad del archivo
                    reemplaza la anterior.
                  </li>
                </ul>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                className="hidden"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  e.target.value = '';
                }}
              />

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-border hover:border-brand transition-colors px-4 py-6 flex flex-col items-center gap-2 text-center"
              >
                <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />
                </div>
                {file ? (
                  <>
                    <p className="text-sm font-semibold text-foreground break-all">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Toca para elegir otro archivo
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-foreground">
                      Selecciona el archivo
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Formato .xlsx o .xls
                    </p>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-border bg-card px-3 py-2.5 text-center">
                  <p className="text-lg font-bold text-foreground tabular-nums">
                    {resumen.procesadas}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Filas</p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-center">
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {resumen.exitosas}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Cargadas</p>
                </div>
                <div
                  className={`rounded-xl border px-3 py-2.5 text-center ${
                    resumen.fallidas > 0
                      ? 'border-destructive/20 bg-destructive/10'
                      : 'border-border bg-card'
                  }`}
                >
                  <p
                    className={`text-lg font-bold tabular-nums ${
                      resumen.fallidas > 0
                        ? 'text-destructive'
                        : 'text-foreground'
                    }`}
                  >
                    {resumen.fallidas}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Con error</p>
                </div>
              </div>

              {(resumen.nuevos > 0 ||
                resumen.actualizados > 0 ||
                resumen.itemsCreadosEnCatalogo > 0) && (
                <div className="flex flex-wrap gap-1.5">
                  {resumen.nuevos > 0 && (
                    <Badge variant="outline" className="tabular-nums">
                      {resumen.nuevos} nuevo{resumen.nuevos !== 1 ? 's' : ''} en
                      el evento
                    </Badge>
                  )}
                  {resumen.actualizados > 0 && (
                    <Badge variant="outline" className="tabular-nums">
                      {resumen.actualizados} actualizado
                      {resumen.actualizados !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {resumen.itemsCreadosEnCatalogo > 0 && (
                    <Badge
                      variant="outline"
                      className="tabular-nums bg-brand/10 text-brand border-brand/20"
                    >
                      {resumen.itemsCreadosEnCatalogo} creado
                      {resumen.itemsCreadosEnCatalogo !== 1 ? 's' : ''} en el
                      catálogo
                    </Badge>
                  )}
                </div>
              )}

              {result.failed.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-destructive">
                    No se cargaron ({result.failed.length})
                  </p>
                  <div className="rounded-xl border border-destructive/20 divide-y divide-destructive/10 overflow-hidden">
                    {result.failed.map((f) => (
                      <div key={`f-${f.row}`} className="px-3 py-2.5">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground">
                              Fila {f.row} · {f.nombre}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {f.motivo}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.successful.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Cargadas ({result.successful.length})
                  </p>
                  <div className="rounded-xl border border-border divide-y divide-border overflow-hidden max-h-56 overflow-y-auto">
                    {result.successful.map((s) => (
                      <div
                        key={`s-${s.row}`}
                        className="px-3 py-2.5 flex items-start gap-2"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {s.nombre}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                            {s.actualizado
                              ? `${s.cantidadAnterior} → ${s.cantidadCargada} unidades`
                              : `${s.cantidadCargada} unidades`}
                            {s.itemCreado && ' · nuevo en el catálogo'}
                          </p>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
                          Fila {s.row}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-5 py-4 border-t border-border flex justify-end gap-2 shrink-0">
          {result ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setFile(null);
                }}
              >
                Cargar otro archivo
              </Button>
              <Button onClick={onClose}>Listo</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={uploading}>
                Cancelar
              </Button>
              <Button onClick={handleUpload} disabled={!file || uploading}>
                {uploading && (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                )}
                {uploading ? 'Procesando...' : 'Cargar archivo'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Barra de paginación (se reutiliza arriba y abajo de la lista) ──────────
function PaginationBar({
  variant = 'bottom',
  total,
  startIdx,
  endIdx,
  safePage,
  totalPages,
  pageSize,
  onPageSizeChange,
  onPrev,
  onNext,
}) {
  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 ${
        variant === 'top' ? 'border-b' : 'border-t'
      } border-border`}
    >
      <span className="text-xs text-muted-foreground">
        Mostrando{' '}
        <span className="font-medium text-foreground">
          {startIdx}–{endIdx}
        </span>{' '}
        de <span className="font-medium text-foreground">{total}</span>{' '}
        registros
      </span>

      <div className="flex items-center gap-3">
        <div className="relative">
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="appearance-none bg-background border border-border text-sm text-foreground rounded-lg px-3 py-1.5 pr-7 outline-none cursor-pointer hover:border-brand focus:border-brand transition-colors"
          >
            <option value={10}>10 / página</option>
            <option value={25}>25 / página</option>
            <option value={50}>50 / página</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none w-3.5 h-3.5 text-muted-foreground" />
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={safePage === 1}
            onClick={onPrev}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground px-2 min-w-[4rem] text-center tabular-nums">
            {safePage} / {Math.max(totalPages, 1)}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={safePage === totalPages}
            onClick={onNext}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────
function EventoInventarioPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [modalRow, setModalRow] = useState(undefined); // undefined=cerrado, null=nuevo, obj=editar
  const [bulkOpen, setBulkOpen] = useState(false);
  const [toRemove, setToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  const hasActiveFilter = search !== '';

  // Búsqueda con debounce: escribir resetea a la página 1.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    const res = await listEventInventoryService(eventId, {
      page,
      limit: pageSize,
      nombre: search || undefined,
    });
    if (res.status) {
      setRows(res.items);
      setPagination(res.pagination);
    } else {
      toast.error(res.errors ?? 'Error al cargar el inventario del evento.');
    }
    setLoading(false);
  }, [eventId, page, pageSize, search]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handlePageSize = (size) => {
    setPageSize(size);
    setPage(1);
  };

  const totalPages = pagination.totalPages;
  const safePage = Math.min(page, Math.max(1, totalPages));
  const startIdx = pagination.total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIdx = Math.min(safePage * pageSize, pagination.total);

  const handleRemove = async () => {
    if (!toRemove) return;
    setRemoving(true);
    const res = await deleteEventInventoryService({
      eventId,
      inventoryItemId: toRemove.inventoryItemId,
    });
    if (res.status) {
      toast.success('Ítem quitado del inventario del evento.');
      fetchInventory();
    } else {
      toast.error(res.errors ?? 'Error al quitar el ítem.');
    }
    setRemoving(false);
    setToRemove(null);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          type="button"
          onClick={() => navigate(`/eventos/${eventId}`)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-brand transition-colors group -ml-1"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Volver al evento
        </button>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#DD7419]/10 flex items-center justify-center">
                <Boxes className="w-4 h-4 text-[#DD7419]" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground tracking-tight">
                Inventario del evento
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Define cuántas unidades de cada ítem del catálogo hay disponibles
              para este evento.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkOpen(true)}
              className="gap-1.5"
            >
              <Upload className="w-4 h-4" /> Carga masiva
            </Button>
            {pagination.total > 0 && (
              <Button
                size="sm"
                onClick={() => setModalRow(null)}
                className="gap-1.5"
              >
                <Plus className="w-4 h-4" /> Cargar ítem
              </Button>
            )}
          </div>
        </div>

        {pagination.total > 0 || hasActiveFilter ? (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9 pr-9"
              placeholder="Buscar por nombre..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : null}

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/20 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {loading
                ? 'Cargando...'
                : `${pagination.total} ítem${
                    pagination.total !== 1 ? 's' : ''
                  } cargado${pagination.total !== 1 ? 's' : ''}`}
            </p>
            {hasActiveFilter && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-brand/10 text-brand">
                Filtro activo
              </span>
            )}
          </div>

          {!loading && pagination.total > 0 && (
            <PaginationBar
              variant="top"
              total={pagination.total}
              startIdx={startIdx}
              endIdx={endIdx}
              safePage={safePage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageSizeChange={handlePageSize}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            />
          )}

          {loading ? (
            <div className="divide-y divide-border">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="px-4 py-3 flex items-center gap-3 animate-pulse"
                >
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-muted rounded w-36" />
                    <div className="h-3 bg-muted rounded w-48" />
                  </div>
                  <div className="w-16 h-5 bg-muted rounded-full" />
                </div>
              ))}
            </div>
          ) : rows.length === 0 && hasActiveFilter ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14 text-center px-6">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                <Search className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">
                  Sin resultados
                </p>
                <p className="text-xs text-muted-foreground max-w-xs mt-1">
                  No se encontraron ítems cargados con ese nombre.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSearchInput('')}
                className="gap-1.5 mt-1"
              >
                <X className="w-4 h-4" /> Limpiar búsqueda
              </Button>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14 text-center px-6">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                <PackageOpen className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">
                  Este evento aún no tiene inventario cargado
                </p>
                <p className="text-xs text-muted-foreground max-w-xs mt-1">
                  Carga los ítems del catálogo y define cuántas unidades hay
                  disponibles para este evento antes de asignarlos en el
                  check-in.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setModalRow(null)}
                className="gap-1.5 mt-1"
              >
                <Plus className="w-4 h-4" /> Cargar el primer ítem
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="grid gap-3 px-4 py-4 transition-colors hover:bg-muted/20 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {row.nombre}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <Badge variant="outline" className="tabular-nums">
                        {row.cantidadCargada} cargado
                        {row.cantidadCargada !== 1 ? 's' : ''}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="tabular-nums text-muted-foreground"
                      >
                        {row.asignado} asignado{row.asignado !== 1 ? 's' : ''}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="tabular-nums bg-brand/10 text-brand border-brand/20"
                      >
                        {row.disponible} disponible
                        {row.disponible !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-3 sm:border-0 sm:pt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5"
                      onClick={() => setModalRow(row)}
                    >
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-red-500 disabled:text-muted-foreground"
                      disabled={row.asignado > 0}
                      title={
                        row.asignado > 0
                          ? 'No puedes quitarlo: ya tiene unidades asignadas a colaboradores.'
                          : undefined
                      }
                      onClick={() => setToRemove(row)}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Quitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && pagination.total > 0 && (
            <PaginationBar
              variant="bottom"
              total={pagination.total}
              startIdx={startIdx}
              endIdx={endIdx}
              safePage={safePage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageSizeChange={handlePageSize}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            />
          )}
        </div>
      </div>

      <LoadItemModal
        open={modalRow !== undefined}
        editingRow={modalRow}
        eventId={eventId}
        onSuccess={fetchInventory}
        onClose={() => setModalRow(undefined)}
      />

      <BulkUploadModal
        open={bulkOpen}
        eventId={eventId}
        onSuccess={fetchInventory}
        onClose={() => setBulkOpen(false)}
      />

      <AlertDialog
        open={!!toRemove}
        onOpenChange={(v) => !v && setToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Quitar ítem del inventario del evento?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toRemove && (
                <>
                  <strong>{toRemove.nombre}</strong> dejará de estar disponible
                  para asignar en este evento.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing ? 'Quitando...' : 'Quitar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default EventoInventarioPage;
