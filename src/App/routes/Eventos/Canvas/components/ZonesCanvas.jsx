import {
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Lock,
  Maximize,
  Unlock,
  Upload,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { COLORS, generateId, getCenter } from './constants';

/* ── Etiqueta SVG de zona ─────────────────────────────────
   Si la zona es de categoría 'acopio' y tiene responsableAcopio,
   la caja se hace más alta y muestra el nombre debajo del título.
────────────────────────────────────────────────────────── */
function ZoneLabel({ zone, isSelected }) {
  const hasResponsable =
    zone.category === 'acopio' && zone.responsableAcopio;

  // Nombre corto: primero + primer apellido (max 2 palabras)
  const responsableName = hasResponsable
    ? zone.responsableAcopio.name.split(' ').slice(0, 2).join(' ')
    : null;

  const boxW = hasResponsable ? 130 : 110;
  const boxH = hasResponsable ? 44 : 28;
  const nameY = hasResponsable ? -6 : 5;

  return (
    <g className="pointer-events-none select-none">
      <rect
        x={-(boxW / 2)}
        y={-(boxH / 2)}
        width={boxW}
        height={boxH}
        rx="4"
        fill="white"
        fillOpacity="0.92"
        stroke={isSelected ? '#234465' : zone.color}
        strokeWidth={isSelected ? 2 : 1.5}
      />
      <text
        y={nameY}
        textAnchor="middle"
        fontSize="12"
        fontWeight="bold"
        fill="#1e293b"
      >
        {zone.name}
      </text>
      {hasResponsable && (
        <text
          y={nameY + 16}
          textAnchor="middle"
          fontSize="9.5"
          fontWeight="600"
          fill="#DD7419"
        >
          {responsableName}
        </text>
      )}
    </g>
  );
}

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
  const [freeMove, setFreeMove] = useState(false);

  /* ── Touch pan para móvil (solo lectura) ─────────────── */
  const touchStartRef = useRef(null);

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        viewBox: { ...viewBox },
      };
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && touchStartRef.current) {
      const svg = svgRef.current;
      if (!svg) return;
      const dx =
        (touchStartRef.current.x - e.touches[0].clientX) *
        (touchStartRef.current.viewBox.w / svg.clientWidth);
      const dy =
        (touchStartRef.current.y - e.touches[0].clientY) *
        (touchStartRef.current.viewBox.h / svg.clientHeight);
      setViewBox({
        ...touchStartRef.current.viewBox,
        x: touchStartRef.current.viewBox.x + dx,
        y: touchStartRef.current.viewBox.y + dy,
      });
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

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
    if (tool === 'move' || (e.button === 1 && freeMove)) {
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
    if (!isAdmin) {
      onSelectZone(zone.id);
      return;
    }
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
      const dx =
        (startPan.x - e.clientX) * (viewBox.w / svgRef.current.clientWidth);
      const dy =
        (startPan.y - e.clientY) * (viewBox.h / svgRef.current.clientHeight);
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
      if (r.width < 0) {
        r.x += r.width;
        r.width = Math.abs(r.width);
      }
      if (r.height < 0) {
        r.y += r.height;
        r.height = Math.abs(r.height);
      }
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

  /* Wheel zoom con passive:false — solo si freeMove está activo */
  handleWheelRef.current = (e) => {
    e.preventDefault();
    if (!freeMove) return;
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

  /* ── Zonas compartidas (usado en mobile y desktop) ───── */
  const renderZones = () =>
    zones.map((zone) => {
      const isSelected = selectedId === zone.id;
      const center = getCenter(zone);
      return (
        <g key={zone.id}>
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
          <g transform={`translate(${center.x}, ${center.y})`}>
            <ZoneLabel zone={zone} isSelected={isSelected} />
          </g>
        </g>
      );
    });

  /* ── Render ──────────────────────────────────────────── */
  return (
    <>
      {/* ── Vista móvil (solo lectura, pan con touch) ─── */}
      <main className="md:hidden flex-1 overflow-hidden relative h-[50vh]">
        {/* Badge indicando modo lectura */}
        <div className="absolute top-3 left-3 z-10 bg-[#234465]/90 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
          <Lock className="w-3 h-3" />
          Solo lectura
        </div>

        {/* Controles de zoom móvil */}
        <div className="absolute top-3 right-3 z-10 bg-card rounded-lg shadow-md border border-border p-1 flex flex-col gap-1">
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

        <svg
          ref={svgRef}
          className="w-full h-full touch-none outline-none"
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onContextMenu={(e) => e.preventDefault()}
        >
          <defs>
            <pattern id="grid-mobile" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="0.5" opacity="0.2" />
            </pattern>
          </defs>
          <rect id="background-rect" x="-5000" y="-5000" width="10000" height="10000" fill="#f8fafc" />
          <rect id="workspace-rect" x="0" y="0" width="1200" height="800" fill="white" />
          <rect id="grid-rect" x="0" y="0" width="1200" height="800" fill="url(#grid-mobile)" />
          <image href={planImage} x="50" y="50" width="1100" height="700" opacity="0.9" preserveAspectRatio="none" className="pointer-events-none" />
          {renderZones()}
        </svg>

        {/* Skeleton móvil */}
        {loading && (
          <div className="absolute inset-0 z-20 bg-[#f8fafc] flex flex-col items-center justify-center gap-4">
            <div className="relative w-[90%] h-[200px] rounded-2xl overflow-hidden border border-border bg-white">
              <div className="absolute inset-0 animate-pulse bg-muted/60" />
              <div className="absolute top-6 left-6 w-32 h-16 rounded-lg animate-pulse bg-muted" />
              <div className="absolute top-6 right-8 w-24 h-20 rounded-lg animate-pulse bg-muted delay-75" />
              <div className="absolute bottom-6 left-1/3 w-36 h-14 rounded-lg animate-pulse bg-muted delay-150" />
            </div>
            <p className="text-xs text-muted-foreground animate-pulse">
              Cargando plano…
            </p>
          </div>
        )}

        {/* Empty state móvil */}
        {!loading && !planImage && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3 bg-card/95 border border-border rounded-2xl shadow-lg px-8 py-6 text-center max-w-xs">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                <ImageOff className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="font-semibold text-sm text-foreground">Sin plano cargado</p>
              <p className="text-xs text-muted-foreground">
                No hay un plano del recinto para este evento.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ── Vista desktop (edición completa) ─────────── */}
      <main
        className={`hidden md:block md:flex-1 overflow-hidden relative ${
          tool === 'move'
            ? 'cursor-grab active:cursor-grabbing'
            : tool === 'select'
              ? 'cursor-default'
              : 'cursor-crosshair'
        }`}
      >
        {/* Controles de zoom flotantes */}
        <div className="absolute top-4 left-4 z-10 bg-card rounded-lg shadow-md border border-border p-1 flex flex-col gap-1">
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

          {/* Separador */}
          <div className="h-px bg-border mx-1" />

          {/* Toggle movimiento libre */}
          <button
            onClick={() => setFreeMove((v) => !v)}
            className={`p-1.5 rounded transition flex flex-col items-center gap-0.5 ${
              freeMove
                ? 'bg-[#DD7419]/10 text-[#DD7419] hover:bg-[#DD7419]/20'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            title={freeMove ? 'Bloquear movimiento' : 'Habilitar movimiento libre'}
          >
            {freeMove ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span className="text-[8px] font-semibold leading-none">
              {freeMove ? 'Libre' : 'Bloq.'}
            </span>
          </button>
        </div>

        {/* SVG Canvas desktop */}
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
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="0.5" opacity="0.2" />
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

          {/* Zonas con drag */}
          {zones.map((zone) => {
            const isSelected = selectedId === zone.id;
            const center = getCenter(zone);
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
                <g transform={`translate(${center.x}, ${center.y})`}>
                  <ZoneLabel zone={zone} isSelected={isSelected} />
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

        {/* Skeleton */}
        {loading && (
          <div className="absolute inset-0 z-20 bg-[#f8fafc] flex flex-col items-center justify-center gap-6">
            <div className="relative w-[560px] max-w-[90%] h-[360px] rounded-2xl overflow-hidden border border-border shadow-sm bg-white">
              <div className="absolute inset-0 animate-pulse bg-muted/60" />
              <div className="absolute top-10 left-8 w-40 h-24 rounded-lg animate-pulse bg-muted" />
              <div className="absolute top-10 right-12 w-28 h-32 rounded-lg animate-pulse bg-muted delay-75" />
              <div className="absolute bottom-12 left-1/3 w-48 h-20 rounded-lg animate-pulse bg-muted delay-150" />
              <div className="absolute bottom-8 right-8 w-24 h-16 rounded-lg animate-pulse bg-muted delay-100" />
            </div>
            <p className="text-xs text-muted-foreground animate-pulse">
              Cargando plano del evento…
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !planImage && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="pointer-events-auto flex flex-col items-center gap-4 bg-card/95 backdrop-blur-sm border border-border rounded-2xl shadow-lg px-10 py-8 text-center max-w-xs">
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
    </>
  );
}