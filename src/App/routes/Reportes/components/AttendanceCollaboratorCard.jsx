import { useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  GlassWater,
  MapPin,
  Package,
  Shirt,
  UtensilsCrossed,
} from 'lucide-react';

const ROLE_LABELS = {
  supervisor: 'Supervisor',
  coordinador: 'Coordinador',
  colaborador: 'Colaborador',
  responsable_acopio: 'Resp. Acopio',
};

const ROLE_COLORS = {
  supervisor:
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  coordinador:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  colaborador: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  responsable_acopio:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

const ROLE_ACCENT = {
  supervisor: 'border-l-violet-500',
  coordinador: 'border-l-blue-500',
  colaborador: 'border-l-slate-400',
};

const AVATAR_COLORS = {
  supervisor:
    'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  coordinador:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  colaborador:
    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

function formatTime(isoString) {
  if (!isoString) return null;
  return new Date(isoString).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function StatusPill({ icon: Icon, label, active }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
        active
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
          : 'bg-muted text-muted-foreground opacity-50'
      }`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      {label}
    </span>
  );
}

function AttendanceBlock({ attendance, index }) {
  const entryTime = formatTime(attendance.entryTime);
  const exitTime = formatTime(attendance.exitTime);
  const isActive = !attendance.exitTime;
  const snackLabel = attendance.snackDetail
    ? `Snack: ${attendance.snackDetail}`
    : 'Snack';

  return (
    <div className="p-3 rounded-xl bg-muted/50 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full shrink-0 ${
            isActive ? 'bg-emerald-500' : 'bg-zinc-400'
          }`}
        />
        <span className="text-[10px] font-semibold text-muted-foreground">
          #{index + 1}
        </span>
        <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
          <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="font-semibold text-foreground">
            {entryTime ?? '—'}
          </span>
          <span className="text-muted-foreground">→</span>
          {isActive ? (
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 px-2 py-0.5 rounded-full">
              En evento
            </span>
          ) : (
            <span className="font-semibold text-foreground">
              {exitTime ?? '—'}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 pl-4">
        <StatusPill
          icon={Briefcase}
          label="Maletín"
          active={!!attendance.receivedSuitcase}
        />
        <StatusPill
          icon={UtensilsCrossed}
          label="Almuerzo"
          active={!!attendance.receivedLunch}
        />
        <StatusPill
          icon={GlassWater}
          label={snackLabel}
          active={!!attendance.receivedSnack}
        />
        <StatusPill
          icon={Shirt}
          label="Uniforme devuelto"
          active={!!attendance.returnedUniform}
        />
      </div>

      {attendance.notes && (
        <p className="text-xs text-muted-foreground italic pl-4 border-l-2 border-border">
          {attendance.notes}
        </p>
      )}
    </div>
  );
}

export default function AttendanceCollaboratorCard({ collaborator }) {
  const [expanded, setExpanded] = useState(false);
  const hasLunch = collaborator.attendances.some((a) => a.receivedLunch);
  const hasUniform = collaborator.attendances.some((a) => a.uniform);
  const uniformSize = collaborator.attendances.find(
    (a) => a.uniformSize
  )?.uniformSize;
  const hasInventory = collaborator.inventoryItems.length > 0;
  const attendanceCount = collaborator.attendances.length;
  const initials = `${collaborator.firstName?.[0] ?? ''}${
    collaborator.lastName?.[0] ?? ''
  }`.toUpperCase();
  const role = collaborator.role ?? 'colaborador';

  return (
    <div
      className={`bg-card border border-border border-l-4 ${
        ROLE_ACCENT[role] ?? ROLE_ACCENT.colaborador
      } rounded-2xl overflow-hidden transition-all hover:shadow-md`}
    >
      <div className="p-4 flex items-start gap-3">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
            AVATAR_COLORS[role] ?? AVATAR_COLORS.colaborador
          }`}
        >
          {initials || '?'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground leading-tight">
                {collaborator.firstName} {collaborator.lastName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                CC {collaborator.cedula}
              </p>
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                ROLE_COLORS[role] ?? ROLE_COLORS.colaborador
              }`}
            >
              {ROLE_LABELS[role] ?? role}
            </span>
          </div>

          {collaborator.zones.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5">
              <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground truncate">
                {collaborator.zones.join(' · ')}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 mt-2.5">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                attendanceCount > 0
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {attendanceCount > 0 ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <Circle className="w-3 h-3" />
              )}
              {attendanceCount > 0
                ? `${attendanceCount} registro${attendanceCount > 1 ? 's' : ''}`
                : 'Sin registro'}
            </span>

            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                hasLunch
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <UtensilsCrossed className="w-3 h-3" />
              {hasLunch ? 'Almuerzo' : 'Sin almuerzo'}
            </span>

            {hasUniform && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
                <Shirt className="w-3 h-3" />
                Uniforme{uniformSize ? ` ${uniformSize}` : ''}
              </span>
            )}

            {hasInventory && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                <Package className="w-3 h-3" />
                {collaborator.inventoryItems.length} ítem
                {collaborator.inventoryItems.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => setExpanded((value) => !value)}
        className="w-full flex items-center justify-center gap-1.5 py-2 border-t border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        {expanded ? (
          <>
            <ChevronUp className="w-3.5 h-3.5" /> Ocultar detalle
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5" /> Ver detalle
          </>
        )}
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-4 flex flex-col gap-5 bg-muted/20">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              Asistencia
            </p>
            {attendanceCount > 0 ? (
              <div className="flex flex-col gap-2">
                {collaborator.attendances.map((attendance, index) => (
                  <AttendanceBlock
                    key={attendance.id}
                    attendance={attendance}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sin registros de asistencia.
              </p>
            )}
          </div>

          {hasInventory && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                Inventario asignado
              </p>
              <div className="flex flex-col gap-1.5">
                {collaborator.inventoryItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-card rounded-xl px-3 py-2.5"
                  >
                    <span className="text-sm font-medium text-foreground truncate pr-3">
                      {item.itemName}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                        {item.quantity} asig.
                      </span>
                      {item.returnedQuantity > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 font-medium">
                          {item.returnedQuantity} dev.
                        </span>
                      )}
                      {item.damagedQuantity > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 font-medium">
                          {item.damagedQuantity} dañ.
                        </span>
                      )}
                      {item.pendingQuantity > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 font-medium">
                          {item.pendingQuantity} pend.
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
