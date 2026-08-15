import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { RefreshCw } from 'lucide-react';
import {
  deleteEventZoneService,
  getEventoDetailService,
  getEventZonesService,
  updateEventZonesService,
} from '../services/eventServices';
import { EventoHeader } from '../Canvas/components/EventoHeader';
import { DeleteZoneModal } from '../Canvas/components/DeleteZoneModal';
import { LoadingModal } from '../Canvas/components/LoadingModal';
import { COLORS } from '../Canvas/components/constants';
import { MapZonesSidebar } from './components/MapZonesSidebar';
import { TrackingPanel } from './modals/TrackingPanel';
import { useUserStore } from '@/App/context/userStore';
import { hasAdminAccess } from '@/App/utils/roles';
import { eventBasePath } from '@/App/utils/eventNav';
import { getLiveLocationsService } from './services/mapLayoutServices';
import { MAPBOX_TOKEN } from '@/App/utils/constants/apiConstants';

import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

mapboxgl.accessToken = MAPBOX_TOKEN;

const CENTER = [-74.09211028939165, 4.65864757893157];

// Convierte las zonas del estado a un GeoJSON FeatureCollection para Mapbox.
// Solo renderiza zonas con coordenadas geográficas válidas (lat/lng).
const isGeoPoint = (p) =>
  p && p.x >= -180 && p.x <= 180 && p.y >= -90 && p.y <= 90;

const zonesToGeoJSON = (zones) => ({
  type: 'FeatureCollection',
  features: zones
    .filter(
      (z) =>
        z.type === 'polygon' &&
        Array.isArray(z.points) &&
        z.points.length >= 3 &&
        isGeoPoint(z.points[0])
    )
    .map((zone) => ({
      type: 'Feature',
      properties: {
        zoneId: String(zone.id),
        name: zone.name,
        color: zone.color,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            ...zone.points.map((p) => [p.x, p.y]),
            [zone.points[0].x, zone.points[0].y], // cerrar anillo
          ],
        ],
      },
    })),
});

const isValidLngLat = (lng, lat) =>
  typeof lng === 'number'
  && typeof lat === 'number'
  && lng >= -180
  && lng <= 180
  && lat >= -90
  && lat <= 90;

const liveToGeoJSON = (locations) => ({
  type: 'FeatureCollection',
  features: locations
    .filter((loc) => isValidLngLat(loc.longitude, loc.latitude))
    .map((loc) => {
      const batteryValue = loc.battery != null ? Number(loc.battery) : null;
      const lastUpdateTs = loc.lastUpdate ? new Date(loc.lastUpdate).getTime() : null;
      const isStale = !lastUpdateTs || (Date.now() - lastUpdateTs) > 30 * 60 * 1000;
      const isLowBattery = batteryValue != null && batteryValue < 20;

        return {
          type: 'Feature',
          properties: {
            locationId: loc.locationId,
            userId: loc.userId,
            firstName: loc.firstName,
            lastName: loc.lastName,
            role: loc.role,
            deviceId: loc.deviceId,
            battery: batteryValue,
            lastUpdate: loc.lastUpdate,
            isLowBattery,
            isStale,
            zones: JSON.stringify(loc.zones ?? []),
            primaryZoneColor: loc.zones?.[0]?.color ?? null,
          },
        geometry: {
          type: 'Point',
          coordinates: [loc.longitude, loc.latitude],
        },
      };
    }),
});

export default function MapLayoutPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useUserStore();
  const IS_ADMIN = hasAdminAccess(user?.roleId);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const zonesCountRef = useRef(0); // ref para closures de eventos del mapa
  const hasFittedZonesRef = useRef(false); // se activa una sola vez al cargar zonas

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  const [zones, setZones] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingZone, setIsDeletingZone] = useState(false);
  const [sidebarOpen] = useState(true);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [liveLocations, setLiveLocations] = useState([]);
  const [isRefreshingLive, setIsRefreshingLive] = useState(false);

  // Mantener ref sincronizado para los event handlers del mapa
  useEffect(() => {
    zonesCountRef.current = zones.length;
  }, [zones]);

  // ─── Carga de zonas ────────────────────────────────────────────
  const loadZones = useCallback(async () => {
    const zonesRes = await getEventZonesService(eventId);
    if (!zonesRes.status || !zonesRes.data) return;

    const processed = zonesRes.data.zones.map((zone) => {
      const people = [];

      if (zone.supervisor) {
        people.push({
          id: zone.supervisor.userId,
          name: `${zone.supervisor.firstName} ${zone.supervisor.lastName}`.trim(),
          cedula: zone.supervisor.cedula,
          role: 'supervisor',
          status: 'confirmed',
        });
      }
      if (zone.coordinator) {
        people.push({
          id: zone.coordinator.userId,
          name: `${zone.coordinator.firstName} ${zone.coordinator.lastName}`.trim(),
          cedula: zone.coordinator.cedula,
          role: 'coordinador',
          status: 'confirmed',
        });
      }
      zone.responsableAcopio?.forEach((r) => {
        people.push({
          id: r.userId,
          name: `${r.firstName} ${r.lastName}`.trim(),
          cedula: r.cedula,
          role: 'responsable_acopio',
          status: 'confirmed',
        });
      });
      zone.collaborators.forEach((c) => {
        people.push({
          id: c.userId,
          name: `${c.firstName} ${c.lastName}`.trim(),
          cedula: c.cedula,
          role: 'colaborador',
          status: 'confirmed',
        });
      });

      return {
        id: zone.id,
        name: zone.name,
        type: zone.type,
        category: zone.category,
        color: zone.color,
        maxCapacity: zone.maxCapacity,
        notes: zone.notes || '',
        wasteLimit: zone.wasteLimit ?? null,
        weightLimit: zone.weightLimit ?? null,
        people,
        responsableAcopio:
          zone.responsableAcopio?.map((r) => ({
            userId: r.userId,
            name: `${r.firstName} ${r.lastName}`.trim(),
            cedula: r.cedula,
          })) ?? [],
        ...(zone.type === 'rect'
          ? zone.geometry
          : { points: zone.geometry.points }),
      };
    });

    setZones(processed);
  }, [eventId]);

  // ─── Carga inicial ─────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const eventRes = await getEventoDetailService(eventId);
      if (eventRes.status) setEvent(eventRes.event);
      await loadZones();
      setLoading(false);
    };
    load();
  }, [eventId, loadZones]);

  // ─── Ubicaciones en tiempo real (polling) ─────────────────────
  const fetchLiveLocations = useCallback(async () => {
    setIsRefreshingLive(true);
    const res = await getLiveLocationsService(eventId);
    if (res.status) setLiveLocations(res.data);
    setIsRefreshingLive(false);
  }, [eventId]);

  useEffect(() => {
    let intervalId;

    fetchLiveLocations();
    intervalId = setInterval(fetchLiveLocations, 30000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchLiveLocations]);

  // ─── Inicializar mapa ──────────────────────────────────────────
  useEffect(() => {
    if (loading || !mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: CENTER,
      zoom: 14,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
    });
    map.addControl(draw, 'top-right');

    map.on('load', () => {
      // Fuente de datos para las zonas
      map.addSource('zones-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Relleno base
      map.addLayer({
        id: 'zones-fill',
        type: 'fill',
        source: 'zones-source',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.3,
        },
      });

      // Relleno destacado para zona seleccionada
      map.addLayer({
        id: 'zones-fill-selected',
        type: 'fill',
        source: 'zones-source',
        filter: ['==', ['get', 'zoneId'], ''],
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.55,
        },
      });

      // Borde
      map.addLayer({
        id: 'zones-line',
        type: 'line',
        source: 'zones-source',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2,
        },
      });

      // Etiquetas
      map.addLayer({
        id: 'zones-labels',
        type: 'symbol',
        source: 'zones-source',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 12,
          'text-anchor': 'center',
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1,
        },
      });

      // Fuente para ubicaciones en tiempo real
      map.addSource('live-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'live-points',
        type: 'circle',
        source: 'live-source',
        paint: {
          'circle-radius': 6,
          'circle-color': [
            'coalesce',
            ['get', 'primaryZoneColor'],
            [
              'match',
              ['get', 'role'],
              'coordinador', '#DD7419',
              'coordinator', '#DD7419',
              'collaborator', '#1D4ED8',
              'colaborador', '#1D4ED8',
              'supervisor', '#6D28D9',
              'responsableAcopio', '#16A34A',
              'responsable_acopio', '#16A34A',
              '#1D4ED8',
            ],
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5,
        },
      });

      map.addLayer({
        id: 'live-role-ring',
        type: 'circle',
        source: 'live-source',
        paint: {
          'circle-radius': 8,
          'circle-color': 'rgba(0,0,0,0)',
          'circle-stroke-color': [
            'match',
            ['get', 'role'],
            'coordinador', '#DD7419',
            'coordinator', '#DD7419',
            'collaborator', '#1D4ED8',
            'colaborador', '#1D4ED8',
            'supervisor', '#6D28D9',
            'responsableAcopio', '#16A34A',
            'responsable_acopio', '#16A34A',
            '#1D4ED8',
          ],
          'circle-stroke-width': 2,
        },
      });

      map.addLayer({
        id: 'live-low-batt-ring',
        type: 'circle',
        source: 'live-source',
        filter: ['==', ['get', 'isLowBattery'], true],
        paint: {
          'circle-radius': 9,
          'circle-color': '#ef4444',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
          'circle-opacity': 0.9,
        },
      });

      map.addLayer({
        id: 'live-low-batt-alert',
        type: 'symbol',
        source: 'live-source',
        filter: ['==', ['get', 'isLowBattery'], true],
        layout: {
          'text-field': '!',
          'text-size': 12,
          'text-offset': [0, -0.9],
          'text-anchor': 'bottom',
        },
        paint: {
          'text-color': '#ef4444',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1,
        },
      });

      map.addLayer({
        id: 'live-stale-ring',
        type: 'circle',
        source: 'live-source',
        filter: [
          'all',
          ['==', ['get', 'isStale'], true],
          ['!=', ['get', 'isLowBattery'], true],
        ],
        paint: {
          'circle-radius': 9,
          'circle-color': '#f59e0b',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
          'circle-opacity': 0.9,
        },
      });

      map.addLayer({
        id: 'live-stale-alert',
        type: 'symbol',
        source: 'live-source',
        filter: [
          'all',
          ['==', ['get', 'isStale'], true],
          ['!=', ['get', 'isLowBattery'], true],
        ],
        layout: {
          'text-field': '!',
          'text-size': 12,
          'text-offset': [0, -0.9],
          'text-anchor': 'bottom',
        },
        paint: {
          'text-color': '#f59e0b',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1,
        },
      });

      map.addLayer({
        id: 'live-labels',
        type: 'symbol',
        source: 'live-source',
        layout: {
          'text-field': ['concat', ['get', 'firstName'], ' ', ['get', 'lastName']],
          'text-size': 11,
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1,
        },
      });

      map.on('click', 'live-points', (e) => {
        if (!e.features?.length) return;
        const feature = e.features[0];
        const props = feature.properties || {};
        const coordinates = feature.geometry?.coordinates?.slice();
        if (!coordinates) return;

        const batteryValue = props.battery != null ? Number(props.battery) : null;
        const isLowBattery = props.isLowBattery === true;
        const isStale = props.isStale === true;
        const batteryText = batteryValue != null ? `${batteryValue}%` : '—';
        const lastUpdateText = props.lastUpdate
          ? new Date(props.lastUpdate).toLocaleString('es-CO', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
          : '—';

        const roleLabel = (() => {
          const role = String(props.role || '').toLowerCase();
          if (role === 'coordinador' || role === 'coordinator') return 'Coordinador';
          if (role === 'supervisor') return 'Supervisor';
          if (role === 'responsableacopio' || role === 'responsable_acopio') return 'Resp. Acopio';
          if (role === 'collaborator' || role === 'colaborador') return 'Colaborador';
          return props.role || '—';
        })();

        const batteryLine = isLowBattery
          ? `<div><strong>Batería baja:</strong> <span style="color:#ef4444;font-weight:700">${batteryText}</span></div>`
          : `<div><strong>Batería:</strong> ${batteryText}</div>`;

        const alertReasons = [];
        if (isLowBattery) alertReasons.push('Batería baja');
        if (isStale) alertReasons.push('Sin reporte > 30 min');
        const alertLine = alertReasons.length
          ? `<div><strong>Alerta:</strong> <span style="color:#f59e0b;font-weight:700">${alertReasons.join(' · ')}</span></div>`
          : '';

        let zonesSection = '';
        try {
          const zonesRaw = props.zones ? JSON.parse(props.zones) : [];
          if (Array.isArray(zonesRaw) && zonesRaw.length > 0) {
            const visibleZones = zonesRaw.slice(0, 3);
            const remainingCount = zonesRaw.length - visibleZones.length;
            const zoneLines = visibleZones.map((z) => {
              const zoneRole = String(z.role || '').toLowerCase();
              const zoneRoleLabel = (() => {
                if (zoneRole === 'coordinador' || zoneRole === 'coordinator') return 'Coordinador';
                if (zoneRole === 'supervisor') return 'Supervisor';
                if (zoneRole === 'responsableacopio' || zoneRole === 'responsable_acopio') return 'Resp. Acopio';
                if (zoneRole === 'collaborator' || zoneRole === 'colaborador') return 'Colaborador';
                return z.role || '—';
              })();
              const color = z.color || '#94a3b8';
              return `
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                  <div style="display:flex;align-items:center;gap:6px;min-width:0;">
                    <span style="width:8px;height:8px;border-radius:999px;background:${color};flex:0 0 auto;"></span>
                    <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${z.name || 'Zona'}</span>
                  </div>
                  <span style="font-size:11px;color:#e9e2cf;">${zoneRoleLabel}</span>
                </div>
              `;
            }).join('');
            const moreLine = remainingCount > 0
              ? `<div style="font-size:11px;color:#94a3b8;">+${remainingCount} más</div>`
              : '';
            zonesSection = `
              <div style="margin-top:6px;">
                <div style="font-size:12px;font-weight:600;margin-bottom:4px;">Zonas</div>
                <div style="display:flex;flex-direction:column;gap:4px;">
                  ${zoneLines}
                  ${moreLine}
                </div>
              </div>
            `;
          }
        } catch (error) {
          zonesSection = '';
        }

        const html = `
          <div style="min-width:200px">
            <div style="font-weight:700;margin-bottom:6px">${props.firstName || ''} ${props.lastName || ''}</div>
            <div style="font-size:12px;line-height:1.45;display:flex;flex-direction:column;gap:4px;">
              ${batteryLine}
              <div><strong>Última actualización:</strong> ${lastUpdateText}</div>
              ${alertLine}
              <div><strong>Device ID:</strong> ${props.deviceId || '—'}</div>
            </div>
            ${zonesSection}
          </div>
        `;

        new mapboxgl.Popup({ offset: 12, className: 'live-popup' })
          .setLngLat(coordinates)
          .setHTML(html)
          .addTo(map);
      });

      map.on('mouseenter', 'live-points', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'live-points', () => {
        map.getCanvas().style.cursor = '';
      });

      // Seleccionar zona al hacer clic
      map.on('click', 'zones-fill', (e) => {
        const rawId = e.features[0].properties.zoneId;
        const parsed = isNaN(Number(rawId)) ? rawId : Number(rawId);
        setSelectedId(parsed);
      });

      map.on('mouseenter', 'zones-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'zones-fill', () => {
        map.getCanvas().style.cursor = '';
      });

      setMapReady(true);
    });

    // Crear zona al terminar de dibujar un polígono
    map.on('draw.create', (e) => {
      const feature = e.features[0];
      const coords = feature.geometry.coordinates[0];
      // Quitar el punto repetido final del anillo GeoJSON
      const points = coords
        .slice(0, -1)
        .map(([lng, lat]) => ({ x: lng, y: lat }));

      const count = zonesCountRef.current;
      const color = COLORS[count % COLORS.length].hex;
      const tempId = `new-${Date.now()}`;

      setZones((prev) => [
        ...prev,
        {
          id: tempId,
          name: `Zona ${count + 1}`,
          type: 'polygon',
          points,
          color,
          people: [],
          maxCapacity: 10,
          category: 'general',
          notes: '',
          wasteLimit: null,
          weightLimit: null,
          responsableAcopio: [],
        },
      ]);
      setSelectedId(tempId);

      // Quitar de MapboxDraw — el rendering lo maneja la capa GeoJSON
      draw.delete(feature.id);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [loading]);

  // ─── Sincronizar zonas → fuente GeoJSON ───────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const source = mapRef.current.getSource('zones-source');
    if (source) source.setData(zonesToGeoJSON(zones));

    // Fit al cargar zonas por primera vez
    if (!hasFittedZonesRef.current) {
      const allCoords = zones
        .filter((z) => z.type === 'polygon' && Array.isArray(z.points) && z.points.length >= 3 && isGeoPoint(z.points[0]))
        .flatMap((z) => z.points.map((p) => [p.x, p.y]));

      if (allCoords.length > 0) {
        const bounds = allCoords.reduce(
          (b, c) => b.extend(c),
          new mapboxgl.LngLatBounds(allCoords[0], allCoords[0])
        );
        mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 17, duration: 1000 });
        hasFittedZonesRef.current = true;
      }
    }
  }, [zones, mapReady]);

  // ─── Sincronizar ubicaciones → fuente GeoJSON ─────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const source = mapRef.current.getSource('live-source');
    if (source) source.setData(liveToGeoJSON(liveLocations));
  }, [liveLocations, mapReady]);

  // ─── Highlight zona seleccionada ──────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    mapRef.current.setFilter('zones-fill-selected', [
      '==',
      ['get', 'zoneId'],
      selectedId !== null ? String(selectedId) : '',
    ]);
  }, [selectedId, mapReady]);

  // ─── Handlers de zonas ────────────────────────────────────────
  const updateZone = (id, updates) =>
    setZones((prev) =>
      prev.map((z) => (z.id === id ? { ...z, ...updates } : z))
    );

  const addPeople = (zoneId, collaborators, role) => {
    const zone = zones.find((z) => z.id === zoneId);
    if (!zone) return;
    const newPeople = collaborators.map((c) => ({
      id: c.userId,
      name: `${c.firstName} ${c.lastName}`.trim(),
      cedula: c.cedula,
      role,
      status: 'confirmed',
    }));
    updateZone(zoneId, { people: [...zone.people, ...newPeople] });
  };

  const removePerson = (zoneId, personId) => {
    const zone = zones.find((z) => z.id === zoneId);
    updateZone(zoneId, {
      people: zone.people.filter((p) => p.id !== personId),
    });
  };

  const confirmDeleteZone = async (id) => {
    if (typeof id === 'number' && id > 0) {
      setIsDeletingZone(true);
      const res = await deleteEventZoneService(id);
      setIsDeletingZone(false);
      if (!res.status) return;
    }
    setZones((prev) => prev.filter((z) => z.id !== id));
    setDeleteId(null);
    setSelectedId(null);
  };

  // ─── Guardar zonas ────────────────────────────────────────────
  const handleSaveZones = async () => {
    setIsSaving(true);

    const zonesData = zones
      .filter((z) => z.type === 'polygon' && z.points?.length >= 3)
      .map((zone) => {
        const supervisor = zone.people.find((p) => p.role === 'supervisor');
        const coordinador = zone.people.find((p) => p.role === 'coordinador');
        const responsablesAcopio = zone.people.filter(
          (p) => p.role === 'responsable_acopio'
        );
        const colaboradores = zone.people.filter(
          (p) => p.role === 'colaborador'
        );

        return {
          ...(typeof zone.id === 'number' && zone.id > 0
            ? { zoneId: zone.id }
            : {}),
          name: zone.name,
          type: 'polygon',
          category: zone.category,
          color: zone.color,
          maxCapacity: zone.maxCapacity,
          notes: zone.notes || '',
          wasteLimit:
            zone.category === 'acopio' ? zone.wasteLimit ?? null : null,
          weightLimit:
            zone.category === 'acopio' ? zone.weightLimit ?? null : null,
          geometry: { points: zone.points },
          supervisorId: supervisor ? supervisor.id : null,
          coordinadorId: coordinador ? coordinador.id : null,
          responsableAcopioIds: responsablesAcopio.map((r) => r.id),
          colaboradorIds: colaboradores.map((c) => c.id),
        };
      });

    const res = await updateEventZonesService({
      eventId: Number(eventId),
      zones: zonesData,
    });

    if (res.status) await loadZones();
    setIsSaving(false);
  };

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <EventoHeader
        loading={loading}
        event={event}
        onBack={() => navigate(eventBasePath(eventId, user?.roleId))}
        onSave={handleSaveZones}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Mapa */}
        <div className="relative flex-1 overflow-hidden">
          <div
            ref={mapContainerRef}
            style={{ width: '100%', height: '100%' }}
          />

          {/* Widget de seguimiento — esquina superior izquierda */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <button
              onClick={() => setTrackingOpen(true)}
              className="flex items-center gap-2.5 bg-card border border-border rounded-xl px-4 py-2.5 shadow-lg hover:shadow-xl hover:border-[#234465]/40 transition group"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div className="text-left">
                <p className="text-xs font-bold text-foreground leading-none">
                  Seguimiento
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">
                  {zones.reduce((acc, z) => acc + z.people.length, 0)}{' '}
                  colaboradores asignados
                </p>
              </div>
              <span className="text-[10px] font-semibold text-[#234465] dark:text-[#7493B2] group-hover:underline ml-1">
                Ver
              </span>
            </button>
            <button
              onClick={fetchLiveLocations}
              disabled={isRefreshingLive}
              className="h-[46px] w-[46px] flex items-center justify-center rounded-xl bg-card border border-border shadow-lg hover:shadow-xl hover:border-[#234465]/40 transition disabled:opacity-50"
              title="Actualizar ubicaciones"
            >
              <RefreshCw className={`w-4 h-4 text-[#234465] ${isRefreshingLive ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Sidebar de zonas */}
        <MapZonesSidebar
          isOpen={sidebarOpen}
          zones={zones}
          selectedId={selectedId}
          isAdmin={IS_ADMIN}
          onSelectZone={setSelectedId}
          onUpdateZone={updateZone}
          onAddPeople={addPeople}
          onRemovePerson={removePerson}
          onDeleteRequest={setDeleteId}
        />
      </div>

      <TrackingPanel
        eventId={eventId}
        open={trackingOpen}
        onClose={() => setTrackingOpen(false)}
      />

      <DeleteZoneModal
        deleteId={deleteId}
        isDeleting={isDeletingZone}
        onConfirm={confirmDeleteZone}
        onCancel={() => setDeleteId(null)}
      />

      {isSaving && <LoadingModal />}
    </div>
  );
}
