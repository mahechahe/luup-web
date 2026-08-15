import { ArrowLeft, Boxes } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getEventoDetailService } from '../Eventos/services/eventServices';
import { listEventInventoryService } from '../Eventos/services/inventoryServices';

function ClienteEventoInventarioPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getEventoDetailService(eventId),
      listEventInventoryService(eventId, { page: 1, limit: 200 }),
    ]).then(([eventRes, itemsRes]) => {
      if (eventRes.status) setEvent(eventRes.event);
      if (itemsRes.status) setItems(itemsRes.items);
      else toast.error(itemsRes.errors ?? 'Error al cargar el inventario del evento.');
      setLoading(false);
    });
  }, [eventId]);

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">

        <button
          type="button"
          onClick={() => navigate(`/cliente/eventos/${eventId}`)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-brand transition-colors group -ml-1"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Volver al evento
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center">
            <Boxes className="w-4 h-4 text-[#7C3AED]" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">Inventario del evento</h2>
            {!loading && event?.name && (
              <p className="text-sm text-muted-foreground">{event.name}</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/20 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {loading ? 'Cargando...' : `${items.length} ítem${items.length !== 1 ? 's' : ''} cargado${items.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {loading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-4 py-3.5 flex items-center gap-4 animate-pulse">
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-muted rounded w-40" />
                    <div className="h-3 bg-muted rounded w-24" />
                  </div>
                  <div className="w-16 h-5 bg-muted rounded-full" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                <Boxes className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground text-sm">Sin inventario cargado</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Este evento aún no tiene ítems de inventario asignados.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {/* Encabezado de columnas — oculto en pantallas pequeñas */}
              <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_repeat(3,7rem)] gap-3 px-4 py-2 bg-muted/10 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <span>Ítem</span>
                <span className="text-right">Cargado</span>
                <span className="text-right">Asignado</span>
                <span className="text-right">Disponible</span>
              </div>
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-2 sm:grid-cols-[minmax(0,1fr)_repeat(3,7rem)] gap-x-3 gap-y-1.5 px-4 py-3.5"
                >
                  <div className="col-span-2 sm:col-span-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.nombre}</p>
                    {item.descripcion && (
                      <p className="text-xs text-muted-foreground truncate">{item.descripcion}</p>
                    )}
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="sm:hidden text-[10px] uppercase text-muted-foreground">Cargado</p>
                    <p className="text-sm font-medium text-foreground tabular-nums">{item.cantidadCargada}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="sm:hidden text-[10px] uppercase text-muted-foreground">Asignado</p>
                    <p className="text-sm font-medium text-foreground tabular-nums">{item.asignado}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="sm:hidden text-[10px] uppercase text-muted-foreground">Disponible</p>
                    <p className={`text-sm font-semibold tabular-nums ${item.disponible > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                      {item.disponible}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClienteEventoInventarioPage;
