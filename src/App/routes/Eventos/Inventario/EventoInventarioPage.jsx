import {
  ArrowLeft,
  Boxes,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  PackageOpen,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
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
    if (
      typeof selectedItem.cantidad === 'number' &&
      Number(cantidad) > selectedItem.cantidad
    ) {
      toast.error(
        `No puedes cargar más de ${selectedItem.cantidad} unidades: es la cantidad total de "${selectedItem.nombre}" en el catálogo.`
      );
      return;
    }
    setSaving(true);
    const res = await upsertEventInventoryService({
      eventId,
      inventoryItemId: selectedItem.id,
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
              : 'Elige un ítem del catálogo y define cuántas unidades tiene disponibles este evento.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {!isEdit && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">
                Ítem del catálogo
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Buscar por nombre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

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
                  No se encontraron ítems en el catálogo.
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
              max={selectedItem?.cantidad ?? undefined}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="ej. 4"
            />
            {typeof selectedItem?.cantidad === 'number' && (
              <p className="text-xs text-muted-foreground">
                Cantidad total en catálogo:{' '}
                <span className="font-medium text-foreground tabular-nums">
                  {selectedItem.cantidad}
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border flex justify-end gap-2 shrink-0">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              saving ||
              !selectedItem ||
              cantidad === '' ||
              (typeof selectedItem?.cantidad === 'number' &&
                Number(cantidad) > selectedItem.cantidad)
            }
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
