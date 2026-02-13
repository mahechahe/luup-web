import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CalendarRange,
  MapPin,
  User,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getEventoDetailService } from '../services/eventServices';

/* ── Helpers ─────────────────────────────────────────────── */
function formatDate(iso) {
  if (!iso) return '—';
  const normalized = iso.toString().replace(' ', 'T');
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

const DATE_TYPE_LABEL = {
  single_date: 'Fecha única',
  stages: 'Etapas',
};

/* ── Skeleton ────────────────────────────────────────────── */
function Skeleton({ className }) {
  return (
    <div className={`animate-pulse bg-muted rounded-md ${className ?? ''}`} />
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 pt-4 px-5">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-36" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 pt-4 px-5">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-36" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Campo de detalle ────────────────────────────────────── */
function DetailField({ label, value }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm text-foreground font-medium">{value ?? '—'}</p>
    </div>
  );
}

/* ── Sección ─────────────────────────────────────────────── */
function Section({ icon: Icon, title, children }) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3 pt-4 px-5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-brand" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">{children}</CardContent>
    </Card>
  );
}

/* ── Página ──────────────────────────────────────────────── */
function EventoDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getEventoDetailService(eventId).then((res) => {
      if (res.status) {
        setEvent(res.event);
      } else {
        setError(res.errors ?? 'No se pudo cargar el evento.');
      }
      setLoading(false);
    });
  }, [eventId]);

  /* ── Error / Not found state ─────────────────────────── */
  if (!loading && (error || !event)) {
    return (
      <div className="min-h-screen bg-background px-4 py-6 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {error ? 'Error al cargar el evento' : 'Evento no encontrado'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {error ?? 'El evento que buscas no existe o fue eliminado.'}
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate('/eventos')}
          >
            <ArrowLeft className="w-4 h-4" />
            Ir a todos los eventos
          </Button>
        </div>
      </div>
    );
  }

  /* ── Fechas según tipo ───────────────────────────────── */
  function renderDateFields() {
    if (!event) return null;
    if (event.dateType === 'stages') {
      return (
        <>
          <DetailField label="Fecha de inicio" value={formatDate(event.startDate)} />
          <DetailField label="Fecha de fin" value={formatDate(event.endDate)} />
        </>
      );
    }
    return <DetailField label="Fecha" value={formatDate(event.date)} />;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Encabezado ───────────────────────────────────── */}
        <div className="flex items-start gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => navigate('/eventos')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-7 w-64" />
                <Skeleton className="h-5 w-28" />
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-foreground tracking-tight truncate">
                  {event.name}
                </h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                    <Badge
                      className={`text-xs border-0 ${
                        event.dateType === 'stages'
                          ? 'bg-brand/10 text-brand'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {DATE_TYPE_LABEL[event.dateType] ?? event.dateType}
                    </Badge>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Skeleton completo ────────────────────────────── */}
        {loading && <DetailSkeleton />}

        {/* ── Contenido ────────────────────────────────────── */}
        {!loading && event && (
          <div className="space-y-4">

            {/* Información del evento */}
            <Section icon={Calendar} title="Información del evento">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                <DetailField label="Nombre" value={event.name} />
                {renderDateFields()}
                <DetailField label="Ubicación" value={event.location} />
                {event.mapImageUrl && (
                  <DetailField label="Imagen del mapa" value={event.mapImageUrl} />
                )}
              </div>
            </Section>

            {/* Auditoría */}
            <Section icon={User} title="Auditoría">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                <DetailField
                  label="Creado por"
                  value={
                    event.createdBy?.firstName
                      ? `${event.createdBy.firstName} ${event.createdBy.lastName ?? ''}`.trim()
                      : '—'
                  }
                />
                <DetailField label="Fecha de creación" value={formatDate(event.createdAt)} />
                <DetailField label="Última actualización" value={formatDate(event.updatedAt)} />
              </div>
            </Section>

          </div>
        )}
      </div>
    </div>
  );
}

export default EventoDetailPage;
