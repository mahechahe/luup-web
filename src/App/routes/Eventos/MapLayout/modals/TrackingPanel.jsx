import { Battery, MapPin, RefreshCw, Signal, SignalZero, UserX, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getEventUsersWithLocationService,
  registerUserDeviceService,
} from '../services/mapLayoutServices';

/* ── Colores y etiquetas por rol ──────────────────────────── */
const ROLE_CONFIG = {
  coordinator:       { label: 'Coordinador',   cls: 'bg-[#6D28D9]/15 text-[#6D28D9] dark:bg-[#6D28D9]/25 dark:text-[#C4B5FD]' },
  supervisor:        { label: 'Supervisor',    cls: 'bg-[#1D4ED8]/15 text-[#1D4ED8] dark:bg-[#1D4ED8]/25 dark:text-[#93C5FD]' },
  responsableAcopio: { label: 'Resp. Acopio',  cls: 'bg-[#DD7419]/15 text-[#DD7419]' },
  collaborator:      { label: 'Colaborador',   cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
};

const ROLE_ORDER = {
  coordinator: 1,
  supervisor: 2,
  responsableAcopio: 3,
  collaborator: 4,
};

function normalizeRole(role) {
  if (!role) return 'collaborator';
  const normalized = String(role).toLowerCase();
  if (normalized === 'coordinador' || normalized === 'coordinator') return 'coordinator';
  if (normalized === 'supervisor') return 'supervisor';
  if (normalized === 'responsable_acopio' || normalized === 'responsableacopio') return 'responsableAcopio';
  if (normalized === 'colaborador' || normalized === 'collaborator') return 'collaborator';
  return role;
}

function getRoleConfig(role) {
  const normalized = normalizeRole(role);
  return ROLE_CONFIG[normalized] ?? { label: role, cls: 'bg-muted text-muted-foreground' };
}

function getRoleOrder(role) {
  const normalized = normalizeRole(role);
  return ROLE_ORDER[normalized] ?? 99;
}

function getDefaultRole(user) {
  return (
    user?.assignedAs?.[0]
    || user?.zones?.[0]?.assignedAs
    || 'collaborator'
  );
}

/* ── Badge de estado de ubicación ────────────────────────── */
function LocationBadge({ location }) {
  if (!location) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
        <SignalZero className="w-3 h-3" />
        Sin dispositivo
      </span>
    );
  }
  if (location.latitude == null || location.longitude == null) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
        <Signal className="w-3 h-3" />
        Sin posición
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
      <MapPin className="w-3 h-3" />
      Activo
    </span>
  );
}

/* ── Card de usuario ──────────────────────────────────────── */
function UserCard({
  user,
  deviceIdValue,
  onDeviceIdChange,
  onRegisterDevice,
  registering,
  registerError,
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      {/* Nombre + estado GPS */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-muted-foreground">{user.cedula}</p>
        </div>
        <LocationBadge location={user.location} />
      </div>

      {/* Zonas asignadas */}
      {user.zones?.length > 0 && (
        <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 space-y-2">
          <p className="text-[11px] font-semibold text-foreground/70">Zonas</p>
          <div className="space-y-1">
            {[...user.zones]
              .sort((a, b) => getRoleOrder(a.assignedAs) - getRoleOrder(b.assignedAs))
              .map((z) => {
                const { label, cls } = getRoleConfig(z.assignedAs);
                return (
                  <div
                    key={`${z.zoneId}-${z.assignedAs}`}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`h-1.5 w-1.5 rounded-full ${cls}`} />
                      <p className="text-[11px] text-muted-foreground truncate">{z.name}</p>
                    </div>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${cls}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Detalle GPS */}
      {user.location && (
        <div className="rounded-md bg-muted/40 px-3 py-2 space-y-1">
          {user.location.latitude != null ? (
            <p className="text-[11px] text-muted-foreground">
              Posición:{' '}
              <span className="text-foreground font-medium font-mono">
                {user.location.latitude.toFixed(5)}, {user.location.longitude.toFixed(5)}
              </span>
            </p>
          ) : (
            <p className="text-[11px] text-amber-600">GPS aún sin primer ping</p>
          )}
          {user.location.deviceId && (
            <p className="text-[11px] text-muted-foreground">
              Device ID:{' '}
              <span className="text-foreground font-medium font-mono">
                {user.location.deviceId}
              </span>
            </p>
          )}
          {user.location.battery != null && (
            <p className={`text-[11px] flex items-center gap-1 ${
              user.location.battery < 20 ? 'text-destructive'
              : user.location.battery < 50 ? 'text-amber-600'
              : 'text-emerald-600'
            }`}>
              <Battery className="w-3 h-3" />
              Batería: {user.location.battery}%
            </p>
          )}
          {user.location.lastUpdate && (
            <p className="text-[10px] text-muted-foreground">
              Última actualización:{' '}
              {new Date(user.location.lastUpdate).toLocaleTimeString('es-CO', {
                hour: '2-digit', minute: '2-digit', second: '2-digit',
              })}
            </p>
          )}
        </div>
      )}

      {!user.location && (
        <div className="rounded-md border border-dashed border-border/70 bg-muted/20 px-3 py-2 space-y-2">
          <p className="text-[11px] text-muted-foreground">
            Sin dispositivo asignado
          </p>
          <div className="flex items-center gap-2">
            <input
              value={deviceIdValue}
              onChange={(e) => onDeviceIdChange(user.userId, e.target.value)}
              placeholder="IMEI / Device ID"
              className="h-9 flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={() => onRegisterDevice(user)}
              disabled={registering || !deviceIdValue}
              className="h-9 px-3 rounded-md bg-[#234465] text-white text-xs font-semibold hover:bg-[#234465]/90 transition disabled:opacity-40"
            >
              Asignar
            </button>
          </div>
          {registerError && (
            <p className="text-[11px] text-destructive">{registerError}</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Panel principal ──────────────────────────────────────── */
export function TrackingPanel({ eventId, open, onClose }) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ name: '', cedula: '' });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [deviceIds, setDeviceIds] = useState({});
  const [registeringIds, setRegisteringIds] = useState({});
  const [registerErrors, setRegisterErrors] = useState({});

  const fetchUsers = async ({ nextPage = page, nextFilters = filters } = {}) => {
    setLoadingUsers(true);
    setError(null);
    const res = await getEventUsersWithLocationService(eventId, {
      page: nextPage,
      limit: pagination.limit,
      name: nextFilters.name,
      cedula: nextFilters.cedula,
    });
    if (res.status) {
      setUsers(res.users);
      if (res.pagination) {
        const totalPages = res.pagination.totalPages
          ?? Math.max(1, Math.ceil((res.pagination.total || 0) / (res.pagination.limit || 10)));
        setPagination({ ...res.pagination, totalPages });
        setPage(res.pagination.page);
      }
    }
    else setError(res.errors);
    setLoadingUsers(false);
  };

  // Cargar datos al abrir
  useEffect(() => {
    if (open) fetchUsers({ nextPage: 1 });
  }, [open, eventId]);

  const handleFilterChange = (field) => (e) => {
    setFilters((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleApplyFilters = () => {
    const nextFilters = { ...filters };
    setPage(1);
    fetchUsers({ nextPage: 1, nextFilters });
  };

  const handleClearFilters = () => {
    const nextFilters = { name: '', cedula: '' };
    setFilters(nextFilters);
    setPage(1);
    fetchUsers({ nextPage: 1, nextFilters });
  };

  const handleDeviceIdChange = (userId, value) => {
    setDeviceIds((prev) => ({ ...prev, [userId]: value }));
  };

  const handleRegisterDevice = async (user) => {
    const deviceId = deviceIds[user.userId]?.trim();
    if (!deviceId) return;
    const role = getDefaultRole(user);
    setRegisteringIds((prev) => ({ ...prev, [user.userId]: true }));
    setRegisterErrors((prev) => ({ ...prev, [user.userId]: null }));
    const res = await registerUserDeviceService({
      userId: user.userId,
      eventId: Number(eventId),
      role,
      deviceId,
    });
    if (!res.status) {
      setRegisterErrors((prev) => ({ ...prev, [user.userId]: res.errors }));
    } else {
      setDeviceIds((prev) => ({ ...prev, [user.userId]: '' }));
      await fetchUsers({ nextPage: page });
    }
    setRegisteringIds((prev) => ({ ...prev, [user.userId]: false }));
  };

  const activeCount = users.filter(
    (u) => u.location?.latitude != null && u.location?.longitude != null
  ).length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="p-0 gap-0 h-[90vh] max-h-[90vh] flex flex-col overflow-hidden sm:max-w-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <div>
            <DialogTitle className="text-base font-bold text-foreground">
              Seguimiento
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {loadingUsers
                ? 'Cargando...'
                : `${users.length} usuarios · ${activeCount} con posición activa`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              disabled={loadingUsers}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition disabled:opacity-40"
              title="Actualizar"
            >
              <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          <form
            className="rounded-lg border border-border bg-card p-3 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              handleApplyFilters();
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                value={filters.name}
                onChange={handleFilterChange('name')}
                placeholder="Buscar por nombre"
                className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                value={filters.cedula}
                onChange={handleFilterChange('cedula')}
                placeholder="Buscar por cédula"
                className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="h-9 px-3 rounded-md bg-[#DD7419] text-white text-sm font-semibold hover:bg-[#DD7419]/90 transition"
              >
                Buscar
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="h-9 px-3 rounded-md border border-border text-sm text-foreground hover:bg-muted transition"
              >
                Limpiar
              </button>
              <div className="ml-auto text-xs text-muted-foreground">
                {pagination.total} resultados
              </div>
            </div>
          </form>

          {loadingUsers && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-card p-3 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-2 flex-1">
                      <div className="h-4 w-40 rounded bg-muted animate-pulse" />
                      <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                    </div>
                    <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
                  </div>
                  <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 space-y-2">
                    <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-full rounded bg-muted animate-pulse" />
                    <div className="h-3 w-5/6 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loadingUsers && error && (
            <div className="py-10 flex flex-col items-center gap-2 text-destructive">
              <UserX className="w-6 h-6" />
              <p className="text-sm text-center">{error}</p>
            </div>
          )}

          {!loadingUsers && !error && users.length === 0 && (
            <div className="py-10 flex flex-col items-center gap-2 text-muted-foreground">
              <UserX className="w-6 h-6" />
              <p className="text-sm">No hay usuarios asignados a este evento.</p>
            </div>
          )}

          {!loadingUsers && !error && users.map((user) => (
            <UserCard
              key={user.userId}
              user={user}
              deviceIdValue={deviceIds[user.userId] ?? ''}
              onDeviceIdChange={handleDeviceIdChange}
              onRegisterDevice={handleRegisterDevice}
              registering={!!registeringIds[user.userId]}
              registerError={registerErrors[user.userId]}
            />
          ))}

          {!loadingUsers && !error && (
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => fetchUsers({ nextPage: Math.max(1, page - 1) })}
                disabled={page <= 1}
                className="h-9 px-3 rounded-md border border-border text-sm text-foreground disabled:opacity-40 hover:bg-muted transition"
              >
                Anterior
              </button>
              <div className="text-xs text-muted-foreground">
                Página {page} de {pagination.totalPages}
              </div>
              <button
                onClick={() => fetchUsers({ nextPage: Math.min(pagination.totalPages, page + 1) })}
                disabled={page >= pagination.totalPages}
                className="h-9 px-3 rounded-md border border-border text-sm text-foreground disabled:opacity-40 hover:bg-muted transition"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
