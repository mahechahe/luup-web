import {
  AlertTriangle,
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Filter,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  getInventoryItemsService,
  createInventoryItemService,
  updateInventoryItemService,
  deleteInventoryItemService,
} from './services/Inventoryservices';
import { FilterDrawer } from './components/FilterDrawer';

/* ── Helpers ─────────────────────────────────────────────── */
const fmt = (n) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n ?? 0);

/* ── Skeleton row ────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr className="border-b border-border animate-pulse">
      <td className="px-4 py-3.5">
        <div className="h-3.5 bg-muted rounded-full w-32 mb-1.5" />
        <div className="h-3 bg-muted rounded-full w-24" />
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell">
        <div className="h-3.5 bg-muted rounded-full w-14" />
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell">
        <div className="h-3.5 bg-muted rounded-full w-24" />
      </td>
      <td className="px-4 py-3.5">
        <div className="h-8 bg-muted rounded-md w-32" />
      </td>
    </tr>
  );
}

/* ── Modal confirmar eliminación ─────────────────────────── */
function DeleteConfirmModal({ item, onConfirm, onCancel, loading }) {
  return (
    <Dialog
      open={!!item}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent className="max-w-sm text-center" showCloseButton={false}>
        <DialogHeader className="items-center">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-1">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <DialogTitle>¿Eliminar ítem?</DialogTitle>
          <DialogDescription>
            Estás a punto de eliminar{' '}
            <span className="font-semibold text-foreground">
              "{item?.nombre}"
            </span>
            . Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:flex-row gap-2 mt-1">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-destructive hover:bg-destructive/90 text-white border-0"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
            {loading ? 'Eliminando...' : 'Sí, eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Modal agregar / editar ──────────────────────────────── */
function ItemModal({ open, item, onSave, onClose }) {
  const isEdit = !!item;
  const [form, setForm] = useState({
    nombre: item?.nombre ?? '',
    descripcion: item?.descripcion ?? '',
    cantidad: item?.cantidad ?? '',
    precioUnitario: item?.precioUnitario ?? '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.nombre.trim() || !form.cantidad) return;
    setSaving(true);
    await onSave({
      ...(isEdit ? { itemId: item.id } : {}),
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      cantidad: parseInt(form.cantidad) || 0,
      precioUnitario: parseFloat(form.precioUnitario) || 0,
    });
    setSaving(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-brand" />
            </div>
            <DialogTitle>{isEdit ? 'Editar ítem' : 'Nuevo ítem'}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
              Nombre <span className="text-destructive">*</span>
            </label>
            <input
              autoFocus
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              placeholder="ej. Trapero industrial"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition bg-background text-foreground"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
              Descripción{' '}
              <span className="text-muted-foreground font-normal normal-case">
                (opcional)
              </span>
            </label>
            <input
              value={form.descripcion}
              onChange={(e) => set('descripcion', e.target.value)}
              placeholder="ej. Para limpieza de pisos, color azul…"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition bg-background text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
                Cantidad <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={form.cantidad}
                onChange={(e) => set('cantidad', e.target.value)}
                placeholder="0"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition bg-background text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
                Precio unitario
              </label>
              <input
                type="number"
                min="0"
                value={form.precioUnitario}
                onChange={(e) => set('precioUnitario', e.target.value)}
                placeholder="0"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition bg-background text-foreground"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            className="bg-brand text-brand-foreground hover:bg-brand/90"
            onClick={handleSubmit}
            disabled={!form.nombre.trim() || !form.cantidad || saving}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
            {isEdit ? 'Guardar cambios' : 'Agregar ítem'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Página principal ────────────────────────────────────── */
export default function InventarioPage() {
  const EMPTY_FILTERS = { nombre: '', descripcion: '' };

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sortDir, setSortDir] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [modalItem, setModalItem] = useState(undefined);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const hasActiveFilter = Object.values(filters).some((v) => v !== '');

  /* ── Fetch ───────────────────────────────────────────── */
  const doFetch = async ({ p = page, limit = pageSize, f = filters } = {}) => {
    setLoading(true);
    const res = await getInventoryItemsService({
      page: p,
      limit,
      nombre: f.nombre || undefined,
      descripcion: f.descripcion || undefined,
    });
    if (res.status) {
      setItems(res.items);
      setPagination(res.pagination);
    } else {
      toast.error(res.errors ?? 'Error al cargar el inventario.');
    }
    setLoading(false);
  };

  useEffect(() => {
    doFetch({ p: page, limit: pageSize, f: filters });
  }, [page, pageSize, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Sort (client-side sobre la página actual) ───────── */
  const sorted =
    sortDir === 'asc'
      ? [...items].sort((a, b) => a.cantidad - b.cantidad)
      : sortDir === 'desc'
        ? [...items].sort((a, b) => b.cantidad - a.cantidad)
        : items;

  const totalPages = pagination.totalPages;
  const safePage = Math.min(page, Math.max(1, totalPages));

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };
  const handlePageSize = (s) => {
    setPageSize(s);
    setPage(1);
  };

  /* ── CRUD ────────────────────────────────────────────── */
  const handleSave = async (data) => {
    const isEdit = !!data.itemId;
    const res = isEdit
      ? await updateInventoryItemService(data)
      : await createInventoryItemService(data);
    if (res.status) {
      toast.success(isEdit ? 'Ítem actualizado.' : 'Ítem agregado.');
      setPage(1);
      doFetch({ p: 1, limit: pageSize, f: filters });
    } else {
      toast.error(res.errors ?? 'Error al guardar.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const res = await deleteInventoryItemService(deleteTarget.id);
    if (res.status) {
      toast.success('Ítem eliminado.');
      setDeleteTarget(null);
      doFetch({ p: page, limit: pageSize, f: filters });
    } else {
      toast.error(res.errors ?? 'Error al eliminar.');
    }
    setDeleteLoading(false);
  };

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-24">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Header ───────────────────────────────────── */}
        <div className="rounded-2xl bg-[#234465] px-6 py-5 shadow-md flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Boxes className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-0.5">
                Gestión de recursos
              </p>
              <h2 className="text-2xl font-extrabold text-white leading-tight">
                Inventario
              </h2>
              <p className="text-sm text-white/60 mt-0.5">
                Gestiona los ítems y recursos de LUUP.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className={`gap-1.5 h-9 border-white/20 text-white hover:bg-white/20 hover:text-white ${
                hasActiveFilter
                  ? 'bg-[#DD7419]/30 border-[#DD7419]/60'
                  : 'bg-white/10'
              }`}
              onClick={() => setDrawerOpen(true)}
            >
              <Filter className="w-4 h-4" /> Filtrar
            </Button>
            {hasActiveFilter && (
              <Button
                variant="ghost"
                className="gap-1.5 h-9 text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => {
                  setFilters(EMPTY_FILTERS);
                  setPage(1);
                }}
              >
                <X className="w-4 h-4" /> Limpiar
              </Button>
            )}
            <Button
              variant="outline"
              className="gap-1.5 h-9 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              onClick={() => doFetch({ p: page, limit: pageSize, f: filters })}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
            </Button>
            <Button
              className="bg-[#DD7419] hover:bg-[#DD7419]/90 text-white gap-1.5 h-9 font-semibold shadow-sm sm:ml-auto"
              onClick={() => setModalItem(null)}
            >
              <Plus className="w-4 h-4" /> Agregar ítem
            </Button>
          </div>
        </div>

        {/* ── Card tabla ───────────────────────────────── */}
        <Card className="border-border shadow-sm overflow-hidden p-0">
          <div className="flex items-center justify-between px-5 h-12 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#234465]/10 dark:bg-white/10 flex items-center justify-center">
                <Boxes className="w-3.5 h-3.5 text-[#234465] dark:text-white" />
              </div>
              {loading ? (
                <div className="h-4 w-40 bg-muted rounded-full animate-pulse" />
              ) : (
                <span className="text-sm text-muted-foreground">
                  <span className="font-bold text-foreground tabular-nums">
                    {pagination.total}
                  </span>{' '}
                  ítem{pagination.total !== 1 ? 's' : ''} encontrado
                  {pagination.total !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {hasActiveFilter && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#DD7419]/10 text-[#DD7419]">
                Filtros activos
              </span>
            )}
          </div>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase border-b border-border">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase border-b border-border hidden md:table-cell">
                      Descripción
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase border-b border-border">
                      <button
                        onClick={() =>
                          setSortDir((p) =>
                            p === '' ? 'asc' : p === 'asc' ? 'desc' : ''
                          )
                        }
                        className="flex items-center gap-1 hover:text-foreground transition"
                      >
                        Cantidad
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${
                            sortDir === 'asc' ? 'rotate-180' : ''
                          } ${sortDir === '' ? 'opacity-40' : ''}`}
                        />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase border-b border-border hidden md:table-cell">
                      Precio unit.
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase border-b border-border">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <SkeletonRow key={i} />
                    ))
                  ) : sorted.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-20 text-center text-muted-foreground"
                      >
                        {hasActiveFilter
                          ? 'No se encontraron resultados.'
                          : 'No hay ítems registrados.'}
                      </td>
                    </tr>
                  ) : (
                    sorted.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-border hover:bg-muted/30"
                      >
                        {/* Nombre */}
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-foreground block">
                            {item.nombre}
                          </span>
                          {item.descripcion && (
                            <span className="text-xs text-muted-foreground md:hidden block mt-0.5">
                              {item.descripcion}
                            </span>
                          )}
                        </td>

                        {/* Descripción — solo desktop */}
                        <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell">
                          {item.descripcion || '—'}
                        </td>

                        {/* Cantidad */}
                        <td className="px-4 py-3.5">
                          <Badge
                            variant="outline"
                            className="tabular-nums font-semibold"
                          >
                            {item.cantidad.toLocaleString('es-CO')}
                          </Badge>
                        </td>

                        {/* Precio — solo desktop */}
                        <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell">
                          {fmt(item.precioUnitario ?? 0)}
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 md:px-3 text-brand"
                              onClick={() => setModalItem(item)}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span className="hidden md:inline ml-1">
                                Editar
                              </span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 md:px-3 text-red-500"
                              onClick={() => setDeleteTarget(item)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden md:inline ml-1">
                                Eliminar
                              </span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Footer paginación ─────────────────────── */}
            {!loading && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-3.5 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  Mostrando{' '}
                  <span className="font-medium text-foreground">
                    {pagination.total === 0 ? 0 : (safePage - 1) * pageSize + 1}
                    –{Math.min(safePage * pageSize, pagination.total)}
                  </span>{' '}
                  de{' '}
                  <span className="font-medium text-foreground">
                    {pagination.total}
                  </span>{' '}
                  registros
                </span>

                <div className="flex items-center gap-3">
                  {/* Page size */}
                  <div className="relative">
                    <select
                      value={pageSize}
                      onChange={(e) => handlePageSize(Number(e.target.value))}
                      className="appearance-none bg-background border border-border text-sm text-foreground rounded-lg px-3 py-1.5 pr-7 outline-none cursor-pointer hover:border-brand focus:border-brand transition-colors"
                    >
                      <option value={10}>10 / página</option>
                      <option value={25}>25 / página</option>
                      <option value={50}>50 / página</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none w-3.5 h-3.5 text-muted-foreground" />
                  </div>

                  {/* Prev / indicador / Next */}
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={safePage === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground px-2 min-w-[4rem] text-center tabular-nums">
                      {safePage} / {Math.max(pagination.totalPages, 1)}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={safePage === totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onApply={handleApplyFilters}
        activeFilters={filters}
      />

      {/* ── Modales ───────────────────────────────────────── */}
      <ItemModal
        open={modalItem !== undefined}
        item={modalItem}
        onSave={handleSave}
        onClose={() => setModalItem(undefined)}
      />

      <DeleteConfirmModal
        item={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
