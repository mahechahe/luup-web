import { Users } from 'lucide-react';
import { CardContent } from '@/components/ui/card';
import { SkeletonRow } from './SkeletonRow';
import { CollaboratorRow } from './CollaboratorRow';

export function ColaboradoresTable({
  loading,
  users,
  pagination,
  hasActiveFilter,
  getRoleLabel,
  formatDate,
  genderLabel,
  genderBadgeClass,
  activeBarClass,
  onEdit,
  onView,
  onDelete,
}) {
  return (
    <>
      <div className="flex items-center justify-between px-5 h-12 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#234465]/10 dark:bg-white/10 flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-[#234465] dark:text-white" />
          </div>
          {loading ? (
            <div className="h-4 w-36 bg-muted rounded-full animate-pulse" />
          ) : (
            <span className="text-sm text-muted-foreground">
              <span className="font-bold text-foreground tabular-nums">
                {pagination.total}
              </span>{' '}
              colaborador{pagination.total !== 1 ? 'es' : ''} encontrado
              {pagination.total !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {hasActiveFilter && (
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#DD7419]/10 text-[#DD7419]">
            Filtros activos
          </span>
        )}
      </div>

      <CardContent className="p-0 m-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/40">
              <tr>
                <th className="w-1 p-0 border-b border-border" />
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase border-b border-border min-w-[200px]">
                  Nombre
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase border-b border-border hidden md:table-cell">
                  Documento
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase border-b border-border hidden md:table-cell">
                  Contacto
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase border-b border-border hidden md:table-cell">
                  Estado
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase border-b border-border">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-20 text-center text-muted-foreground"
                  >
                    No se encontraron datos.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isActive = u.isActive === 1 || u.isActive === true;
                  return (
                    <CollaboratorRow
                      key={u.userId}
                      user={u}
                      isActive={isActive}
                      activeBarClass={activeBarClass}
                      roleLabel={getRoleLabel(u.roleId)}
                      genderLabel={genderLabel}
                      genderBadgeClass={genderBadgeClass}
                      formatDate={formatDate}
                      onEdit={() => onEdit(u)}
                      onView={() => onView(u)}
                      onDelete={() => onDelete(u)}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </>
  );
}
