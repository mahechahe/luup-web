import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PaginationFooter({ pagination, onLimitChange, onPageChange }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-3.5 border-t border-border">
      <span className="text-xs text-muted-foreground">
        Mostrando{' '}
        <span className="font-medium text-foreground">
          {pagination.total === 0
            ? 0
            : (pagination.page - 1) * pagination.limit + 1}
          –
          {Math.min(
            pagination.page * pagination.limit,
            pagination.total
          )}
        </span>{' '}
        de{' '}
        <span className="font-medium text-foreground">
          {pagination.total}
        </span>{' '}
        registros
      </span>

      <div className="flex items-center gap-3">
        <div className="relative">
          <select
            value={pagination.limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="appearance-none bg-background border border-border text-sm text-foreground rounded-lg px-3 py-1.5 pr-7 outline-none cursor-pointer hover:border-brand focus:border-brand transition-colors"
          >
            <option value={10}>10 / página</option>
            <option value={25}>25 / página</option>
            <option value={50}>50 / página</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none w-3.5 h-3.5 text-muted-foreground" />
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={pagination.page === 1}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground px-2 min-w-[4rem] text-center tabular-nums">
            {pagination.page} / {Math.max(pagination.totalPages, 1)}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
