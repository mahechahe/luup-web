import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ListIcon } from 'lucide-react';
import { getEventoDetailService } from '../services/eventServices';

export default function ZonasPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);

  useEffect(() => {
    getEventoDetailService(eventId).then((res) => {
      if (res.status) {
        setEvent(res.event);
      }
      setLoading(false);
    });
  }, [eventId]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-white px-5 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/eventos/${eventId}`)}
            className="h-8 w-8 rounded-md border border-border hover:bg-muted flex items-center justify-center transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-bold text-foreground">Zonas</h1>
            <p className="text-xs text-muted-foreground">{event?.name}</p>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#DD7419]/10 flex items-center justify-center mx-auto">
            <ListIcon className="w-8 h-8 text-[#DD7419]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground mb-2">
              Vista de Zonas
            </h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Listado y gestión de zonas del evento{' '}
              <span className="font-medium text-foreground">{event?.name}</span>.
            </p>
          </div>
          <div className="inline-block px-4 py-2 bg-white rounded-lg border border-border text-xs text-muted-foreground">
            🚧 En construcción
          </div>
        </div>
      </div>
    </div>
  );
}
