import {
  AlertTriangle,
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Loader2,
  Package,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  getInventoryItemsService,
  createInventoryItemService,
  updateInventoryItemService,
  deleteInventoryItemService,
} from './services/Inventoryservices';

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
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">¿Eliminar ítem?</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Estás a punto de eliminar{' '}
            <span className="font-semibold text-foreground">"{item.nombre}"</span>.
            Esta acción no se puede deshacer.
          </p>
        </div>
        <div className="flex gap-3 w-full mt-1">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-red-500 hover:bg-red-600 text-white border-0"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
            {loading ? 'Eliminando...' : 'Sí, eliminar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Modal agregar / editar ──────────────────────────────── */
function ItemModal({ item, onSave, onClose }) {
  const isEdit = !!item;
  const [form, setForm] = useState({
    nombre:         item?.nombre         ?? '',
    descripcion:    item?.descripcion    ?? '',
    cantidad:       item?.cantidad       ?? '',
    precioUnitario: item?.precioUnitario ?? '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.nombre.trim() || !form.cantidad) return;
    setSaving(true);
    await onSave({
      ...(isEdit ? { itemId: item.id } : {}),
      nombre:         form.nombre.trim(),
      descripcion:    form.descripcion.trim() || null,
      cantidad:       parseInt(form.cantidad) || 0,
      precioUnitario: parseFloat(form.precioUnitario) || 0,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-brand" />
            </div>
            <h2 className="text-base font-semibold text-foreground">
              {isEdit ? 'Editar ítem' : 'Nuevo ítem'}
            </h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              placeholder="ej. Trapero industrial"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition bg-background"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
              Descripción <span className="text-muted-foreground font-normal normal-case">(opcional)</span>
            </label>
            <input
              value={form.descripcion}
              onChange={(e) => set('descripcion', e.target.value)}
              placeholder="ej. Para limpieza de pisos, color azul…"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition bg-background"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
                Cantidad <span className="text-red-500">*</span>
              </label>
              <input
                type="number" min="0"
                value={form.cantidad}
                onChange={(e) => set('cantidad', e.target.value)}
                placeholder="0"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition bg-background"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
                Precio unitario
              </label>
              <input
                type="number" min="0"
                value={form.precioUnitario}
                onChange={(e) => set('precioUnitario', e.target.value)}
                placeholder="0"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition bg-background"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-brand text-brand-foreground hover:bg-brand/90"
            onClick={handleSubmit}
            disabled={!form.nombre.trim() || !form.cantidad || saving}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
            {isEdit ? 'Guardar cambios' : 'Agregar ítem'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Página principal ────────────────────────────────────── */
export default function InventarioPage() {
  const [items, setItems]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [sortDir, setSortDir]           = useState('');
  const [pageSize, setPageSize]         = useState(10);
  const [page, setPage]                 = useState(1);
  const [modalItem, setModalItem]       = useState(undefined); // undefined=cerrado, null=nuevo, obj=editar
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ── Fetch ───────────────────────────────────────────── */
  const fetchItems = useCallback(async () => {
    setLoading(true);
    const res = await getInventoryItemsService();
    if (res.status) setItems(res.items);
    else toast.error(res.errors ?? 'Error al cargar el inventario.');
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  /* ── Filtros + sort ──────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...items];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) =>
        i.nombre.toLowerCase().includes(q) || String(i.cantidad).includes(q)
      );
    }
    if (sortDir === 'asc')  list.sort((a, b) => a.cantidad - b.cantidad);
    if (sortDir === 'desc') list.sort((a, b) => b.cantidad - a.cantidad);
    return list;
  }, [items, search, sortDir]);

  /* ── Paginación ──────────────────────────────────────── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSearch   = (v) => { setSearch(v); setPage(1); };
  const handlePageSize = (s) => { setPageSize(s); setPage(1); };

  /* ── CRUD ────────────────────────────────────────────── */
  const handleSave = async (data) => {
    const isEdit = !!data.itemId;
    const res = isEdit
      ? await updateInventoryItemService(data)
      : await createInventoryItemService(data);
    if (res.status) {
      toast.success(isEdit ? 'Ítem actualizado.' : 'Ítem agregado.');
      await fetchItems();
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
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setDeleteTarget(null);
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center">
                <Boxes className="w-4 h-4 text-brand" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground tracking-tight">Inventario</h2>
            </div>
            <p className="text-sm text-muted-foreground">Gestiona los ítems y recursos de LUUP.</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              className="bg-brand text-brand-foreground hover:bg-brand/90 gap-1.5 h-9"
              onClick={() => setModalItem(null)}
            >
              <Plus className="w-4 h-4" /> Agregar ítem
            </Button>
          </div>
        </div>

        {/* ── Card tabla ───────────────────────────────── */}
        <Card className="border-border shadow-sm overflow-hidden p-0">
          <CardHeader className="px-5 py-4 border-b">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Contador */}
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-muted-foreground" />
                {loading ? (
                  <div className="h-4 w-40 bg-muted rounded-full animate-pulse" />
                ) : (
                  <span className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground tabular-nums">{filtered.length}</span>{' '}
                    inventario{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Buscador */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Buscar por nombre o cantidad…"
                  className="w-full h-9 pl-9 pr-8 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition"
                />
                {search && (
                  <button
                    onClick={() => handleSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </CardHeader>

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
                        onClick={() => setSortDir((p) => p === '' ? 'asc' : p === 'asc' ? 'desc' : '')}
                        className="flex items-center gap-1 hover:text-foreground transition"
                      >
                        Cantidad
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortDir === 'asc' ? 'rotate-180' : ''} ${sortDir === '' ? 'opacity-40' : ''}`} />
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
                    Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-muted-foreground">
                        {search ? 'No se encontraron resultados.' : 'No hay ítems registrados.'}
                      </td>
                    </tr>
                  ) : (
                    paginated.map((item) => (
                      <tr key={item.id} className="border-b border-border hover:bg-muted/30">
                        {/* Nombre */}
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-foreground block">{item.nombre}</span>
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
                          <Badge variant="outline" className="tabular-nums font-semibold">
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
                              <span className="hidden md:inline ml-1">Editar</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 md:px-3 text-red-500"
                              onClick={() => setDeleteTarget(item)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden md:inline ml-1">Eliminar</span>
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
                    {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}
                    –{Math.min(safePage * pageSize, filtered.length)}
                  </span>{' '}
                  de{' '}
                  <span className="font-medium text-foreground">{filtered.length}</span>{' '}
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
                      {safePage} / {Math.max(totalPages, 1)}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={safePage === totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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

      {/* ── Modales ───────────────────────────────────────── */}
      {modalItem !== undefined && (
        <ItemModal
          item={modalItem}
          onSave={handleSave}
          onClose={() => setModalItem(undefined)}
        />
      )}

      <DeleteConfirmModal
        item={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
}