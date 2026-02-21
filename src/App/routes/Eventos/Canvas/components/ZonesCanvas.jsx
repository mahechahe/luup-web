import {
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Maximize,
  Upload,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { COLORS, generateId, getCenter, getStatusColor } from './constants';

export function ZonesCanvas({
  zones,
  selectedId,
  tool,
  planImage,
  polyPoints,
  isAdmin,
  sidebarOpen,
  loading,
  onAddZone,
  onUpdateZone,
  onSelectZone,
  onAddPolyPoint,
  onFinishPolygon,
  onChangeTool,
  onToggleSidebar,
  onSelectPlan,
}) {
  const svgRef = useRef(null);
  const handleWheelRef = useRef(null);

  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 1200, h: 800 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRect, setCurrentRect] = useState(null);
  const [dragInfo, setDragInfo] = useState(null);

  /* ── Helpers ─────────────────────────────────────────── */
  const getMousePos = (e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const CTM = svg.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    return { x: (e.clientX - CTM.e) / CTM.a, y: (e.clientY - CTM.f) / CTM.d };
  };

  const handleZoom = (factor) => {
    setViewBox((prev) => ({
      x: prev.x + (prev.w * (1 - factor)) / 2,
      y: prev.y + (prev.h * (1 - factor)) / 2,
      w: prev.w * factor,
      h: prev.h * factor,
    }));
  };

  const resetView = () => setViewBox({ x: 0, y: 0, w: 1200, h: 800 });

  /* ── Handlers SVG ────────────────────────────────────── */
  const handleMouseDown = (e) => {
    const pos = getMousePos(e);
    if (tool === 'move' || e.button === 1) {
      setIsPanning(true);
      setStartPan({ x: e.clientX, y: e.clientY });
      return;
    }
    if (tool === 'rect') {
      setIsDrawing(true);
      setCurrentRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
      onSelectZone(null);
    } else if (tool === 'poly') {
      onAddPolyPoint(pos);
      onSelectZone(null);
    } else if (tool === 'select') {
      const tag = e.target.id;
      if (tag === 'background-rect' || tag === 'grid-rect') onSelectZone(null);
    }
  };

  const handleZoneMouseDown = (e, zone) => {
    if (tool !== 'select') return;
    e.stopPropagation();
    if (!isAdmin) { onSelectZone(zone.id); return; }
    const pos = getMousePos(e);
    onSelectZone(zone.id);
    setDragInfo({
      zoneId: zone.id,
      startMouse: pos,
      initialZone: JSON.parse(JSON.stringify(zone)),
    });
  };

  const handleMouseMove = (e) => {
    const pos = getMousePos(e);
    if (dragInfo && tool === 'select') {
      const dx = pos.x - dragInfo.startMouse.x;
      const dy = pos.y - dragInfo.startMouse.y;
      const init = dragInfo.initialZone;
      if (init.type === 'rect') {
        onUpdateZone(dragInfo.zoneId, { x: init.x + dx, y: init.y + dy });
      } else {
        onUpdateZone(dragInfo.zoneId, {
          points: init.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
        });
      }
      return;
    }
    if (isPanning) {
      const dx = (startPan.x - e.clientX) * (viewBox.w / svgRef.current.clientWidth);
      const dy = (startPan.y - e.clientY) * (viewBox.h / svgRef.current.clientHeight);
      setViewBox((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      setStartPan({ x: e.clientX, y: e.clientY });
      return;
    }
    if (isDrawing && tool === 'rect' && currentRect) {
      setCurrentRect((prev) => ({
        ...prev,
        width: pos.x - prev.x,
        height: pos.y - prev.y,
      }));
    }
  };

  const handleMouseUp = () => {
    if (dragInfo) {
      setDragInfo(null);
      return;
    }
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    if (isDrawing && tool === 'rect' && currentRect) {
      let r = { ...currentRect };
      if (r.width < 0) { r.x += r.width; r.width = Math.abs(r.width); }
      if (r.height < 0) { r.y += r.height; r.height = Math.abs(r.height); }
      if (r.width > 10 && r.height > 10) {
        const newZone = {
          id: generateId(),
          name: `Zona ${zones.length + 1}`,
          type: 'rect',
          ...r,
          color: COLORS[0].hex,
          people: [],
          maxCapacity: 10,
          category: 'general',
          notes: '',
        };
        onAddZone(newZone);
        onSelectZone(newZone.id);
      }
      setIsDrawing(false);
      setCurrentRect(null);
      onChangeTool('select');
    }
  };

  /* Wheel zoom con passive:false */
  handleWheelRef.current = (e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.1 : 0.9;
    const pos = getMousePos(e);
    setViewBox((prev) => ({
      x: pos.x - (pos.x - prev.x) * factor,
      y: pos.y - (pos.y - prev.y) * factor,
      w: prev.w * factor,
      h: prev.h * factor,
    }));
  };

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const handler = (e) => handleWheelRef.current(e);
    svg.addEventListener('wheel', handler, { passive: false });
    return () => svg.removeEventListener('wheel', handler);
  }, []);

  /* ── Render ──────────────────────────────────────────── */
  return (
    <main
      className={`flex-1 overflow-hidden relative ${
        tool === 'move'
          ? 'cursor-grab active:cursor-grabbing'
          : tool === 'select'
            ? 'cursor-default'
            : 'cursor-crosshair'
      }`}
    >
      {/* Controles de zoom flotantes */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-md border border-border p-1 flex flex-col gap-1">
        <button
          onClick={() => handleZoom(0.8)}
          className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition"
          title="Restablecer vista"
        >
          <Maximize className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(1.25)}
          className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-full touch-none outline-none"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        onDoubleClick={
          tool === 'poly' && polyPoints.length >= 3 ? onFinishPolygon : undefined
        }
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="gray"
              strokeWidth="0.5"
              opacity="0.2"
            />
          </pattern>
        </defs>
        <rect id="background-rect" x="-5000" y="-5000" width="10000" height="10000" fill="#f8fafc" />
        <rect id="workspace-rect" x="0" y="0" width="1200" height="800" fill="white" />
        <rect id="grid-rect" x="0" y="0" width="1200" height="800" fill="url(#grid)" />

        <image
          href={planImage}
          x="50"
          y="50"
          width="1100"
          height="700"
          opacity="0.9"
          preserveAspectRatio="none"
          className="pointer-events-none"
        />

        {/* Zonas */}
        {zones.map((zone) => {
          const isSelected = selectedId === zone.id;
          const center = getCenter(zone);
          const statusColor = getStatusColor(zone.people.length, zone.maxCapacity);
          return (
            <g
              key={zone.id}
              onMouseDown={(e) => handleZoneMouseDown(e, zone)}
              className={tool === 'select' ? 'cursor-move' : ''}
            >
              {zone.type === 'rect' ? (
                <rect
                  x={zone.x}
                  y={zone.y}
                  width={zone.width}
                  height={zone.height}
                  fill={zone.color}
                  fillOpacity={isSelected ? 0.5 : 0.2}
                  stroke={isSelected ? '#234465' : zone.color}
                  strokeWidth={isSelected ? 3 : 2}
                />
              ) : (
                <polygon
                  points={zone.points.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill={zone.color}
                  fillOpacity={isSelected ? 0.5 : 0.2}
                  stroke={isSelected ? '#234465' : zone.color}
                  strokeWidth={isSelected ? 3 : 2}
                />
              )}
              <g
                transform={`translate(${center.x}, ${center.y})`}
                className="pointer-events-none select-none"
              >
                <rect
                  x="-55"
                  y="-22"
                  width="110"
                  height="44"
                  rx="4"
                  fill="white"
                  fillOpacity="0.9"
                  stroke={statusColor}
                  strokeWidth="1.5"
                />
                <text y="-4" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1e293b">
                  {zone.name}
                </text>
                <text y="13" textAnchor="middle" fontSize="10" fill="#475569">
                  👥 {zone.people.length} / {zone.maxCapacity}
                </text>
                <circle cx="46" cy="-13" r="4" fill={statusColor} />
              </g>
            </g>
          );
        })}

        {/* Preview rect en dibujo */}
        {isDrawing && currentRect && tool === 'rect' && (
          <rect
            x={currentRect.width < 0 ? currentRect.x + currentRect.width : currentRect.x}
            y={currentRect.height < 0 ? currentRect.y + currentRect.height : currentRect.y}
            width={Math.abs(currentRect.width)}
            height={Math.abs(currentRect.height)}
            fill="rgba(35,68,101,0.15)"
            stroke="#234465"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        )}

        {/* Preview polígono en dibujo */}
        {tool === 'poly' && polyPoints.length > 0 && (
          <g>
            <polyline
              points={polyPoints.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#234465"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            {polyPoints.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="4" fill="#234465" />
            ))}
          </g>
        )}
      </svg>

      {/* Skeleton — cargando evento */}
      {loading && (
        <div className="absolute inset-0 z-20 bg-[#f8fafc] flex flex-col items-center justify-center gap-6">
          {/* Simulación de plano con pulsos */}
          <div className="relative w-[560px] max-w-[90%] h-[360px] rounded-2xl overflow-hidden border border-border shadow-sm bg-white">
            {/* Fondo animado */}
            <div className="absolute inset-0 animate-pulse bg-muted/60" />
            {/* Bloques que simulan zonas */}
            <div className="absolute top-10 left-8 w-40 h-24 rounded-lg animate-pulse bg-muted" />
            <div className="absolute top-10 right-12 w-28 h-32 rounded-lg animate-pulse bg-muted delay-75" />
            <div className="absolute bottom-12 left-1/3 w-48 h-20 rounded-lg animate-pulse bg-muted delay-150" />
            <div className="absolute bottom-8 right-8 w-24 h-16 rounded-lg animate-pulse bg-muted delay-100" />
          </div>
          <p className="text-xs text-muted-foreground animate-pulse">Cargando plano del evento…</p>
        </div>
      )}

      {/* Empty state — sin plano cargado */}
      {!loading && !planImage && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="pointer-events-auto flex flex-col items-center gap-4 bg-white/90 backdrop-blur-sm border border-border rounded-2xl shadow-lg px-10 py-8 text-center max-w-xs">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <ImageOff className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">Sin plano cargado</p>
              <p className="text-xs text-muted-foreground mt-1">
                No hay un plano del recinto para este evento.
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={onSelectPlan}
                className="flex items-center gap-2 bg-[#234465] hover:bg-[#234465]/90 text-white text-xs font-medium px-4 py-2 rounded-lg transition"
              >
                <Upload className="w-3.5 h-3.5" />
                Seleccionar plano
              </button>
            )}
          </div>
        </div>
      )}

      {/* Botón colapsar sidebar */}
      <button
        onClick={onToggleSidebar}
        className="absolute top-1/2 right-0 -translate-y-1/2 z-10 w-5 h-12 flex items-center justify-center bg-white border border-border rounded-l-lg shadow-sm hover:bg-muted transition-colors"
        title={sidebarOpen ? 'Ocultar panel' : 'Mostrar panel'}
      >
        {sidebarOpen ? (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>
    </main>
  );
}
