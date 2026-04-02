import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import {
  X,
  MapPin,
  Clock,
  Battery,
  AlertCircle,
  Loader2,
  Navigation,
  Flag,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getCollaboratorLocationHistoryService } from './collaboratorLocationService';
import { MAPBOX_TOKEN } from '@/App/utils/constants/apiConstants';

import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = MAPBOX_TOKEN;

/* ── Helpers ─────────────────────────────────────────────── */
function fmtTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function fmtDuration(startIso, endIso) {
  if (!startIso || !endIso) return '—';
  const ms = new Date(endIso) - new Date(startIso);
  if (ms < 0) return '—';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h === 0) return `${m} min`;
  return `${h}h ${m}min`;
}

/* ── Stat card ───────────────────────────────────────────── */
function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
          {label}
        </p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Modal ───────────────────────────────────────────────── */
export function CollaboratorMovementsModal({
  open,
  onClose,
  eventId,
  userId,
  collaboratorName,
  event,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const startMarkerRef = useRef(null);
  const endMarkerRef = useRef(null);

  const [points, setPoints] = useState([]);
  const [loadingState, setLoadingState] = useState({
    active: false,
    page: 0,
    totalPages: 0,
  });
  const [error, setError] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  /* ── Inyectar estilos oscuros para los popups de Mapbox ─ */
  useEffect(() => {
    const style = document.createElement('style');
    style.dataset.id = 'movements-popup-styles';
    style.innerHTML = `
      .movements-popup .mapboxgl-popup-content {
        background: #1e293b;
        color: #f1f5f9;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 10px 12px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.6);
        min-width: 130px;
      }
      .movements-popup.mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip {
        border-top-color: #1e293b;
      }
      .movements-popup.mapboxgl-popup-anchor-top .mapboxgl-popup-tip {
        border-bottom-color: #1e293b;
      }
      .movements-popup.mapboxgl-popup-anchor-left .mapboxgl-popup-tip {
        border-right-color: #1e293b;
      }
      .movements-popup.mapboxgl-popup-anchor-right .mapboxgl-popup-tip {
        border-left-color: #1e293b;
      }
      .movements-popup .mapboxgl-popup-close-button {
        color: #94a3b8;
        font-size: 18px;
        line-height: 1;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        top: 6px;
        right: 6px;
        border-radius: 4px;
        padding: 0;
      }
      .movements-popup .mapboxgl-popup-close-button:hover {
        color: #f1f5f9;
        background: rgba(255,255,255,0.1);
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) document.head.removeChild(style);
    };
  }, []);

  /* ── Fetch all pages ─────────────────────────────────── */
  const fetchAllPoints = useCallback(async () => {
    if (!eventId || !userId) return;
    setError(null);
    setPoints([]);
    setLoadingState({ active: true, page: 1, totalPages: 1 });

    const firstRes = await getCollaboratorLocationHistoryService(
      eventId,
      userId,
      {
        page: 1,
        limit: 500,
      }
    );

    if (!firstRes.status) {
      setError(firstRes.errors);
      setLoadingState({ active: false, page: 0, totalPages: 0 });
      return;
    }

    const { totalPages } = firstRes.pagination ?? { totalPages: 1 };
    let allPoints = [...firstRes.points];
    setLoadingState({ active: true, page: 1, totalPages });

    for (let page = 2; page <= totalPages; page++) {
      setLoadingState({ active: true, page, totalPages });
      const res = await getCollaboratorLocationHistoryService(eventId, userId, {
        page,
        limit: 500,
      });
      if (res.status) allPoints = [...allPoints, ...res.points];
    }

    setPoints(allPoints);
    setLoadingState({ active: false, page: totalPages, totalPages });
  }, [eventId, userId]);

  /* ── Trigger fetch when modal opens ─────────────────── */
  useEffect(() => {
    if (open) fetchAllPoints();
    else {
      setPoints([]);
      setError(null);
      setLoadingState({ active: false, page: 0, totalPages: 0 });
    }
  }, [open, fetchAllPoints]);

  /* ── Init / destroy map ──────────────────────────────── */
  useEffect(() => {
    if (!open || mapRef.current) return;

    // Defer until after the Dialog animation completes so the container
    // has real pixel dimensions when Mapbox measures it.
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-74.09211028939165, 4.65864757893157],
        zoom: 13,
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.on('load', () => {
        map.resize();
        map.addSource('route-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });

        // Halo exterior para contraste
        map.addLayer({
          id: 'route-halo',
          type: 'line',
          source: 'route-source',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#000000',
            'line-width': 7,
            'line-opacity': 0.35,
          },
        });

        // Línea principal de la ruta
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route-source',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#DD7419',
            'line-width': 4,
          },
        });

        // Puntos intermedios
        map.addSource('points-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });

        map.addLayer({
          id: 'points-circles',
          type: 'circle',
          source: 'points-source',
          paint: {
            'circle-radius': 3,
            'circle-color': '#DD7419',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1,
            'circle-opacity': 0.7,
          },
        });

        setMapReady(true);
      });

      mapRef.current = map;
    }, 200); // wait for Dialog open animation (~150ms)

    return () => {
      clearTimeout(timer);
      startMarkerRef.current?.remove();
      endMarkerRef.current?.remove();
      startMarkerRef.current = null;
      endMarkerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [open]);

  /* ── Paint route when points + map are ready ─────────── */
  useEffect(() => {
    if (!mapReady || !mapRef.current || points.length === 0) return;

    const coords = points.map((p) => [p.longitude, p.latitude]);

    // Update route line
    const routeSource = mapRef.current.getSource('route-source');
    if (routeSource) {
      routeSource.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: coords },
          },
        ],
      });
    }

    // Update intermediate points
    const pointsSource = mapRef.current.getSource('points-source');
    if (pointsSource) {
      pointsSource.setData({
        type: 'FeatureCollection',
        features: coords.map(([lng, lat], i) => ({
          type: 'Feature',
          properties: { index: i },
          geometry: { type: 'Point', coordinates: [lng, lat] },
        })),
      });
    }

    // Remove old markers
    startMarkerRef.current?.remove();
    endMarkerRef.current?.remove();

    // Start marker (green)
    const startEl = document.createElement('div');
    startEl.innerHTML = `
      <div style="
        width:28px;height:28px;border-radius:50%;
        background:#22c55e;border:3px solid #ffffff;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 2px 6px rgba(0,0,0,0.4);
      ">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 8 12 12 14 14"/>
        </svg>
      </div>
    `;
    startMarkerRef.current = new mapboxgl.Marker({ element: startEl })
      .setLngLat(coords[0])
      .setPopup(
        new mapboxgl.Popup({ offset: 16, className: 'movements-popup' }).setHTML(
          `<div style="font-size:12px;font-weight:700;color:#22c55e;margin-bottom:4px">Inicio</div>
           <div style="font-size:11px;color:#cbd5e1">${fmtDate(points[0].timestamp)}</div>
           <div style="font-size:11px;color:#94a3b8">${fmtTime(points[0].timestamp)}</div>
           ${points[0].battery != null ? `<div style="font-size:11px;color:#94a3b8;margin-top:2px">Batería: <span style="color:#f1f5f9;font-weight:600">${points[0].battery}%</span></div>` : ''}`
        )
      )
      .addTo(mapRef.current);

    // End marker (red)
    const last = points[points.length - 1];
    const endEl = document.createElement('div');
    endEl.innerHTML = `
      <div style="
        width:28px;height:28px;border-radius:50%;
        background:#ef4444;border:3px solid #ffffff;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 2px 6px rgba(0,0,0,0.4);
      ">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
          <line x1="4" y1="22" x2="4" y2="15"/>
        </svg>
      </div>
    `;
    endMarkerRef.current = new mapboxgl.Marker({ element: endEl })
      .setLngLat(coords[coords.length - 1])
      .setPopup(
        new mapboxgl.Popup({ offset: 16, className: 'movements-popup' }).setHTML(
          `<div style="font-size:12px;font-weight:700;color:#ef4444;margin-bottom:4px">Fin</div>
           <div style="font-size:11px;color:#cbd5e1">${fmtDate(last.timestamp)}</div>
           <div style="font-size:11px;color:#94a3b8">${fmtTime(last.timestamp)}</div>
           ${last.battery != null ? `<div style="font-size:11px;color:#94a3b8;margin-top:2px">Batería: <span style="color:#f1f5f9;font-weight:600">${last.battery}%</span></div>` : ''}`
        )
      )
      .addTo(mapRef.current);

    // Fit bounds to route
    const bounds = coords.reduce(
      (b, c) => b.extend(c),
      new mapboxgl.LngLatBounds(coords[0], coords[0])
    );
    mapRef.current.fitBounds(bounds, {
      padding: 60,
      maxZoom: 17,
      duration: 800,
    });
  }, [mapReady, points]);

  /* ── Derived stats ───────────────────────────────────── */
  const firstPt = points[0];
  const lastPt = points[points.length - 1];
  const batteries = points.map((p) => p.battery).filter((b) => b != null);
  const minBattery = batteries.length ? Math.min(...batteries) : null;
  const maxBattery = batteries.length ? Math.max(...batteries) : null;

  const isLoading = loadingState.active;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex flex-col w-[95vw] max-w-[95vw] sm:max-w-[95vw] h-[95vh] max-h-[95vh] p-0 gap-0 overflow-hidden"
      >
        {/* Título oculto requerido por Radix para accesibilidad */}
        <DialogTitle className="sr-only">
          Movimientos de {collaboratorName}
        </DialogTitle>
        <div className="flex flex-1 min-h-0">
          {/* ── Panel izquierdo ─────────────────────────── */}
          <div className="w-[280px] shrink-0 flex flex-col border-r border-border bg-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center">
                  <Navigation className="w-3.5 h-3.5 text-brand" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Movimientos
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Colaborador */}
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                  Colaborador
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {collaboratorName ?? '—'}
                </p>
              </div>

              {/* Evento */}
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">
                  Evento
                </p>
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {event?.name ?? '—'}
                </p>
                {event?.location && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {event.location}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  {fmtDate(event?.date ?? event?.startDate)}
                </p>
              </div>

              <div className="border-t border-border" />

              {/* Loading */}
              {isLoading && (
                <div className="flex items-center gap-2.5 py-2">
                  <Loader2 className="w-4 h-4 text-brand animate-spin shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      Cargando datos...
                    </p>
                    {loadingState.totalPages > 1 && (
                      <p className="text-[11px] text-muted-foreground">
                        Página {loadingState.page} de {loadingState.totalPages}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && !isLoading && (
                <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive">{error}</p>
                </div>
              )}

              {/* Sin datos */}
              {!isLoading && !error && points.length === 0 && (
                <div className="text-center py-4">
                  <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Sin registros de ubicación.
                  </p>
                </div>
              )}

              {/* Stats */}
              {!isLoading && points.length > 0 && (
                <div className="space-y-4">
                  <Stat
                    icon={MapPin}
                    label="Total de pings"
                    value={points.length.toLocaleString('es-CO')}
                  />
                  <Stat
                    icon={Clock}
                    label="Horario"
                    value={`${fmtTime(firstPt?.timestamp)} → ${fmtTime(
                      lastPt?.timestamp
                    )}`}
                    sub={fmtDuration(firstPt?.timestamp, lastPt?.timestamp)}
                  />
                  {minBattery != null && (
                    <Stat
                      icon={Battery}
                      label="Batería"
                      value={`${minBattery}% → ${maxBattery}%`}
                      sub="mín → máx durante el evento"
                    />
                  )}
                </div>
              )}

              {/* Legend */}
              {!isLoading && points.length > 0 && (
                <>
                  <div className="border-t border-border" />
                  <div className="space-y-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                      Referencia
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-[#22c55e] border-2 border-white shadow-sm shrink-0" />
                      <p className="text-xs text-foreground">Punto de inicio</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-[#ef4444] border-2 border-white shadow-sm shrink-0" />
                      <p className="text-xs text-foreground">Punto final</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-1 w-6 rounded-full shrink-0"
                        style={{ background: '#DD7419' }}
                      />
                      <p className="text-xs text-foreground">Ruta recorrida</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Mapa ────────────────────────────────────── */}
          <div className="relative flex-1 min-h-0">
            <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0 }} />

            {/* Overlay de carga sobre el mapa */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-10">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-brand animate-spin" />
                  <p className="text-sm font-medium text-foreground">
                    {loadingState.totalPages > 1
                      ? `Cargando página ${loadingState.page} de ${loadingState.totalPages}...`
                      : 'Cargando movimientos...'}
                  </p>
                </div>
              </div>
            )}

            {/* Overlay de error sobre el mapa */}
            {error && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-10">
                <div className="text-center space-y-3 max-w-xs px-4">
                  <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6 text-destructive" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    Error al cargar el historial
                  </p>
                  <p className="text-xs text-muted-foreground">{error}</p>
                  <Button size="sm" variant="outline" onClick={fetchAllPoints}>
                    Reintentar
                  </Button>
                </div>
              </div>
            )}

            {/* Sin puntos */}
            {!isLoading && !error && points.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-10">
                <div className="text-center space-y-2">
                  <Flag className="w-10 h-10 text-muted-foreground mx-auto" />
                  <p className="text-sm font-semibold text-foreground">
                    Sin movimientos registrados
                  </p>
                  <p className="text-xs text-muted-foreground">
                    No se encontraron pings de ubicación para este evento.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
