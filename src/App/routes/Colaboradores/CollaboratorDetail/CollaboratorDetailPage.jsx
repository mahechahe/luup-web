import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Briefcase,
  Building2,
  Camera,
  FileText,
  Heart,
  ImageIcon,
  LogIn,
  LogOut,
  MapPin,
  Package,
  Phone,
  Pill,
  Shirt,
  Star,
  TrendingUp,
  Upload,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  UserCheck,
  HardHat,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  getCollaboratorDetailService,
  updateCollaboratorPhotoService,
  getCollaboratorRatingSummaryService,
  getCollaboratorRatingHistoryService,
} from '../services/collaboratorServices';
import { CollaboratorMovementsModal } from './modal/CollaboratorMovementsModal';

/* ── Helpers ─────────────────────────────────────────────── */
function formatDate(iso) {
  if (!iso) return '—';
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(iso);
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function genderLabel(gender) {
  const map = { male: 'Masculino', female: 'Femenino', other: 'Otro' };
  return map[gender] ?? '—';
}

/* ── Role name translation ───────────────────────────────── */
const ROLE_NAME_MAP = {
  CLIENT: 'Cliente',
  ADMIN: 'Admin',
  WORKER: 'Colaborador',
  SUPER_ADMIN: 'Super Admin',
};

function displayRoleName(roleName) {
  if (!roleName) return null;
  return ROLE_NAME_MAP[roleName.toUpperCase()] ?? roleName;
}

/* ── Service type config ─────────────────────────────────── */
const SERVICE_TYPE_CONFIG = {
  aseo: {
    label: 'Aseo',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
  },
  residuos: {
    label: 'Residuos',
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60',
  },
  integral: {
    label: 'Integral',
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60',
  },
};

/* ── Role badge ───────────────────────────────────────────── */
const ROLE_CONFIG = {
  coordinator: {
    label: 'Coordinador',
    icon: ShieldCheck,
    className:
      'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60',
  },
  supervisor: {
    label: 'Supervisor',
    icon: UserCheck,
    className:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
  },
  worker: {
    label: 'Colaborador',
    icon: HardHat,
    className:
      'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
};

function RoleBadge({ role }) {
  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.worker;
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

/* ── Skeleton ────────────────────────────────────────────── */
function Skeleton({ className }) {
  return (
    <div className={`animate-pulse bg-muted rounded-md ${className ?? ''}`} />
  );
}

function HeroSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-24 rounded-2xl" />
      <div className="px-1 space-y-3">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-36" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-36" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Detail field ────────────────────────────────────────── */
function DetailField({ label, value, fullWidth }) {
  return (
    <div className={`space-y-1 min-w-0 ${fullWidth ? 'col-span-full' : ''}`}>
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
        {label}
      </p>
      <p className="text-sm text-foreground font-medium break-all leading-relaxed">
        {value ?? '—'}
      </p>
    </div>
  );
}

/* ── Section card ────────────────────────────────────────── */
function Section({ icon: Icon, title, children }) {
  return (
    <Card className="gap-0 overflow-hidden border-border p-0 shadow-sm">
      <CardHeader className="border-b border-border bg-muted/30 px-5 pt-4 [.border-b]:pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
            <Icon className="w-3.5 h-3.5 text-brand" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 py-5">{children}</CardContent>
    </Card>
  );
}

/* ── Inline chip ─────────────────────────────────────────── */
function Chip({ label, value, positive, negative }) {
  const base = 'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border';
  if (value === true)
    return <span className={`${base} ${positive ?? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60'}`}><CheckCircle2 className="w-3 h-3" />{label}</span>;
  if (value === false)
    return <span className={`${base} ${negative ?? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/60'}`}><XCircle className="w-3 h-3" />Sin {label.toLowerCase()}</span>;
  return null;
}

/* ── Event history card ──────────────────────────────────── */
function EventHistoryCard({ event, onViewMovements }) {
  const [open, setOpen] = useState(false);

  const attendedKey = event.attended === true ? 'true' : event.attended === false ? 'false' : 'null';
  const attendedConfig = {
    true:  { icon: CheckCircle2, label: 'Asistió',    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60', accentClass: 'border-l-emerald-500' },
    false: { icon: XCircle,      label: 'No asistió', badgeClass: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/60',                         accentClass: 'border-l-red-500' },
    null:  { icon: Clock,        label: 'Pendiente',  badgeClass: 'bg-muted text-muted-foreground border-border',                                                                               accentClass: 'border-l-muted-foreground/30' },
  };
  const att = attendedConfig[attendedKey];
  const AttIcon = att.icon;

  const hasRecords = event.attendanceRecords?.length > 0;
  const hasInventory = event.inventoryItems?.length > 0;
  const hasIncidents = event.incidents?.length > 0;

  return (
    <div className={`rounded-xl border border-border bg-card overflow-hidden border-l-4 ${att.accentClass}`}>
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-3 px-4 py-3.5 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0 mt-0.5">
            <Calendar className="w-4 h-4 text-brand" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{event.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {event.location ?? '—'} · {formatDate(event.date ?? event.startDate)}
            </p>
            <div className="mt-1.5 sm:hidden"><RoleBadge role={event.role} /></div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-flex"><RoleBadge role={event.role} /></span>
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${att.badgeClass}`}>
            <AttIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{att.label}</span>
          </span>
          {event.locationPingsCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onViewMovements(event); }}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border bg-brand/10 text-brand border-brand/20 hover:bg-brand/20 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver movimientos</span>
            </button>
          )}
          <span className={`text-muted-foreground text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </button>

      {/* Expanded */}
      {open && (
        <div className="border-t border-border divide-y divide-border">

          {/* ── Registros de asistencia ── */}
          {hasRecords && (
            <div className="px-4 py-4 space-y-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Registros de asistencia ({event.attendanceRecords.length})
              </p>
              {event.attendanceRecords.map((rec) => (
                <div key={rec.id} className="rounded-lg bg-muted/40 border border-border p-3 space-y-3">
                  {/* Date + times */}
                  <div className="flex items-center gap-4 flex-wrap">
                    {rec.dateRegister && (
                      <span className="text-xs font-semibold text-foreground">
                        {formatDate(rec.dateRegister)}
                      </span>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <LogIn className="w-3.5 h-3.5" />
                        {formatTime(rec.entryTime)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <LogOut className="w-3.5 h-3.5" />
                        {formatTime(rec.exitTime)}
                      </span>
                    </div>
                  </div>
                  {/* Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    <Chip label="Uniforme" value={rec.uniform} />
                    {rec.uniform && rec.uniformSize && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-muted text-muted-foreground border-border">
                        <Shirt className="w-3 h-3" />Talla {rec.uniformSize}
                      </span>
                    )}
                    {rec.uniform && rec.returnedUniform === true && <Chip label="Devolvió uniforme" value={true} />}
                    {rec.uniform && rec.returnedUniform === false && <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60"><XCircle className="w-3 h-3" />No devolvió uniforme</span>}
                    <Chip label="Snack" value={rec.receivedSnack} />
                    <Chip label="Almuerzo" value={rec.receivedLunch} />
                    <Chip label="Maletín" value={rec.receivedSuitcase} />
                  </div>
                  {rec.snackDetail && (
                    <p className="text-xs text-muted-foreground">Snack: {rec.snackDetail}</p>
                  )}
                  {rec.notes && (
                    <p className="text-xs text-muted-foreground italic">"{rec.notes}"</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Inventario ── */}
          {hasInventory && (
            <div className="px-4 py-4 space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                Inventario asignado ({event.inventoryItems.length})
              </p>
              {event.inventoryItems.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg bg-muted/40 border border-border px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">{item.name}</p>
                    {item.description && <p className="text-[11px] text-muted-foreground mt-0.5">{item.description}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                      {item.quantity} asig.
                    </span>
                    {item.returnedQuantity > 0 && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
                        {item.returnedQuantity} dev.
                      </span>
                    )}
                    {item.usedQuantity > 0 && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60">
                        {item.usedQuantity} usado
                      </span>
                    )}
                    {item.damagedQuantity > 0 && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/60">
                        {item.damagedQuantity} dañado
                      </span>
                    )}
                    {item.pendingQuantity > 0 && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60">
                        {item.pendingQuantity} pendiente
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Incidencias ── */}
          <div className="px-4 py-4 space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Incidencias {hasIncidents ? `(${event.incidents.length})` : ''}
            </p>
            {hasIncidents ? (
              event.incidents.map((inc) => (
                <div key={inc.id} className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-muted/50 border border-border text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand mt-1 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-semibold text-foreground">{inc.name}</span>
                    {inc.time && <span className="text-muted-foreground ml-1.5">· {inc.time}</span>}
                    {inc.note && <p className="text-muted-foreground mt-0.5">{inc.note}</p>}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">Sin incidencias registradas.</p>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

/* ── Photo preview modal ─────────────────────────────────── */
function PhotoPreviewModal({ preview, uploading, error, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-base text-foreground">Confirmar foto</h3>
          <button
            onClick={onCancel}
            disabled={uploading}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="aspect-square rounded-xl overflow-hidden bg-muted ring-1 ring-border">
            <img
              src={preview.previewUrl}
              alt="Vista previa"
              className="w-full h-full object-cover"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive font-medium">{error}</p>
            </div>
          )}
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <button
              onClick={onConfirm}
              disabled={uploading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium bg-brand text-white hover:bg-brand/90 transition-colors px-4 py-2 disabled:opacity-70"
            >
              {uploading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Subiendo…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Subir foto
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Photo lightbox ──────────────────────────────────────── */
function PhotoLightbox({ src, name, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-colors"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      <div
        className="relative flex flex-col items-center gap-3 max-w-[90vw] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={name}
          className="rounded-2xl shadow-2xl object-contain max-w-full max-h-[80vh]"
        />
        {name && (
          <p className="text-white/80 text-sm font-medium tracking-wide">{name}</p>
        )}
      </div>
    </div>
  );
}

/* ── Avatar with photo upload menu ──────────────────────── */
function CollaboratorAvatar({ collaborator, onPhotoUpdate }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const cameraRef = useRef(null);
  const fileRef = useRef(null);

  const initials = `${collaborator.firstName?.[0] ?? ''}${collaborator.lastName?.[0] ?? ''}`.toUpperCase();

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview({ file, previewUrl });
    setUploadError(null);
    e.target.value = '';
  };

  const handleCancel = () => {
    if (photoPreview?.previewUrl) URL.revokeObjectURL(photoPreview.previewUrl);
    setPhotoPreview(null);
    setUploadError(null);
  };

  const handleConfirm = async () => {
    if (!photoPreview) return;
    setUploading(true);
    setUploadError(null);
    const result = await updateCollaboratorPhotoService(
      collaborator.userId,
      photoPreview.file
    );
    if (result.status) {
      URL.revokeObjectURL(photoPreview.previewUrl);
      setPhotoPreview(null);
      onPhotoUpdate(result.photoUrl);
    } else {
      setUploadError(result.errors || 'Error al subir la foto.');
    }
    setUploading(false);
  };

  return (
    <>
      <div className="relative shrink-0">
        {/* Avatar */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-background shadow-lg overflow-hidden bg-brand flex items-center justify-center">
          {collaborator.photoUrl ? (
            <button
              onClick={() => setShowLightbox(true)}
              className="w-full h-full focus:outline-none"
              title="Ver foto"
            >
              <img
                src={collaborator.photoUrl}
                alt={`${collaborator.firstName} ${collaborator.lastName}`}
                className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-zoom-in"
              />
            </button>
          ) : (
            <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {initials}
            </span>
          )}
        </div>

        <Popover open={showMenu} onOpenChange={setShowMenu}>
          <PopoverTrigger asChild>
            <button
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background shadow-md transition-colors hover:bg-muted"
              title="Cambiar foto"
              aria-label="Cambiar foto del colaborador"
            >
              <Camera className="h-3.5 w-3.5 text-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={8}
            className="w-48 overflow-hidden rounded-xl p-0 shadow-xl"
          >
            <button
              onClick={() => {
                cameraRef.current?.click();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-muted transition-colors text-left text-foreground"
            >
              <Camera className="w-4 h-4 text-muted-foreground" />
              Tomar foto
            </button>
            <div className="h-px bg-border mx-3" />
            <button
              onClick={() => {
                fileRef.current?.click();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-muted transition-colors text-left text-foreground"
            >
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
              Cargar imagen
            </button>
          </PopoverContent>
        </Popover>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Lightbox */}
      {showLightbox && collaborator.photoUrl && (
        <PhotoLightbox
          src={collaborator.photoUrl}
          name={`${collaborator.firstName} ${collaborator.lastName}`}
          onClose={() => setShowLightbox(false)}
        />
      )}

      {/* Preview modal */}
      {photoPreview && (
        <PhotoPreviewModal
          preview={photoPreview}
          uploading={uploading}
          error={uploadError}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}

/* ── Star display (read-only) ─────────────────────────────── */
function StarDisplay({ value, max = 5, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const percentage = Math.max(0, Math.min(100, ((value ?? 0) / max) * 100));
  const stars = Array.from({ length: max });
  return (
    <div
      className="relative inline-flex shrink-0"
      aria-label={`${Number(value ?? 0).toFixed(1)} de ${max} estrellas`}
    >
      <div className="flex items-center gap-1">
        {stars.map((_, i) => (
          <Star key={i} className={`${sizeClass} shrink-0 fill-transparent text-muted-foreground/30`} />
        ))}
      </div>
      <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${percentage}%` }}>
        <div className="flex w-max items-center gap-1">
          {stars.map((_, i) => (
            <Star key={i} className={`${sizeClass} shrink-0 fill-amber-400 text-amber-400`} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Rating summary section ──────────────────────────────── */
function RatingsSection({ collaboratorId }) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!collaboratorId) return;
    Promise.all([
      getCollaboratorRatingSummaryService(collaboratorId),
      getCollaboratorRatingHistoryService(collaboratorId, { page: 1, limit: 50 }),
    ]).then(([summaryRes, historyRes]) => {
      setSummary(summaryRes.summary);
      setRatings(historyRes.ratings ?? []);
      setLoading(false);
    });
  }, [collaboratorId]);

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="h-24 bg-muted rounded-xl" />
        <div className="h-16 bg-muted rounded-xl" />
      </div>
    );
  }

  const totalRatings = summary?.totalRatings ?? 0;
  const overallAvg = summary?.overallAverage ?? null;
  const criteriaAvgs = summary?.criteriaAverages ?? [];
  const visibleRatings = showAll ? ratings : ratings.slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Overall summary card */}
      <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 px-5 py-4">
        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-900/20">
          <span className="text-2xl font-black text-amber-500 leading-none">
            {overallAvg !== null ? overallAvg.toFixed(1) : '—'}
          </span>
          <span className="text-[10px] font-semibold text-amber-400 mt-0.5">/ 5</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Calificación histórica</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalRatings > 0
              ? `Basada en ${totalRatings} calificación${totalRatings > 1 ? 'es' : ''}`
              : 'Sin calificaciones registradas aún'}
          </p>
          <div className="mt-2">
            <StarDisplay value={overallAvg ?? 0} />
          </div>
        </div>
      </div>

      {/* Per-criterion breakdown */}
      {criteriaAvgs.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
            Desglose por criterio
          </p>
          {criteriaAvgs.map((c) => (
            <div key={c.criterionId} className="flex items-center gap-3">
              <span className="text-xs text-foreground min-w-0 flex-1 truncate">
                {c.criterionName}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-24 h-1.5 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: `${((c.average ?? 0) / 5) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-amber-500 w-6 text-right">
                  {(c.average ?? 0).toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History list */}
      {ratings.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
            Historial por evento
          </p>
          {visibleRatings.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {r.eventName}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {r.eventLocation ?? ''}
                  {r.dateRegister ? ` · ${r.dateRegister}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StarDisplay value={r.overallScore ?? 0} size="sm" />
                <span className="text-xs font-bold text-amber-500">
                  {r.overallScore !== null ? r.overallScore.toFixed(1) : '—'}
                </span>
              </div>
            </div>
          ))}
          {ratings.length > 3 && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="w-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-1.5"
            >
              {showAll ? 'Ver menos' : `Ver ${ratings.length - 3} más`}
            </button>
          )}
        </div>
      )}

      {totalRatings === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
          <Star className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Sin calificaciones registradas.</p>
        </div>
      )}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────── */
function CollaboratorDetailPage() {
  const { collaboratorId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [collaborator, setCollaborator] = useState(null);
  const [error, setError] = useState(null);
  const [movementsTarget, setMovementsTarget] = useState(null);

  useEffect(() => {
    setLoading(true);
    getCollaboratorDetailService(collaboratorId).then((res) => {
      if (res.status) {
        setCollaborator(res.collaborator);
      } else {
        setError(res.errors ?? 'No se pudo cargar el colaborador.');
      }
      setLoading(false);
    });
  }, [collaboratorId]);

  if (!loading && error) {
    return (
      <div className="min-h-screen bg-background px-4 py-6 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Error al cargar el colaborador</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate('/colaboradores')}
          >
            <ArrowLeft className="w-4 h-4" />
            Ir para atrás
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <div className="px-4 pt-5 pb-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
            onClick={() => navigate('/colaboradores')}
          >
            <ArrowLeft className="w-4 h-4" />
            Colaboradores
          </Button>
        </div>

        {loading ? (
          <div className="px-4">
            <HeroSkeleton />
          </div>
        ) : (
          collaborator && (
            <>
              {/* ── Hero card ── */}
              <div className="px-4 mb-5">
                <div className="rounded-2xl border border-border overflow-hidden shadow-sm bg-card">
                  {/* Gradient banner */}
                  <div className="h-24 bg-gradient-to-br from-brand/25 via-brand/10 to-brand/5 relative overflow-hidden">
                    <div
                      className="absolute inset-0 opacity-[0.07]"
                      style={{
                        backgroundImage:
                          'radial-gradient(circle, currentColor 1px, transparent 1px)',
                        backgroundSize: '18px 18px',
                      }}
                    />
                  </div>

                  {/* Avatar + identity */}
                  <div className="px-5 pb-5">
                    <div className="flex items-end gap-4 -mt-10 mb-4">
                      <CollaboratorAvatar
                        collaborator={collaborator}
                        onPhotoUpdate={(url) =>
                          setCollaborator((prev) => ({ ...prev, photoUrl: url }))
                        }
                      />
                      <div className="mb-1 ml-auto">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            collaborator.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60'
                              : 'bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${collaborator.isActive ? 'bg-emerald-500' : 'bg-muted-foreground'}`}
                          />
                          {collaborator.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                        {collaborator.firstName} {collaborator.lastName}
                      </h1>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-xs font-semibold px-2 py-0.5"
                        >
                          {collaborator.typeDocument?.code ?? '—'} {collaborator.cedula}
                        </Badge>
                        {collaborator.roleName && (
                          <Badge className="text-xs border-0 bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                            {displayRoleName(collaborator.roleName)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Sections ── */}
              <div className="px-4 pb-10 space-y-4">
                <Section icon={User} title="Información personal">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
                    <DetailField label="Teléfono" value={collaborator.phone} />
                    <DetailField label="Correo electrónico" value={collaborator.email} />
                    <DetailField label="Edad" value={collaborator.age} />
                    <DetailField label="Género" value={genderLabel(collaborator.gender)} />
                    <DetailField
                      label="Fecha de nacimiento"
                      value={formatDate(collaborator.birthDate)}
                    />
                    <DetailField label="Tipo de sangre" value={collaborator.bloodType} />
                    <DetailField label="Dirección" value={collaborator.address} />
                    <DetailField
                      label="Ocupación actual"
                      value={collaborator.currentOccupation}
                    />
                    <DetailField
                      label="Talla de uniforme"
                      value={collaborator.uniformSize}
                    />
                    <DetailField
                      label="Fecha de registro"
                      value={formatDate(collaborator.createdAt)}
                    />
                  </div>
                </Section>

                <Section icon={Heart} title="Salud">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
                    <DetailField
                      label="¿Tiene enfermedades?"
                      value={
                        collaborator.hasDisease === true
                          ? 'Sí'
                          : collaborator.hasDisease === false
                            ? 'No'
                            : '—'
                      }
                    />
                    {collaborator.hasDisease && (
                      <DetailField
                        label="Descripción de la enfermedad"
                        value={collaborator.diseaseDescription}
                        fullWidth
                      />
                    )}
                    <DetailField
                      label="¿Toma medicamentos?"
                      value={
                        collaborator.takesMedication === true
                          ? 'Sí'
                          : collaborator.takesMedication === false
                            ? 'No'
                            : '—'
                      }
                    />
                    {collaborator.takesMedication && (
                      <DetailField
                        label="Medicamentos"
                        value={collaborator.medicationDescription}
                        fullWidth
                      />
                    )}
                  </div>
                </Section>

                <Section icon={Phone} title="Contacto de emergencia">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
                    <DetailField
                      label="Nombre"
                      value={collaborator.emergencyContactName}
                    />
                    <DetailField
                      label="Teléfono"
                      value={collaborator.emergencyContactPhone}
                    />
                  </div>
                </Section>

                <Section icon={Banknote} title="Información bancaria">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
                    <DetailField label="Banco" value={collaborator.bankName} />
                    <DetailField
                      label="Número de cuenta"
                      value={collaborator.accountNumber}
                    />
                  </div>
                </Section>

                <Section icon={Briefcase} title="Experiencia laboral">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
                    <DetailField
                      label="¿Tiene experiencia previa?"
                      value={
                        collaborator.hasExperience === true
                          ? 'Sí'
                          : collaborator.hasExperience === false
                            ? 'No'
                            : '—'
                      }
                    />
                    {collaborator.hasExperience && (
                      <DetailField
                        label="Descripción"
                        value={collaborator.experienceDescription}
                        fullWidth
                      />
                    )}
                  </div>
                </Section>

                {collaborator.additionalNotes && (
                  <Section icon={Pill} title="Notas adicionales">
                    <p className="text-sm text-foreground leading-relaxed">
                      {collaborator.additionalNotes}
                    </p>
                  </Section>
                )}

                {collaborator.clientEvents?.length > 0 && (
                  <Section
                    icon={Building2}
                    title={`Eventos como cliente (${collaborator.clientEvents.length})`}
                  >
                    <div className="space-y-3">
                      {collaborator.clientEvents.map((ce) => {
                        const svc = SERVICE_TYPE_CONFIG[ce.serviceType] ?? {
                          label: ce.serviceType,
                          className: 'bg-muted text-muted-foreground border-border',
                        };
                        return (
                          <div
                            key={ce.eventId}
                            className="flex items-start justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3.5"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0 mt-0.5">
                                <Building2 className="w-4 h-4 text-brand" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">
                                  {ce.eventName}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                  {ce.location ?? '—'} · {formatDate(ce.date)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${svc.className}`}
                              >
                                {svc.label}
                              </span>
                              {ce.reportUrl && (
                                <button
                                  onClick={() => window.open(ce.reportUrl, '_blank', 'noopener,noreferrer')}
                                  className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border bg-brand/10 text-brand border-brand/20 hover:bg-brand/20 transition-colors"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Informe</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Section>
                )}

                <Section
                  icon={Calendar}
                  title={`Historial de eventos (${collaborator.eventHistory?.length ?? 0})`}
                >
                  {!collaborator.eventHistory?.length ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Sin eventos registrados.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {collaborator.eventHistory.map((event) => (
                        <EventHistoryCard
                          key={event.eventId}
                          event={event}
                          onViewMovements={(ev) =>
                            setMovementsTarget({
                              event: ev,
                              eventId: ev.eventId,
                              userId: collaborator.userId,
                              collaboratorName: `${collaborator.firstName} ${collaborator.lastName}`,
                            })
                          }
                        />
                      ))}
                    </div>
                  )}
                </Section>

                <Section icon={TrendingUp} title="Calificaciones">
                  <RatingsSection collaboratorId={collaborator.userId} />
                </Section>
              </div>
            </>
          )
        )}
      </div>

      {movementsTarget && (
        <CollaboratorMovementsModal
          open={!!movementsTarget}
          onClose={() => setMovementsTarget(null)}
          eventId={movementsTarget?.eventId}
          userId={movementsTarget?.userId}
          collaboratorName={movementsTarget?.collaboratorName}
          event={movementsTarget?.event}
        />
      )}
    </div>
  );
}

export default CollaboratorDetailPage;
