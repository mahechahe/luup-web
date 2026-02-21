import { ArrowLeft, Calendar, MapPin, Save, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from './Skeleton';
import { DATE_TYPE_LABEL, formatDate, IS_ADMIN } from './constants';

export function EventoHeader({ loading, event, onBack, onSave }) {

  return (
    <header className="shrink-0 flex items-center gap-4 px-5 py-3 border-b border-border bg-white">
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
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <h1 className="text-base font-bold text-foreground tracking-tight truncate">
            {event.name}
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              className={`text-xs border-0 ${
                event.isActive
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {event.isActive ? 'Activo' : 'Inactivo'}
            </Badge>
            {event.dateType && (
              <Badge className="text-xs border-0 bg-brand/10 text-brand">
                {DATE_TYPE_LABEL[event.dateType] ?? event.dateType}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 ml-4 text-xs text-muted-foreground">
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {event.location}
              </span>
            )}
            {event.date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(event.date)}
              </span>
            )}
            {event.createdBy?.firstName && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {`${event.createdBy.firstName} ${event.createdBy.lastName ?? ''}`.trim()}
              </span>
            )}
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