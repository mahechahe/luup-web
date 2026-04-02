import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Briefcase,
  Heart,
  Phone,
  Pill,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  UserCheck,
  HardHat,
  LogIn,
  LogOut,
  MapPin,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCollaboratorDetailService } from '../services/collaboratorServices';
import { CollaboratorMovementsModal } from './modal/CollaboratorMovementsModal';

/* ── Helpers ─────────────────────────────────────────────── */
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', {
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

/* ── Rol badge ───────────────────────────────────────────── */
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

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-5 w-40" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Campo de detalle ────────────────────────────────────── */
function DetailField({ label, value }) {
  return (
    <div className="space-y-1 min-w-0">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm text-foreground font-medium break-all">
        {value ?? '—'}
      </p>
    </div>
  );
}

/* ── Sección ─────────────────────────────────────────────── */
function Section({ icon: Icon, title, children }) {
  return (
    <Card className="border-border shadow-sm p-0">
      <CardHeader className="pb-3 pt-4 px-5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-brand" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">{children}</CardContent>
    </Card>
  );
}

/* ── Tarjeta de evento individual ────────────────────────── */
function EventHistoryCard({ event, onViewMovements }) {
  const [open, setOpen] = useState(false);

  const attendedKey =
    event.attended === true
      ? 'true'
      : event.attended === false
        ? 'false'
        : 'null';

  const attendedConfig = {
    true: {
      icon: CheckCircle2,
      label: 'Asistió',
      badgeClass:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
      accentClass: 'border-l-emerald-500',
    },
    false: {
      icon: XCircle,
      label: 'No asistió',
      badgeClass:
        'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/60',
      accentClass: 'border-l-red-500',
    },
    null: {
      icon: Clock,
      label: 'Pendiente',
      badgeClass: 'bg-muted text-muted-foreground border-border',
      accentClass: 'border-l-muted-foreground/30',
    },
  };

  const att = attendedConfig[attendedKey];
  const AttIcon = att.icon;

  return (
    <div
      className={`rounded-xl border border-border bg-card overflow-hidden border-l-4 ${att.accentClass}`}
    >
      {/* Header colapsable */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-3 px-4 py-3.5 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0 mt-0.5">
            <Calendar className="w-4 h-4 text-brand" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {event.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {event.location ?? '—'} ·{' '}
              {formatDate(event.date ?? event.startDate)}
            </p>
            {/* Role badge visible solo en móvil */}
            <div className="mt-1.5 sm:hidden">
              <RoleBadge role={event.role} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Role badge visible solo en desktop */}
          <span className="hidden sm:inline-flex">
            <RoleBadge role={event.role} />
          </span>
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${att.badgeClass}`}
          >
            <AttIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{att.label}</span>
          </span>
          {/* Botón de movimientos */}
          {event.locationPingsCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewMovements(event);
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border bg-brand/10 text-brand border-brand/20 hover:bg-brand/20 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver movimientos</span>
            </button>
          )}
          <span
            className={`text-muted-foreground text-xs transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
          >
            ▼
          </span>
        </div>
      </button>

      {/* Detalle expandible */}
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-3">
          {/* Horarios */}
          <div className="flex items-center gap-6 sm:gap-8">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                <LogIn className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                  Entrada
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {formatTime(event.entryTime)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                  Salida
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {formatTime(event.exitTime)}
                </p>
              </div>
            </div>
          </div>

          {/* Incidencias */}
          {event.incidents?.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Incidencias ({event.incidents.length})
              </p>
              <div className="space-y-2">
                {event.incidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-muted/50 border border-border text-xs"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-brand mt-1 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-semibold text-foreground">
                        {inc.name}
                      </span>
                      {inc.time && (
                        <span className="text-muted-foreground ml-1.5">
                          · {inc.time}
                        </span>
                      )}
                      {inc.note && (
                        <p className="text-muted-foreground mt-0.5">
                          {inc.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Sin incidencias registradas.
            </p>
          )}

          {/* Notas de asistencia */}
          {event.notes && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Notas
              </p>
              <p className="text-sm text-foreground">{event.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Página principal ────────────────────────────────────── */
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

  /* ── Error state ───────────────────────────────────────── */
  if (!loading && error) {
    return (
      <div className="min-h-screen bg-background px-4 py-6 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              Error al cargar el colaborador
            </p>
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
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Encabezado */}
        <div className="flex items-start gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => navigate('/colaboradores')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-7 w-52" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-foreground tracking-tight truncate">
                  {collaborator.firstName} {collaborator.lastName}
                </h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge
                    variant="outline"
                    className="text-xs font-semibold px-1.5 py-0"
                  >
                    {collaborator.typeDocument?.code ?? '—'}{' '}
                    {collaborator.cedula}
                  </Badge>
                  <Badge
                    className={`text-xs border-0 ${
                      collaborator.isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {collaborator.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                  {collaborator.roleName && (
                    <Badge className="text-xs border-0 bg-violet-100 text-violet-700">
                      {collaborator.roleName}
                    </Badge>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {loading && <DetailSkeleton />}

        {!loading && collaborator && (
          <div className="space-y-4">
            {/* Información personal */}
            <Section icon={User} title="Información personal">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                <DetailField label="Teléfono" value={collaborator.phone} />
                <DetailField
                  label="Correo electrónico"
                  value={collaborator.email}
                />
                <DetailField label="Edad" value={collaborator.age} />
                <DetailField
                  label="Género"
                  value={genderLabel(collaborator.gender)}
                />
                <DetailField
                  label="Fecha de nacimiento"
                  value={formatDate(collaborator.birthDate)}
                />
                <DetailField
                  label="Tipo de sangre"
                  value={collaborator.bloodType}
                />
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

            {/* Salud */}
            <Section icon={Heart} title="Salud">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
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
                  <div className="col-span-2">
                    <DetailField
                      label="Descripción de la enfermedad"
                      value={collaborator.diseaseDescription}
                    />
                  </div>
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
                  <div className="col-span-2">
                    <DetailField
                      label="Medicamentos"
                      value={collaborator.medicationDescription}
                    />
                  </div>
                )}
              </div>
            </Section>

            {/* Contacto de emergencia */}
            <Section icon={Phone} title="Contacto de emergencia">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
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

            {/* Información bancaria */}
            <Section icon={Banknote} title="Información bancaria">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                <DetailField label="Banco" value={collaborator.bankName} />
                <DetailField
                  label="Número de cuenta"
                  value={collaborator.accountNumber}
                />
              </div>
            </Section>

            {/* Experiencia laboral */}
            <Section icon={Briefcase} title="Experiencia laboral">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
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
                  <div className="col-span-2">
                    <DetailField
                      label="Descripción"
                      value={collaborator.experienceDescription}
                    />
                  </div>
                )}
              </div>
            </Section>

            {/* Notas adicionales */}
            {collaborator.additionalNotes && (
              <Section icon={Pill} title="Notas adicionales">
                <p className="text-sm text-foreground leading-relaxed">
                  {collaborator.additionalNotes}
                </p>
              </Section>
            )}

            {/* Historial de eventos */}
            <Section
              icon={Calendar}
              title={`Historial de eventos (${
                collaborator.eventHistory?.length ?? 0
              })`}
            >
              {!collaborator.eventHistory?.length ? (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
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
          </div>
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
