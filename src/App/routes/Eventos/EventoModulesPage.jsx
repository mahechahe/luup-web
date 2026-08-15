import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Boxes, AlertTriangle } from 'lucide-react';
import { getEventoDetailService } from './services/eventServices';
import { listEventInventoryService } from './services/inventoryServices';
import { EventoHeader } from './Canvas/components/EventoHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/App/context/userStore';
import { hasAdminAccess } from '@/App/utils/roles';
import { MODULES } from './eventModules';

export default function EventoModulesPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [inventoryEmpty, setInventoryEmpty] = useState(false);
  const { user } = useUserStore();
  const isAdmin = hasAdminAccess(user?.roleId);

  useEffect(() => {
    getEventoDetailService(eventId).then((res) => {
      if (res.status) setEvent(res.event);
      setLoading(false);
    });
  }, [eventId]);

  useEffect(() => {
    if (!isAdmin) return;
    listEventInventoryService(eventId, { page: 1, limit: 1 }).then((res) => {
      if (res.status) setInventoryEmpty(res.pagination.total === 0);
    });
  }, [eventId, isAdmin]);

  const modules = MODULES.filter((m) => !m.adminOnly || isAdmin).map((m) => ({
    ...m,
    path:
      m.id === 'reporte'
        ? `/reportes/${eventId}`
        : `/eventos/${eventId}/${m.id}`,
  }));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <EventoHeader
        loading={loading}
        event={event}
        onBack={() => navigate('/eventos/listado')}
      />

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        {/* Alerta: inventario aún no cargado */}
        {!loading && isAdmin && inventoryEmpty && (
          <div className="relative flex gap-3 overflow-hidden rounded-xl border border-amber-500/25 bg-amber-50 dark:bg-amber-900/15 px-4 py-3.5 text-foreground shadow-sm mb-6 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-amber-500">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">
                  Este evento no tiene inventario asignado
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  Carga los ítems y cantidades disponibles para este evento
                  antes de asignarlos a los colaboradores en el check-in.
                </p>
              </div>
              <Button
                size="sm"
                className="gap-1.5 shrink-0 bg-amber-600 hover:bg-amber-600/90 text-white"
                onClick={() => navigate(`/eventos/${eventId}/inventario`)}
              >
                <Boxes className="w-4 h-4" /> Cargar inventario
              </Button>
            </div>
          </div>
        )}

        {/* Section heading */}
        <div className="mb-10">
          {loading ? (
            <>
              <Skeleton className="h-3.5 w-40 mb-3" />
              <Skeleton className="h-7 w-56" />
            </>
          ) : (
            <>
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-2">
                {event?.name}
              </p>
              <h2 className="text-[22px] font-bold text-foreground leading-tight">
                Selecciona un módulo
              </h2>
            </>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl overflow-hidden border border-border bg-card"
                >
                  <div className="h-1 w-full bg-muted" />
                  <div className="p-6">
                    <Skeleton className="w-11 h-11 rounded-xl mb-5" />
                    <Skeleton className="h-5 w-1/2 mb-3" />
                    <Skeleton className="h-4 w-full mb-1.5" />
                    <Skeleton className="h-4 w-4/5 mb-1.5" />
                    <Skeleton className="h-4 w-3/5 mb-6" />
                    <Skeleton className="h-px w-full mb-4" />
                    <Skeleton className="h-3.5 w-16" />
                  </div>
                </div>
              ))
            : modules.map((module, idx) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  idx={idx}
                  onClick={() =>
                    navigate(module.path, {
                      state:
                        module.id === 'reporte'
                          ? { backTo: `/eventos/${eventId}` }
                          : undefined,
                    })
                  }
                />
              ))}
        </div>
      </div>
    </div>
  );
}

function ModuleCard({ module, idx, onClick }) {
  const hex = module.color;

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col text-left rounded-2xl overflow-hidden border border-border bg-card transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDelay: `${idx * 55}ms`, animationFillMode: 'both' }}
    >
      {/* Top accent bar */}
      <div
        className="h-[3px] w-full shrink-0 transition-all duration-300 group-hover:h-[5px]"
        style={{ backgroundColor: hex }}
      />

      {/* Subtle hover gradient wash */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
        style={{
          background: `linear-gradient(145deg, ${hex}0d 0%, transparent 55%)`,
        }}
      />

      <div className="flex-1 flex flex-col p-6 relative overflow-hidden">
        {/* Ghost index number */}
        <span
          className="absolute -right-2 -top-3 text-[76px] font-black leading-none select-none transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-1"
          style={{ color: hex, opacity: 0.07 }}
          aria-hidden
        >
          {module.index}
        </span>

        {/* Icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 shrink-0 transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: `${hex}18` }}
        >
          <module.icon className="w-[22px] h-[22px]" style={{ color: hex }} />
        </div>

        {/* Text */}
        <h3 className="text-[15px] font-bold text-foreground mb-2 tracking-tight">
          {module.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">
          {module.description}
        </p>

        {/* Footer */}
        <div className="flex items-center mt-6 pt-4 border-t border-border">
          <span
            className="text-[11px] font-semibold tracking-[0.15em] uppercase"
            style={{ color: hex }}
          >
            Abrir módulo
          </span>
          <ArrowRight
            className="w-3.5 h-3.5 ml-2 transition-transform duration-300 group-hover:translate-x-1.5"
            style={{ color: hex }}
          />
        </div>
      </div>
    </button>
  );
}
