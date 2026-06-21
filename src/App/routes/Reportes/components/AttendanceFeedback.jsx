import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function CollaboratorCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex gap-4">
      <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="h-4 w-44 rounded" />
        <Skeleton className="h-3 w-28 rounded" />
        <div className="flex gap-2 mt-1">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-5 w-20 rounded-full shrink-0" />
    </div>
  );
}

export function ExcelLoadingModal({ open }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-card border border-border rounded-3xl shadow-2xl px-10 py-10 flex flex-col items-center gap-5 w-[300px]">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
            <FileSpreadsheet className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-card border-2 border-border flex items-center justify-center">
            <Loader2 className="w-4 h-4 text-brand animate-spin" />
          </div>
        </div>

        <div className="text-center">
          <p className="font-bold text-foreground text-base">Generando Excel</p>
          <p className="text-sm text-muted-foreground mt-1">
            Preparando el reporte…
          </p>
        </div>

        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full animate-[progress_2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
