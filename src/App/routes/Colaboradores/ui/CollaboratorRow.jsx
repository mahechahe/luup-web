import { Pencil, Eye, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover } from '@/components/ui/popover';
import { CollaboratorPopover, CollaboratorPopoverContent } from './CollaboratorPopover';

export function CollaboratorRow({
  user,
  isActive,
  activeBarClass,
  roleLabel,
  genderLabel,
  genderBadgeClass,
  formatDate,
  onEdit,
  onView,
  onDelete,
}) {
  return (
    <tr className="border-b border-border hover:bg-muted/30">
      <td className={`w-1 p-0 ${activeBarClass(isActive)}`} />
      <td className="px-4 py-3.5 min-w-[200px]">
        <Popover>
          <CollaboratorPopover
            user={user}
            isActive={isActive}
            roleLabel={roleLabel}
            genderLabel={genderLabel}
            genderBadgeClass={genderBadgeClass}
            formatDate={formatDate}
          />
          <CollaboratorPopoverContent
            user={user}
            isActive={isActive}
            roleLabel={roleLabel}
            formatDate={formatDate}
          />
        </Popover>
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap hidden md:table-cell">
        <Badge variant="outline" className="mr-2">
          {user.documentType?.code || 'CC'}
        </Badge>
        <span className="text-xs">{user.username}</span>
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell">
        <span className="text-sm text-foreground block">
          {user.email ?? '—'}
        </span>
        <span className="text-xs text-muted-foreground block mt-0.5">
          {user.phone ?? '—'}
        </span>
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell">
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
          isActive
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-red-50 text-red-600 border-red-200'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-400'}`} />
          {isActive ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 md:px-3 text-brand"
            onClick={onEdit}
          >
            <Pencil className="w-3.5 h-3.5" />
            <span className="hidden md:inline ml-1">Editar</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 md:px-3 text-sky-600"
            onClick={onView}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden md:inline ml-1">Ver</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 md:px-3 text-red-500"
            onClick={onDelete}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline ml-1">Eliminar</span>
          </Button>
        </div>
      </td>
    </tr>
  );
}
