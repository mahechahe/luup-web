import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, ClipboardList, MapPin, Save, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from './Skeleton';
import { DATE_TYPE_LABEL, formatDate } from './constants';
import { useUserStore } from '@/App/context/userStore';
import { hasAdminAccess } from '@/App/utils/roles';
import { EventStatusBadge } from './EventStatusBadge';
import { ChangeEventStatusModal } from './ChangeEventStatusModal';
import { EventStatusHistoryModal } from './EventStatusHistoryModal';

export function EventoHeader({ loading, event, onBack, onSave, onBulkAssignment }) {
  const user = useUserStore((state) => state.user);
  const isAdmin = hasAdminAccess(user?.roleId);
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || '—';

  // Estado local del badge: se actualiza optimistamente al cambiar el estado
  // sin depender de que las 4 páginas que usan este header vuelvan a
  // consultar el evento.
  const [status, setStatus] = useState(event?.status ?? null);
  const [changeStatusOpen, setChangeStatusOpen] = useState(false);
  const [statusHistoryOpen, setStatusHistoryOpen] = useState(false);

  useEffect(() => {
    setStatus(event?.status ?? null);
  }, [event?.eventId, event?.status]);

  return (
    <header className="shrink-0 px-5 py-3 border-b border-border bg-card text-card-foreground">
      {/* Fila principal: flecha + info + botón (desktop) */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>

        {loading ? (
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ) : (
          <div className="flex flex-col min-w-0 flex-1">
            {/* Línea 1: solo el nombre del evento */}
            <h1 className="text-base font-bold text-foreground tracking-tight truncate">
              {event.name}
            </h1>

            {/* Línea 2: ubicación + badge Fecha única + fecha */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate max-w-[110px] sm:max-w-none">
                    {event.location}
                  </span>
                </span>
              )}
              {event.dateType && (
                <Badge className="text-xs border-0 bg-brand/10 text-brand shrink-0">
                  {DATE_TYPE_LABEL[event.dateType] ?? event.dateType}
                </Badge>
              )}
              {event.date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 shrink-0" />
                  {formatDate(event.date)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Grupo derecho (desktop): Activo + usuario arriba, estado del evento en su propia fila debajo */}
        {!loading && event && (
          <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Badge
                className={`text-xs border-0 shrink-0 ${
                  event.isActive
                    ? 'bg-emerald-500/15 text-emerald-500'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {event.isActive ? 'Activo' : 'Inactivo'}
              </Badge>
              <span className="flex items-center gap-1">
                <User className="w-3 h-3 shrink-0" />
                <span className="truncate max-w-[110px]">{fullName}</span>
              </span>
            </div>
            <EventStatusBadge
              status={status}
              onClick={() => setChangeStatusOpen(true)}
            />
          </div>
        )}

        {/* Estado del evento — solo móvil, junto al título (en desktop vive en el grupo de arriba) */}
        {!loading && event && (
          <div className="sm:hidden shrink-0">
            <EventStatusBadge
              status={status}
              onClick={() => setChangeStatusOpen(true)}
            />
          </div>
        )}

        {/* Acciones — solo visibles en desktop */}
        {!loading && (onBulkAssignment || (isAdmin && onSave)) && (
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {onBulkAssignment && (
              <Button
                onClick={onBulkAssignment}
                variant="outline"
                className="border-[#DD7419]/60 bg-[#DD7419]/10 text-[#DD7419] hover:bg-[#DD7419]/20 hover:text-[#DD7419] flex items-center gap-2"
              >
                <ClipboardList className="w-4 h-4" />
                Asignación masiva
              </Button>
            )}
            {isAdmin && onSave && (
              <Button
                onClick={onSave}
                className="bg-[#DD7419] hover:bg-[#DD7419]/90 text-white flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar cambios
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Activo + usuario — debajo de los datos en móvil */}
      {!loading && event && (
        <div className="sm:hidden flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <Badge
            className={`text-xs border-0 shrink-0 ${
              event.isActive
                ? 'bg-emerald-500/15 text-emerald-500'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {event.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
          <span className="flex items-center gap-1">
            <User className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[140px]">{fullName}</span>
          </span>
        </div>
      )}

      {/* Acciones — debajo de los datos en móvil */}
      {!loading && (onBulkAssignment || (isAdmin && onSave)) && (
        <div className="sm:hidden mt-3 flex flex-col gap-2">
          {onBulkAssignment && (
            <Button
              onClick={onBulkAssignment}
              variant="outline"
              className="w-full border-[#DD7419]/60 bg-[#DD7419]/10 text-[#DD7419] hover:bg-[#DD7419]/20 hover:text-[#DD7419] gap-2"
            >
              <ClipboardList className="w-4 h-4" />
              Asignación masiva
            </Button>
          )}
          {isAdmin && onSave && (
            <Button
              onClick={onSave}
              className="w-full bg-[#DD7419] hover:bg-[#DD7419]/90 text-white gap-2"
            >
              <Save className="w-4 h-4" />
              Guardar cambios
            </Button>
          )}
        </div>
      )}

      {!loading && event && (
        <>
          <ChangeEventStatusModal
            open={changeStatusOpen}
            onOpenChange={setChangeStatusOpen}
            eventId={event.eventId}
            currentStatus={status}
            onChanged={setStatus}
            onViewHistory={() => {
              setChangeStatusOpen(false);
              setStatusHistoryOpen(true);
            }}
          />
          <EventStatusHistoryModal
            open={statusHistoryOpen}
            onClose={() => setStatusHistoryOpen(false)}
            eventId={event.eventId}
          />
        </>
      )}
    </header>
  );
}
