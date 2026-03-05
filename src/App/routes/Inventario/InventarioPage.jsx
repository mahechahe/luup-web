import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Edit2,
  Loader2,
  Package,
  Plus,
  Search,
  Trash2,
  X,
  TrendingUp,
  DollarSign,
  Boxes,
} from 'lucide-react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
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

/* ── Modal: Agregar / Editar ─────────────────────────────── */
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
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del modal con acento de color */}
        <div className="px-6 pt-6 pb-5" style={{ background: 'linear-gradient(135deg, #234465 0%, #1a3350 100%)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-0.5">
                {isEdit ? 'Modificar registro' : 'Nuevo registro'}
              </p>
              <h2 className="text-white text-xl font-black">
                {isEdit ? item.nombre : 'Agregar ítem'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center transition"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Nombre */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              autoFocus
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              placeholder="ej. Trapero industrial"
              className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-medium outline-none transition focus:border-[#234465]"
              style={{ background: '#f8fafc' }}
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Descripción <span className="text-slate-300 font-normal normal-case tracking-normal">(opcional)</span>
            </label>
            <input
              value={form.descripcion}
              onChange={(e) => set('descripcion', e.target.value)}
              placeholder="ej. Para limpieza de pisos, color azul…"
              className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-medium outline-none transition focus:border-[#234465]"
              style={{ background: '#f8fafc' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Cantidad */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Cantidad <span className="text-red-400">*</span>
              </label>
              <input
                type="number" min="0"
                value={form.cantidad}
                onChange={(e) => set('cantidad', e.target.value)}
                placeholder="0"
                className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-medium outline-none transition focus:border-[#234465]"
                style={{ background: '#f8fafc' }}
              />
            </div>
            {/* Precio */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Precio unit.
              </label>
              <input
                type="number" min="0"
                value={form.precioUnitario}
                onChange={(e) => set('precioUnitario', e.target.value)}
                placeholder="0"
                className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-medium outline-none transition focus:border-[#234465]"
                style={{ background: '#f8fafc' }}
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!form.nombre.trim() || !form.cantidad || saving}
            className="w-full rounded-2xl py-3.5 text-sm font-black text-white transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #DD7419 0%, #c46210 100%)' }}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Guardar cambios' : 'Agregar ítem'}
          </button>
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
  const [modalItem, setModalItem]       = useState(undefined);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId]     = useState(null);

  /* ── Fetch ───────────────────────────────────────────── */
  const fetchItems = useCallback(async () => {
    setLoading(true);
    const res = await getInventoryItemsService();
    if (res.status) setItems(res.items);
    else toast.error(res.errors ?? 'Error al cargar el inventario.');
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  /* ── Filtros ─────────────────────────────────────────── */
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

  const handlePageSize = (size) => { setPageSize(size); setPage(1); };
  const handleSearch   = (v)    => { setSearch(v); setPage(1); };

  /* ── Stats ───────────────────────────────────────────── */
  const totalItems    = items.length;
  const totalUnidades = items.reduce((s, i) => s + i.cantidad, 0);
  const valorTotal    = items.reduce((s, i) => s + (i.cantidad * (i.precioUnitario ?? 0)), 0);

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

  const handleDelete = async (id) => {
    setDeletingId(id);
    const res = await deleteInventoryItemService(id);
    if (res.status) {
      toast.success('Ítem eliminado.');
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      toast.error(res.errors ?? 'Error al eliminar.');
    }
    setDeletingId(null);
    setDeleteTarget(null);
  };

  /* ── Page numbers ────────────────────────────────────── */
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
      acc.push(p);
      return acc;
    }, []);

  /* ── Skeleton ────────────────────────────────────────── */
  const Skeleton = () => (
    <div className="animate-pulse divide-y divide-slate-100">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="w-8 h-8 bg-slate-100 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-slate-100 rounded-full w-2/3" />
            <div className="h-3 bg-slate-100 rounded-full w-1/3" />
          </div>
          <div className="h-3.5 bg-slate-100 rounded-full w-12 hidden sm:block" />
          <div className="h-3.5 bg-slate-100 rounded-full w-20 hidden sm:block" />
          <div className="flex gap-2">
            <div className="h-8 bg-slate-100 rounded-xl w-16" />
            <div className="h-8 bg-slate-100 rounded-xl w-20" />
          </div>
        </div>
      ))}
    </div>
  );

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div className="min-h-screen pb-24" style={{ background: '#f1f5f9' }}>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* ── Header con gradiente ─────────────────────── */}
        <div
          className="rounded-3xl px-6 py-5 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #234465 0%, #1a3350 100%)' }}
        >
          <div>
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-0.5">Módulo</p>
            <h1 className="text-white text-2xl font-black tracking-tight">Inventario</h1>
            <p className="text-white/60 text-sm mt-0.5">
              {loading ? '…' : `${totalItems} ítem${totalItems !== 1 ? 's' : ''} registrados`}
            </p>
          </div>
          <button
            onClick={() => setModalItem(null)}
            className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black transition-all shadow-lg hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
            style={{ background: '#DD7419', color: 'white' }}
          >
            <Plus className="w-4 h-4" />
            <span>Agregar</span>
          </button>
        </div>

        {/* ── Stats cards ──────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total ítems',  value: loading ? '…' : totalItems,                            icon: Boxes,      bg: 'linear-gradient(135deg, #234465 0%, #1a3350 100%)', textColor: 'white',   subColor: 'rgba(255,255,255,0.6)' },
            { label: 'Unidades',     value: loading ? '…' : totalUnidades.toLocaleString('es-CO'), icon: TrendingUp, bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', textColor: '#c2410c', subColor: '#f97316' },
            { label: 'Valor total',  value: loading ? '…' : fmt(valorTotal),                       icon: DollarSign, bg: 'linear-gradient(135deg, #059669 0%, #047857 100%)', textColor: 'white',   subColor: 'rgba(255,255,255,0.6)' },
          ].map(({ label, value, icon: Icon, bg, textColor, subColor }) => (
            <div
              key={label}
              className="rounded-2xl p-3 sm:p-4 shadow-sm overflow-hidden relative"
              style={{ background: bg }}
            >
              <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full opacity-10" style={{ background: textColor }} />
              <Icon className="w-4 h-4 mb-2" style={{ color: subColor }} />
              <p className="font-black text-base sm:text-xl leading-none truncate" style={{ color: textColor }}>{value}</p>
              <p className="text-[10px] sm:text-xs font-semibold mt-1 uppercase tracking-wide" style={{ color: subColor }}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── Buscador + page size ──────────────────────── */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar por nombre o cantidad…"
              className="w-full h-11 pl-11 pr-10 rounded-2xl border-2 border-transparent bg-white text-sm font-medium placeholder:text-slate-400 outline-none transition focus:border-[#234465] shadow-sm"
            />
            {search && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select
            value={pageSize}
            onChange={(e) => handlePageSize(Number(e.target.value))}
            className="h-11 px-4 rounded-2xl border-2 border-transparent bg-white text-sm font-bold text-slate-600 outline-none focus:border-[#234465] shadow-sm shrink-0 transition"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        {/* ── Tabla ────────────────────────────────────── */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-slate-100">

          {/* Cabecera */}
          <div className="grid grid-cols-[1fr_72px_180px] sm:grid-cols-[1fr_1fr_90px_130px_180px] items-center gap-3 px-5 py-3.5 border-b border-slate-100"
            style={{ background: '#f8fafc' }}
          >
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nombre</p>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">Descripción</p>
            <button
              onClick={() => setSortDir((p) => p === '' ? 'asc' : p === 'asc' ? 'desc' : '')}
              className="flex items-center gap-1 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-[#234465] transition"
            >
              Cant.
              {sortDir === 'asc'  && <ChevronUp   className="w-3 h-3" />}
              {sortDir === 'desc' && <ChevronDown  className="w-3 h-3" />}
              {sortDir === ''     && <span className="opacity-40">↕</span>}
            </button>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">Precio unit.</p>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</p>
          </div>

          {/* Filas */}
          {loading ? (
            <Skeleton />
          ) : paginated.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <div
                className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto"
                style={{ background: '#f1f5f9' }}
              >
                <Package className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-500">Sin ítems</p>
              <p className="text-xs text-slate-400">
                {search ? 'Sin resultados para tu búsqueda.' : 'Agrega el primer ítem con el botón "Agregar".'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {paginated.map((item, idx) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_72px_180px] sm:grid-cols-[1fr_1fr_90px_130px_180px] items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  {/* Nombre + descripcion mobile */}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{item.nombre}</p>
                    {item.descripcion && (
                      <p className="text-[11px] text-slate-400 truncate sm:hidden mt-0.5">{item.descripcion}</p>
                    )}
                  </div>

                  {/* Descripción desktop */}
                  <p className="text-sm text-slate-400 truncate hidden sm:block">
                    {item.descripcion || <span className="text-slate-200">—</span>}
                  </p>

                  {/* Cantidad */}
                  <div>
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black"
                      style={{ background: '#EFF6FF', color: '#234465' }}
                    >
                      {item.cantidad.toLocaleString('es-CO')}
                    </span>
                  </div>

                  {/* Precio desktop */}
                  <p className="text-sm font-semibold text-slate-600 hidden sm:block">
                    {fmt(item.precioUnitario ?? 0)}
                  </p>

                  {/* Acciones */}
                  <div className="flex items-center gap-1.5 justify-end">
                    <button
                      onClick={() => setModalItem(item)}
                      className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all duration-200 hover:-translate-y-1 hover:shadow-md active:translate-y-0"
                      style={{ background: '#EFF6FF', color: '#234465' }}
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all duration-200 hover:-translate-y-1 hover:shadow-md active:translate-y-0"
                      style={{ background: '#FEF2F2', color: '#dc2626' }}
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer totales */}
          {!loading && paginated.length > 0 && (
            <div
              className="grid grid-cols-[1fr_72px_180px] sm:grid-cols-[1fr_1fr_90px_130px_180px] items-center gap-3 px-5 py-3.5 border-t border-slate-100"
              style={{ background: '#f8fafc' }}
            >
              <p className="text-xs font-bold text-slate-400">
                {filtered.length} ítem{filtered.length !== 1 ? 's' : ''}
              </p>
              <span className="hidden sm:block" />
              <div>
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black"
                  style={{ background: '#234465', color: 'white' }}
                >
                  {filtered.reduce((s, i) => s + i.cantidad, 0).toLocaleString('es-CO')}
                </span>
              </div>
              <p className="text-sm font-black hidden sm:block" style={{ color: '#059669' }}>
                {fmt(filtered.reduce((s, i) => s + (i.cantidad * (i.precioUnitario ?? 0)), 0))}
              </p>
              <span />
            </div>
          )}
        </div>

        {/* ── Paginación ───────────────────────────────── */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-400">
              Página {safePage} de {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {pageNumbers.map((p, idx) =>
                p === '...' ? (
                  <span key={`dot-${idx}`} className="w-8 text-center text-xs text-slate-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className="w-8 h-8 rounded-xl text-xs font-black transition shadow-sm border"
                    style={
                      p === safePage
                        ? { background: '#234465', color: 'white', borderColor: '#234465' }
                        : { background: 'white', color: '#64748b', borderColor: '#e2e8f0' }
                    }
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal agregar/editar ─────────────────────────── */}
      {modalItem !== undefined && (
        <ItemModal
          item={modalItem}
          onSave={handleSave}
          onClose={() => setModalItem(undefined)}
        />
      )}

      {/* ── Modal eliminar ───────────────────────────────── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}
        >
          <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-5" style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Confirmar acción</p>
                  <p className="text-white font-black text-base">Eliminar ítem</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-slate-500 leading-relaxed">
                Se eliminará <span className="font-bold text-slate-700">"{deleteTarget.nombre}"</span> del inventario permanentemente.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={!!deletingId}
                  className="flex-1 border-2 border-slate-200 rounded-2xl py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(deleteTarget.id)}
                  disabled={!!deletingId}
                  className="flex-1 rounded-2xl py-3 text-sm font-black text-white transition flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' }}
                >
                  {deletingId === deleteTarget.id && <Loader2 className="w-4 h-4 animate-spin" />}
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}