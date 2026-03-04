import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Edit2,
  Loader2,
  Package,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  getInventoryItemsService,
  createInventoryItemService,
  updateInventoryItemService,
  deleteInventoryItemService,
} from './services/Inventoryservices';

/* ── Helpers ─────────────────────────────────────────────── */
const fmt = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n ?? 0);

/* ── Celda editable inline ───────────────────────────────── */
function EditableCell({ value, type = 'text', prefix, onSave, disabled }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);
  const inputRef              = useRef(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commit = () => {
    const parsed = type === 'number' ? (parseFloat(draft) || 0) : draft.trim();
    if (parsed !== value) onSave(parsed);
    setEditing(false);
  };

  const cancel = () => { setDraft(value); setEditing(false); };

  const handleKey = (e) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') cancel();
  };

  if (disabled) {
    return (
      <span className="text-sm text-foreground">
        {prefix}{type === 'number' && prefix ? fmt(value) : value}
      </span>
    );
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type={type}
          min={type === 'number' ? 0 : undefined}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          onBlur={commit}
          className="w-full border border-[#234465] rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-[#234465]/20 bg-white"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group flex items-center gap-1.5 text-left w-full hover:text-[#234465] transition"
    >
      <span className="text-sm text-foreground group-hover:text-[#234465] transition">
        {prefix === '$' ? fmt(value) : value ?? '—'}
      </span>
      <Edit2 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0 transition" />
    </button>
  );
}

/* ── Modal: Agregar ítem ─────────────────────────────────── */
function AddItemModal({ onSave, onClose }) {
  const [form, setForm]   = useState({ nombre: '', descripcion: '', cantidad: '', precioUnitario: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.nombre.trim() || !form.cantidad) return;
    setSaving(true);
    await onSave({
      nombre:         form.nombre.trim(),
      descripcion:    form.descripcion.trim() || null,
      cantidad:       parseInt(form.cantidad) || 0,
      precioUnitario: parseFloat(form.precioUnitario) || 0,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Agregar ítem</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">
              Nombre <span className="text-destructive">*</span>
            </label>
            <input
              autoFocus
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              placeholder="ej. Trapero industrial"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#234465] focus:ring-2 focus:ring-[#234465]/15"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">
              Descripción <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <input
              value={form.descripcion}
              onChange={(e) => set('descripcion', e.target.value)}
              placeholder="ej. Para limpieza de pisos, color azul…"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#234465] focus:ring-2 focus:ring-[#234465]/15"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">
                Cantidad <span className="text-destructive">*</span>
              </label>
              <input
                type="number" min="0"
                value={form.cantidad}
                onChange={(e) => set('cantidad', e.target.value)}
                placeholder="0"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#234465] focus:ring-2 focus:ring-[#234465]/15"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">
                Precio unit.
              </label>
              <input
                type="number" min="0"
                value={form.precioUnitario}
                onChange={(e) => set('precioUnitario', e.target.value)}
                placeholder="0"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#234465] focus:ring-2 focus:ring-[#234465]/15"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!form.nombre.trim() || !form.cantidad || saving}
            className="w-full bg-[#234465] hover:bg-[#234465]/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-3 text-sm font-bold transition flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Agregar ítem
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
  const [cantidadFilter, setCantidadFilter] = useState('');  // '' | 'asc' | 'desc'
  const [showAdd, setShowAdd]           = useState(false);
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
      // buscar por nombre o por cantidad exacta
      list = list.filter((i) => {
        const byName     = i.nombre.toLowerCase().includes(q);
        const byCantidad = String(i.cantidad).includes(q);
        return byName || byCantidad;
      });
    }

    if (cantidadFilter === 'asc')  list.sort((a, b) => a.cantidad - b.cantidad);
    if (cantidadFilter === 'desc') list.sort((a, b) => b.cantidad - a.cantidad);

    return list;
  }, [items, search, cantidadFilter]);

  /* ── Stats ───────────────────────────────────────────── */
  const totalItems    = items.length;
  const totalUnidades = items.reduce((s, i) => s + i.cantidad, 0);
  const valorTotal    = items.reduce((s, i) => s + (i.cantidad * (i.precioUnitario ?? 0)), 0);

  /* ── Update inline ───────────────────────────────────── */
  const handleInlineUpdate = async (item, field, newValue) => {
    // optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, [field]: newValue } : i))
    );
    const res = await updateInventoryItemService({
      itemId:        item.id,
      nombre:        field === 'nombre'        ? newValue : item.nombre,
      cantidad:      field === 'cantidad'      ? newValue : item.cantidad,
      precioUnitario: field === 'precioUnitario' ? newValue : item.precioUnitario,
    });
    if (!res.status) {
      toast.error(res.errors ?? 'Error al actualizar.');
      // revert
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, [field]: item[field] } : i))
      );
    }
  };

  /* ── Add ─────────────────────────────────────────────── */
  const handleAdd = async (data) => {
    const res = await createInventoryItemService(data);
    if (res.status) {
      toast.success('Ítem agregado.');
      setItems((prev) => [res.item, ...prev]);
    } else {
      toast.error(res.errors ?? 'Error al agregar el ítem.');
    }
  };

  /* ── Delete ──────────────────────────────────────────── */
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

  /* ── Sort toggle ─────────────────────────────────────── */
  const toggleSort = () => {
    setCantidadFilter((p) => p === '' ? 'asc' : p === 'asc' ? 'desc' : '');
  };

  /* ── Skeleton ────────────────────────────────────────── */
  const Skeleton = () => (
    <div className="animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-border">
          <div className="h-4 bg-muted rounded flex-1" />
          <div className="h-4 bg-muted rounded flex-1" />
          <div className="h-4 bg-muted rounded w-16" />
          <div className="h-4 bg-muted rounded w-24" />
          <div className="w-7 h-7 bg-muted rounded-lg" />
        </div>
      ))}
    </div>
  );

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5 pb-24">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-[#234465] tracking-tight">Inventario</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {loading ? '…' : `${totalItems} ítem${totalItems !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-[#DD7419] hover:bg-[#DD7419]/90 text-white rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm transition shrink-0"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Ítems',       value: totalItems,                                   color: '#234465' },
            { label: 'Unidades',    value: loading ? '…' : totalUnidades.toLocaleString('es-CO'), color: '#DD7419' },
            { label: 'Valor total', value: loading ? '…' : fmt(valorTotal),              color: '#059669' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border border-border bg-white px-3 py-3.5 text-center shadow-sm">
              <p className="text-lg font-black truncate" style={{ color }}>{value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o cantidad…"
            className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-white text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#234465]/20 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">

          {/* Cabecera */}
          <div className="grid grid-cols-[1fr_1fr_100px_140px_40px] items-center gap-4 px-4 py-3 border-b border-border bg-muted/30">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Nombre</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Descripción</p>
            <button
              onClick={toggleSort}
              className="flex items-center gap-1 text-xs font-bold text-muted-foreground uppercase tracking-wide hover:text-[#234465] transition"
            >
              Cantidad
              {cantidadFilter === 'asc'  && <ChevronUp   className="w-3 h-3" />}
              {cantidadFilter === 'desc' && <ChevronDown  className="w-3 h-3" />}
              {cantidadFilter === ''     && <span className="w-3 h-3 opacity-40">↕</span>}
            </button>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Precio unit.</p>
            <span />
          </div>

          {/* Filas */}
          {loading ? (
            <Skeleton />
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                <Package className="w-7 h-7 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Sin ítems</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {search
                    ? 'Sin resultados para tu búsqueda.'
                    : 'Agrega el primer ítem con el botón "Agregar".'}
                </p>
              </div>
            </div>
          ) : (
            <div>
              {filtered.map((item, idx) => (
                <div
                  key={item.id}
                  className={`grid grid-cols-[1fr_1fr_100px_140px_40px] items-center gap-4 px-4 py-3.5 ${
                    idx !== filtered.length - 1 ? 'border-b border-border' : ''
                  } hover:bg-muted/20 transition-colors group`}
                >
                  {/* Nombre */}
                  <EditableCell
                    value={item.nombre}
                    type="text"
                    onSave={(v) => handleInlineUpdate(item, 'nombre', v)}
                  />

                  {/* Descripción */}
                  <EditableCell
                    value={item.descripcion ?? ''}
                    type="text"
                    onSave={(v) => handleInlineUpdate(item, 'descripcion', v)}
                  />

                  {/* Cantidad */}
                  <EditableCell
                    value={item.cantidad}
                    type="number"
                    onSave={(v) => handleInlineUpdate(item, 'cantidad', v)}
                  />

                  {/* Precio */}
                  <EditableCell
                    value={item.precioUnitario ?? 0}
                    type="number"
                    prefix="$"
                    onSave={(v) => handleInlineUpdate(item, 'precioUnitario', v)}
                  />

                  {/* Eliminar */}
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Footer con totales */}
          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-[1fr_1fr_100px_140px_40px] items-center gap-4 px-4 py-3 border-t border-border bg-muted/20">
              <p className="text-xs font-bold text-muted-foreground">
                {filtered.length} ítem{filtered.length !== 1 ? 's' : ''}
              </p>
              <span />
              <p className="text-sm font-black text-[#234465]">
                {filtered.reduce((s, i) => s + i.cantidad, 0).toLocaleString('es-CO')}
              </p>
              <p className="text-sm font-black text-[#059669]">
                {fmt(filtered.reduce((s, i) => s + (i.cantidad * (i.precioUnitario ?? 0)), 0))}
              </p>
              <span />
            </div>
          )}
        </div>

        {/* Tip de edición */}
        {!loading && items.length > 0 && (
          <p className="text-center text-[11px] text-muted-foreground">
            Toca cualquier celda para editarla directamente · Enter para guardar · Esc para cancelar
          </p>
        )}
      </div>

      {/* ── Modales ───────────────────────────────────────── */}
      {showAdd && (
        <AddItemModal
          onSave={handleAdd}
          onClose={() => setShowAdd(false)}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">Eliminar ítem</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Se eliminará "{deleteTarget.nombre}" del inventario. Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={!!deletingId}
                className="flex-1 border border-border rounded-xl py-2.5 text-sm font-semibold hover:bg-muted transition disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteTarget.id)}
                disabled={!!deletingId}
                className="flex-1 bg-destructive hover:bg-destructive/90 disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-bold transition flex items-center justify-center gap-2"
              >
                {deletingId === deleteTarget.id && <Loader2 className="w-4 h-4 animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}