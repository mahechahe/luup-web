import {
  LayoutDashboard, /* Recycle, Leaf, Wind, Trees, */ Calendar, MapPin, ChevronRight, FileText, History,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getClienteDashboardService } from './services/clienteServices';

const BAG_COLORS = [
  { key: 'verde',  label: 'Verde',  dot: 'bg-emerald-500' },
  { key: 'blanco', label: 'Blanco', dot: 'bg-slate-400' },
  { key: 'negra',  label: 'Negra',  dot: 'bg-zinc-600' },
  { key: 'roja',   label: 'Roja',   dot: 'bg-red-500' },
];

const SERVICE_LABEL = { aseo: 'Aseo', residuos: 'Residuos', integral: 'Integral' };

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* Oculto temporalmente junto con los KPIs Globales Acumulados. */
/*
function KpiCard({ icon: Icon, label, value, unit, note, colorClass, formula, source, isEstimate }) {
  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${colorClass}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">
              {value}
              <span className="text-sm font-semibold text-muted-foreground ml-1">{unit}</span>
            </p>
            {note && <p className="text-[11px] text-muted-foreground mt-1 italic">{note}</p>}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border space-y-2">
          {isEstimate && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
              Estimación divulgativa
            </span>
          )}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Fórmula</p>
            <p className="text-xs text-foreground font-mono bg-muted rounded-md px-2.5 py-1.5">{formula}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Fuente / Criterio</p>
            <p className="text-xs text-muted-foreground">{source}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonKpi() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 animate-pulse flex items-start gap-4">
      <div className="w-11 h-11 rounded-2xl bg-muted shrink-0" />
      <div className="flex-1">
        <div className="h-3 bg-muted rounded w-24 mb-2" />
        <div className="h-7 bg-muted rounded w-16" />
      </div>
    </div>
  );
}
*/

/* Segmento de color dentro de la barra de un evento. Abre un popover con el
   detalle al pasar el mouse y tambien al tocarlo, para que funcione en movil. */
function WasteSegment({ eventName, seg }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${seg.label}: ${seg.bags} bolsas, ${seg.kg.toFixed(1)} kg`}
          className={`h-full cursor-pointer transition-opacity hover:opacity-75 focus-visible:outline-none ${seg.dot}`}
          style={{ width: `${seg.pctOfEvent}%` }}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        />
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        className="w-auto min-w-44 p-3"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${seg.dot}`} />
          <span className="text-sm font-semibold text-foreground">Bolsa {seg.label}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5 mb-2.5">{eventName}</p>
        <div className="space-y-1">
          <div className="flex items-baseline justify-between gap-6">
            <span className="text-xs text-muted-foreground">Bolsas</span>
            <span className="text-sm font-bold text-foreground tabular-nums">
              {seg.bags > 0 ? seg.bags : 'Sin registro'}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-6">
            <span className="text-xs text-muted-foreground">Peso</span>
            <span className="text-sm font-bold text-foreground tabular-nums">
              {seg.kg.toFixed(1)} kg
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ClienteDashboardPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClienteDashboardService().then((res) => {
      if (res.status) setDashboard(res.dashboard);
      else toast.error(res.errors ?? 'Error al cargar el dashboard.');
      setLoading(false);
    });
  }, []);

  // const kpis = dashboard?.kpis ?? {}; // Oculto con los KPIs Globales Acumulados.
  const kgByColor = dashboard?.kgByColor ?? {};
  const totalKg = dashboard?.totalKg ?? 0;
  const comparison = dashboard?.eventComparison ?? [];

  /* Aporte de cada evento al acumulado: pctOfTotal dimensiona la barra y
     pctOfEvent reparte sus segmentos por color de bolsa. */
  const comparisonSorted = [...comparison].sort(
    (a, b) => (Number(b.totalKg) || 0) - (Number(a.totalKg) || 0)
  );

  /* Los historicos no tienen color de bolsa ni conteo: van en su propio bloque
     de la distribucion acumulada, aunque si suman al total gestionado. */
  const operatedComparison = comparison.filter((ev) => !ev.isHistorical);
  const historicalComparison = comparisonSorted.filter((ev) => ev.isHistorical);

  const eventBreakdown = operatedComparison
    .map((ev) => {
      const evTotal = Number(ev.totalKg) || 0;
      return {
        eventId: ev.eventId,
        name: ev.name,
        totalKg: evTotal,
        pctOfTotal: totalKg > 0 ? Math.round((evTotal / totalKg) * 100) : 0,
        segments: BAG_COLORS.map(({ key, label, dot }) => {
          const kg = Number(ev.kgByColor?.[key]) || 0;
          return {
            key,
            label,
            dot,
            kg,
            bags: Number(ev.bagsByColor?.[key]) || 0,
            pctOfEvent: evTotal > 0 ? (kg / evTotal) * 100 : 0,
          };
        }).filter((seg) => seg.kg > 0),
      };
    })
    .sort((a, b) => b.totalKg - a.totalKg);

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-brand" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">Dashboard</h2>
          </div>
          <p className="text-sm text-muted-foreground">Métricas acumuladas de todos tus eventos.</p>
        </div>

        {/* KPIs Globales Acumulados — ocultos temporalmente.
            Para restaurarlos, descomentar el bloque completo.
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">KPIs Globales Acumulados</h3>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => <SkeletonKpi key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiCard
                icon={Recycle}
                label="KG Gestionados"
                value={Number(totalKg).toFixed(0)}
                unit="kg"
                colorClass="bg-brand/10 text-brand"
                formula="Suma de kg registrados en todas las bolsas de todos los eventos"
                source="Total acumulado de residuos pesados y registrados en los centros de acopio."
              />
              <KpiCard
                icon={Leaf}
                label="% Aprovechamiento"
                value={kpis.aprovechamiento ?? 0}
                unit="%"
                note="Meta ≥ 60%"
                colorClass="bg-emerald-100 text-emerald-700"
                formula="(kg bolsa verde + kg bolsa blanca) ÷ kg total × 100"
                source="Se consideran aprovechables los residuos depositados en bolsa verde y blanca. Las bolsas negra y roja se tratan como no aprovechables."
              />
              <KpiCard
                icon={Wind}
                label="% Evitado Relleno"
                value={kpis.evitadoRellenoSanitario ?? 0}
                unit="%"
                note="Meta ≥ 85%"
                colorClass="bg-green-100 text-green-700"
                formula="(kg total − kg bolsa negra) ÷ kg total × 100"
                source="Solo la bolsa negra (residuo general) se considera que va a relleno sanitario. Bolsas verde, blanca y roja son desviadas mediante reciclaje o tratamiento especial."
              />
              <KpiCard
                icon={Trees}
                label="Árboles Equivalentes"
                value={(kpis.treesEquivalent ?? 0).toLocaleString()}
                unit=""
                colorClass="bg-lime-100 text-lime-700"
                isEstimate
                formula="(kg desviados de relleno × 2.53) ÷ 21.77"
                source="Factor CO₂: 2.53 kg CO₂ por kg desviado de relleno (IPCC, 2006). Un árbol absorbe ~21.77 kg CO₂/año. Valor divulgativo para comunicar impacto de forma tangible."
              />
            </div>
          )}
        </section>
        */}

        {/* Distribución acumulada, desglosada por evento */}
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Distribución de Residuos (Acumulado)</h3>
          <Card className="border-border shadow-sm">
            <CardContent className="p-5">
              {loading ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3, 4].map((i) => <div key={i} className="h-8 bg-muted rounded-xl" />)}
                </div>
              ) : totalKg === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Sin registros de residuos aún.</p>
              ) : (
                <div className="space-y-4">
                  {eventBreakdown.map((ev) => (
                    <div key={ev.eventId}>
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <span className="text-sm font-medium text-foreground truncate">{ev.name}</span>
                        <div className="flex items-baseline gap-2 shrink-0">
                          <span className="text-sm font-bold text-foreground tabular-nums">
                            {ev.totalKg.toFixed(1)} kg
                          </span>
                          <span className="text-xs text-muted-foreground tabular-nums">({ev.pctOfTotal}%)</span>
                        </div>
                      </div>
                      {/* El ancho de la barra es el aporte del evento al acumulado;
                          los segmentos son su reparto por color de bolsa. */}
                      <div className="h-3.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full flex" style={{ width: `${ev.pctOfTotal}%` }}>
                          {ev.segments.map((seg) => (
                            <WasteSegment key={seg.key} eventName={ev.name} seg={seg} />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {historicalComparison.length > 0 && (
                    <div className="pt-3 border-t border-border space-y-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Eventos históricos
                      </p>
                      {historicalComparison.map((ev) => (
                        <div key={`h-${ev.historicalEventId}`}>
                          <div className="flex items-center justify-between gap-3 mb-1.5">
                            <span className="text-sm font-medium text-foreground truncate">
                              {ev.name}
                            </span>
                            <div className="flex items-baseline gap-2 shrink-0">
                              <span className="text-sm font-bold text-foreground tabular-nums">
                                {Number(ev.totalKg).toFixed(1)} kg
                              </span>
                              <span className="text-xs text-muted-foreground tabular-nums">
                                ({totalKg > 0 ? Math.round((ev.totalKg / totalKg) * 100) : 0}%)
                              </span>
                            </div>
                          </div>
                          <div className="h-3.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-muted-foreground/40 rounded-full"
                              style={{
                                width: `${totalKg > 0 ? Math.round((ev.totalKg / totalKg) * 100) : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                      <p className="text-[11px] text-muted-foreground">
                        Cargados manualmente. Suman al total, pero no tienen desglose por color
                        de bolsa.
                      </p>
                    </div>
                  )}

                  <div className="pt-3 border-t border-border flex items-baseline justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Total gestionado
                    </span>
                    <span className="text-xl font-bold text-foreground tabular-nums">
                      {Number(totalKg).toFixed(1)} kg
                    </span>
                  </div>

                  {/* Totales por color, hacen las veces de leyenda de los segmentos */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {BAG_COLORS.map(({ key, label, dot }) => (
                      <span key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                        {label}
                        <span className="font-semibold text-foreground tabular-nums">
                          {Number(kgByColor[key] ?? 0).toFixed(1)} kg
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Comparativo entre eventos */}
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Comparativo entre Eventos ({comparison.length})
          </h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : comparison.length === 0 ? (
            <Card className="border-border shadow-sm">
              <CardContent className="py-10 text-center">
                <p className="text-sm text-muted-foreground">Sin eventos para comparar aún.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {comparisonSorted.map((ev) =>
                ev.isHistorical ? (
                  <Card
                    key={`h-${ev.historicalEventId}`}
                    className="border-border border-dashed"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <History className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-foreground text-sm truncate">{ev.name}</p>
                          <Badge variant="secondary" className="text-[10px] mt-1">
                            Histórico
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-border flex items-center gap-6">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            KG Total
                          </p>
                          <p className="text-lg font-bold text-foreground tabular-nums leading-tight">
                            {Number(ev.totalKg).toFixed(1)}{' '}
                            <span className="text-xs font-semibold text-muted-foreground">kg</span>
                          </p>
                        </div>

                        {ev.reportUrl && (
                          <Button asChild size="sm" variant="outline" className="ml-auto shrink-0">
                            <a href={ev.reportUrl} target="_blank" rel="noopener noreferrer">
                              <FileText className="w-3.5 h-3.5" />
                              Informe
                            </a>
                          </Button>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                        {(ev.distributions ?? []).map((d) => (
                          <span key={d.id} className="text-[11px] text-muted-foreground">
                            {d.category}{' '}
                            <span className="font-semibold text-foreground tabular-nums">
                              {d.weightKg.toFixed(1)} kg
                            </span>
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                <Card
                  key={ev.eventId}
                  className="relative border-border hover:border-brand/40 hover:shadow-sm transition-all group"
                >
                  {/* Overlay clicable: cubre la tarjeta sin anidar el enlace del informe */}
                  <button
                    type="button"
                    onClick={() => navigate(`/cliente/eventos/${ev.eventId}`)}
                    className="absolute inset-0 w-full rounded-xl cursor-pointer"
                    aria-label={`Ver ${ev.name}`}
                  />
                  <CardContent className="relative p-4 pointer-events-none">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4 text-brand" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-foreground text-sm truncate">{ev.name}</p>
                          <div className="flex items-center gap-x-3 gap-y-1 mt-1 flex-wrap">
                            <span className="text-xs text-muted-foreground flex items-center gap-1 min-w-0">
                              <Calendar className="w-3 h-3 shrink-0" />
                              <span className="truncate">
                                {ev.dateType === 'stages'
                                  ? `${formatDate(ev.startDate)} — ${formatDate(ev.endDate)}`
                                  : formatDate(ev.date)}
                              </span>
                            </span>
                            {ev.location && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1 min-w-0">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate">{ev.location}</span>
                              </span>
                            )}
                            <Badge variant="secondary" className="text-[10px]">
                              {SERVICE_LABEL[ev.serviceType] ?? ev.serviceType}
                            </Badge>
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 transition-colors group-hover:text-brand" />
                      </div>

                      {/* Metricas visibles tambien en movil, donde antes quedaban ocultas */}
                      <div className="mt-3 pt-3 border-t border-border flex items-center gap-6">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">KG Total</p>
                          <p className="text-lg font-bold text-foreground tabular-nums leading-tight">
                            {Number(ev.totalKg).toFixed(1)}{' '}
                            <span className="text-xs font-semibold text-muted-foreground">kg</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Bolsas</p>
                          <p className="text-lg font-bold text-foreground tabular-nums leading-tight">
                            {Number(ev.totalBags) || 0}
                          </p>
                        </div>

                        {ev.reportUrl && (
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="ml-auto shrink-0 pointer-events-auto"
                          >
                            <a
                              href={ev.reportUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Informe
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                </Card>
                )
              )}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

export default ClienteDashboardPage;
