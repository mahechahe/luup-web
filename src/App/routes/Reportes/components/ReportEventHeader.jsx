import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarIcon, History } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { Skeleton } from '@/components/ui/skeleton';
import { constants } from '@/App/utils/constants/apiConstants';
import { eventStatusDotClass } from '../../Eventos/Canvas/components/eventStatus';
import { EventStatusHistoryModal } from '../../Eventos/Canvas/components/EventStatusHistoryModal';

const { BASE_URL, ENDPOINTS } = constants;

function formatEventDate(event) {
  if (!event) return '';

  if (event.dateType === 'single_date' && event.date) {
    return new Date(`${event.date}T12:00:00`).toLocaleDateString('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  if (event.dateType === 'stages' && event.startDate && event.endDate) {
    const start = new Date(`${event.startDate}T12:00:00`).toLocaleDateString(
      'es-CO',
      { day: 'numeric', month: 'short' }
    );
    const end = new Date(`${event.endDate}T12:00:00`).toLocaleDateString(
      'es-CO',
      { day: 'numeric', month: 'short', year: 'numeric' }
    );
    return `${start} – ${end}`;
  }

  return '';
}

export default function ReportEventHeader({ eventId, onBack }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    setLoading(true);
    axios
      .get(`${BASE_URL}/${ENDPOINTS.EVENTS}/${eventId}`)
      .then(({ data }) => {
        const eventData = data?.data;
        setEvent({
          name: eventData?.name ?? '',
          dateType: eventData?.dateType ?? eventData?.date_type,
          date: eventData?.date,
          startDate: eventData?.startDate ?? eventData?.start_date,
          endDate: eventData?.endDate ?? eventData?.end_date,
          status: eventData?.status ?? null,
        });
      })
      .catch(() => toast.error('Error al cargar el evento.'))
      .finally(() => setLoading(false));
  }, [eventId]);

  return (
    <div className="rounded-2xl bg-[#234465] px-5 py-5 shadow-md">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-colors shrink-0"
          aria-label="Volver a reportes"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0">
          {loading ? (
            <>
              <Skeleton className="h-3 w-24 rounded mb-2 bg-white/20" />
              <Skeleton className="h-6 w-48 rounded bg-white/20" />
              <Skeleton className="h-3.5 w-32 rounded mt-1 bg-white/20" />
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-0.5">
                Reporte de evento
              </p>
              <h1 className="text-xl font-extrabold text-white leading-tight truncate">
                {event?.name ?? 'Evento'}
              </h1>
              <div className="flex items-center gap-1 mt-0.5 text-sm text-white/60">
                <CalendarIcon className="w-3 h-3" />
                <span>{formatEventDate(event)}</span>
              </div>
            </>
          )}
        </div>

        {!loading && event && (
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            title="Ver bitácora de estados del evento"
            className="shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/10 hover:bg-white/20 transition text-xs font-semibold text-white"
          >
            <History className="w-3 h-3 shrink-0" />
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${eventStatusDotClass(
                event.status
              )}`}
            />
            {event.status || 'Sin estado'}
          </button>
        )}
      </div>

      <EventStatusHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        eventId={eventId}
      />
    </div>
  );
}
