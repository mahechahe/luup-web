import { useCallback, useEffect, useState } from 'react';
import {
  Briefcase,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cookie,
  DoorOpen,
  History,
  IdCard,
  Package,
  Search,
  Shirt,
  User,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { getAttendanceHistoryService } from '../../services/eventServices';

/* ── Helpers ─────────────────────────────────────────────── */
function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function roleBadgeClass(role) {
  if (role === 'supervisor')
    return 'bg-[#234465]/10 text-[#234465] dark:bg-[#234465]/20 dark:text-[#7493B2]';
  if (role === 'coordinador') return 'bg-[#DD7419]/10 text-[#DD7419]';
  return 'bg-[#7493B2]/10 text-[#7493B2]';
}

function roleLabel(role) {
  return (
    {
      supervisor: 'Supervisor',
      coordinador: 'Coordinador',
      colaborador: 'Colaborador',
    }[role] ?? role
  );
}

function Pill({ icon: Icon, label, active, detail }) {
  return (
    <div
      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border ${
        active
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300'
          : 'bg-muted/50 border-border text-muted-foreground'
      }`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span>{label}</span>
      {active && detail && (
        <span className="text-[10px] font-normal opacity-75">· {detail}</span>
      )}
    </div>
  );
}

function AttendanceRecord({ att }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
      {/* Cabecera del registro */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-muted/40 transition"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-bold text-foreground">
              {formatTime(att.entryTime)}
            </span>
          </div>
          {att.exitTime && (
            <>
              <span className="text-muted-foreground text-xs">→</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <DoorOpen className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-xs font-bold text-foreground">
                  {formatTime(att.exitTime)}
                </span>
              </div>
            </>
          )}
          <span className="text-[10px] text-muted-foreground hidden sm:block">
            {formatDate(att.createdAt)}
          </span>
        </div>
        <ChevronRight
          className="w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Detalle expandido */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2.5 border-t border-border">
          {/* Beneficios */}
          <div className="flex flex-wrap gap-1.5 pt-2.5">
            <Pill
              icon={Shirt}
              label="Uniforme"
              active={att.uniform}
              detail={att.uniformSize}
            />
            <Pill
              icon={Briefcase}
              label="Maleta"
              active={att.receivedSuitcase}
            />
            <Pill
              icon={UtensilsCrossed}
              label="Almuerzo"
              active={att.receivedLunch}
            />
            <Pill
              icon={Cookie}
              label="Refrigerio"
              active={att.receivedSnack}
              detail={att.snackDetail}
            />
          </div>

          {/* Uniforme devuelto */}
          {att.returnedUniform != null && (
            <p className="text-[11px] text-muted-foreground">
              Uniforme devuelto:{' '}
              <span
                className={`font-semibold ${
                  att.returnedUniform ? 'text-emerald-600' : 'text-destructive'
                }`}
              >
                {att.returnedUniform ? 'Sí' : 'No'}
              </span>
            </p>
          )}

          {/* Notas */}
          {att.notes && (
            <p className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg px-2.5 py-1.5 italic">
              <span className="font-semibold not-italic">Nota: </span>
              {att.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function CollabHistoryCard({ collab }) {
  const [itemsExpanded, setItemsExpanded] = useState(false);

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="h-1 bg-[#234465]" />
      <div className="p-4 space-y-3">
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-bold text-foreground">
              {collab.firstName} {collab.lastName}
            </p>
            <div className="mt-1.5 space-y-1">
              <p className="text-xs text-foreground">
                <span className="text-muted-foreground">Cédula:</span>{' '}
                <span className="font-semibold">{collab.cedula}</span>
              </p>
              {collab.phone && (
                <p className="text-xs text-foreground">
                  <span className="text-muted-foreground">Celular:</span>{' '}
                  <span className="font-semibold">{collab.phone}</span>
                </p>
              )}
              {collab.zones?.length > 0 && (
                <p className="text-xs text-foreground">
                  <span className="text-muted-foreground">Zonas:</span>{' '}
                  <span className="font-semibold">
                    {collab.zones.join(', ')}
                  </span>
                </p>
              )}
            </div>
          </div>
          <span
            className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-md ${roleBadgeClass(
              collab.role
            )}`}
          >
            {roleLabel(collab.role)}
          </span>
        </div>

        {/* Registros de asistencia */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Registros ({collab.attendances.length})
          </p>
          {collab.attendances.map((att) => (
            <AttendanceRecord key={att.id} att={att} />
          ))}
        </div>

        {/* Inventario */}
        {collab.inventoryItems?.length > 0 && (
          <div>
            <button
              onClick={() => setItemsExpanded((v) => !v)}
              className="w-full flex items-center justify-between gap-2 rounded-xl bg-muted/30 px-3 py-2 hover:bg-muted/50 transition"
            >
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-[#DD7419] shrink-0" />
                <span className="text-[11px] font-semibold text-foreground">
                  {itemsExpanded ? 'Ocultar inventario' : 'Ver inventario'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DD7419]/10 text-[#DD7419]">
                  {collab.inventoryItems.length}{' '}
                  {collab.inventoryItems.length === 1 ? 'ítem' : 'ítems'}
                </span>
              </div>
              <ChevronRight
                className="w-3.5 h-3.5 text-muted-foreground transition-transform duration-200"
                style={{
                  transform: itemsExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                }}
              />
            </button>

            {itemsExpanded && (
              <div className="mt-2 space-y-2">
                {collab.inventoryItems.map((item) => {
                  const returned = item.returnedQuantity ?? 0;
                  const used = item.usedQuantity ?? 0;
                  const damaged = item.damagedQuantity ?? 0;
                  const pending =
                    item.pendingQuantity ??
                    item.quantity - returned - used - damaged;
                  const complete = pending === 0;
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl bg-muted/40 px-3 py-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-[#DD7419]/10 flex items-center justify-center shrink-0">
                            <Package className="w-3 h-3 text-[#DD7419]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold text-foreground truncate">
                              {item.itemName}
                            </p>
                            {item.dateRegister && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Calendar className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                                <p className="text-[10px] text-muted-foreground">
                                  Fecha: {item.dateRegister}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <span
                          className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            complete
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                          }`}
                        >
                          {complete ? 'Completo' : 'Pendiente'}
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[
                          {
                            label: 'Asignado',
                            value: item.quantity,
                            color: 'text-foreground',
                          },
                          {
                            label: 'Devuelto',
                            value: returned,
                            color: 'text-emerald-600',
                          },
                          {
                            label: 'Usado',
                            value: used,
                            color: 'text-[#234465] dark:text-[#7493B2]',
                          },
                          {
                            label: 'Dañado',
                            value: damaged,
                            color:
                              damaged > 0
                                ? 'text-destructive'
                                : 'text-muted-foreground',
                          },
                          {
                            label: 'Pendiente',
                            value: pending,
                            color: complete
                              ? 'text-emerald-600'
                              : 'text-amber-600',
                          },
                        ].map(({ label, value, color }) => (
                          <div
                            key={label}
                            className="bg-background rounded-lg py-2 text-center"
                          >
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wide leading-none mb-1">
                              {label}
                            </p>
                            <p className={`text-base font-bold ${color}`}>
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border p-4 animate-pulse space-y-3">
      <div className="flex justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded-full w-44" />
          <div className="h-3 bg-muted rounded-full w-32" />
          <div className="h-3 bg-muted rounded-full w-28" />
        </div>
        <div className="h-6 w-20 bg-muted rounded-md shrink-0" />
      </div>
      <div className="h-10 bg-muted rounded-xl" />
      <div className="h-10 bg-muted rounded-xl" />
    </div>
  );
}

const PAGE_LIMIT = 25;

export function AttendanceHistoryModal({ open, onClose, eventId }) {
  const [filterInput, setFilterInput] = useState({ name: '', cedula: '' });
  const [filters, setFilters] = useState({ name: '', cedula: '' });
  const [collaborators, setCollaborators] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 1,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(
    async (page, f) => {
      if (!eventId) return;
      setLoading(true);
      const body = { eventId, page, limit: PAGE_LIMIT };
      if (f.name) body.name = f.name;
      if (f.cedula) body.cedula = f.cedula;
      const res = await getAttendanceHistoryService(body);
      console.log('res', res);

      if (res.status) {
        setCollaborators(res.data?.data?.collaborators ?? []);
        setPagination(
          res.data?.data?.pagination ?? {
            page: 1,
            limit: PAGE_LIMIT,
            total: 0,
            totalPages: 1,
          }
        );
      }
      setLoading(false);
    },
    [eventId]
  );

  useEffect(() => {
    if (open) {
      setFilterInput({ name: '', cedula: '' });
      setFilters({ name: '', cedula: '' });
      setCurrentPage(1);
    }
  }, [open]);

  useEffect(() => {
    if (open) fetchData(currentPage, filters);
  }, [open, currentPage, filters, fetchData]);

  const handleSearch = () => {
    setFilters(filterInput);
    setCurrentPage(1);
  };

  const handleClear = () => {
    setFilterInput({ name: '', cedula: '' });
    setFilters({ name: '', cedula: '' });
    setCurrentPage(1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const { total, totalPages } = pagination;
  const safePage = Math.min(currentPage, Math.max(1, totalPages));
  const startIdx = (safePage - 1) * PAGE_LIMIT;
  const hasActiveFilters = filterInput.name !== '' || filterInput.cedula !== '';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90dvh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#DD7419]" />
            <DialogTitle>Histórico de Check-in</DialogTitle>
          </div>
          <DialogDescription>
            Colaboradores que ya completaron su jornada (con salida registrada).
          </DialogDescription>
        </DialogHeader>

        {/* Filtros */}
        <div className="px-5 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[130px]">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por nombre…"
                value={filterInput.name}
                onChange={(e) =>
                  setFilterInput((f) => ({ ...f, name: e.target.value }))
                }
                onKeyDown={handleKeyDown}
                className="h-9 pl-8 pr-3 rounded-md border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#DD7419]/30 w-full"
              />
            </div>
            <div className="relative w-36 shrink-0">
              <IdCard className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Cédula…"
                value={filterInput.cedula}
                onChange={(e) =>
                  setFilterInput((f) => ({ ...f, cedula: e.target.value }))
                }
                onKeyDown={handleKeyDown}
                className="h-9 pl-8 pr-3 rounded-md border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#DD7419]/30 w-full"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={(!filterInput.name && !filterInput.cedula) || loading}
              className="h-9 bg-[#DD7419] hover:bg-[#DD7419]/90 text-white gap-1.5 shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              Buscar
            </Button>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={handleClear}
                className="h-9 gap-1.5 text-muted-foreground shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                <span className="text-xs">Limpiar</span>
              </Button>
            )}
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
          ) : collaborators.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <History className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                Sin registros
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                No hay colaboradores con salida registrada aún.
              </p>
            </div>
          ) : (
            collaborators.map((collab) => (
              <CollabHistoryCard key={collab.userId} collab={collab} />
            ))
          )}
        </div>

        {/* Paginación */}
        {!loading && collaborators.length > 0 && (
          <div className="px-5 py-3 border-t border-border shrink-0 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {startIdx + 1}–{Math.min(startIdx + PAGE_LIMIT, total)}
              </span>{' '}
              de <span className="font-semibold text-foreground">{total}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="h-8 w-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
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
                .map((item, idx) =>
                  item === '...' ? (
                    <span
                      key={`e-${idx}`}
                      className="px-1 text-xs text-muted-foreground"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item)}
                      className={`h-8 min-w-8 px-2 rounded-md text-xs font-semibold transition ${
                        safePage === item
                          ? 'bg-[#DD7419] text-white'
                          : 'border border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={safePage === totalPages}
                className="h-8 w-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
