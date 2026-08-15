import { useEffect, useState } from 'react';
import { History, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  COLOMBIA_TZ,
  formatColombiaTime,
} from '@/App/utils/functions/colombiaDate';
import { getEventStatusLogService } from '../../services/eventServices';
import { eventStatusBadgeClass } from './eventStatus';

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  timeZone: COLOMBIA_TZ,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatDateTime(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return `${dateFormatter.format(date)} · ${formatColombiaTime(iso) ?? ''}`;
}

/** Bitácora de cambios de `events.status`: quién marcó cada estado, cuándo y la nota. */
export function EventStatusHistoryModal({ open, onClose, eventId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !eventId) return;
    setLoading(true);
    getEventStatusLogService(eventId).then((res) => {
      if (res.status) setLogs(res.logs);
      setLoading(false);
    });
  }, [open, eventId]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[85dvh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#DD7419]" />
            <DialogTitle>Bitácora de estados</DialogTitle>
          </div>
          <DialogDescription>
            Historial de cambios de estado de este evento.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
            ))
          ) : logs.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <History className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                Sin cambios de estado
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Todavía no se ha marcado ningún estado para este evento.
              </p>
            </div>
          ) : (
            logs.map((entry) => {
              const name =
                [entry.performedBy?.firstName, entry.performedBy?.lastName]
                  .filter(Boolean)
                  .join(' ') || 'Usuario';
              return (
                <div
                  key={entry.id}
                  className="rounded-xl border border-border bg-muted/20 px-3 py-2.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${eventStatusBadgeClass(
                        entry.status
                      )}`}
                    >
                      {entry.status}
                    </span>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {formatDateTime(entry.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="w-3 h-3 shrink-0" />
                    {name}
                  </div>
                  {entry.note && (
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg px-2.5 py-1.5 italic">
                      {entry.note}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
