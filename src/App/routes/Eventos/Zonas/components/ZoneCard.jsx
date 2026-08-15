import { useState } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Utensils,
  Coffee,
  FileText,
  Shield,
  Crown,
  Trash2,
  Weight,
  Plus,
  ClipboardList,
  History,
  ChevronDown,
  PackageOpen,
  Truck,
  ArrowUpRight,
  Scale,
  Pencil,
  CheckCircle2,
  ImageIcon,
  Loader2,
  X,
} from 'lucide-react';
import { getRequirementSignedUrlService } from '../../services/eventServices';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RoleSectionLabel } from './RoleSectionLabel';
import { SupervisorCard } from './SupervisorCard';
import { CoordinatorCard } from './CoordinatorCard';
import { CollaboratorCard } from './CollaboratorCard';
import { WasteHistoryModal } from './WasteHistoryModal';
import { TruckExitHistoryModal } from './TruckExitHistoryModal';
import { WasteDistributionDeleteDialog } from './WasteDistributionDeleteDialog';

const CATEGORY_STYLE = {
  general:
    'bg-[#234465]/10 text-[#234465] dark:bg-[#234465]/30 dark:text-[#7493B2]',
  acopio:
    'bg-[#DD7419]/10 text-[#DD7419] dark:bg-[#DD7419]/20 dark:text-[#DD7419]',
};

const CATEGORY_LABEL = {
  general: 'Zona general',
  acopio: 'Centro de Acopio',
};

const formatKg = (value) =>
  Number(value ?? 0).toLocaleString('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatUnits = (value) =>
  Number(value ?? 0).toLocaleString('es-CO', {
    maximumFractionDigits: 0,
  });

function MiniStat({ icon: Icon, value, label, color }) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-0">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className={`text-sm font-bold leading-none ${color}`}>{value}</span>
      <span className="text-[9px] text-muted-foreground leading-tight text-center">
        {label}
      </span>
    </div>
  );
}

function RequirementCard({ requirement: r, zoneId }) {
  const [signedUrl, setSignedUrl] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleViewPhoto = async () => {
    setLightboxOpen(true);
    setSignedUrl(null);
    setPhotoLoading(true);
    const res = await getRequirementSignedUrlService(zoneId, r.id);
    setSignedUrl(res.status ? res.url : null);
    setPhotoLoading(false);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setSignedUrl(null);
    setPhotoLoading(false);
  };

  return (
    <>
      <div className="rounded-xl border border-[#234465]/15 bg-[#234465]/5 px-3 py-3">
        <p className="text-sm text-foreground leading-snug">{r.note}</p>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-[11px] text-muted-foreground">
            {r.creator.firstName} {r.creator.lastName}
            {' · '}
            {new Date(r.createdAt).toLocaleString('es-CO', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          {r.photoUrl && (
            <button
              type="button"
              onClick={handleViewPhoto}
              className="flex items-center gap-1 text-[11px] font-semibold text-[#234465] dark:text-[#7493B2] hover:opacity-70 transition shrink-0"
            >
              <ImageIcon className="w-3 h-3" />
              Ver foto
            </button>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/85" onClick={closeLightbox} />
          <div className="relative z-10 w-full max-w-lg mx-4">
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center min-h-48">
              {photoLoading ? (
                <div className="flex flex-col items-center gap-2 py-16 text-white/60">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-xs">Cargando imagen…</span>
                </div>
              ) : signedUrl ? (
                <img
                  src={signedUrl}
                  alt="Foto del requerimiento"
                  className="w-full max-h-[70vh] object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 py-16 text-white/60">
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-xs">No se pudo cargar la imagen</span>
                </div>
              )}
            </div>
            <div className="mt-3 px-1 text-white/70 text-xs">
              <span>{r.note}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ZoneCard({
  zone,
  incidents = {},
  wasteEntries = [],
  wasteLoading = false,
  wasteDistribution,
  wasteDistributionLoading = false,
  truckExits = [],
  truckExitsLoading = false,
  requirements = [],
  requirementsLoading = false,
  onAddRequirement,
  onAddIncident,
  onViewHistory,
  onAddWaste,
  onAddWasteDistribution,
  onEditWasteDistribution,
  onDeleteWasteDistribution,
  onAddTruckExit,
  onTransfer,
}) {
  const [showWasteHistory, setShowWasteHistory] = useState(false);
  const [showTruckExitHistory, setShowTruckExitHistory] = useState(false);
  const [distributionToDelete, setDistributionToDelete] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const collaborators = zone.collaborators ?? [];

  const allPeople = [
    ...(zone.coordinator ? [zone.coordinator] : []),
    ...(zone.supervisor ? [zone.supervisor] : []),
    ...(zone.responsableAcopio ?? []),
    ...collaborators,
  ];

  const staffCount =
    (zone.supervisor ? 1 : 0) +
    (zone.coordinator ? 1 : 0) +
    (zone.responsableAcopio?.length ?? 0) +
    collaborators.length;

  // incidents[userId] must arrive ordered chronologically (oldest → newest)
  const getLatest = (userId) => {
    const arr = incidents[userId] ?? [];
    return arr.length > 0 ? arr[arr.length - 1] : null;
  };

  const activeCount = allPeople.filter((p) => {
    const inc = getLatest(p.userId);
    return !inc || inc.name?.toLowerCase() === 'activo';
  }).length;

  const lunchCount = allPeople.filter((p) => {
    const inc = getLatest(p.userId);
    return inc?.name?.toLowerCase() === 'almuerzo';
  }).length;

  const breakCount = allPeople.filter((p) => {
    const inc = getLatest(p.userId);
    return inc?.name?.toLowerCase() === 'break';
  }).length;

  const inactiveCount = allPeople.filter((p) => {
    const inc = getLatest(p.userId);
    return inc?.name?.toLowerCase() === 'inactivo';
  }).length;

  const totalWasteQty = wasteEntries.reduce(
    (sum, e) => sum + (e.quantity ?? 0),
    0
  );
  const totalWasteKg = wasteEntries.reduce(
    (sum, e) => sum + (e.weightKg ?? 0),
    0
  );
  const hasWasteKg = wasteEntries.some((e) => e.weightKg != null);

  const totalExitQty = truckExits.reduce(
    (sum, e) => sum + (e.quantity ?? 0),
    0
  );
  const totalExitKg = truckExits.reduce((sum, e) => sum + (e.weightKg ?? 0), 0);
  const hasExitKg = truckExits.some((e) => e.weightKg != null);

  const netQty = Math.max(0, totalWasteQty - totalExitQty);
  const netKg = Math.max(0, totalWasteKg - totalExitKg);
  const hasNetKg = hasWasteKg || hasExitKg;

  const distributionSummary = wasteDistribution ?? {
    totalInputKg: totalWasteKg,
    distributedKg: 0,
    remainingKg: totalWasteKg,
    isComplete: false,
    distributions: [],
  };
  const distributionProgress = distributionSummary.totalInputKg > 0
    ? Math.min(100, (distributionSummary.distributedKg / distributionSummary.totalInputKg) * 100)
    : 0;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
      <div className="h-1.5 shrink-0" style={{ backgroundColor: zone.color }} />

      {/* Header — clickable para expandir/colapsar */}
      <div
        className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl shrink-0 shadow-sm ring-1 ring-black/5"
              style={{ backgroundColor: zone.color }}
            />
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-foreground leading-tight truncate">
                {zone.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="font-semibold text-foreground">
                  {staffCount}
                </span>{' '}
                {staffCount === 1 ? 'persona' : 'personas'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col items-end gap-1.5">
              <Badge
                className={`text-xs border-0 font-medium ${
                  CATEGORY_STYLE[zone.category] ?? 'bg-muted text-foreground'
                }`}
              >
                {CATEGORY_LABEL[zone.category] ?? zone.category}
              </Badge>
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-white text-xs font-semibold"
                style={{ backgroundColor: zone.color }}
              >
                <Users className="w-3 h-3" />
                <span>Máx. {zone.maxCapacity}</span>
              </div>
            </div>
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-muted/50">
              <ChevronDown
                className="w-4 h-4 text-muted-foreground transition-transform duration-300"
                style={{
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </div>
          </div>
        </div>

        {zone.notes && !expanded && (
          <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-muted/50">
            <FileText className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1">
              {zone.notes}
            </p>
          </div>
        )}
      </div>

      {/* Vista colapsada — 5 mini stats */}
      {!expanded && (
        <div className="animate-in fade-in duration-150">
          <div className="mx-4 sm:mx-6 border-t border-border mb-3" />
          <div className="px-4 sm:px-6 pb-4">
            <div className="grid grid-cols-5 gap-1.5 bg-muted/30 rounded-2xl px-3 py-3">
              <MiniStat
                icon={Users}
                value={staffCount}
                label="Total"
                color="text-foreground"
              />
              <MiniStat
                icon={UserCheck}
                value={activeCount}
                label="Activos"
                color="text-emerald-600"
              />
              <MiniStat
                icon={Utensils}
                value={lunchCount}
                label="Almuerzo"
                color="text-[#DD7419]"
              />
              <MiniStat
                icon={Coffee}
                value={breakCount}
                label="Break"
                color="text-[#7493B2]"
              />
              <MiniStat
                icon={UserX}
                value={inactiveCount}
                label="Inactivos"
                color="text-slate-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Contenido expandido */}
      {expanded && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="mx-4 sm:mx-6 border-t border-border" />

          {zone.notes && (
            <div className="mx-4 sm:mx-6 mt-4">
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-muted/50">
                <FileText className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {zone.notes}
                </p>
              </div>
            </div>
          )}

          {/* Límites de acopio */}
          {zone.category === 'acopio' &&
            (zone.wasteLimit != null || zone.weightLimit != null) && (
              <>
                <div className="px-4 sm:px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {zone.wasteLimit != null && (
                    <div className="relative overflow-hidden min-h-28 rounded-2xl bg-gradient-to-br from-[#DD7419]/14 via-[#DD7419]/8 to-transparent border border-[#DD7419]/25 px-4 py-3.5 flex flex-col justify-between shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                      <div className="absolute -right-8 -top-10 w-28 h-28 rounded-full bg-[#DD7419]/8" />
                      <div className="relative flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#DD7419]/75">
                            Capacidad máxima
                          </p>
                          <p className="text-sm font-bold text-foreground mt-0.5">
                            Límite de basuras
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-[#DD7419] text-white flex items-center justify-center shadow-sm shadow-[#DD7419]/25">
                          <Trash2 className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="relative flex items-end gap-2 mt-3">
                        <p className="text-4xl font-black tracking-tight tabular-nums text-[#DD7419] leading-[0.85]">
                          {formatUnits(zone.wasteLimit)}
                        </p>
                        <p className="text-xs font-bold text-[#DD7419]/60 pb-0.5">
                          unidades
                        </p>
                      </div>
                    </div>
                  )}
                  {zone.weightLimit != null && (
                    <div className="relative overflow-hidden min-h-28 rounded-2xl bg-gradient-to-br from-[#DD7419]/14 via-[#DD7419]/8 to-transparent border border-[#DD7419]/25 px-4 py-3.5 flex flex-col justify-between shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                      <div className="absolute -right-8 -top-10 w-28 h-28 rounded-full bg-[#DD7419]/8" />
                      <div className="relative flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#DD7419]/75">
                            Capacidad máxima
                          </p>
                          <p className="text-sm font-bold text-foreground mt-0.5">
                            Límite de peso
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-[#DD7419] text-white flex items-center justify-center shadow-sm shadow-[#DD7419]/25">
                          <Weight className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="relative flex items-end gap-2 mt-3">
                        <p className="text-4xl font-black tracking-tight tabular-nums text-[#DD7419] leading-[0.85]">
                          {formatKg(zone.weightLimit)}
                        </p>
                        <p className="text-xs font-bold text-[#DD7419]/60 pb-0.5">
                          kg
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mx-4 sm:mx-6 border-t border-border" />
              </>
            )}

          {/* Conteo de basuras */}
          {zone.category === 'acopio' && (
            <>
              <div className="px-4 sm:px-6 py-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#DD7419]/12 text-[#DD7419] flex items-center justify-center shrink-0">
                      <ClipboardList className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-foreground">
                        Estado del acopio
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        Balance entre ingresos y salidas registradas
                      </p>
                    </div>
                  </div>
                  {onAddWaste && (
                    <button
                      onClick={onAddWaste}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#DD7419] text-white text-xs font-bold hover:bg-[#C96514] hover:-translate-y-0.5 shadow-sm shadow-[#DD7419]/20 transition-all shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Registrar entrada
                    </button>
                  )}
                </div>
                {wasteLoading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[0, 1].map((i) => (
                      <div
                        key={i}
                        className="rounded-xl bg-[#DD7419]/8 border border-[#DD7419]/20 px-4 py-3"
                      >
                        <Skeleton className="h-2.5 w-28 bg-[#DD7419]/20" />
                        <Skeleton className="h-8 w-10 mt-1 bg-[#DD7419]/20" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="relative overflow-hidden min-h-28 rounded-2xl bg-gradient-to-br from-[#DD7419]/14 via-[#DD7419]/7 to-transparent border border-[#DD7419]/25 p-4 flex flex-col justify-between">
                        <div className="absolute -right-7 -bottom-8 w-24 h-24 rounded-full border-[16px] border-[#DD7419]/5" />
                        <div className="relative flex items-center gap-2 text-[#DD7419]">
                          <div className="w-7 h-7 rounded-lg bg-[#DD7419]/15 flex items-center justify-center">
                            <Trash2 className="w-3.5 h-3.5" />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-[0.14em]">
                            Unidades en acopio
                          </p>
                        </div>
                        <div className="relative mt-3">
                          <p className="text-4xl font-black tracking-tight tabular-nums text-[#DD7419] leading-none">
                            {formatUnits(netQty)}
                          </p>
                          <div className="flex items-center gap-1.5 mt-2 text-[11px]">
                            <span className="font-bold text-foreground">
                              {formatUnits(totalWasteQty)}
                            </span>
                            <span className="text-muted-foreground">
                              unidades ingresadas en total
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="relative overflow-hidden min-h-28 rounded-2xl bg-gradient-to-br from-[#DD7419]/14 via-[#DD7419]/7 to-transparent border border-[#DD7419]/25 p-4 flex flex-col justify-between">
                        <div className="absolute -right-7 -bottom-8 w-24 h-24 rounded-full border-[16px] border-[#DD7419]/5" />
                        <div className="relative flex items-center gap-2 text-[#DD7419]">
                          <div className="w-7 h-7 rounded-lg bg-[#DD7419]/15 flex items-center justify-center">
                            <Weight className="w-3.5 h-3.5" />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-[0.14em]">
                            Peso actual en acopio
                          </p>
                        </div>
                        <div className="relative mt-3">
                          <div className="flex items-end gap-1.5">
                            <p className="text-4xl font-black tracking-tight tabular-nums text-[#DD7419] leading-none">
                              {hasNetKg ? formatKg(netKg) : '—'}
                            </p>
                            {hasNetKg && (
                              <span className="text-xs font-black text-[#DD7419]/65 pb-1">
                                kg
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-2 text-[11px]">
                            <span className="font-bold text-foreground">
                              {hasWasteKg ? formatKg(totalWasteKg) : '—'} kg
                            </span>
                            <span className="text-muted-foreground">
                              ingresados en total
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {wasteEntries.length > 0 ? (
                      <button
                        onClick={() => setShowWasteHistory(true)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl border border-[#DD7419]/25 bg-[#DD7419]/5 text-[#DD7419] text-xs font-bold hover:bg-[#DD7419]/10 hover:border-[#DD7419]/45 transition"
                      >
                        <History className="w-3.5 h-3.5" />
                        Ver historial
                        <span className="rounded-full bg-[#DD7419]/12 px-2 py-0.5 tabular-nums">
                          {wasteEntries.length}{' '}
                          {wasteEntries.length === 1 ? 'entrada' : 'entradas'}
                        </span>
                      </button>
                    ) : (
                      <p className="text-xs text-muted-foreground italic text-center py-1">
                        Sin registros aún
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className="mx-4 sm:mx-6 border-t border-border" />
            </>
          )}

          {/* Distribución del peso bruto ingresado */}
          {zone.category === 'acopio' && (
            <>
              <div className="px-4 sm:px-6 py-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[#A6520B] min-w-0">
                    <Scale className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-bold truncate">
                      Distribución de kilogramos
                    </span>
                  </div>
                  {onAddWasteDistribution && (
                    <button
                      onClick={onAddWasteDistribution}
                      disabled={
                        wasteDistributionLoading ||
                        !wasteDistribution ||
                        distributionSummary.remainingKg <= 0
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#A6520B] text-white text-xs font-semibold hover:bg-[#8E4508] transition disabled:opacity-45 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Agregar categoría
                    </button>
                  )}
                </div>

                {wasteDistributionLoading ? (
                  <div className="rounded-xl border border-[#DD7419]/15 p-4 space-y-3">
                    <Skeleton className="h-3 w-40 bg-[#DD7419]/15" />
                    <Skeleton className="h-2 w-full bg-[#DD7419]/15" />
                    <Skeleton className="h-12 w-full bg-[#DD7419]/10" />
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border border-[#DD7419]/20 bg-gradient-to-br from-[#DD7419]/10 via-[#DD7419]/5 to-transparent p-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">
                            Ingresado
                          </p>
                          <p className="text-sm sm:text-base font-black tabular-nums text-foreground mt-0.5">
                            {formatKg(distributionSummary.totalInputKg)}
                            <span className="text-[10px] font-semibold text-muted-foreground ml-0.5">kg</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">
                            Distribuido
                          </p>
                          <p className="text-sm sm:text-base font-black tabular-nums text-[#A6520B] mt-0.5">
                            {formatKg(distributionSummary.distributedKg)}
                            <span className="text-[10px] font-semibold ml-0.5">kg</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">
                            Pendiente
                          </p>
                          <p className="text-sm sm:text-base font-black tabular-nums text-[#DD7419] mt-0.5">
                            {formatKg(distributionSummary.remainingKg)}
                            <span className="text-[10px] font-semibold ml-0.5">kg</span>
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 h-2 rounded-full bg-[#DD7419]/15 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#DD7419] to-[#A6520B] transition-all duration-500"
                          style={{ width: `${distributionProgress}%` }}
                        />
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[10px] font-semibold">
                        <span className="text-muted-foreground">
                          {distributionProgress.toFixed(1)}% clasificado
                        </span>
                        {distributionSummary.isComplete && (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="w-3 h-3" /> Completa
                          </span>
                        )}
                      </div>
                    </div>

                    {distributionSummary.distributions.length > 0 ? (
                      <div
                        className="max-h-[11.5rem] space-y-2 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(221,116,25,0.45)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#DD7419]/35 hover:[&::-webkit-scrollbar-thumb]:bg-[#DD7419]/55"
                        role="list"
                        aria-label="Categorías de la distribución de kilogramos"
                      >
                        {distributionSummary.distributions.map((distribution, index) => (
                          <div
                            key={distribution.id}
                            className="group flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 hover:border-[#DD7419]/30 transition"
                            role="listitem"
                          >
                            <div className="w-7 h-7 rounded-lg bg-[#DD7419]/10 text-[#DD7419] flex items-center justify-center text-[10px] font-black shrink-0">
                              {String(index + 1).padStart(2, '0')}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-foreground truncate">
                                {distribution.category}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Categoría de residuo
                              </p>
                            </div>
                            <p className="text-sm font-black tabular-nums text-[#A6520B] shrink-0">
                              {formatKg(distribution.weightKg)} <span className="text-[10px]">kg</span>
                            </p>
                            {onEditWasteDistribution && onDeleteWasteDistribution && (
                              <div className="flex items-center gap-0.5 shrink-0">
                                <button
                                  onClick={() => onEditWasteDistribution(distribution)}
                                  className="w-7 h-7 rounded-md text-muted-foreground hover:text-[#A6520B] hover:bg-[#DD7419]/10 flex items-center justify-center transition"
                                  aria-label={`Editar ${distribution.category}`}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDistributionToDelete(distribution)}
                                  className="w-7 h-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition"
                                  aria-label={`Eliminar ${distribution.category}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-[#DD7419]/25 px-4 py-5 text-center">
                        <Scale className="w-5 h-5 text-[#DD7419]/45 mx-auto mb-1.5" />
                        <p className="text-xs font-semibold text-muted-foreground">
                          {distributionSummary.totalInputKg > 0
                            ? 'Aún no hay kilogramos distribuidos'
                            : 'Registra peso de entrada para comenzar'}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="mx-4 sm:mx-6 border-t border-border" />
            </>
          )}

          {/* Salidas de camión */}
          {zone.category === 'acopio' && (
            <>
              <div className="px-4 sm:px-6 py-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#0891B2]/12 text-[#0891B2] flex items-center justify-center shrink-0">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-foreground">
                        Salidas de camión
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        Material retirado del centro de acopio
                      </p>
                    </div>
                  </div>
                  {onAddTruckExit && (
                    <button
                      onClick={onAddTruckExit}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0891B2] text-white text-xs font-bold hover:bg-[#077C98] hover:-translate-y-0.5 shadow-sm shadow-[#0891B2]/20 transition-all shrink-0"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      Registrar salida
                    </button>
                  )}
                </div>
                {truckExitsLoading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[0, 1].map((i) => (
                      <div
                        key={i}
                        className="rounded-xl bg-[#0891B2]/8 border border-[#0891B2]/20 px-4 py-3"
                      >
                        <Skeleton className="h-2.5 w-28 bg-[#0891B2]/20" />
                        <Skeleton className="h-8 w-10 mt-1 bg-[#0891B2]/20" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="relative overflow-hidden min-h-[5.75rem] rounded-2xl bg-gradient-to-br from-[#0891B2]/14 via-[#0891B2]/7 to-transparent border border-[#0891B2]/25 px-4 py-3.5 flex flex-col justify-between">
                        <div className="absolute -right-6 -bottom-9 w-24 h-24 rounded-full border-[16px] border-[#0891B2]/5" />
                        <div className="relative flex items-center gap-2 text-[#0891B2]">
                          <div className="w-6 h-6 rounded-md bg-[#0891B2]/14 flex items-center justify-center">
                            <PackageOpen className="w-3 h-3" />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-[0.14em]">
                            Total retirado
                          </p>
                        </div>
                        <div className="relative flex items-end gap-1.5 mt-2">
                          <p className="text-4xl font-black tracking-tight tabular-nums text-[#0891B2] leading-none">
                            {formatUnits(totalExitQty)}
                          </p>
                          <span className="text-[10px] font-bold text-[#0891B2]/60 pb-0.5">
                            bolsas
                          </span>
                        </div>
                      </div>
                      <div className="relative overflow-hidden min-h-[5.75rem] rounded-2xl bg-gradient-to-br from-[#0891B2]/14 via-[#0891B2]/7 to-transparent border border-[#0891B2]/25 px-4 py-3.5 flex flex-col justify-between">
                        <div className="absolute -right-6 -bottom-9 w-24 h-24 rounded-full border-[16px] border-[#0891B2]/5" />
                        <div className="relative flex items-center gap-2 text-[#0891B2]">
                          <div className="w-6 h-6 rounded-md bg-[#0891B2]/14 flex items-center justify-center">
                            <Weight className="w-3 h-3" />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-[0.14em]">
                            Peso retirado
                          </p>
                        </div>
                        <div className="relative flex items-end gap-1.5 mt-2">
                          <p className="text-4xl font-black tracking-tight tabular-nums text-[#0891B2] leading-none">
                            {hasExitKg ? formatKg(totalExitKg) : '—'}
                          </p>
                          {hasExitKg && (
                            <span className="text-[10px] font-bold text-[#0891B2]/60 pb-0.5">
                              kg
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {truckExits.length > 0 ? (
                      <button
                        onClick={() => setShowTruckExitHistory(true)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-[#0891B2]/25 bg-[#0891B2]/5 text-[#0891B2] text-xs font-bold hover:bg-[#0891B2]/10 hover:border-[#0891B2]/45 transition"
                      >
                        <History className="w-3.5 h-3.5" />
                        Ver historial
                        <span className="rounded-full bg-[#0891B2]/12 px-2 py-0.5 tabular-nums">
                          {truckExits.length}{' '}
                          {truckExits.length === 1 ? 'salida' : 'salidas'}
                        </span>
                      </button>
                    ) : (
                      <p className="text-xs text-muted-foreground italic text-center py-1">
                        Sin salidas registradas aún
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className="mx-4 sm:mx-6 border-t border-border" />
            </>
          )}

          {/* Requerimientos — solo zonas generales */}
          {zone.category === 'general' && (
            <>
              <div className="px-4 sm:px-6 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#234465]">
                    <ClipboardList className="w-4 h-4" />
                    <span className="text-sm font-bold">Requerimientos</span>
                    {requirements.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#234465]/10 text-[#234465]">
                        {requirements.length}
                      </span>
                    )}
                  </div>
                  {onAddRequirement && (
                  <button
                    onClick={onAddRequirement}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#234465] text-white text-xs font-semibold hover:bg-[#234465]/85 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar
                  </button>
                  )}
                </div>

                {requirementsLoading ? (
                  <div className="space-y-2">
                    {[0, 1].map((i) => (
                      <div key={i} className="rounded-xl border border-border px-3 py-3">
                        <Skeleton className="h-3 w-3/4 mb-2" />
                        <Skeleton className="h-2.5 w-1/3" />
                      </div>
                    ))}
                  </div>
                ) : requirements.length > 0 ? (
                  <div className="space-y-2">
                    {requirements.map((r) => (
                      <RequirementCard key={r.id} requirement={r} zoneId={zone.id} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic text-center py-1">
                    Sin requerimientos aún
                  </p>
                )}
              </div>
              <div className="mx-4 sm:mx-6 border-t border-border" />
            </>
          )}

          {/* Personal — jerarquía */}
          <div className="px-4 sm:px-6 py-5 flex-1 space-y-5">
            {zone.coordinator && (
              <div>
                <RoleSectionLabel
                  icon={Crown}
                  label="Coordinador"
                  sublabel="Nivel superior · Supervisa múltiples zonas"
                  colorClass="text-[#DD7419]"
                />
                <CoordinatorCard
                  person={zone.coordinator}
                  incident={getLatest(zone.coordinator.userId)}
                  onAddIncident={onAddIncident ? () => onAddIncident(zone.coordinator) : undefined}
                  onViewHistory={() => onViewHistory(zone.coordinator)}
                />
              </div>
            )}

            {zone.supervisor && (
              <div>
                <RoleSectionLabel
                  icon={Shield}
                  label="Supervisor de Zona"
                  sublabel="Responsable únicamente de su zona asignada"
                  colorClass="text-[#7493B2]"
                />
                <SupervisorCard
                  person={zone.supervisor}
                  zoneColor={zone.color}
                  incident={getLatest(zone.supervisor.userId)}
                  onAddIncident={onAddIncident ? () => onAddIncident(zone.supervisor) : undefined}
                  onViewHistory={() => onViewHistory(zone.supervisor)}
                />
              </div>
            )}

            {zone.category === 'acopio' &&
              zone.responsableAcopio?.length > 0 && (
                <div>
                  <RoleSectionLabel
                    icon={PackageOpen}
                    label="Responsable de Acopio"
                    sublabel="Acceso únicamente a su centro de acopio"
                    count={zone.responsableAcopio.length}
                    colorClass="text-[#DD7419]"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {zone.responsableAcopio.map((r) => (
                      <CollaboratorCard
                        key={r.userId}
                        person={r}
                        incident={getLatest(r.userId)}
                        onAddIncident={onAddIncident ? () => onAddIncident(r) : undefined}
                        onViewHistory={() => onViewHistory(r)}
                      />
                    ))}
                  </div>
                </div>
              )}

            {collaborators.length > 0 && (
              <div>
                <RoleSectionLabel
                  icon={Users}
                  label="Colaboradores"
                  sublabel="Personal operativo de la zona"
                  count={collaborators.length}
                  colorClass="text-[#7493B2]"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {collaborators.map((c) => (
                    <CollaboratorCard
                      key={c.userId}
                      person={c}
                      incident={getLatest(c.userId)}
                      onAddIncident={onAddIncident ? () => onAddIncident(c) : undefined}
                      onViewHistory={() => onViewHistory(c)}
                      onTransfer={
                        onTransfer ? () => onTransfer(c, zone.id) : undefined
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {staffCount === 0 && (
              <p className="text-sm text-muted-foreground italic">
                Sin personal asignado
              </p>
            )}
          </div>
        </div>
      )}

      <WasteHistoryModal
        open={showWasteHistory}
        onClose={() => setShowWasteHistory(false)}
        zone={zone}
        entries={wasteEntries}
      />

      <TruckExitHistoryModal
        open={showTruckExitHistory}
        onClose={() => setShowTruckExitHistory(false)}
        zone={zone}
        exits={truckExits}
      />

      <WasteDistributionDeleteDialog
        open={distributionToDelete !== null}
        onClose={() => setDistributionToDelete(null)}
        distribution={distributionToDelete}
        onConfirm={(distribution) =>
          onDeleteWasteDistribution(distribution.id)
        }
      />
    </div>
  );
}
