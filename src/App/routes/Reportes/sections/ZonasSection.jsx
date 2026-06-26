import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ClipboardList,
  ImageIcon,
  Loader2,
  MapPin,
  RefreshCw,
  User,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getZonesWithIncidentsService,
  getZoneRequirementsService,
  getRequirementSignedUrlService,
} from '../services/reportesServices';

const CATEGORY_LABELS = {
  general: 'General',
  acopio: 'Centro de Acopio',
};

function IncidentRow({ incident }) {
  return (
    <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-2.5 py-2">
      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 leading-tight">
          {incident.name}
        </span>
        <span className="text-[10px] text-amber-600 dark:text-amber-400">
          {incident.time}
          {incident.note ? ` · ${incident.note}` : ''}
        </span>
      </div>
    </div>
  );
}

function PersonRow({ user }) {
  const fullName = `${user.firstName} ${user.lastName}`.trim() || user.cedula;
  const hasIncidents = user.incidents && user.incidents.length > 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 min-w-0">
        <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium text-foreground truncate">
          {fullName}
        </span>
        <span className="text-[11px] text-muted-foreground shrink-0">
          {user.cedula}
        </span>
        {hasIncidents && (
          <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 shrink-0 whitespace-nowrap">
            {user.incidents.length} novedad{user.incidents.length !== 1 ? 'es' : ''}
          </span>
        )}
      </div>
      {hasIncidents && (
        <div className="pl-5 flex flex-col gap-1">
          {user.incidents.map((inc) => (
            <IncidentRow key={inc.id} incident={inc} />
          ))}
        </div>
      )}
    </div>
  );
}

function PersonnelGroup({ label, users }) {
  if (!users || users.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <div className="flex flex-col gap-3">
        {users.map((user) => (
          <PersonRow key={user.userId} user={user} />
        ))}
      </div>
    </div>
  );
}

function RequirementItem({ req, zoneId }) {
  const [imgOpen, setImgOpen] = useState(false);
  const [imgUrl, setImgUrl] = useState(null);
  const [imgLoading, setImgLoading] = useState(false);

  const createdAt = new Date(req.createdAt);
  const dateStr = createdAt.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = createdAt.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  const creatorName =
    `${req.creator?.firstName ?? ''} ${req.creator?.lastName ?? ''}`.trim();

  const handleViewPhoto = async () => {
    setImgOpen(true);
    if (imgUrl) return;
    setImgLoading(true);
    const res = await getRequirementSignedUrlService(zoneId, req.id);
    if (res.status && res.url) {
      setImgUrl(res.url);
    } else {
      toast.error(res.errors ?? 'No se pudo cargar la foto.');
      setImgOpen(false);
    }
    setImgLoading(false);
  };

  return (
    <>
      <div className="bg-muted/50 rounded-xl px-3 py-2.5 flex flex-col gap-1.5">
        <p className="text-sm text-foreground leading-snug">{req.note}</p>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground flex-wrap">
          {creatorName && <span>{creatorName}</span>}
          {creatorName && <span>·</span>}
          <span>
            {dateStr} {timeStr}
          </span>
          {req.photoUrl && (
            <button
              onClick={handleViewPhoto}
              className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 hover:opacity-80 transition-opacity"
            >
              <ImageIcon className="w-3 h-3" />
              Ver foto
            </button>
          )}
        </div>
      </div>

      <Dialog open={imgOpen} onOpenChange={setImgOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Foto del requerimiento · {dateStr} {timeStr}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center min-h-48">
            {imgLoading ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Cargando imagen…</p>
              </div>
            ) : imgUrl ? (
              <img
                src={imgUrl}
                alt="Foto del requerimiento"
                className="w-full rounded-xl object-contain max-h-[60vh]"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ZoneSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
      <Skeleton className="w-3 h-3 rounded-full shrink-0" />
      <div className="flex-1 flex flex-col gap-1.5">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="w-4 h-4 shrink-0" />
    </div>
  );
}

function ZoneCard({ zone, requirements, requirementsLoading }) {
  const [expanded, setExpanded] = useState(false);

  const isGeneral = zone.category === 'general';

  const supervisors = zone.supervisor ? [zone.supervisor] : [];
  const coordinators = zone.coordinator ? [zone.coordinator] : [];
  const responsables = zone.responsableAcopio ?? [];
  const collaborators = zone.collaborators ?? [];

  const allPersonnel = [
    ...supervisors,
    ...coordinators,
    ...responsables,
    ...collaborators,
  ];

  const totalIncidents = allPersonnel.reduce(
    (sum, u) => sum + (u.incidents?.length ?? 0),
    0
  );

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/40 transition-colors"
      >
        <span
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: zone.color ?? '#94a3b8' }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground truncate">
              {zone.name}
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
              {CATEGORY_LABELS[zone.category] ?? zone.category}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground flex-wrap">
            <span>
              {allPersonnel.length} persona
              {allPersonnel.length !== 1 ? 's' : ''}
            </span>
            {totalIncidents > 0 && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                <AlertTriangle className="w-3 h-3" />
                {totalIncidents} novedad{totalIncidents !== 1 ? 'es' : ''}
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 flex flex-col gap-5">
          {/* Requerimientos — solo zonas generales */}
          {isGeneral && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5" />
                Requerimientos
              </p>
              {requirementsLoading ? (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-14 w-full rounded-xl" />
                  <Skeleton className="h-14 w-full rounded-xl" />
                </div>
              ) : requirements.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  Sin requerimientos registrados.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {requirements.map((req) => (
                    <RequirementItem key={req.id} req={req} zoneId={zone.id} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Personal */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Personal
            </p>
            {allPersonnel.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Sin personal asignado.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                <PersonnelGroup label="Supervisor" users={supervisors} />
                <PersonnelGroup label="Coordinador" users={coordinators} />
                <PersonnelGroup
                  label="Responsable Acopio"
                  users={responsables}
                />
                <PersonnelGroup label="Colaboradores" users={collaborators} />
              </div>
            )}
          </div>

          {/* Notas de la zona */}
          {zone.notes && (
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Notas
              </p>
              <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-2">
                {zone.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ZonasSection({ eventId }) {
  const [zones, setZones] = useState([]);
  const [requirements, setRequirements] = useState({});
  const [requirementsLoading, setRequirementsLoading] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setRequirements({});
    setRequirementsLoading({});

    const res = await getZonesWithIncidentsService(eventId);

    if (!res.status) {
      toast.error(res.errors ?? 'Error al cargar las zonas.');
      setLoading(false);
      return;
    }

    setZones(res.zones);
    setLoading(false);

    const generalZones = res.zones.filter((z) => z.category === 'general');
    if (generalZones.length === 0) return;

    const loadingMap = {};
    generalZones.forEach((z) => {
      loadingMap[z.id] = true;
    });
    setRequirementsLoading(loadingMap);

    const results = await Promise.allSettled(
      generalZones.map((z) => getZoneRequirementsService(z.id))
    );

    const reqMap = {};
    const doneMap = {};
    results.forEach((result, i) => {
      const zoneId = generalZones[i].id;
      doneMap[zoneId] = false;
      reqMap[zoneId] =
        result.status === 'fulfilled' && result.value.status
          ? result.value.requirements
          : [];
    });

    setRequirements(reqMap);
    setRequirementsLoading(doneMap);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    fetchData();
  }, [eventId, fetchData]);

  const totalIncidents = zones.reduce((sum, zone) => {
    const all = [
      ...(zone.supervisor ? [zone.supervisor] : []),
      ...(zone.coordinator ? [zone.coordinator] : []),
      ...(zone.responsableAcopio ?? []),
      ...(zone.collaborators ?? []),
    ];
    return sum + all.reduce((s, u) => s + (u.incidents?.length ?? 0), 0);
  }, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <button
          onClick={fetchData}
          disabled={loading}
          className="w-10 h-10 rounded-xl border border-border bg-card flex items-center justify-center text-foreground hover:bg-muted transition-colors disabled:opacity-40"
          title="Actualizar zonas"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {!loading && zones.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-border">
            <div className="flex flex-col items-center gap-0.5 py-4">
              <span className="text-2xl font-bold text-foreground">
                {zones.length}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">
                Zonas
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5 py-4">
              <span
                className={`text-2xl font-bold ${
                  totalIncidents > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-foreground'
                }`}
              >
                {totalIncidents}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">
                Novedades
              </span>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <ZoneSkeleton key={i} />
          ))}
        </div>
      ) : zones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
            <MapPin className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">Sin zonas</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Este evento no tiene zonas configuradas.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {zones.map((zone) => (
            <ZoneCard
              key={zone.id}
              zone={zone}
              requirements={requirements[zone.id] ?? []}
              requirementsLoading={requirementsLoading[zone.id] ?? false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
