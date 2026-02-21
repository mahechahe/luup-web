import { Skeleton } from '@/components/ui/skeleton';

export function ZoneCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="h-1.5 bg-muted animate-pulse" />
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
        <div className="mt-4 px-3 py-2.5 rounded-xl bg-muted/30">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4 mt-1.5" />
        </div>
      </div>
      <div className="mx-6 border-t border-border" />
      <div className="px-6 py-5 space-y-5">
        <Skeleton className="h-3 w-32" />
        {/* Supervisor */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-3 w-20" />
            <div className="flex-1 h-px bg-muted" />
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border-l-4 border-muted">
            <Skeleton className="w-11 h-11 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </div>
        {/* Coordinador */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-3 w-24" />
            <div className="flex-1 h-px bg-muted" />
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border-l-4 border-muted">
            <Skeleton className="w-11 h-11 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </div>
        {/* Colaboradores */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-3 w-28" />
            <div className="flex-1 h-px bg-muted" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[0, 1].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2.5 w-20" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
