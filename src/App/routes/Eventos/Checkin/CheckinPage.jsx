import { useUserStore } from '@/App/context/userStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Boxes,
  ClipboardCheck,
  DoorOpen,
  Lock,
  Package,
  UserCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getEventoDetailService } from '../services/eventServices';
import { Section1 } from './Sections/Section1';
import { Section2 } from './Sections/Section2';
import { Section3 } from './Sections/Section3';
import { Section4 } from './Sections/Section4';

const STATIONS = [
  {
    id: 1,
    label: 'Estación 1',
    sublabel: 'Check-in · Uniforme',
    Icon: ClipboardCheck,
    activeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 shadow-sm',
    inactiveClass: 'text-foreground hover:bg-muted',
    lockedClass: 'text-muted-foreground/40 cursor-not-allowed',
  },
  {
    id: 2,
    label: 'Estación 2',
    sublabel: 'Maleta · Almuerzo · Refrigerio',
    Icon: Package,
    activeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 shadow-sm',
    inactiveClass: 'text-foreground hover:bg-muted',
    lockedClass: 'text-muted-foreground/40 cursor-not-allowed',
  },
  {
    id: 3,
    label: 'Estación 3',
    sublabel: 'Dotación · Insumos',
    Icon: Boxes,
    activeClass: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 shadow-sm',
    inactiveClass: 'text-foreground hover:bg-muted',
    lockedClass: 'text-muted-foreground/40 cursor-not-allowed',
  },
  {
    id: 4,
    label: 'Estación 4',
    sublabel: 'Check-out',
    Icon: DoorOpen,
    activeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 shadow-sm',
    inactiveClass: 'text-foreground hover:bg-muted',
    lockedClass: 'text-muted-foreground/40 cursor-not-allowed',
  },
];

export default function CheckinPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useUserStore();

  const userStationId = user?.stationId ?? null;
  const canAccess = (id) => userStationId === null || userStationId === id;
  const defaultTab = userStationId ?? 1;

  const [activeStation, setActiveStation] = useState(defaultTab);
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);

  const [error, setError] = useState(null);

  useEffect(() => {
    getEventoDetailService(eventId).then((res) => {
      if (!res.status) {
        setError(res.errors ?? 'Evento no encontrado');
        setLoading(false);
        return;
      }
      setEvent(res.event);
    });
  }, [eventId]);

  const handleStationChange = (id) => {
    setActiveStation(id);
  };

  if (!loading && error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <UserCheck className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-lg font-bold text-foreground">
            El evento no existe
          </h2>
          <Button
            onClick={() => navigate('/eventos/listado')}
            className="bg-[#DD7419] hover:bg-[#DD7419]/90"
          >
            Ir al listado
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/eventos/${eventId}`)}
            className="h-8 w-8 rounded-md border border-border hover:bg-muted flex items-center justify-center transition shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-foreground leading-tight">
              Estaciones del evento
            </h1>
            {event && (
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-muted-foreground truncate">
                  {event.name}
                </p>
                <Badge
                  className={`text-[10px] border-0 shrink-0 ${
                    event.isActive
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {event.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Tabs de estaciones ── */}
      <div className="sticky top-[57px] z-20 bg-card border-b border-border px-2">
        <div className="flex gap-1 py-1.5">
          {STATIONS.map(
            ({
              id,
              label,
              sublabel,
              Icon,
              activeClass,
              inactiveClass,
              lockedClass,
            }) => {
              const accessible = canAccess(id);
              const isActive = activeStation === id;
              return (
                <button
                  key={id}
                  onClick={() => accessible && handleStationChange(id)}
                  disabled={!accessible}
                  className={`relative flex-1 flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg font-semibold transition-all ${
                    !accessible
                      ? lockedClass
                      : isActive
                        ? activeClass
                        : inactiveClass
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <Icon className="w-3 h-3 shrink-0" />
                    <span className="text-[11px]">{label}</span>
                    {!accessible && <Lock className="w-2.5 h-2.5" />}
                  </div>
                  <span
                    className={`text-[9px] font-normal leading-tight text-center ${
                      isActive
                        ? 'text-current opacity-70'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {sublabel}
                  </span>
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">
          {activeStation === 1 && <Section1 eventId={eventId} />}
          {activeStation === 2 && <Section2 eventId={eventId} />}
          {activeStation === 3 && <Section3 eventId={eventId} />}
          {activeStation === 4 && <Section4 eventId={eventId} />}
        </div>
      </div>
    </div>
  );
}
