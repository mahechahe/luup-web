import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  BarChart3,
  Calendar,
  FileText,
  LayoutGrid,
  MapPin,
  Users,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserStore } from '@/App/context/userStore';
import { hasAdminAccess } from '@/App/utils/roles';
import { getReportesEventosService } from './services/reportesServices';

const PAGE_LIMIT = 20;

function formatEventDate(event) {
  if (event.dateType === 'single_date' && event.date) {
    return new Date(event.date + 'T12:00:00').toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  if (event.dateType === 'stages' && event.startDate && event.endDate) {
    const start = new Date(event.startDate + 'T12:00:00').toLocaleDateString(
      'es-CO',
      { day: 'numeric', month: 'short' }
    );
    const end = new Date(event.endDate + 'T12:00:00').toLocaleDateString(
      'es-CO',
      { day: 'numeric', month: 'short', year: 'numeric' }
    );
    return `${start} – ${end}`;
  }
  return '—';
}

function EventCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 h-44">
      <Skeleton className="h-4 w-4/5 rounded-lg" />
      <Skeleton className="h-4 w-3/5 rounded-lg" />
      <Skeleton className="h-3.5 w-2/3 rounded-lg" />
      <div className="mt-auto flex flex-col gap-1.5">
        <Skeleton className="h-5 w-full rounded-lg" />
        <Skeleton className="h-5 w-full rounded-lg" />
      </div>
    </div>
  );
}

function EventCard({ event, onClick }) {
  const isMultiDay = event.dateType === 'stages';

  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-card border border-border rounded-2xl p-4 flex flex-col gap-2 hover:border-brand/50 hover:shadow-md transition-all duration-200 active:scale-[0.97]"
    >
      {/* Multi-day badge */}
      {isMultiDay && (
        <span className="self-start inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand/10 text-brand leading-none">
          MULTI-DÍA
        </span>
      )}

      {/* Name */}
      <h3 className="font-semibold text-sm text-foreground leading-snug line-clamp-2 group-hover:text-brand transition-colors duration-150">
        {event.name}
      </h3>

      {/* Date */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Calendar className="w-3 h-3 shrink-0" />
        <span className="leading-tight">{formatEventDate(event)}</span>
      </div>

      {/* Location */}
      {event.location && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{event.location}</span>
        </div>
      )}

      {/* Stats — pushed to bottom */}
      <div className="mt-auto pt-2 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <LayoutGrid className="w-3 h-3 shrink-0 text-brand/60" />
          <span>
            {event.zoneCount ?? 0} {event.zoneCount === 1 ? 'zona' : 'zonas'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="w-3 h-3 shrink-0 text-brand/60" />
          <span>
            {event.collaboratorCount ?? 0}{' '}
            {event.collaboratorCount === 1 ? 'colaborador' : 'colaboradores'}
          </span>
        </div>
      </div>
    </button>
  );
}

export default function ReportesPage() {
  const navigate = useNavigate();
  const { user } = useUserStore();

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 1,
  });

  const fetchEvents = useCallback(async (page) => {
    setLoading(true);
    const res = await getReportesEventosService({ page, limit: PAGE_LIMIT });
    if (res.status) {
      setEvents(res.events);
      setPagination(res.pagination);
    } else {
      toast.error(res.errors ?? 'Error al cargar los eventos.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!hasAdminAccess(user.roleId)) {
      navigate('/dashboard');
      return;
    }
    fetchEvents(1);
  }, [user, navigate, fetchEvents]);

  if (user && !hasAdminAccess(user.roleId)) return null;

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-28">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-[#234465] px-5 py-5 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-0.5">
                Análisis y datos
              </p>
              <h1 className="text-2xl font-extrabold text-white leading-tight">
                Reportes
              </h1>
              <p className="text-sm text-white/60 mt-0.5">
                Selecciona un evento para ver sus reportes.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <FileText className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-base font-medium text-foreground mb-1">
                Sin eventos
              </p>
              <p className="text-sm text-muted-foreground max-w-xs">
                No hay eventos activos disponibles para generar reportes.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {pagination.total}{' '}
                  {pagination.total === 1 ? 'evento' : 'eventos'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {events.map((event) => (
                  <EventCard
                    key={event.eventId}
                    event={event}
                    onClick={() => navigate(`/reportes/${event.eventId}`)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button
                    onClick={() => fetchEvents(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="px-4 py-2 text-sm font-medium rounded-xl border border-border bg-card text-foreground disabled:opacity-40 hover:bg-muted transition-colors"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => fetchEvents(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-4 py-2 text-sm font-medium rounded-xl border border-border bg-card text-foreground disabled:opacity-40 hover:bg-muted transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
