import { PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PopoverRow } from './PopoverRow';

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
      <button className="text-left group">
        <span className="font-semibold text-foreground group-hover:underline block">
          {user.firstName} {user.lastName}
        </span>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-xs text-muted-foreground">
            {roleLabel}
          </span>
          {gLabel && gClass && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${gClass}`}>
              {gLabel}
            </span>
          )}
          <span className={`md:hidden text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
            isActive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-red-50 text-red-600 border-red-200'
          }`}>
            {isActive ? 'Activo' : 'Inactivo'}
          </span>
        </div>
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
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0 text-white font-bold text-sm">
          {user.firstName?.[0]}{user.lastName?.[0]}
        </div>
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
