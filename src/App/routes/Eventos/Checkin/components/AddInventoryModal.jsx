import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  PackageOpen,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  assignInventoryToCollaboratorService,
  listEventInventoryService,
} from '../../services/inventoryServices';
import { useUserStore } from '@/App/context/userStore';
import { hasAdminAccess } from '@/App/utils/roles';

/* ── Helpers ─────────────────────────────────────────────── */
function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function NumInput({ label, value, onChange, max, color = 'text-foreground' }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className={`text-[10px] font-semibold uppercase tracking-wide ${color}`}
      >
        {label}
      </span>
      <div className="flex items-center border border-border rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => onChange(clamp(value - 1, 0, max))}
          disabled={value <= 0}
          className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30 transition"
        >
          −
        </button>
        <input
          type="number"
          min={0}
          max={max}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value) || 0, 0, max))}
          className="w-10 h-8 text-center text-sm font-bold bg-background text-foreground outline-none"
        />
        <button
          type="button"
          onClick={() => onChange(clamp(value + 1, 0, max))}
          disabled={value >= max}
          className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30 transition"
        >
          +
        </button>
      </div>
    </div>
  );
}

/* ── Modal principal ─────────────────────────────────────── */
export function AddInventoryModal({
  open,
  onOpenChange,
  collab,
  eventId = null,
  onAdded,
}) {
  const currentUser = useUserStore((s) => s.user);
  const isAdmin = hasAdminAccess(currentUser?.roleId);
  const navigate = useNavigate();

  /* búsqueda */
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  /* selección + breakdown */
  const [selectedItem, setSelectedItem] = useState(null);
  const [totalQty, setTotalQty] = useState(1);
  const [usados, setUsados] = useState(0);
  const [danados, setDanados] = useState(0);
  const [devueltos, setDevueltos] = useState(0);

  /* lista staged */
  const [staged, setStaged] = useState([]);
  const [saving, setSaving] = useState(false);

  const pendientes = totalQty - usados - danados - devueltos;
  const breakdownOk =
    pendientes >= 0 && usados + danados + devueltos + pendientes === totalQty;

  /* reset al abrir */
  useEffect(() => {
    if (open) {
      setSearchInput('');
      setSearch('');
      setCurrentPage(1);
      setSelectedItem(null);
      setTotalQty(1);
      setUsados(0);
      setDanados(0);
      setDevueltos(0);
      setStaged([]);
    }
  }, [open]);

  /* fetch inventario cargado para este evento */
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listEventInventoryService(eventId, {
      page: currentPage,
      nombre: search || undefined,
    }).then((res) => {
      if (res.status) {
        setItems(res.items);
        setPagination(res.pagination);
      }
      setLoading(false);
    });
  }, [open, eventId, search, currentPage]);

  const handleSearch = () => {
    setSearch(searchInput);
    setCurrentPage(1);
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setTotalQty(1);
    setUsados(0);
    setDanados(0);
    setDevueltos(0);
  };

  const handleAddToStaged = () => {
    if (!selectedItem || !breakdownOk) return;
    // evitar duplicado del mismo ítem
    setStaged((prev) => {
      const exists = prev.find((s) => s.item.id === selectedItem.id);
      if (exists) {
        return prev.map((s) =>
          s.item.id === selectedItem.id
            ? { ...s, totalQty, usados, danados, devueltos, pendientes }
            : s
        );
      }
      return [
        ...prev,
        {
          item: selectedItem,
          totalQty,
          usados,
          danados,
          devueltos,
          pendientes,
        },
      ];
    });
    setSelectedItem(null);
    setTotalQty(1);
    setUsados(0);
    setDanados(0);
    setDevueltos(0);
  };

  const handleRemoveStaged = (itemId) => {
    setStaged((prev) => prev.filter((s) => s.item.id !== itemId));
  };

  const handleConfirm = async () => {
    if (staged.length === 0) return;
    setSaving(true);
    try {
      let allOk = true;
      for (const s of staged) {
        const res = await assignInventoryToCollaboratorService({
          inventoryItemId: s.item.inventoryItemId,
          userId: collab.userId,
          quantity: s.totalQty,
          createdBy: currentUser?.userId,
          eventId,
        });
        if (!res.status) {
          toast.error(res.errors ?? `Error al agregar ${s.item.nombre}`);
          allOk = false;
          break;
        }
        onAdded?.(res.data);
      }
      if (allOk) {
        toast.success('Inventario agregado correctamente');
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const { total, totalPages } = pagination;
  const safePage = Math.min(currentPage, Math.max(1, totalPages));
  const startIdx = (safePage - 1) * pagination.limit;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="p-0 gap-0 max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#DD7419]/10 flex items-center justify-center shrink-0">
              <Boxes className="w-5 h-5 text-[#DD7419]" />
            </div>
            <DialogHeader className="gap-0.5 text-left">
              <DialogTitle className="text-base font-bold leading-tight">
                Agregar inventario
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground">
                {collab?.firstName} {collab?.lastName}
              </p>
            </DialogHeader>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition text-muted-foreground shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo scrollable */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* ── Buscador ─────────────────────────────── */}
          <div className="px-5 py-3 border-b border-border shrink-0">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar ítem por nombre…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="h-9 pl-8 pr-3 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#DD7419]/30 w-full"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="h-9 bg-[#DD7419] hover:bg-[#DD7419]/90 text-white gap-1.5 shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
                Buscar
              </Button>
              {search && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchInput('');
                    setSearch('');
                    setCurrentPage(1);
                  }}
                  className="h-9 w-9 p-0 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* ── Tabla de ítems ───────────────────────── */}
          <div className="overflow-y-auto" style={{ maxHeight: '220px' }}>
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="bg-muted/70 border-b border-border">
                  <th className="text-left font-semibold text-muted-foreground px-3 py-2">
                    Nombre
                  </th>
                  <th className="text-center font-semibold text-muted-foreground px-3 py-2 w-16">
                    Disponible
                  </th>
                  <th className="w-10 px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr
                      key={i}
                      className="border-b border-border/50 animate-pulse"
                    >
                      <td className="px-3 py-2">
                        <div className="h-3 bg-muted rounded-full w-40" />
                      </td>
                      <td className="px-3 py-2">
                        <div className="h-4 bg-muted rounded-full w-10 mx-auto" />
                      </td>
                      <td />
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center">
                      <div className="flex flex-col items-center gap-2 px-4">
                        <PackageOpen className="w-7 h-7 text-muted-foreground" />
                        {search ? (
                          <p className="text-sm text-muted-foreground">
                            Sin resultados
                          </p>
                        ) : (
                          <>
                            <p className="text-sm font-semibold text-foreground">
                              Este evento aún no tiene inventario cargado
                            </p>
                            {isAdmin && (
                              <Button
                                size="sm"
                                className="mt-1 h-8 bg-[#DD7419] hover:bg-[#DD7419]/90 text-white gap-1.5"
                                onClick={() =>
                                  navigate(`/eventos/${eventId}/inventario`)
                                }
                              >
                                <Boxes className="w-3.5 h-3.5" /> Cargar
                                inventario
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-b border-border/50 transition-colors ${
                        selectedItem?.id === item.id
                          ? 'bg-[#DD7419]/8'
                          : 'hover:bg-muted/30'
                      }`}
                    >
                      <td className="px-3 py-2 font-semibold text-foreground">
                        <p className="truncate max-w-[220px]">{item.nombre}</p>
                        {item.descripcion && (
                          <p className="text-[10px] text-muted-foreground truncate max-w-[220px] mt-0.5">
                            {item.descripcion}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-block font-bold text-[#DD7419] bg-[#DD7419]/10 px-2 py-0.5 rounded-full">
                          {item.disponible}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <button
                          onClick={() => handleSelectItem(item)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition shrink-0 ${
                            selectedItem?.id === item.id
                              ? 'bg-[#DD7419] text-white'
                              : 'bg-[#DD7419]/10 text-[#DD7419] hover:bg-[#DD7419]/20'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación tabla */}
          <div className="border-t border-border px-5 py-2 flex items-center justify-between gap-3 shrink-0">
            <p className="text-xs text-muted-foreground">
              {loading ? (
                '—'
              ) : (
                <>
                  <span className="font-semibold text-foreground">
                    {total === 0 ? 0 : startIdx + 1}–
                    {Math.min(startIdx + pagination.limit, total)}
                  </span>{' '}
                  de{' '}
                  <span className="font-semibold text-foreground">{total}</span>
                </>
              )}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1 || loading}
                className="h-7 w-7 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={safePage === totalPages || loading}
                className="h-7 w-7 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ── Panel breakdown (ítem seleccionado) ─── */}
          {selectedItem && (
            <div className="border-t-2 border-[#DD7419]/20 bg-[#DD7419]/5 px-5 py-4 shrink-0 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#DD7419]/15 flex items-center justify-center shrink-0">
                  <Package className="w-3.5 h-3.5 text-[#DD7419]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">
                    {selectedItem.nombre}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Disponible:{' '}
                    <span className="font-semibold text-[#DD7419]">
                      {selectedItem.disponible}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-muted-foreground hover:text-foreground transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Total + breakdown */}
              <div className="space-y-3">
                {/* Total */}
                <div className="flex items-center justify-between gap-3 bg-background rounded-xl px-4 py-3 border border-border">
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Total a asignar
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      La suma de estados debe ser igual a este valor
                    </p>
                  </div>
                  <div className="flex items-center border border-[#DD7419]/40 rounded-lg overflow-hidden shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const v = clamp(
                          totalQty - 1,
                          1,
                          selectedItem.disponible
                        );
                        setTotalQty(v);
                        setUsados((u) => clamp(u, 0, v));
                        setDanados((d) => clamp(d, 0, v));
                        setDevueltos((dv) => clamp(dv, 0, v));
                      }}
                      disabled={totalQty <= 1}
                      className="w-9 h-9 flex items-center justify-center text-[#DD7419] font-bold hover:bg-[#DD7419]/10 disabled:opacity-30 transition"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-sm font-bold text-foreground select-none">
                      {totalQty}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setTotalQty((q) =>
                          clamp(q + 1, 1, selectedItem.disponible)
                        )
                      }
                      disabled={totalQty >= selectedItem.disponible}
                      className="w-9 h-9 flex items-center justify-center text-[#DD7419] font-bold hover:bg-[#DD7419]/10 disabled:opacity-30 transition"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="bg-background rounded-xl px-4 py-3 border border-border space-y-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Distribución del estado
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    <NumInput
                      label="Usados"
                      value={usados}
                      onChange={setUsados}
                      max={totalQty - danados - devueltos}
                      color="text-[#234465] dark:text-[#7493B2]"
                    />
                    <NumInput
                      label="Dañados"
                      value={danados}
                      onChange={setDanados}
                      max={totalQty - usados - devueltos}
                      color="text-destructive"
                    />
                    <NumInput
                      label="Devueltos"
                      value={devueltos}
                      onChange={setDevueltos}
                      max={totalQty - usados - danados}
                      color="text-emerald-600"
                    />
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                        Pendientes
                      </span>
                      <div
                        className={`w-full h-8 flex items-center justify-center rounded-lg text-sm font-bold ${
                          pendientes < 0
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600'
                        }`}
                      >
                        {pendientes}
                      </div>
                    </div>
                  </div>

                  {/* Validación */}
                  {pendientes < 0 && (
                    <p className="text-[11px] text-destructive font-medium">
                      La suma supera el total asignado ({totalQty}). Ajusta los
                      valores.
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleAddToStaged}
                disabled={!breakdownOk}
                className="w-full h-9 rounded-lg bg-[#DD7419] text-white text-xs font-semibold hover:bg-[#DD7419]/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Añadir a la lista
              </button>
            </div>
          )}

          {/* ── Ítems staged ─────────────────────────── */}
          {staged.length > 0 && (
            <div className="px-5 py-4 border-t border-border space-y-2">
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-[#DD7419]" />
                Ítems a confirmar
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#DD7419]/10 text-[#DD7419] text-[10px] font-bold">
                  {staged.length}
                </span>
              </p>
              <div className="space-y-2">
                {staged.map((s) => (
                  <div
                    key={s.item.id}
                    className="bg-muted/40 rounded-xl px-3 py-2.5 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Package className="w-3.5 h-3.5 text-[#DD7419] shrink-0" />
                        <p className="text-xs font-semibold text-foreground truncate">
                          {s.item.nombre}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-bold text-[#DD7419] bg-[#DD7419]/10 px-2 py-0.5 rounded-full">
                          Total: {s.totalQty}
                        </span>
                        <button
                          onClick={() => handleRemoveStaged(s.item.id)}
                          className="text-muted-foreground hover:text-destructive transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      {[
                        {
                          label: 'Usados',
                          value: s.usados,
                          color: 'text-[#234465] dark:text-[#7493B2]',
                        },
                        {
                          label: 'Dañados',
                          value: s.danados,
                          color:
                            s.danados > 0
                              ? 'text-destructive'
                              : 'text-muted-foreground',
                        },
                        {
                          label: 'Devueltos',
                          value: s.devueltos,
                          color: 'text-emerald-600',
                        },
                        {
                          label: 'Pendientes',
                          value: s.pendientes,
                          color: 'text-amber-600',
                        },
                      ].map(({ label, value, color }) => (
                        <div
                          key={label}
                          className="bg-background rounded-lg py-1.5"
                        >
                          <p className="text-[9px] text-muted-foreground uppercase tracking-wide leading-none mb-1">
                            {label}
                          </p>
                          <p className={`text-sm font-bold ${color}`}>
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer — confirmar */}
        <div className="border-t border-border px-5 py-3 shrink-0 flex gap-2">
          <button
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="flex-1 h-10 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={staged.length === 0 || saving}
            className="flex-1 h-10 rounded-lg bg-[#234465] text-white text-sm font-semibold hover:bg-[#234465]/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Confirmar{' '}
                {staged.length > 0 &&
                  `(${staged.length} ${
                    staged.length === 1 ? 'ítem' : 'ítems'
                  })`}
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
