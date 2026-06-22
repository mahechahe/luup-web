import { PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PopoverRow } from './PopoverRow';

function CollaboratorAvatar({ user, className = 'h-9 w-9', textClassName = 'text-xs' }) {
  return (
    <span className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand/10 font-bold text-brand ${className} ${textClassName}`}>
      <span>{user.firstName?.[0]}{user.lastName?.[0]}</span>
      {user.photoUrl && (
        <img
          src={user.photoUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={(event) => { event.currentTarget.style.display = 'none'; }}
        />
      )}
    </span>
  );
}

export function CollaboratorPopover({
  user,
  isActive,
  roleLabel,
  genderLabel,
  genderBadgeClass,
  formatDate,
}) {
  const gLabel = genderLabel(user.gender);
  const gClass = genderBadgeClass(user.gender);

  return (
    <PopoverTrigger asChild>
      <button className="group flex items-center gap-3 text-left">
        <CollaboratorAvatar user={user} />
        <span className="min-w-0">
          <span className="block truncate font-semibold text-foreground group-hover:underline">
            {user.firstName} {user.lastName}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">
              {roleLabel}
            </span>
            {gLabel && gClass && (
              <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${gClass}`}>
                {gLabel}
              </span>
            )}
            <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold md:hidden ${
              isActive
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-600'
            }`}>
              {isActive ? 'Activo' : 'Inactivo'}
            </span>
          </span>
        </span>
      </button>
    </PopoverTrigger>
  );
}

export function CollaboratorPopoverContent({
  user,
  isActive,
  roleLabel,
  formatDate,
}) {
  return (
    <PopoverContent className="w-72 p-0 overflow-hidden" align="start">
      <div className="bg-[#234465] px-4 py-3 flex items-center gap-3">
        <CollaboratorAvatar
          user={user}
          className="h-10 w-10 bg-white/20 text-white ring-1 ring-white/25"
          textClassName="text-sm"
        />
        <div className="min-w-0">
          <p className="font-semibold text-white text-sm truncate">{user.firstName} {user.lastName}</p>
          <p className="text-xs text-white/60 truncate">{roleLabel}</p>
        </div>
        <span className={`ml-auto shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
          isActive
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            : 'bg-red-500/20 text-red-300 border-red-500/30'
        }`}>
          {isActive ? 'Activo' : 'Inactivo'}
        </span>
      </div>
      <div className="px-4 py-3 space-y-2.5">
        <PopoverRow label="Documento" value={`${user.documentType?.code || 'CC'} ${user.username}`} />
        <PopoverRow label="Email" value={user.email} />
        <PopoverRow label="Teléfono" value={user.phone} />
        <PopoverRow label="Edad" value={user.age != null ? `${user.age} años` : null} />
        <PopoverRow label="Género" value={
          user.gender === 'male' ? 'Masculino'
          : user.gender === 'female' ? 'Femenino'
          : user.gender === 'other' ? 'Otro'
          : null
        } />
        <PopoverRow label="Creado" value={formatDate(user.createdAt)} />
      </div>
    </PopoverContent>
  );
}
