import { Calendar, MapPin, ArrowRight, Package, FileText, History } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getClienteEventosService } from './services/clienteServices';

const SERVICE_LABEL = {
  aseo: 'Aseo',
  residuos: 'Residuos',
  integral: 'Integral',
};
const SERVICE_COLOR = {
  aseo: 'bg-blue-50 text-blue-700 border-blue-200',
  residuos: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  integral: 'bg-purple-50 text-purple-700 border-purple-200',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function EventDateDisplay({ event }) {
  if (event.dateType === 'stages') {
    return (
      <span>
        {formatDate(event.startDate)} — {formatDate(event.endDate)}
      </span>
    );
  }
  return <span>{formatDate(event.date)}</span>;
}

function SkeletonRow() {
  return (
    <div className="px-4 py-3 flex items-center gap-3 animate-pulse">
      <div className="w-8 h-8 rounded-lg bg-muted shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 bg-muted rounded w-44" />
        <div className="h-3 bg-muted rounded w-56" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
        <Calendar className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="font-semibold text-foreground">Sin eventos asignados</p>
      <p className="text-sm text-muted-foreground max-w-xs">
        Aún no tienes eventos asignados a tu perfil.
      </p>
    </div>
  );
}

/* Evento anterior a Luup: no tiene detalle navegable, solo su distribucion
   de kilogramos y el informe en PDF. */
function HistoricalRow({ item }) {
  return (
    <div className="px-4 py-3 flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <History className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-foreground text-sm truncate leading-tight">
            {item.name}
          </p>
          <Badge variant="secondary" className="text-[10px]">
            Histórico
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
          {item.totalKg.toFixed(1)} kg gestionados
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
          {item.distributions.map((d) => (
            <span key={d.id} className="text-[11px] text-muted-foreground">
              {d.category}{' '}
              <span className="font-semibold text-foreground tabular-nums">
                {d.weightKg.toFixed(1)} kg
              </span>
            </span>
          ))}
        </div>
      </div>
      {item.reportUrl && (
        <Button asChild size="sm" variant="outline" className="shrink-0">
          <a href={item.reportUrl} target="_blank" rel="noopener noreferrer">
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Informe</span>
          </a>
        </Button>
      )}
    </div>
  );
}

function ClienteEventosPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [historical, setHistorical] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClienteEventosService().then((res) => {
      if (res.status) {
        setEvents(res.events);
        setHistorical(res.historical);
      } else {
        toast.error(res.errors ?? 'Error al cargar los eventos.');
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-brand" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">
              Mis Eventos
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Eventos de tu operación asignados a tu perfil.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {loading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
            </div>
          ) : events.length === 0 && historical.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="divide-y divide-border">
              {events.map((item) => (
                <div
                  key={item.assignmentId}
                  className="relative group hover:bg-muted/40 transition-colors"
                >
                  {/* Overlay clicable: cubre la fila sin anidar el enlace del informe */}
                  <button
                    type="button"
                    onClick={() => navigate(`/cliente/eventos/${item.event.eventId}`)}
                    className="absolute inset-0 w-full cursor-pointer"
                    aria-label={`Ver ${item.event.name}`}
                  />
                  <div className="relative px-4 py-3 flex items-center gap-3 pointer-events-none">
                    <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                      <Package className="w-3.5 h-3.5 text-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate leading-tight">
                        {item.event.name}
                      </p>
                      <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3 shrink-0" />{item.event.location}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3 shrink-0" /><EventDateDisplay event={item.event} />
                        </span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${SERVICE_COLOR[item.serviceType] ?? ''}`}>
                          {SERVICE_LABEL[item.serviceType] ?? item.serviceType}
                        </span>
                      </div>
                    </div>
                    {item.reportUrl && (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="shrink-0 pointer-events-auto"
                      >
                        <a
                          href={item.reportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Informe</span>
                        </a>
                      </Button>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-brand transition-colors shrink-0" />
                  </div>
                </div>
              ))}

              {historical.map((item) => (
                <HistoricalRow key={`h-${item.historicalEventId}`} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClienteEventosPage;
