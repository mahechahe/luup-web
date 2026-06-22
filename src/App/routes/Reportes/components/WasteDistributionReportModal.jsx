import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Scale } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { getWasteDistributionsReportService } from '../services/reportesServices';

const formatKg = (value) =>
  new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));

export default function WasteDistributionReportModal({
  open,
  onOpenChange,
  zones,
}) {
  const [loading, setLoading] = useState(false);
  const [summaries, setSummaries] = useState([]);
  const [failedZones, setFailedZones] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const fetchDistributions = async () => {
      setLoading(true);
      setSummaries([]);
      setFailedZones([]);
      setError(null);

      const response = await getWasteDistributionsReportService(zones);
      if (cancelled) return;

      if (response.status) {
        setSummaries(response.summaries);
        setFailedZones(response.failedZones);
      } else {
        setError(response.errors);
        setFailedZones(response.failedZones);
      }
      setLoading(false);
    };

    fetchDistributions();
    return () => {
      cancelled = true;
    };
  }, [open, zones]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-hidden p-0 gap-0">
        <DialogHeader className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-border bg-gradient-to-br from-[#DD7419]/10 via-background to-background">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <span className="w-9 h-9 rounded-xl bg-[#DD7419]/12 text-[#A6520B] flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </span>
            Distribución de kilogramos
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Clasificación del peso ingresado, separada por centro de acopio.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto px-5 sm:px-6 py-5">
          {loading ? (
            <div className="space-y-4" aria-label="Cargando distribuciones">
              {[0, 1].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-border p-4 space-y-3"
                >
                  <Skeleton className="h-4 w-40" />
                  <div className="grid grid-cols-3 gap-2">
                    <Skeleton className="h-14 rounded-xl" />
                    <Skeleton className="h-14 rounded-xl" />
                    <Skeleton className="h-14 rounded-xl" />
                  </div>
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-5 py-8 text-center">
              <AlertTriangle className="w-7 h-7 text-destructive mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">
                No fue posible cargar la distribución
              </p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
          ) : zones.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-5 py-10 text-center">
              <Scale className="w-7 h-7 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm font-semibold">No hay centros de acopio</p>
              <p className="text-xs text-muted-foreground mt-1">
                Este evento no tiene centros disponibles para consultar.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {failedZones.length > 0 && (
                <div className="flex gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    No se pudo consultar {failedZones.length} centro
                    {failedZones.length !== 1 ? 's' : ''}:{' '}
                    {failedZones.map((zone) => zone.name).join(', ')}.
                  </span>
                </div>
              )}

              {summaries.map(({ zone, summary }) => {
                const progress =
                  summary.totalInputKg > 0
                    ? Math.min(
                        100,
                        (summary.distributedKg / summary.totalInputKg) * 100
                      )
                    : 0;

                return (
                  <section
                    key={zone.id}
                    className="rounded-2xl border border-border bg-card overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">
                          {zone.name}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                          Centro de acopio
                        </p>
                      </div>
                      {summary.isComplete && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" /> Completa
                        </span>
                      )}
                    </div>

                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          [
                            'Ingresado',
                            summary.totalInputKg,
                            'text-foreground',
                          ],
                          [
                            'Distribuido',
                            summary.distributedKg,
                            'text-[#A6520B]',
                          ],
                          ['Pendiente', summary.remainingKg, 'text-[#DD7419]'],
                        ].map(([label, value, color]) => (
                          <div
                            key={label}
                            className="rounded-xl bg-muted/70 px-2 py-2.5 text-center min-w-0"
                          >
                            <p
                              className={`text-sm sm:text-base font-black tabular-nums ${color}`}
                            >
                              {formatKg(value)}{' '}
                              <span className="text-[9px] font-semibold">
                                kg
                              </span>
                            </p>
                            <p className="text-[9px] uppercase tracking-wide font-bold text-muted-foreground mt-0.5">
                              {label}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div>
                        <div className="h-2 rounded-full bg-[#DD7419]/15 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#DD7419] to-[#A6520B] transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground font-semibold mt-1.5 text-right">
                          {progress.toFixed(1)}% distribuido
                        </p>
                      </div>

                      {summary.distributions.length > 0 ? (
                        <div className="divide-y divide-border rounded-xl border border-border">
                          {summary.distributions.map((distribution) => (
                            <div
                              key={distribution.id}
                              className="flex items-center justify-between gap-3 px-3 py-2.5"
                            >
                              <p className="text-xs font-semibold text-foreground min-w-0 truncate">
                                {distribution.category}
                              </p>
                              <p className="text-sm font-black tabular-nums text-[#A6520B] shrink-0">
                                {formatKg(distribution.weightKg)}{' '}
                                <span className="text-[10px]">kg</span>
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-[#DD7419]/25 px-4 py-4 text-center">
                          <p className="text-xs font-semibold text-muted-foreground">
                            {summary.totalInputKg > 0
                              ? 'Aún no hay kilogramos distribuidos.'
                              : 'Este centro todavía no registra peso de entrada.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
