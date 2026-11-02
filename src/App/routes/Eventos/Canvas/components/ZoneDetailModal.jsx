import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Check,
  ClipboardList,
  Crown,
  Eye,
  MapPin,
  Package,
  PackageOpen,
  PencilLine,
  Shield,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { COLORS } from './constants';

/**
 * Detalle de una zona (canvas y mapa).
 *
 * - "Datos de la zona": editables por admins. Los cambios quedan en el canvas
 *   y se guardan con "Guardar cambios" del encabezado.
 * - "Personal asignado": SOLO LECTURA. Las asignaciones se gestionan en
 *   Asignación masiva.
 */
export function ZoneDetailModal({
  zone,
  isAdmin,
  onUpdate,
  onDeleteRequest,
  onClose,
}) {
  const navigate = useNavigate();
  const { eventId } = useParams();

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const isAcopio = zone.category === 'acopio';
  const byRole = (role) => zone.people.filter((p) => p.role === role);
  const roleGroups = [
    {
      id: 'coordinador',
      label: 'Coordinador',
      hint: 'Supervisa varias zonas',
      icon: Crown,
      iconClass: 'text-[#DD7419]',
      people: byRole('coordinador'),
    },
    {
      id: 'supervisor',
      label: 'Supervisor de zona',
      hint: 'Responsable de esta zona',
      icon: Shield,
      iconClass: 'text-[#234465] dark:text-[#7493B2]',
      people: byRole('supervisor'),
    },
    ...(isAcopio
      ? [
          {
            id: 'responsable_acopio',
            label: 'Responsable de acopio',
            hint: 'Acceso solo a este centro',
            icon: PackageOpen,
            iconClass: 'text-[#DD7419]',
            people: byRole('responsable_acopio'),
          },
        ]
      : []),
    {
      id: 'colaborador',
      label: 'Colaboradores',
      hint: 'Personal operativo',
      icon: Users,
      iconClass: 'text-muted-foreground',
      people: byRole('colaborador'),
    },
  ];

  const goToAssignments = () =>
    navigate(`/eventos/${eventId}/zonas/asignacion-masiva`);

  const update = (changes) => isAdmin && onUpdate(zone.id, changes);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end bg-black/50 backdrop-blur-[2px] sm:items-center sm:justify-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="zone-detail-title"
        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-card text-card-foreground shadow-2xl sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Franja con el color de la zona */}
        <div
          className="h-1.5 shrink-0"
          style={{ backgroundColor: zone.color }}
        />

        {/* Pill handle en mobile */}
        <div className="flex shrink-0 justify-center pt-2 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/20" />
        </div>

        {/* ── Encabezado ─────────────────────────────────── */}
        <header className="flex shrink-0 items-start gap-3 border-b border-border px-4 py-3.5 sm:px-6 sm:py-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
            style={{ backgroundColor: zone.color }}
          >
            {isAcopio ? (
              <Package className="h-5 w-5" />
            ) : (
              <MapPin className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="zone-detail-title"
              className="truncate text-lg font-bold leading-tight text-foreground"
            >
              {zone.name || 'Zona sin nombre'}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span
                className={`rounded-full px-2 py-0.5 font-semibold ${
                  isAcopio
                    ? 'bg-[#DD7419]/10 text-[#DD7419]'
                    : 'bg-[#234465]/10 text-[#234465] dark:bg-[#7493B2]/15 dark:text-[#7493B2]'
                }`}
              >
                {isAcopio ? 'Centro de acopio' : 'Zona'}
              </span>
              <span>
                {zone.people.length}{' '}
                {zone.people.length === 1 ? 'persona' : 'personas'} · capacidad{' '}
                {zone.maxCapacity || 0}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-1 rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* ── Cuerpo ─────────────────────────────────────── */}
        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6">
          {/* Datos de la zona */}
          <section className="space-y-4">
            <SectionTitle
              icon={isAdmin ? PencilLine : Eye}
              title="Datos de la zona"
              description={
                isAdmin
                  ? 'Se guardan con «Guardar cambios», arriba en el canvas.'
                  : undefined
              }
            />

            {isAdmin ? (
              <div className="space-y-4">
                <Field label="Nombre">
                  <input
                    className={inputClass}
                    value={zone.name}
                    onChange={(e) => update({ name: e.target.value })}
                    placeholder="Ej. Escenario principal"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
                  <Field label="Tipo">
                    <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/40 p-1">
                      <TypeOption
                        active={!isAcopio}
                        onClick={() => update({ category: 'general' })}
                        icon={MapPin}
                        label="Zona"
                        activeClass="bg-[#234465] text-white"
                      />
                      <TypeOption
                        active={isAcopio}
                        onClick={() => update({ category: 'acopio' })}
                        icon={Package}
                        label="Centro de acopio"
                        activeClass="bg-[#DD7419] text-white"
                      />
                    </div>
                  </Field>
                  <Field label="Capacidad">
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        className={`${inputClass} pr-16`}
                        value={zone.maxCapacity}
                        onChange={(e) =>
                          update({
                            maxCapacity: parseInt(e.target.value, 10) || 0,
                          })
                        }
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        personas
                      </span>
                    </div>
                  </Field>
                </div>

                <Field label="Color en el plano">
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((c) => {
                      const selected = zone.color === c.hex;
                      return (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => update({ color: c.hex })}
                          title={c.name}
                          aria-label={`Color ${c.name}`}
                          aria-pressed={selected}
                          className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                            selected
                              ? 'ring-2 ring-foreground/70 ring-offset-2 ring-offset-card'
                              : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: c.hex }}
                        >
                          {selected && (
                            <Check className="h-4 w-4 text-white drop-shadow" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                {isAcopio && (
                  <div className="space-y-3 rounded-xl border border-[#DD7419]/25 bg-[#DD7419]/5 p-3.5">
                    <p className="text-xs font-semibold text-[#DD7419]">
                      Límites del centro de acopio
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Basuras (unidades)" required>
                        <input
                          type="number"
                          min="0"
                          className={inputClass}
                          value={zone.wasteLimit ?? ''}
                          placeholder="0"
                          onChange={(e) =>
                            update({
                              wasteLimit: parseInt(e.target.value, 10) || 0,
                            })
                          }
                        />
                      </Field>
                      <Field label="Peso (kg)" required>
                        <input
                          type="number"
                          min="0"
                          className={inputClass}
                          value={zone.weightLimit ?? ''}
                          placeholder="0"
                          onChange={(e) =>
                            update({
                              weightLimit: parseInt(e.target.value, 10) || 0,
                            })
                          }
                        />
                      </Field>
                    </div>
                  </div>
                )}

                <Field label="Notas" optional>
                  <textarea
                    className={`${inputClass} h-20 resize-none`}
                    value={zone.notes || ''}
                    onChange={(e) => update({ notes: e.target.value })}
                    placeholder="Indicaciones logísticas, accesos, horarios…"
                  />
                </Field>
              </div>
            ) : (
              <dl className="grid gap-x-4 gap-y-3 rounded-xl border border-border bg-muted/20 p-4 text-sm sm:grid-cols-2">
                <ReadOnlyItem label="Tipo">
                  {isAcopio ? 'Centro de acopio' : 'Zona'}
                </ReadOnlyItem>
                <ReadOnlyItem label="Capacidad">
                  {zone.maxCapacity || 0} personas
                </ReadOnlyItem>
                {isAcopio && (
                  <>
                    <ReadOnlyItem label="Límite de basuras">
                      {zone.wasteLimit ?? '—'}
                    </ReadOnlyItem>
                    <ReadOnlyItem label="Límite de peso">
                      {zone.weightLimit != null
                        ? `${zone.weightLimit} kg`
                        : '—'}
                    </ReadOnlyItem>
                  </>
                )}
                <ReadOnlyItem label="Notas" wide>
                  {zone.notes?.trim() || (
                    <span className="italic text-muted-foreground">
                      Sin notas
                    </span>
                  )}
                </ReadOnlyItem>
              </dl>
            )}
          </section>

          {/* Personal asignado */}
          <section className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <SectionTitle
                icon={Users}
                title="Personal asignado"
                badge="Solo lectura"
              />
              {isAdmin && eventId && (
                <button
                  type="button"
                  onClick={goToAssignments}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#234465]/20 px-2.5 py-1.5 text-xs font-semibold text-[#234465] transition hover:bg-[#234465]/5 dark:border-[#7493B2]/30 dark:text-[#7493B2] dark:hover:bg-[#7493B2]/10"
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    Gestionar en Asignación masiva
                  </span>
                  <span className="sm:hidden">Gestionar</span>
                </button>
              )}
            </div>

            <OccupancyBar
              count={zone.people.length}
              capacity={zone.maxCapacity}
            />

            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
              {roleGroups.map((group) => (
                <RoleRow key={group.id} group={group} />
              ))}
            </div>

            {isAdmin && eventId && (
              <p className="text-xs leading-5 text-muted-foreground">
                Para agregar, mover o quitar personas usa{' '}
                <button
                  type="button"
                  onClick={goToAssignments}
                  className="font-semibold text-[#234465] underline-offset-2 hover:underline dark:text-[#7493B2]"
                >
                  Asignación masiva
                </button>
                .
              </p>
            )}
          </section>

          <div className="h-1 sm:hidden" />
        </div>

        {/* ── Pie ────────────────────────────────────────── */}
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-3 sm:px-6">
          {isAdmin ? (
            <button
              type="button"
              onClick={() => {
                onDeleteRequest(zone.id);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar zona
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#234465] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#234465]/90"
          >
            {isAdmin ? 'Listo' : 'Cerrar'}
          </button>
        </footer>
      </div>
    </div>
  );
}

/* ── Piezas ─────────────────────────────────────────────── */

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-[#234465] focus:ring-2 focus:ring-[#234465]/20 dark:focus:border-[#7493B2] dark:focus:ring-[#7493B2]/20';

function SectionTitle({ icon: Icon, title, description, badge }) {
  return (
    <div className="min-w-0">
      <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {title}
        {badge && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {badge}
          </span>
        )}
      </h3>
      {description && (
        <p className="mt-0.5 pl-6 text-xs text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

function Field({ label, required, optional, children }) {
  return (
    <div>
      <span className="mb-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="text-destructive">*</span>}
        {optional && (
          <span className="font-normal text-muted-foreground/70">
            (opcional)
          </span>
        )}
      </span>
      {children}
    </div>
  );
}

function TypeOption({ active, onClick, icon: Icon, label, activeClass }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold transition ${
        active
          ? `${activeClass} shadow-sm`
          : 'text-muted-foreground hover:bg-background hover:text-foreground'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function ReadOnlyItem({ label, wide, children }) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium text-foreground">{children}</dd>
    </div>
  );
}

function OccupancyBar({ count, capacity }) {
  const max = Number(capacity) || 0;
  const ratio = max > 0 ? count / max : 0;
  const over = max > 0 && count > max;
  let tone = 'bg-emerald-500';
  if (over) tone = 'bg-red-500';
  else if (ratio >= 0.8) tone = 'bg-amber-500';

  return (
    <div className="rounded-xl border border-border px-3.5 py-3">
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="text-muted-foreground">Ocupación</span>
        <span
          className={`font-semibold tabular-nums ${
            over ? 'text-red-600 dark:text-red-400' : 'text-foreground'
          }`}
        >
          {count} de {max} {max === 1 ? 'persona' : 'personas'}
          {over && ' · supera la capacidad'}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${tone}`}
          style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }}
        />
      </div>
    </div>
  );
}

function RoleRow({ group }) {
  const Icon = group.icon;
  const { people } = group;

  return (
    <div className="flex flex-col gap-2 px-3.5 py-3 sm:flex-row sm:items-start sm:gap-4">
      <div className="flex shrink-0 items-start gap-2.5 sm:w-44">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${group.iconClass}`} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {group.label}
            {group.id === 'colaborador' && people.length > 0 && (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                ({people.length})
              </span>
            )}
          </p>
          <p className="text-[11px] text-muted-foreground">{group.hint}</p>
        </div>
      </div>

      <div className="min-w-0 flex-1 pl-6 sm:pl-0">
        {people.length === 0 ? (
          <p className="py-1 text-sm italic text-muted-foreground">
            Sin asignar
          </p>
        ) : (
          <ul className="flex max-h-44 flex-wrap gap-1.5 overflow-y-auto">
            {people.map((person) => (
              <PersonChip key={`${person.role}-${person.id}`} person={person} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PersonChip({ person }) {
  const initials = (person.name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <li className="flex min-w-0 max-w-full items-center gap-2 rounded-full border border-border bg-muted/30 py-1 pl-1 pr-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#234465]/10 text-[11px] font-bold text-[#234465] dark:bg-[#7493B2]/15 dark:text-[#7493B2]">
        {initials}
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-sm font-medium text-foreground">
          {person.name || 'Sin nombre'}
        </span>
        {person.cedula && (
          <span className="block text-[11px] text-muted-foreground">
            CC {person.cedula}
          </span>
        )}
      </span>
    </li>
  );
}
