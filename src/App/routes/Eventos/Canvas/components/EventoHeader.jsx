import { ArrowLeft, Calendar, MapPin, Save, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from './Skeleton';
import { DATE_TYPE_LABEL, formatDate, IS_ADMIN } from './constants';
import { useUserStore } from '@/App/context/userStore';

export function EventoHeader({ loading, event, onBack, onSave }) {
  const user = useUserStore((state) => state.user);
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || '—';
  return (
    <header className="shrink-0 flex items-center gap-3 px-5 py-3 border-b border-border bg-white">
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

          {/* Línea 1: Nombre + badge Activo */}
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-base font-bold text-foreground tracking-tight truncate">
              {event.name}
            </h1>
            <Badge
              className={`text-xs border-0 shrink-0 ${
                event.isActive
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {event.isActive ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>

          {/* Línea 2: ubicación + badge Fecha única + fecha + usuario logueado */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate max-w-[110px] sm:max-w-none">{event.location}</span>
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
            <span className="flex items-center gap-1">
              <User className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[110px] sm:max-w-none">{fullName}</span>
            </span>
          </div>

        </div>
      )}

      {/* Botón guardar cambios - solo admin */}
      {!loading && IS_ADMIN && onSave && (
        <Button
          onClick={onSave}
          className="shrink-0 bg-[#DD7419] hover:bg-[#DD7419]/90 text-white flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Guardar cambios
        </Button>
      )}
    </header>
  );
}