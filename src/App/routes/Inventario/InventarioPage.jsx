import {
  AlertTriangle,
  Box,
  Edit2,
  HardHat,
  Package,
  Plus,
  Radio,
  Search,
  ShieldCheck,
  Shirt,
  Trash2,
  Users,
  X,
  ArrowUpRight,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useState, useMemo } from 'react';

/* ── Categorías ─────────────────────────────────────────── */
const CATEGORIAS = [
  { id: 'radio',     label: 'Radios',     icon: Radio,       color: '#234465' },
  { id: 'uniforme',  label: 'Uniformes',  icon: Shirt,       color: '#7c3aed' },
  { id: 'insumo',    label: 'Insumos',    icon: Package,     color: '#DD7419' },
  { id: 'equipo',    label: 'Equipos',    icon: HardHat,     color: '#0891b2' },
  { id: 'seguridad', label: 'Seguridad',  icon: ShieldCheck, color: '#059669' },
  { id: 'otro',      label: 'Otros',      icon: Box,         color: '#64748b' },
];

const getCat = (id) => CATEGORIAS.find((c) => c.id === id) ?? CATEGORIAS[5];

/* ── Datos demo ─────────────────────────────────────────── */
// asignaciones = lo que el checkin va llenando: [{ nombre, cedula, zona, cantidad }]
const DEMO_ITEMS = [
  {
    id: 1,
    nombre: 'Radio Motorola XT-420',
    categoria: 'radio',
    cantidad: 20,
    descripcion: 'Frecuencia UHF, batería 12h',
    variante: null,
    asignaciones: [
      { id: 1, nombre: 'Carlos Ruiz',   cedula: '10012345', zona: 'Zona A', cantidad: 2 },
      { id: 2, nombre: 'Ana López',     cedula: '10056789', zona: 'Zona B', cantidad: 1 },
      { id: 3, nombre: 'Jhon Pérez',    cedula: '10099988', zona: 'Zona C', cantidad: 3 },
    ],
  },
  {
    id: 2,
    nombre: 'Chaleco Reflectivo',
    categoria: 'seguridad',
    cantidad: 50,
    descripcion: 'Alta visibilidad',
    variante: 'Talla única',
    asignaciones: [
      { id: 4, nombre: 'María Gómez',   cedula: '20011111', zona: 'Zona A', cantidad: 4 },
      { id: 5, nombre: 'Luis Torres',   cedula: '20022222', zona: 'Zona D', cantidad: 2 },
    ],
  },
  {
    id: 3,
    nombre: 'Bolsas de Basura 70L',
    categoria: 'insumo',
    cantidad: 500,
    descripcion: 'Negras, resistentes',
    variante: null,
    asignaciones: [
      { id: 6, nombre: 'Equipo Norte',  cedula: '—',        zona: 'Zona B', cantidad: 80 },
      { id: 7, nombre: 'Equipo Sur',    cedula: '—',        zona: 'Zona C', cantidad: 60 },
    ],
  },
  {
    id: 4,
    nombre: 'Uniforme LUUP',
    categoria: 'uniforme',
    cantidad: 40,
    descripcion: 'Camiseta + pantalón',
    variante: 'M',
    asignaciones: [],
  },
  {
    id: 5,
    nombre: 'Linterna de mano',
    categoria: 'equipo',
    cantidad: 15,
    descripcion: 'LED, 200 lúmenes',
    variante: null,
    asignaciones: [],
  },
  {
    id: 6,
    nombre: 'Guantes de trabajo',
    categoria: 'seguridad',
    cantidad: 80,
    descripcion: 'Talla M/L',
    variante: 'M',
    asignaciones: [
      { id: 8, nombre: 'Pedro Díaz',    cedula: '30044444', zona: 'Zona A', cantidad: 10 },
    ],
  },
];

/* ── Helpers ─────────────────────────────────────────────── */
const enUso      = (item) => item.asignaciones.reduce((s, a) => s + a.cantidad, 0);
const disponible = (item) => Math.max(0, item.cantidad - enUso(item));
const pctUso     = (item) => item.cantidad === 0 ? 0 : Math.round((enUso(item) / item.cantidad) * 100);

const stockColor = (p) => {
  if (p >= 100) return '#ef4444';
  if (p >= 70)  return '#DD7419';
  return '#059669';
};

/* ── Badge ───────────────────────────────────────────────── */
function Badge({ label, color }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ backgroundColor: `${color}18`, color }}
    >
      {label}
    </span>
  );
}

/* ── Modal base ─────────────────────────────────────────── */
function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition mt-0.5">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/* ── Modal: objetos en uso ───────────────────────────────── */
function EnUsoModal({ item, onClose }) {
  const cat       = getCat(item.categoria);
  const totalUso  = enUso(item);
  const disp      = disponible(item);
  const p         = pctUso(item);

  return (
    <Modal
      title={`En uso: ${item.nombre}`}
      subtitle={`${totalUso} de ${item.cantidad} unidades asignadas`}
      onClose={onClose}
    >
      <div className="px-5 py-4 space-y-4">

        {/* Resumen de stock */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total',      value: item.cantidad, color: '#234465' },
            { label: 'En uso',     value: totalUso,      color: stockColor(p) },
            { label: 'Disponible', value: disp,          color: '#059669' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-border bg-muted/20 py-3 text-center">
              <p className="text-xl font-black" style={{ color }}>{value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Barra de uso */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>Ocupación</span>
            <span className="font-bold" style={{ color: stockColor(p) }}>{p}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(p, 100)}%`, backgroundColor: stockColor(p) }}
            />
          </div>
        </div>

        {/* Lista de asignaciones */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
            Asignaciones ({item.asignaciones.length})
          </p>

          {item.asignaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Ninguna unidad está asignada actualmente.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {item.asignaciones.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 bg-white rounded-xl border border-border px-3.5 py-3"
                >
                  {/* Avatar inicial */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-black text-white"
                    style={{ backgroundColor: cat.color }}
                  >
                    {a.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{a.nombre}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {a.cedula !== '—' && (
                        <span className="text-[11px] text-muted-foreground">CC {a.cedula}</span>
                      )}
                      {a.zona && (
                        <span
                          className="text-[11px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                        >
                          {a.zona}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Cantidad */}
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-foreground">{a.cantidad}</p>
                    <p className="text-[10px] text-muted-foreground leading-none">
                      {a.cantidad === 1 ? 'unidad' : 'unidades'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nota informativa */}
        <div className="rounded-xl bg-muted/40 border border-border px-4 py-3 flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Las asignaciones se registran desde el módulo de <span className="font-semibold text-foreground">Check-in</span> por el personal autorizado.
          </p>
        </div>
      </div>
    </Modal>
  );
}

/* ── Modal: Crear / Editar ítem ──────────────────────────── */
function ItemFormModal({ item, onSave, onClose }) {
  const isEdit = !!item;
  const [form, setForm] = useState({
    nombre:      item?.nombre      ?? '',
    categoria:   item?.categoria   ?? 'insumo',
    cantidad:    item?.cantidad    ?? '',
    variante:    item?.variante    ?? '',
    descripcion: item?.descripcion ?? '',
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    if (!form.nombre.trim() || !form.cantidad) return;
    onSave({
      ...(item ?? { asignaciones: [] }),
      nombre:      form.nombre.trim(),
      categoria:   form.categoria,
      cantidad:    parseInt(form.cantidad) || 0,
      variante:    form.variante.trim() || null,
      descripcion: form.descripcion.trim(),
    });
    onClose();
  };

  return (
    <Modal title={isEdit ? 'Editar ítem' : 'Agregar ítem'} onClose={onClose}>
      <div className="px-5 py-4 space-y-4">

        {/* Nombre */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">
            Nombre <span className="text-destructive">*</span>
          </label>
          <input
            autoFocus
            value={form.nombre}
            onChange={(e) => set('nombre', e.target.value)}
            placeholder="ej. Radio Motorola XT-420"
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#234465] focus:ring-2 focus:ring-[#234465]/15 bg-white"
          />
        </div>

        {/* Categoría */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-2">
            Categoría
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIAS.map((c) => {
              const Icon = c.icon;
              const active = form.categoria === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => set('categoria', c.id)}
                  className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-medium transition ${
                    active
                      ? 'border-[#234465] bg-[#234465]/5 text-[#234465]'
                      : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon className="w-4 h-4" style={active ? { color: c.color } : {}} />
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cantidad */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">
            Cantidad total <span className="text-destructive">*</span>
          </label>
          <input
            type="number" min="0"
            value={form.cantidad}
            onChange={(e) => set('cantidad', e.target.value)}
            placeholder="0"
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#234465] focus:ring-2 focus:ring-[#234465]/15"
          />
        </div>

        {/* Variante */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">
            Variante / Talla{' '}
            <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <input
            value={form.variante}
            onChange={(e) => set('variante', e.target.value)}
            placeholder="ej. M, L, Talla única…"
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#234465] focus:ring-2 focus:ring-[#234465]/15"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">
            Descripción
          </label>
          <textarea
            value={form.descripcion}
            onChange={(e) => set('descripcion', e.target.value)}
            placeholder="Detalles adicionales…"
            rows={2}
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#234465] focus:ring-2 focus:ring-[#234465]/15 resize-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!form.nombre.trim() || !form.cantidad}
          className="w-full bg-[#234465] hover:bg-[#234465]/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-3 text-sm font-bold transition"
        >
          {isEdit ? 'Guardar cambios' : 'Agregar ítem'}
        </button>
      </div>
    </Modal>
  );
}

/* ── Página principal ────────────────────────────────────── */
export default function InventarioPage() {
  const [items, setItems]               = useState(DEMO_ITEMS);
  const [search, setSearch]             = useState('');
  const [catFilter, setCatFilter]       = useState('all');
  const [showForm, setShowForm]         = useState(false);
  const [editItem, setEditItem]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [enUsoModal, setEnUsoModal]     = useState(null);

  /* ── Filtros ─────────────────────────────────────────── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((i) => {
      const matchCat    = catFilter === 'all' || i.categoria === catFilter;
      const matchSearch = !q || i.nombre.toLowerCase().includes(q) || (i.descripcion ?? '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [items, search, catFilter]);

  /* ── Stats globales ──────────────────────────────────── */
  const totalUnidades   = items.reduce((s, i) => s + i.cantidad, 0);
  const totalEnUso      = items.reduce((s, i) => s + enUso(i), 0);
  const totalDisponible = items.reduce((s, i) => s + disponible(i), 0);

  /* ── Handlers ────────────────────────────────────────── */
  const handleSave = (data) => {
    if (data.id) {
      setItems((p) => p.map((i) => (i.id === data.id ? { ...i, ...data } : i)));
    } else {
      setItems((p) => [...p, { ...data, id: Date.now() }]);
    }
  };

  const handleDelete = (id) => {
    setItems((p) => p.filter((i) => i.id !== id));
    setDeleteTarget(null);
  };

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-24">

        {/* Encabezado */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-[#234465] tracking-tight">Inventario</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {items.length} ítem{items.length !== 1 ? 's' : ''} registrados
            </p>
          </div>
          <button
            onClick={() => { setEditItem(null); setShowForm(true); }}
            className="flex items-center gap-1.5 bg-[#DD7419] hover:bg-[#DD7419]/90 text-white rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm transition shrink-0"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>

        {/* Stats globales */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total',      value: totalUnidades,   color: '#234465', bg: '#234465' },
            { label: 'En uso',     value: totalEnUso,      color: '#DD7419', bg: '#DD7419' },
            { label: 'Disponible', value: totalDisponible, color: '#059669', bg: '#059669' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="rounded-2xl border border-border bg-white px-3 py-3.5 text-center shadow-sm">
              <p className="text-2xl font-black" style={{ color }}>{value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ítem…"
            className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-white text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#234465]/20 transition"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtros de categoría */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-4 px-4">
          <button
            onClick={() => setCatFilter('all')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition ${
              catFilter === 'all'
                ? 'bg-[#234465] text-white border-[#234465]'
                : 'bg-white text-muted-foreground border-border'
            }`}
          >
            Todos
          </button>
          {CATEGORIAS.map((c) => {
            const Icon = c.icon;
            const active = catFilter === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCatFilter(c.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition ${
                  active ? 'text-white border-transparent' : 'bg-white text-muted-foreground border-border'
                }`}
                style={active ? { backgroundColor: c.color, borderColor: c.color } : {}}
              >
                <Icon className="w-3 h-3" /> {c.label}
              </button>
            );
          })}
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
              <Package className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Sin ítems</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {search || catFilter !== 'all'
                  ? 'Sin resultados para tu búsqueda.'
                  : 'Agrega el primer ítem con el botón "Agregar".'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((item) => {
              const cat  = getCat(item.categoria);
              const Icon = cat.icon;
              const uso  = enUso(item);
              const disp = disponible(item);
              const p    = pctUso(item);
              const sc   = stockColor(p);

              return (
                <div key={item.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                  {/* Franja de color */}
                  <div className="h-1" style={{ backgroundColor: cat.color }} />

                  <div className="px-4 pt-3.5 pb-3">
                    {/* Fila superior: ícono + nombre + acciones */}
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${cat.color}15` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: cat.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{item.nombre}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <Badge label={cat.label} color={cat.color} />
                          {item.variante && <Badge label={item.variante} color="#64748b" />}
                        </div>
                        {item.descripcion && (
                          <p className="text-[11px] text-muted-foreground mt-1 truncate">{item.descripcion}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => { setEditItem(item); setShowForm(true); }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-[#234465] hover:bg-[#234465]/5 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Barra de uso */}
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">Ocupación</span>
                        <span className="font-bold" style={{ color: sc }}>{p}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(p, 100)}%`, backgroundColor: sc }}
                        />
                      </div>
                    </div>

                    {/* Contadores + botón en uso */}
                    <div className="flex items-center gap-2 mt-3">
                      {/* Total */}
                      <div className="flex-1 rounded-xl bg-muted/40 border border-border py-2 text-center">
                        <p className="text-base font-black text-[#234465]">{item.cantidad}</p>
                        <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Total</p>
                      </div>
                      {/* En uso — clickeable */}
                      <button
                        onClick={() => setEnUsoModal(item)}
                        className="flex-1 rounded-xl py-2 text-center border transition hover:opacity-80 active:scale-95"
                        style={{ backgroundColor: `${sc}12`, borderColor: `${sc}40` }}
                      >
                        <p className="text-base font-black" style={{ color: sc }}>{uso}</p>
                        <p className="text-[10px] leading-none mt-0.5 font-medium flex items-center justify-center gap-0.5" style={{ color: sc }}>
                          En uso <ArrowUpRight className="w-2.5 h-2.5" />
                        </p>
                      </button>
                      {/* Disponible */}
                      <div className="flex-1 rounded-xl bg-emerald-50 border border-emerald-200 py-2 text-center">
                        <p className="text-base font-black text-emerald-600">{disp}</p>
                        <p className="text-[10px] text-emerald-600 leading-none mt-0.5">Disponible</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modales ───────────────────────────────────────── */}
      {(showForm || editItem) && (
        <ItemFormModal
          item={editItem}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditItem(null); }}
        />
      )}

      {enUsoModal && (
        <EnUsoModal
          item={enUsoModal}
          onClose={() => setEnUsoModal(null)}
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
                className="flex-1 border border-border rounded-xl py-2.5 text-sm font-semibold hover:bg-muted transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteTarget.id)}
                className="flex-1 bg-destructive hover:bg-destructive/90 text-white rounded-xl py-2.5 text-sm font-bold transition"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}