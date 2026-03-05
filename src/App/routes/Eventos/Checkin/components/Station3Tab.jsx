import { useState, useEffect, useCallback } from 'react';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Edit2,
  Loader2,
  Lock,
  Minus,
  Package,
  PackageCheck,
  Plus,
  Search,
  Trash2,
  UserCheck,
  X,
  BarChart3,
} from 'lucide-react';
import { getInventoryItemsService } from '@/App/routes/Inventario/services/Inventoryservices';
import { useUserStore } from '@/App/context/userStore';

/* ── Helpers ─────────────────────────────────────────────── */
const AVATAR_COLORS = [
  'from-[#234465] to-[#3a6b9f]',
  'from-[#DD7419] to-[#f59e0b]',
  'from-[#059669] to-[#34d399]',
  'from-[#7c3aed] to-[#a78bfa]',
  'from-[#dc2626] to-[#f87171]',
  'from-[#0891b2] to-[#67e8f9]',
];

function Avatar({ firstName }) {
  const c = AVATAR_COLORS[(firstName?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
  return (
    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c} flex items-center justify-center shrink-0`}>
      <span className="text-white font-bold text-sm">{(firstName?.[0] ?? '?').toUpperCase()}</span>
    </div>
  );
}

function roleBadgeClass(role) {
  if (role === 'supervisor') return 'bg-[#234465]/10 text-[#234465]';
  if (role === 'coordinador') return 'bg-[#DD7419]/10 text-[#DD7419]';
  return 'bg-[#7493B2]/10 text-[#7493B2]';
}
function roleLabel(role) {
  return ({ supervisor: 'Supervisor', coordinador: 'Coordinador', colaborador: 'Colaborador' }[role] ?? role);
}

function formatDateTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/* ── Modal disponibilidad de inventario ──────────────────── */
function InventoryAvailabilityModal({ inventory, allDotaciones, onClose }) {
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);
  const PAGE_SIZE = 10;

  const usedMap = {};
  allDotaciones.forEach((dotacion) => {
    dotacion.forEach(({ itemId, cantidad }) => {
      usedMap[itemId] = (usedMap[itemId] ?? 0) + cantidad;
    });
  });

  const allItems = inventory.map((item) => {
    const usado = usedMap[item.id] ?? 0;
    const disponible = item.cantidad - usado;
    return { ...item, usado, disponible };
  });

  const filtered = allItems.filter((i) => {
    const q = search.toLowerCase().trim();
    return !q || i.nombre.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: '90vw', height: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Disponibilidad de inventario</h2>
              <p className="text-xs text-muted-foreground">
                {filtered.length} de {allItems.length} ítem{allItems.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Buscador */}
        <div className="px-6 py-3 border-b border-border shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por nombre…"
              className="w-full h-9 pl-9 pr-9 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-background"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {allItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <Package className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-bold text-foreground">No hay ítems disponibles</p>
              <p className="text-xs text-muted-foreground">El inventario está vacío.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <Search className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-bold text-foreground">Sin resultados</p>
              <p className="text-xs text-muted-foreground">No hay ítems que coincidan con "{search}".</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_80px_80px_80px] gap-3 px-3 py-2 rounded-lg bg-muted/40">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Ítem</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide text-center">Total</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide text-center">Usado</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide text-center">Disp.</p>
              </div>

              {paginated.map((item) => {
                const agotado = item.disponible <= 0;
                const pct = item.cantidad > 0 ? Math.round((item.usado / item.cantidad) * 100) : 0;
                return (
                  <div
                    key={item.id}
                    className={`grid grid-cols-[1fr_80px_80px_80px] gap-3 px-3 py-3 rounded-xl border ${
                      agotado ? 'border-red-200 bg-red-50' : 'border-border bg-white'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${agotado ? 'text-red-700' : 'text-foreground'}`}>
                        {item.nombre}
                      </p>
                      {item.descripcion && (
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.descripcion}</p>
                      )}
                      <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${agotado ? 'bg-red-500' : 'bg-violet-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-foreground text-center self-center tabular-nums">
                      {item.cantidad}
                    </p>
                    <p className="text-sm font-semibold text-orange-600 text-center self-center tabular-nums">
                      {item.usado}
                    </p>
                    <div className="flex items-center justify-center self-center">
                      {agotado ? (
                        <span className="text-[10px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                          Sin stock
                        </span>
                      ) : (
                        <span className="text-sm font-black text-violet-700 tabular-nums">{item.disponible}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer paginación */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-border shrink-0 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Mostrando{' '}
              <span className="font-semibold text-foreground">
                {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)}
              </span>{' '}
              de <span className="font-semibold text-foreground">{filtered.length}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...'); acc.push(p); return acc; }, [])
                .map((p, idx) =>
                  p === '...'
                    ? <span key={`d${idx}`} className="text-xs text-muted-foreground px-1">…</span>
                    : <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition border ${
                          p === safePage ? 'bg-violet-600 text-white border-violet-600' : 'bg-white border-border text-foreground hover:bg-muted'
                        }`}
                      >{p}</button>
                )
              }
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Modal de dotación (inventario paginado) ─────────────── */
function DotacionModal({ inventory, existingCart, onConfirm, onClose, saving, givenBy, givenAt }) {
  const [search, setSearch]     = useState('');
  const [sortDir, setSortDir]   = useState('');
  const [page, setPage]         = useState(1);
  const PAGE_SIZE = 8;

  // Inicializa el carrito con la dotación existente para edición
  const [cart, setCart] = useState(
    existingCart
      ? existingCart.map((d) => ({ item: inventory.find((i) => i.id === d.itemId) ?? { id: d.itemId, nombre: d.itemNombre, cantidad: 9999 }, cantidad: d.cantidad })).filter((c) => c.item)
      : []
  );

  const cartItem   = (id) => cart.find((c) => c.item.id === id);
  const addItem    = (item) => { if (!cartItem(item.id)) setCart((p) => [...p, { item, cantidad: 1 }]); };
  const updateQty  = (id, delta) => setCart((p) => p.map((c) => c.item.id === id ? { ...c, cantidad: c.cantidad + delta } : c).filter((c) => c.cantidad > 0));
  const removeItem = (id) => setCart((p) => p.filter((c) => c.item.id !== id));
  const exceedsStock = (item, cantidad) => cantidad > item.cantidad;

  const filtered = inventory.filter((i) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return i.nombre.toLowerCase().includes(q) || String(i.cantidad).includes(q);
  });
  const sorted   = [...filtered].sort((a, b) => sortDir === 'asc' ? a.cantidad - b.cantidad : sortDir === 'desc' ? b.cantidad - a.cantidad : 0);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totalItems  = cart.reduce((s, c) => s + c.cantidad, 0);
  const hasError    = cart.some(({ item, cantidad }) => exceedsStock(item, cantidad));
  const isEdit = !!existingCart?.length;
  const canConfirm = (isEdit || cart.length > 0) && !saving && !hasError;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground">
              {existingCart?.length ? 'Editar dotación' : 'Entregar dotación'}
            </h2>
            {givenBy && (
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Última entrega: {givenBy} — {formatDateTime(givenAt) ?? 'ahora'}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Carrito */}
          {cart.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-foreground uppercase tracking-wide">Seleccionados</p>
              {cart.map(({ item, cantidad }) => (
                <div key={item.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${exceedsStock(item, cantidad) ? 'bg-red-50 border-red-200' : 'bg-[#eff6ff] border-[#bfdbfe]'}`}>
                  <Package className={`w-3.5 h-3.5 shrink-0 ${exceedsStock(item, cantidad) ? 'text-red-500' : 'text-[#234465]'}`} />
                  <span className="flex-1 text-xs font-semibold text-foreground truncate">{item.nombre}</span>
                  {exceedsStock(item, cantidad) && (
                    <span className="text-[10px] text-red-500 font-bold shrink-0">máx {item.cantidad}</span>
                  )}
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-lg bg-white border border-border flex items-center justify-center hover:bg-muted transition">
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={item.cantidad}
                      value={cantidad}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val >= 1) {
                          setCart((p) => p.map((c) => c.item.id === item.id ? { ...c, cantidad: val } : c));
                        } else if (e.target.value === '') {
                          setCart((p) => p.map((c) => c.item.id === item.id ? { ...c, cantidad: 1 } : c));
                        }
                      }}
                      className="w-12 h-6 text-center text-xs font-black tabular-nums border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#234465]/20"
                    />
                    <button onClick={() => updateQty(item.id, 1)} disabled={exceedsStock(item, cantidad + 1)} className="w-6 h-6 rounded-lg bg-white border border-border flex items-center justify-center hover:bg-muted disabled:opacity-30 transition">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 transition shrink-0">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Buscador + sort */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-foreground uppercase tracking-wide">Inventario</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Buscar ítem…"
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#234465]/20 bg-background"
                />
              </div>
              <button
                onClick={() => { setSortDir((p) => p === '' ? 'asc' : p === 'asc' ? 'desc' : ''); setPage(1); }}
                className="h-9 px-3 rounded-lg border border-border text-xs font-bold text-muted-foreground hover:border-[#234465] hover:text-[#234465] transition flex items-center gap-1"
              >
                Cant.
                {sortDir === 'asc' && <ChevronUp className="w-3 h-3" />}
                {sortDir === 'desc' && <ChevronDown className="w-3 h-3" />}
                {sortDir === '' && <span className="opacity-40">↕</span>}
              </button>
            </div>
          </div>

          {/* Lista de ítems paginada */}
          <div className="space-y-1">
            {paginated.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Sin resultados.</p>
            ) : (
              paginated.map((item) => {
                const inCart  = !!cartItem(item.id);
                const noStock = item.cantidad === 0;
                return (
                  <button
                    key={item.id}
                    onClick={() => !inCart && !noStock && addItem(item)}
                    disabled={inCart || noStock}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition ${
                      inCart    ? 'bg-[#eff6ff] border-[#bfdbfe] cursor-default' :
                      noStock   ? 'bg-muted/40 border-border opacity-50 cursor-not-allowed' :
                                  'bg-white border-border hover:border-[#234465]/40 hover:bg-[#eff6ff]/40 active:scale-[0.98]'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${inCart ? 'bg-[#234465]' : 'bg-muted'}`}>
                      {inCart
                        ? <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        : <Package className="w-3.5 h-3.5 text-muted-foreground" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{item.nombre}</p>
                      {item.descripcion && (
                        <p className="text-[10px] text-muted-foreground truncate">{item.descripcion}</p>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold shrink-0 px-1.5 py-0.5 rounded-md ${noStock ? 'bg-red-100 text-red-500' : 'bg-muted text-muted-foreground'}`}>
                      {noStock ? 'Sin stock' : `${item.cantidad} disp.`}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted-foreground">Pág. {safePage} / {totalPages}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}
                  className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30 transition">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...'); acc.push(p); return acc; }, [])
                  .map((p, idx) =>
                    p === '...' ? <span key={`d${idx}`} className="text-xs text-muted-foreground px-1">…</span> :
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition border ${p === safePage ? 'bg-[#234465] text-white border-[#234465]' : 'bg-white border-border text-foreground hover:bg-muted'}`}>
                      {p}
                    </button>
                  )
                }
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                  className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30 transition">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer confirmar */}
        <div className="px-5 py-4 border-t border-border shrink-0">
          <button
            onClick={() => canConfirm && onConfirm(cart)}
            disabled={!canConfirm}
            className="w-full h-10 rounded-xl bg-[#234465] text-white text-sm font-bold hover:bg-[#234465]/90 disabled:opacity-40 transition flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />}
            Confirmar dotación {totalItems > 0 && `· ${totalItems} ítem${totalItems !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Card colaborador ────────────────────────────────────── */
function CollabCard({ collab, inventory, onDotacionSaved, givenByName }) {
  const [showModal, setShowModal]   = useState(false);
  const [editMode, setEditMode]     = useState(false);
  const [saving, setSaving]         = useState(false);

  const dotacion   = collab.dotacion ?? [];
  const hasDotacion = dotacion.length > 0;

  const handleConfirm = async (cart) => {
    setSaving(true);
    await onDotacionSaved(collab.userId, cart);
    setSaving(false);
    setShowModal(false);
    setEditMode(false);
  };

  return (
    <>
      <div className={`bg-white rounded-2xl border overflow-hidden transition-all ${hasDotacion ? 'border-violet-200' : 'border-border'}`}>
        <div className={`h-1 ${hasDotacion ? 'bg-violet-500' : 'bg-muted'}`} />
        <div className="p-3 space-y-3">

          {/* Info colaborador */}
          <div className="flex items-start gap-3">
            <Avatar firstName={collab.firstName} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{collab.firstName} {collab.lastName}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{collab.cedula} · {collab.phone ?? '—'}</p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {collab.zones?.map((z, i) => (
                  <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#eff6ff] text-[#2563eb]">{z}</span>
                ))}
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${roleBadgeClass(collab.role)}`}>
                  {roleLabel(collab.role)}
                </span>
              </div>
            </div>
            {hasDotacion && (
              <div className="shrink-0 w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
            )}
          </div>

          {/* Resumen dotación + info de quién entregó */}
          {hasDotacion && (
            <div className="space-y-1.5">
              <div className="flex flex-wrap gap-1.5">
                {dotacion.map((d, i) => (
                  <span key={i} className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-100">
                    {d.cantidad}× {d.itemNombre}
                  </span>
                ))}
              </div>
              {(collab.dotacionGivenBy || collab.dotacionGivenAt) && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3 shrink-0" />
                  Entregado por <span className="font-semibold text-foreground">{collab.dotacionGivenBy ?? givenByName}</span>
                  {collab.dotacionGivenAt && <> · {formatDateTime(collab.dotacionGivenAt)}</>}
                </p>
              )}
            </div>
          )}

          {/* Badge estado */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${hasDotacion ? 'bg-violet-100 text-violet-700' : 'bg-muted text-muted-foreground'}`}>
              <Package className="w-3 h-3" />
              {hasDotacion ? 'Dotación entregada' : 'Sin dotación'}
            </div>
          </div>

          {/* Botones */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { setEditMode(false); setShowModal(true); }}
              className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl font-semibold text-sm transition-all border ${
                hasDotacion
                  ? 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100'
                  : 'bg-white border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              <Package className="w-4 h-4" />
              {hasDotacion ? 'Agregar más' : 'Entregar dotación'}
            </button>
            {hasDotacion && (
              <button
                onClick={() => { setEditMode(true); setShowModal(true); }}
                className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl font-semibold text-sm border border-border bg-white text-muted-foreground hover:bg-muted transition"
                title="Editar dotación"
              >
                <Edit2 className="w-4 h-4" />
                <span className="text-xs">Editar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <DotacionModal
          inventory={inventory}
          existingCart={editMode ? dotacion : null}
          onConfirm={handleConfirm}
          onClose={() => { setShowModal(false); setEditMode(false); }}
          saving={saving}
          givenBy={collab.dotacionGivenBy ?? givenByName}
          givenAt={collab.dotacionGivenAt}
        />
      )}
    </>
  );
}

/* ── Tab principal ───────────────────────────────────────── */
export function Station3Tab({ collaborators, loading, filter, onDotacionSaved }) {
  const { user } = useUserStore();
  const givenByName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : 'Operador';

  const [inventory, setInventory]               = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [showAvailability, setShowAvailability] = useState(false);

  const eligible     = collaborators.filter((c) => c.attendance?.attended);
  const notCheckedIn = collaborators.length - eligible.length;
  const hasDotacion  = (c) => (c.dotacion ?? []).length > 0;

  const filtered = eligible.filter((c) => {
    if (filter === 'done')    return hasDotacion(c);
    if (filter === 'pending') return !hasDotacion(c);
    return true;
  });

  const stats = {
    total:   eligible.length,
    done:    eligible.filter(hasDotacion).length,
    pending: eligible.filter((c) => !hasDotacion(c)).length,
  };

  // Todas las dotaciones para calcular disponibilidad
  const allDotaciones = eligible.map((c) => c.dotacion ?? []);

  const fetchInventory = useCallback(async () => {
    setLoadingInventory(true);
    const res = await getInventoryItemsService();
    if (res.status) setInventory(res.items);
    setLoadingInventory(false);
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  // Wrapper que también guarda quién y cuándo entregó
  const handleDotacionSaved = async (userId, cart) => {
    await onDotacionSaved(userId, cart, { givenBy: givenByName, givenAt: new Date().toISOString() });
  };

  return (
    <div className="space-y-4">

      {/* Aviso sin check-in */}
      {!loading && notCheckedIn > 0 && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700 font-medium">
            <span className="font-bold">{notCheckedIn}</span>{' '}
            {notCheckedIn === 1 ? 'persona no ha' : 'personas no han'} completado el check-in en Estación 1.
          </p>
        </div>
      )}

      {/* Stats + botón disponibilidad */}
      {!loading && (
        <div className="flex items-stretch gap-3">
          <div className="grid grid-cols-3 gap-3 flex-1">
            <div className="bg-white rounded-xl border border-border p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Total</p>
            </div>
            <div className="bg-violet-50 rounded-xl border border-violet-100 p-3 text-center">
              <p className="text-2xl font-bold text-violet-600">{stats.done}</p>
              <p className="text-[11px] text-violet-600/70 mt-0.5">Con dotación</p>
            </div>
            <div className="bg-muted rounded-xl border border-border p-3 text-center">
              <p className="text-2xl font-bold text-muted-foreground">{stats.pending}</p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">Pendientes</p>
            </div>
          </div>

          {/* Botón ver disponibilidad */}
          <button
            onClick={() => setShowAvailability(true)}
            className="flex flex-col items-center justify-center gap-1 px-4 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 transition shrink-0 min-w-[72px]"
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] font-bold text-center leading-tight">Ver stock</span>
          </button>
        </div>
      )}

      {/* Skeleton */}
      {loading || loadingInventory ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border p-3 animate-pulse space-y-3">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-muted rounded-full w-36" />
                  <div className="h-3 bg-muted rounded-full w-24" />
                </div>
              </div>
              <div className="h-10 bg-muted rounded-xl" />
            </div>
          ))}
        </div>
      ) : eligible.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <UserCheck className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">Nadie ha completado el check-in aún</p>
          <p className="text-xs text-muted-foreground mt-1">Las personas aparecerán aquí una vez pasen por Estación 1.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Sin resultados para este filtro.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((collab) => (
            <CollabCard
              key={collab.userId}
              collab={collab}
              inventory={inventory}
              onDotacionSaved={handleDotacionSaved}
              givenByName={givenByName}
            />
          ))}
        </div>
      )}

      {/* Modal disponibilidad */}
      {showAvailability && (
        <InventoryAvailabilityModal
          inventory={inventory}
          allDotaciones={allDotaciones}
          onClose={() => setShowAvailability(false)}
        />
      )}
    </div>
  );
}