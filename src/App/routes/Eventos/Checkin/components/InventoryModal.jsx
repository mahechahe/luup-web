import { useEffect, useRef, useState } from 'react';
import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  PackageOpen,
  Plus,
  RefreshCw,
  Search,
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
  getInventoryListService,
} from '../../services/inventoryServices';
import { useUserStore } from '@/App/context/userStore';

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value ?? 0);

// mode: 'browse' | 'assign'
// collab: { userId, firstName, lastName } — solo requerido en modo 'assign'
// onAssigned: (newItem) => void — callback al completar asignación
export function InventoryModal({
  open,
  onOpenChange,
  mode = 'browse',
  collab = null,
  onAssigned,
}) {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);
  const searchRef = useRef(null);
  const currentUser = useUserStore((state) => state.user);

  useEffect(() => {
    if (open) {
      setSearch('');
      setSearchInput('');
      setCurrentPage(1);
      setSelectedItem(null);
      setQuantity(1);
    }
  }, [open]);

  const handleConfirmAssign = async () => {
    if (!selectedItem || !collab) return;
    setSaving(true);
    const res = await assignInventoryToCollaboratorService({
      inventoryItemId: selectedItem.id,
      userId: collab.userId,
      quantity,
      createdBy: currentUser?.userId,
    });
    if (res.status) {
      toast.success(`Inventario asignado a ${collab.firstName}`);
      onAssigned?.(res.data);
    } else {
      toast.error(res.errors ?? 'Error al asignar el inventario');
    }
    setSaving(false);
  };

  const fetchData = (page = currentPage, nombre = search) => {
    setLoading(true);
    getInventoryListService({ page, nombre: nombre || undefined }).then((res) => {
      if (res.status) {
        setItems(res.items);
        setPagination(res.pagination);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    if (!open) return;
    fetchData(currentPage, search);
  }, [open, search, currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    setSearch(searchInput);
    setCurrentPage(1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const { total, totalPages } = pagination;
  const safePage = Math.min(currentPage, Math.max(1, totalPages));
  const startIdx = (safePage - 1) * pagination.limit;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="p-0 gap-0 max-w-2xl max-h-[min(85vh,520px)] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#DD7419]/10 flex items-center justify-center shrink-0">
              <Boxes className="w-5 h-5 text-[#DD7419]" />
            </div>
            <DialogHeader className="gap-0.5 text-left">
              <DialogTitle className="text-base font-bold leading-tight">
                {mode === 'assign'
                  ? `Asignar a ${collab?.firstName ?? ''} ${
                      collab?.lastName ?? ''
                    }`
                  : 'Inventario disponible'}
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground h-3.5">
                {!loading &&
                  `${total} ${total === 1 ? 'ítem' : 'ítems'} en total`}
              </p>
            </DialogHeader>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => fetchData(currentPage, search)}
              disabled={loading}
              className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition text-muted-foreground shrink-0 disabled:opacity-50"
              title="Actualizar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition text-muted-foreground shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Buscador */}
        <div className="px-5 py-3 border-b border-border shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Buscar por nombre…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-9 pl-8 pr-3 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#DD7419]/30 w-full"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="h-9 bg-[#DD7419] hover:bg-[#DD7419]/90 text-white gap-1.5 shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Buscar</span>
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

        {/* Tabla */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="bg-muted/70 border-b border-border">
                <th className="text-left font-semibold text-muted-foreground px-3 py-2 hidden sm:table-cell w-8">
                  #
                </th>
                <th className="text-left font-semibold text-muted-foreground px-3 py-2">
                  Nombre
                </th>
                <th className="text-left font-semibold text-muted-foreground px-3 py-2 hidden sm:table-cell">
                  Descripción
                </th>
                <th className="text-center font-semibold text-muted-foreground px-3 py-2 w-16">
                  Stock
                </th>
                <th className="text-right font-semibold text-muted-foreground px-3 py-2 hidden sm:table-cell w-28">
                  Precio unit.
                </th>
                {mode === 'assign' && <th className="w-10 px-2 py-2" />}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr
                    key={i}
                    className="border-b border-border/50 animate-pulse"
                  >
                    <td className="px-3 py-2 hidden sm:table-cell">
                      <div className="h-3 bg-muted rounded-full w-4" />
                    </td>
                    <td className="px-3 py-2">
                      <div className="h-3 bg-muted rounded-full w-32" />
                    </td>
                    <td className="px-3 py-2 hidden sm:table-cell">
                      <div className="h-3 bg-muted rounded-full w-40" />
                    </td>
                    <td className="px-3 py-2">
                      <div className="h-5 bg-muted rounded-full w-10 mx-auto" />
                    </td>
                    <td className="px-3 py-2 hidden sm:table-cell">
                      <div className="h-3 bg-muted rounded-full w-20 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <PackageOpen className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Sin resultados
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          No se encontraron ítems con ese nombre.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-3 py-1.5 text-muted-foreground hidden sm:table-cell">
                      {startIdx + idx + 1}
                    </td>
                    <td className="px-3 py-1.5 font-semibold text-foreground">
                      <p className="truncate max-w-[140px] sm:max-w-[200px]">
                        {item.nombre}
                      </p>
                      {item.descripcion && (
                        <p className="text-[10px] text-muted-foreground truncate max-w-[140px] sm:hidden mt-0.5">
                          {item.descripcion}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-muted-foreground max-w-[180px] truncate hidden sm:table-cell">
                      {item.descripcion || '—'}
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <span className="inline-block font-bold text-[#DD7419] bg-[#DD7419]/10 px-2 py-0.5 rounded-full">
                        {item.cantidad}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-right text-muted-foreground font-medium hidden sm:table-cell">
                      {formatCurrency(item.precioUnitario)}
                    </td>
                    {mode === 'assign' && (
                      <td className="px-2 py-1.5">
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setQuantity(1);
                          }}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition shrink-0 ${
                            selectedItem?.id === item.id
                              ? 'bg-[#DD7419] text-white'
                              : 'bg-[#DD7419]/10 text-[#DD7419] hover:bg-[#DD7419]/20'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Panel de confirmación de asignación */}
        {mode === 'assign' && selectedItem && (
          <div className="border-t-2 border-[#DD7419]/20 bg-[#DD7419]/5 px-5 py-3 shrink-0 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#DD7419]/15 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-[#DD7419]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">
                  {selectedItem.nombre}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Stock disponible:{' '}
                  <span className="font-semibold text-[#DD7419]">
                    {selectedItem.cantidad}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-foreground">
                  Cantidad:
                </span>
                <div className="flex items-center border border-[#DD7419]/30 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-10 h-10 flex items-center justify-center text-[#DD7419] font-bold text-lg hover:bg-[#DD7419]/10 disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-95"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-sm font-bold text-foreground select-none">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity((q) => Math.min(selectedItem.cantidad, q + 1))
                    }
                    disabled={quantity >= selectedItem.cantidad}
                    className="w-10 h-10 flex items-center justify-center text-[#DD7419] font-bold text-lg hover:bg-[#DD7419]/10 disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedItem(null);
                  setQuantity(1);
                }}
                className="flex-1 h-8 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAssign}
                disabled={saving}
                className="flex-1 h-8 rounded-lg bg-[#DD7419] text-white text-xs font-semibold hover:bg-[#DD7419]/90 transition flex items-center justify-center gap-1.5 disabled:opacity-70"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  'Confirmar asignación'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Footer paginación */}
        <div className="border-t border-border px-5 py-2.5 flex items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-muted-foreground">
            {loading ? (
              <span className="inline-block h-3 w-24 bg-muted rounded-full animate-pulse" />
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
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  totalPages <= 7 ||
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - safePage) <= 1
              )
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((pg, idx) =>
                pg === '...' ? (
                  <span
                    key={`e-${idx}`}
                    className="px-1 text-xs text-muted-foreground"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={pg}
                    onClick={() => setCurrentPage(pg)}
                    disabled={loading}
                    className={`h-7 min-w-7 px-1.5 rounded-md text-xs font-semibold transition ${
                      safePage === pg
                        ? 'bg-[#DD7419] text-white'
                        : 'border border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    {pg}
                  </button>
                )
              )}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages || loading}
              className="h-7 w-7 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
