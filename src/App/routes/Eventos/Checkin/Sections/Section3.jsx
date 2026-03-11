import React, { useEffect, useState } from 'react';
import {
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  DoorOpen,
  IdCard,
  Package,
  PackageOpen,
  Plus,
  Search,
  User,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getStation3RecordsService } from '../../services/eventServices';
import { InventoryModal } from '../components/InventoryModal';

const PAGE_SIZE = 25;

function formatTime(isoString) {
  if (!isoString) return null;
  return new Date(isoString).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
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

function CollabCard({ collab, onAssign }) {
  const items = collab.inventoryItems ?? [];
  const hasItems = items.length > 0;
  const [itemsExpanded, setItemsExpanded] = useState(false);
  const allReturned =
    hasItems && items.every((i) => i.returnedQuantity >= i.quantity);
  const entryTime = formatTime(collab.attendance?.entryTime);
  const exitTime = formatTime(collab.attendance?.exitTime);
  const hasCheckout = !!collab.attendance?.exitTime;

  return (
    <div
      className={`bg-card rounded-2xl border overflow-hidden transition-all ${
        allReturned
          ? 'border-emerald-200 dark:border-emerald-800'
          : 'border-border'
      }`}
    >
      <div
        className={`h-1 ${
          allReturned
            ? 'bg-emerald-500'
            : hasItems
              ? 'bg-[#234465]'
              : 'bg-muted'
        }`}
      />
      <div className="p-4 space-y-3">
        {/* Cabecera colaborador */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-foreground">
              {collab.firstName} {collab.lastName}
            </p>
            <div className="mt-2 space-y-2">
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
          <span
            className={`shrink-0 text-[11px] font-bold px-2 py-1 rounded-lg ${
              hasItems
                ? allReturned
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-[#DD7419]/10 text-[#DD7419]'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
          </span>
        </div>

        {/* Nota */}
        {(collab.attendance?.notes ?? collab.notes) && (
          <p
            className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg px-2.5 py-1.5 italic"
            style={{
              marginBottom: '10px',
            }}
          >
            <span className="font-semibold not-italic">Nota: </span>
            {collab.attendance?.notes ?? collab.notes}
          </p>
        )}

        {/* Inventario */}
        {hasItems ? (
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
                  const pending =
                    item.pendingQuantity ?? item.quantity - returned - used;
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
                          <p className="text-[12px] font-semibold text-foreground truncate">
                            {item.itemName}
                          </p>
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
                      <div className="grid grid-cols-4 gap-1.5">
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
                            color: 'text-[#234465]',
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
          <div className="flex items-center gap-2 rounded-xl bg-muted/30 px-3 py-2.5">
            <PackageOpen className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-[11px] text-muted-foreground italic">
              Sin inventario asignado
            </p>
          </div>
        )}

        {/* Footer: check-out registrado o botón asignar */}
        <div className="pt-1">
          {hasCheckout ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 flex-1 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
                <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wide font-semibold leading-none">
                    Check-in
                  </p>
                  <p className="text-[12px] font-bold text-emerald-700 dark:text-emerald-300">
                    {entryTime ?? '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-1 bg-[#DD7419]/5 border border-[#DD7419]/20 rounded-lg px-3 py-2">
                <DoorOpen className="w-3.5 h-3.5 text-[#DD7419] shrink-0" />
                <div>
                  <p className="text-[9px] text-[#DD7419]/60 uppercase tracking-wide font-semibold leading-none">
                    Check-out
                  </p>
                  <p className="text-[12px] font-bold text-[#DD7419]">
                    {exitTime}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => onAssign(collab)}
              className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg text-[11px] font-semibold text-[#DD7419] border border-[#DD7419]/25 hover:bg-[#DD7419]/5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Asignar inventario
            </button>
          )}
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
        <div className="h-6 w-14 bg-muted rounded-lg shrink-0" />
      </div>
      <div className="space-y-1.5">
        <div className="h-11 bg-muted rounded-xl" />
        <div className="h-11 bg-muted rounded-xl" />
      </div>
    </div>
  );
}

export const Section3 = ({ eventId }) => {
  const [showInventory, setShowInventory] = useState(false);
  const [assignCollab, setAssignCollab] = useState(null);
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleSearch = () => {
    setFilters(filterInput);
    setCurrentPage(1);
  };

  const handleAssigned = (newItem) => {
    setCollaborators((prev) =>
      prev.map((c) => {
        if (c.userId !== assignCollab?.userId) return c;
        return {
          ...c,
          inventoryItems: [...(c.inventoryItems ?? []), newItem],
        };
      })
    );
    setAssignCollab(null);
  };

  const handleClearFilters = () => {
    setFilterInput({ name: '', cedula: '' });
    setFilters({ name: '', cedula: '' });
    setCurrentPage(1);
  };

  useEffect(() => {
    setLoading(true);
    getStation3RecordsService(eventId, {
      ...filters,
      page: currentPage,
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
  }, [eventId, filters, currentPage, pageSize]);

  const hasActiveFilters = filterInput.name !== '' || filterInput.cedula !== '';
  const { total, totalPages } = pagination;
  const safePage = Math.min(currentPage, Math.max(1, totalPages));
  const startIdx = (safePage - 1) * pageSize;

  return (
    <>
      {/* Banner */}
      <div className="rounded-2xl bg-[#234465] px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-1">
            Estación 3
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            Dotación · Insumos
          </h2>
        </div>
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
      </div>

      {/* Alerta inventario */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-[#DD7419]/20 bg-[#DD7419]/5 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#DD7419]/15 flex items-center justify-center shrink-0">
            <Boxes className="w-4 h-4 text-[#DD7419]" />
          </div>
          <p className="text-xs text-[#DD7419] leading-relaxed">
            Puedes ver el inventario disponible y filtrarlo por nombre antes de
            asignarlo a un colaborador.
          </p>
        </div>
        <Button
          onClick={() => setShowInventory(true)}
          className="shrink-0 h-9 bg-[#DD7419] hover:bg-[#DD7419]/90 text-white gap-2 text-xs font-semibold"
        >
          <Boxes className="w-3.5 h-3.5" />
          Ver inventario
        </Button>
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
            Sin registros en Estación 3
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Los colaboradores aparecerán aquí una vez tengan el refrigerio
            marcado en Estación 2.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {collaborators.map((collab) => (
            <CollabCard
              key={collab.userId}
              collab={collab}
              onAssign={setAssignCollab}
            />
          ))}
        </div>
      )}

      {/* Modal inventario — solo navegación */}
      <InventoryModal open={showInventory} onOpenChange={setShowInventory} />

      {/* Modal inventario — asignar a colaborador */}
      <InventoryModal
        open={!!assignCollab}
        onOpenChange={(v) => {
          if (!v) setAssignCollab(null);
        }}
        mode="assign"
        collab={assignCollab}
        onAssigned={handleAssigned}
      />

      {/* Paginación */}
      {!loading && collaborators.length > 0 && (
        <div className="bg-card rounded-xl border border-border px-3 py-2.5 flex items-center justify-between gap-3 flex-wrap pb-4">
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {startIdx + 1}–{Math.min(startIdx + pageSize, total)}
              </span>{' '}
              de <span className="font-semibold text-foreground">{total}</span>
            </p>
          </div>

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
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="h-8 w-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
