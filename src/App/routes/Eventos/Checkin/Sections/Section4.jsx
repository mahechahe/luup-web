import { Button } from '@/components/ui/button';
import {
  Briefcase,
  Calendar,
  ChevronDown,
  Clock,
  Cookie,
  DoorOpen,
  History,
  IdCard,
  Package,
  PackageOpen,
  RefreshCw,
  Search,
  Shirt,
  Star,
  User,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getStation4RecordsService } from '../../services/eventServices';
import { AttendanceHistoryModal } from '../components/AttendanceHistoryModal';
import { CheckoutModal } from '../components/CheckoutModal';
import { RatingModal } from '../components/RatingModal';
import { PaginationControls } from '../components/PaginationControls';

const PAGE_SIZE = 25;

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

function formatTime(isoString) {
  if (!isoString) return null;
  return new Date(isoString).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function AttendancePill({ icon: Icon, label, received, detail }) {
  const active = received === true;
  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border ${
        active
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300'
          : 'bg-muted/50 border-border text-muted-foreground'
      }`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
      {active && detail && (
        <span className="text-[10px] font-normal opacity-75">· {detail}</span>
      )}
    </div>
  );
}

function CollabCheckoutCard({ collab, onCheckout, onRate }) {
  const att = collab.attendance ?? {};
  const items = collab.inventoryItems ?? [];
  const [itemsExpanded, setItemsExpanded] = useState(false);
  const entryTime = formatTime(att.entryTime);
  const exitTime = formatTime(att.exitTime);
  const isCheckedOut = !!att.exitTime;
  const uniformReceived = att.uniform ?? collab.uniform ?? false;
  const uniformSize = att.uniformSize ?? collab.uniformSize ?? null;
  const totalPending = items.reduce(
    (acc, i) => acc + (i.quantity - (i.returnedQuantity ?? 0)),
    0
  );
  const allReturned = items.length > 0 && totalPending === 0;

  return (
    <div
      className={`bg-card rounded-2xl border overflow-hidden transition-all ${
        allReturned
          ? 'border-emerald-200 dark:border-emerald-800'
          : 'border-border'
      }`}
    >
      <div
        className={`h-1 ${allReturned ? 'bg-emerald-500' : 'bg-[#DD7419]'}`}
      />
      <div className="p-4 space-y-3">
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-foreground">
              {collab.firstName} {collab.lastName}
            </p>
            <div className="mt-2 space-y-4">
              <p className="text-xs text-foreground">
                <span className="text-muted-foreground">Cédula:</span>{' '}
                <span className="font-semibold">{collab.cedula}</span>
              </p>
              <p className="text-xs text-foreground">
                <span className="text-muted-foreground">Celular:</span>{' '}
                <span className="font-semibold">{collab.phone ?? '—'}</span>
              </p>
              <p className="text-xs text-foreground">
                <span className="text-muted-foreground">Zonas:</span>{' '}
                {collab.zones?.length > 0 ? (
                  <span className="font-semibold">
                    {collab.zones.join(', ')}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </p>
              <p className="text-xs text-foreground">
                <span className="text-muted-foreground">Rol:</span>{' '}
                <span
                  className={`font-semibold text-[11px] px-2 py-0.5 rounded-md ${roleBadgeClass(
                    collab.role
                  )}`}
                >
                  {roleLabel(collab.role)}
                </span>
              </p>
            </div>
          </div>
          {/* Check-in / hora de entrada */}
          <div className="shrink-0">
            {att.attended ? (
              entryTime ? (
                <div className="flex flex-col items-center bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl px-3 py-2 min-w-[64px]">
                  <Clock className="w-4 h-4 text-emerald-500 mb-1" />
                  <span className="text-[13px] font-extrabold text-emerald-700 dark:text-emerald-300 leading-none">
                    {entryTime}
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-emerald-500 dark:text-emerald-400 mt-1">
                    Check-in
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-2xl px-3 py-2 min-w-[64px]">
                  <Clock className="w-4 h-4 text-amber-500 mb-1" />
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 leading-tight text-center">
                    Sin hora
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-amber-500 dark:text-amber-400 mt-1">
                    Check-in
                  </span>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center bg-muted border border-border rounded-2xl px-3 py-2 min-w-[64px]">
                <Clock className="w-4 h-4 text-muted-foreground mb-1" />
                <span className="text-[11px] font-bold text-muted-foreground leading-tight text-center">
                  Sin registro
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60 mt-1">
                  Check-in
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Nota */}
        {(att.notes ?? collab.notes) && (
          <p
            className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg px-2.5 py-1.5 italic"
            style={{
              marginBottom: '10px',
            }}
          >
            <span className="font-semibold not-italic">Nota: </span>
            {att.notes ?? collab.notes}
          </p>
        )}

        {/* Recibió: Uniforme, Maleta, Almuerzo, Refrigerio */}
        <div className="flex flex-wrap gap-1.5">
          <AttendancePill
            icon={Shirt}
            label="Uniforme"
            received={uniformReceived}
            detail={uniformSize}
          />
          <AttendancePill
            icon={Briefcase}
            label="Maleta"
            received={att.receivedSuitcase}
          />
          <AttendancePill
            icon={UtensilsCrossed}
            label="Almuerzo"
            received={att.receivedLunch}
          />
          <AttendancePill
            icon={Cookie}
            label="Refrigerio"
            received={att.receivedSnack}
            detail={att.snackDetail}
          />
        </div>

        {/* Inventario */}
        {items.length > 0 ? (
          <div>
            <button
              onClick={() => setItemsExpanded((v) => !v)}
              className="w-full flex items-center justify-between gap-2 rounded-xl bg-muted/30 px-3 py-2.5 hover:bg-muted/50 transition"
            >
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-[#DD7419] shrink-0" />
                <span className="text-[11px] font-semibold text-foreground">
                  {itemsExpanded ? 'Ocultar ítems' : 'Ver ítems'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    allReturned
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'bg-[#DD7419]/10 text-[#DD7419]'
                  }`}
                >
                  {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
                </span>
              </div>
              <ChevronDown
                className="w-3.5 h-3.5 text-muted-foreground transition-transform duration-200"
                style={{
                  transform: itemsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>

            {itemsExpanded && (
              <div className="mt-2 space-y-2">
                {items.map((item) => {
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
                      className="rounded-xl bg-muted/40 px-3 py-3 space-y-2.5"
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
                                  Fecha de registro: {item.dateRegister}
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
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-muted/30 px-3 py-2">
            <PackageOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <p className="text-[11px] text-muted-foreground italic">
              Sin inventario asignado
            </p>
          </div>
        )}

        {/* Checkout + Calificar */}
        <div className="flex items-center gap-2">
          {isCheckedOut ? (
            <div className="flex items-center gap-2 flex-1 rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 px-3 py-2.5 min-w-0">
              <DoorOpen className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                  Check-out registrado
                </p>
                <p className="text-[10px] text-rose-600/70 dark:text-rose-400/70 truncate">
                  Salida: {exitTime}
                  {att.returnedUniform != null && (
                    <> · Unif.: {att.returnedUniform ? 'devuelto' : 'no dev.'}</>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => onCheckout(collab)}
              className="flex-1 h-10 rounded-xl bg-[#DD7419] hover:bg-[#DD7419]/90 text-white text-sm font-semibold transition flex items-center justify-center gap-2"
            >
              <DoorOpen className="w-4 h-4" />
              Checkout
            </button>
          )}
          <button
            onClick={() => onRate(collab)}
            className="h-10 px-4 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-sm font-semibold transition flex items-center gap-1.5 shrink-0"
          >
            <Star className="w-3.5 h-3.5" />
            Calificar
          </button>
        </div>
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
          <div className="h-3 bg-muted rounded-full w-36" />
          <div className="h-3 bg-muted rounded-full w-28" />
          <div className="h-3 bg-muted rounded-full w-20" />
        </div>
        <div className="h-7 w-28 bg-muted rounded-xl shrink-0" />
      </div>
      <div className="flex gap-1.5">
        <div className="h-7 w-20 bg-muted rounded-xl" />
        <div className="h-7 w-24 bg-muted rounded-xl" />
        <div className="h-7 w-24 bg-muted rounded-xl" />
      </div>
      <div className="space-y-1.5">
        <div className="h-11 bg-muted rounded-xl" />
        <div className="h-11 bg-muted rounded-xl" />
      </div>
    </div>
  );
}

export const Section4 = ({ eventId }) => {
  const [filters, setFilters] = useState({ name: '', cedula: '' });
  const [filterInput, setFilterInput] = useState({ name: '', cedula: '' });
  const [loading, setLoading] = useState(true);
  const [collaborators, setCollaborators] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = PAGE_SIZE;
  const [checkoutCollab, setCheckoutCollab] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [ratingCollab, setRatingCollab] = useState(null);
  const [ratingOpen, setRatingOpen] = useState(false);

  const handleOpenCheckout = (collab) => {
    setCheckoutCollab(collab);
    setCheckoutOpen(true);
  };

  const handleOpenRating = (collab) => {
    setRatingCollab(collab);
    setRatingOpen(true);
  };

  const handleCheckedOut = (userId, data) => {
    setCollaborators((prev) =>
      prev.map((c) => {
        if (c.userId !== userId) return c;
        return {
          ...c,
          attendance: {
            ...c.attendance,
            exitTime: data?.attendance?.exitTime ?? c.attendance?.exitTime,
            returnedUniform:
              data?.attendance?.returnedUniform ??
              c.attendance?.returnedUniform,
          },
          inventoryItems: data?.items
            ? c.inventoryItems?.map((item) => {
                const updated = data.items.find(
                  (d) => d.collaboratorItemId === item.id
                );
                return updated
                  ? { ...item, returnedQuantity: updated.returned }
                  : item;
              })
            : c.inventoryItems,
        };
      })
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleSearch = () => {
    setFilters(filterInput);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilterInput({ name: '', cedula: '' });
    setFilters({ name: '', cedula: '' });
    setCurrentPage(1);
  };

  const fetchData = (currentFilters = filters, page = currentPage) => {
    setLoading(true);
    getStation4RecordsService(eventId, {
      ...currentFilters,
      page,
      limit: pageSize,
    }).then((res) => {
      if (res.status && res.data) {
        setCollaborators(res.data?.data?.collaborators ?? []);
        setPagination(
          res.data?.data?.pagination ?? {
            page: 1,
            limit: pageSize,
            total: 0,
            totalPages: 1,
          }
        );
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData(filters, currentPage);
  }, [eventId, filters, currentPage, pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasActiveFilters = filterInput.name !== '' || filterInput.cedula !== '';
  const { total, totalPages } = pagination;
  const safePage = Math.min(currentPage, Math.max(1, totalPages));
  const startIdx = (safePage - 1) * pageSize;

  return (
    <>
      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        collab={checkoutCollab}
        onCheckedOut={handleCheckedOut}
      />
      <AttendanceHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        eventId={Number(eventId)}
      />
      <RatingModal
        open={ratingOpen}
        onClose={() => { setRatingOpen(false); setRatingCollab(null); }}
        eventId={Number(eventId)}
        collab={ratingCollab}
        dateRegister={ratingCollab?.attendance?.dateRegister ?? null}
      />

      {/* Banner */}
      <div className="rounded-2xl bg-[#234465] px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-1">
            Estación 4
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            Check-out
          </h2>
        </div>
        <div className="flex flex-col sm:items-end gap-2">
          <div className="text-right">
            <p className="text-sm font-medium text-white/60 uppercase tracking-wide mb-0.5">
              Fecha de hoy
            </p>
            <p className="text-xl sm:text-2xl font-bold text-[#DD7419] capitalize leading-snug">
              {new Date().toLocaleDateString('es-CO', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              className="gap-1.5 h-9 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              onClick={() => fetchData(filters, currentPage)}
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              />
              Actualizar
            </Button>
            <button
              onClick={() => setHistoryOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-lg transition h-9"
            >
              <History className="w-3.5 h-3.5" />
              Ver histórico
            </button>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="bg-card rounded-xl border border-border p-3 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[140px]">
            <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre…"
              value={filterInput.name}
              onChange={(e) =>
                setFilterInput((f) => ({ ...f, name: e.target.value }))
              }
              onKeyDown={handleKeyDown}
              className="h-9 pl-8 pr-3 rounded-md border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 w-full"
            />
          </div>
          <div className="relative w-40 shrink-0">
            <IdCard className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Cédula…"
              value={filterInput.cedula}
              onChange={(e) =>
                setFilterInput((f) => ({ ...f, cedula: e.target.value }))
              }
              onKeyDown={handleKeyDown}
              className="h-9 pl-8 pr-3 rounded-md border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 w-full"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={
              (filterInput.name === '' && filterInput.cedula === '') || loading
            }
            className="h-9 bg-[#DD7419] hover:bg-[#DD7419]/90 text-white gap-1.5 shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Buscar</span>
          </Button>
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="h-9 gap-1.5 text-muted-foreground shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span className="text-xs">Limpiar</span>
            </Button>
          )}
        </div>
        <div className="border-t border-border" />
      </div>

      {!loading && collaborators.length > 0 && (
        <PaginationControls
          totalItems={total}
          pageSize={pageSize}
          startIdx={startIdx}
          safePage={safePage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : collaborators.length === 0 ? (
        <div className="text-center py-14 flex flex-col justify-center items-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <PackageOpen className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            Sin registros de check-out
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Los colaboradores aparecerán aquí una vez estén registrados en las
            estaciones anteriores.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {collaborators.map((collab) => (
            <CollabCheckoutCard
              key={collab.userId}
              collab={collab}
              onCheckout={handleOpenCheckout}
              onRate={handleOpenRating}
            />
          ))}
        </div>
      )}

      {/* Paginación */}
      {!loading && collaborators.length > 0 && (
        <div className="pb-4">
          <PaginationControls
            totalItems={total}
            pageSize={pageSize}
            startIdx={startIdx}
            safePage={safePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </>
  );
};
