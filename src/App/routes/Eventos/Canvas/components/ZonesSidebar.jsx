import {
  FileImage,
  Hexagon,
  Layers,
  Loader2,
  MapPin,
  Move,
  MousePointer2,
  Package,
  RefreshCw,
  Square,
  Upload,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { ZoneAccordionItem } from './ZoneAccordionItem';
import { ZoneDetailModal } from './ZoneDetailModal';

export function ZonesSidebar({
  isOpen,
  tool,
  zones,
  selectedId,
  isAdmin,
  polyPoints,
  pendingFile,
  uploadingPlan,
  uploadError,
  hasPlan,
  onToolChange,
  onFinishPolygon,
  onSelectPlan,
  onUploadPlan,
  onCancelPending,
  onSelectZone,
  onUpdateZone,
  onAddPeople,
  onRemovePerson,
  onDeleteRequest,
}) {
  const [detailZoneId, setDetailZoneId] = useState(null);
  const generalZones = zones.filter((z) => z.category !== 'acopio');
  const acopioZones  = zones.filter((z) => z.category === 'acopio');
  const detailZone = zones.find((z) => z.id === detailZoneId);

  // Calcular todos los IDs de personas asignadas en TODAS las zonas del evento
  // Para evitar que una persona esté en múltiples zonas
  const allAssignedPeopleIds = new Set();
  zones.forEach((zone) => {
    zone.people.forEach((person) => {
      allAssignedPeopleIds.add(person.id);
    });
  });

  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Seleccionar', adminOnly: false },
    { id: 'move',   icon: Move,          label: 'Mover',       adminOnly: false },
    { id: 'rect',   icon: Square,        label: 'Rec',         adminOnly: true  },
    { id: 'poly',   icon: Hexagon,       label: 'Ply',         adminOnly: true  },
  ].filter((t) => !t.adminOnly || isAdmin);

  return (
    <>
      {/* Modal de detalles */}
      {detailZone && (
        <ZoneDetailModal
          zone={detailZone}
          zones={zones}
          isAdmin={isAdmin}
          allAssignedPeopleIds={allAssignedPeopleIds}
          onUpdate={onUpdateZone}
          onAddPeople={onAddPeople}
          onRemovePerson={onRemovePerson}
          onDeleteRequest={onDeleteRequest}
          onClose={() => setDetailZoneId(null)}
        />
      )}

      <aside
        className={`shrink-0 flex flex-col border-l border-border bg-white transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'w-80' : 'w-0'
        }`}
      >
        <div className="w-80 flex flex-col h-full overflow-y-auto">
        {/* Título */}
        <div className="px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#234465]/10 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-[#234465]" />
            </div>
            <h2 className="text-sm font-bold text-foreground">Panel de control de zonas</h2>
          </div>
        </div>

        {/* Herramientas */}
        <div className="px-4 py-4 border-b border-border space-y-3 shrink-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
            Herramientas
          </p>

          <div className="grid grid-cols-2 gap-2">
            {tools.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => {
                  if (hasPlan) onToolChange(id);
                }}
                disabled={!hasPlan}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border py-4 px-2 transition-colors group ${
                  !hasPlan
                    ? 'opacity-40 cursor-not-allowed border-border bg-muted/20 text-muted-foreground'
                    : tool === id
                    ? 'bg-[#234465]/10 border-[#234465]/50 text-[#234465]'
                    : 'border-border bg-muted/40 hover:bg-[#234465]/5 hover:border-[#234465]/30 text-muted-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-medium leading-none">{label}</span>
              </button>
            ))}
          </div>

          {/* Mensaje cuando no hay plano */}
          {!hasPlan && (
            <div className="rounded-xl bg-muted/40 border border-border p-3">
              <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
                Las herramientas están deshabilitadas. Carga un plano para poder crear zonas.
              </p>
            </div>
          )}

          {/* Finalizar polígono */}
          {isAdmin && tool === 'poly' && polyPoints.length > 0 && (
            <div className="rounded-xl bg-[#234465]/5 border border-[#234465]/20 p-3 space-y-2">
              <button
                onClick={onFinishPolygon}
                className="w-full bg-[#234465] text-white text-sm py-2 rounded-lg font-medium hover:bg-[#234465]/90 transition"
              >
                Finalizar polígono ({polyPoints.length} pts)
              </button>
              <p className="text-[10px] text-center text-[#234465]/60">
                O doble clic en el canvas para cerrar
              </p>
            </div>
          )}

          {/* Plano */}
          {isAdmin && <PlanUploadSection
            pendingFile={pendingFile}
            uploadingPlan={uploadingPlan}
            uploadError={uploadError}
            hasPlan={hasPlan}
            onSelectPlan={onSelectPlan}
            onUploadPlan={onUploadPlan}
            onCancelPending={onCancelPending}
          />}
        </div>

        {/* Panel de zonas */}
        <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
          {/* Zonas generales */}
          <ZoneSection
            title="Zonas generales"
            count={generalZones.length}
            color="#234465"
            icon={<MapPin className="w-3 h-3 text-white" />}
            emptyLabel="Sin zonas registradas"
          >
            {generalZones.map((zone) => (
              <ZoneAccordionItem
                key={zone.id}
                zone={zone}
                isSelected={selectedId === zone.id}
                onSelect={onSelectZone}
                onViewDetails={setDetailZoneId}
              />
            ))}
          </ZoneSection>

          {/* Centros de acopio */}
          <ZoneSection
            title="Centros de acopio"
            count={acopioZones.length}
            color="#DD7419"
            icon={<Package className="w-3 h-3 text-white" />}
            emptyLabel="Sin centros registrados"
          >
            {acopioZones.map((zone) => (
              <ZoneAccordionItem
                key={zone.id}
                zone={zone}
                isSelected={selectedId === zone.id}
                onSelect={onSelectZone}
                onViewDetails={setDetailZoneId}
              />
            ))}
          </ZoneSection>
        </div>
      </div>
    </aside>
    </>
  );
}

/* ── Subcomponente: sección de carga de plano ────────────── */
function PlanUploadSection({
  pendingFile,
  uploadingPlan,
  uploadError,
  hasPlan,
  onSelectPlan,
  onUploadPlan,
  onCancelPending,
}) {
  // Estado 1: ningún archivo seleccionado
  if (!pendingFile) {
    return (
      <div className="space-y-1.5">
        <button
          onClick={onSelectPlan}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#DD7419]/50 bg-[#DD7419]/5 hover:bg-[#DD7419]/10 hover:border-[#DD7419] transition-colors py-3 px-4"
        >
          {hasPlan ? (
            <RefreshCw className="w-4 h-4 text-[#DD7419]" />
          ) : (
            <Upload className="w-4 h-4 text-[#DD7419]" />
          )}
          <span className="text-sm font-medium text-[#DD7419]">
            {hasPlan ? 'Cambiar plano' : 'Seleccionar plano'}
          </span>
        </button>
      </div>
    );
  }

  // Estado 2: archivo seleccionado, pendiente de subir
  return (
    <div className="space-y-2">
      {/* Info del archivo */}
      <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2">
        <FileImage className="w-4 h-4 text-[#DD7419] shrink-0" />
        <span className="text-xs text-foreground truncate flex-1">{pendingFile.name}</span>
        <button
          onClick={onCancelPending}
          disabled={uploadingPlan}
          className="text-muted-foreground hover:text-destructive transition shrink-0 disabled:opacity-40"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Error */}
      {uploadError && (
        <p className="text-[10px] text-destructive px-1">{uploadError}</p>
      )}

      {/* Botón subir (habilitado) */}
      <button
        onClick={onUploadPlan}
        disabled={uploadingPlan}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#DD7419] hover:bg-[#DD7419]/90 text-white py-3 px-4 text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {uploadingPlan ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Subiendo...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Subir plano
          </>
        )}
      </button>
    </div>
  );
}

/* ── Subcomponente interno: sección de zona con header ─── */
function ZoneSection({ title, count, color, icon, emptyLabel, children }) {
  const hasItems = count > 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center"
            style={{ backgroundColor: color }}
          >
            {icon}
          </div>
          <p className="text-xs font-semibold text-foreground">{title}</p>
        </div>
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: `${color}1a`, color }}
        >
          {count}
        </span>
      </div>
      <div className="space-y-2">
        {hasItems ? (
          children
        ) : (
          <p className="text-xs text-muted-foreground italic px-1">{emptyLabel}</p>
        )}
      </div>
    </div>
  );
}
