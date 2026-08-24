import {
  ArrowLeft, Calendar, MapPin, /* Leaf, Recycle, Wind, Trees, */
  FileText, ExternalLink, Users, LayoutGrid, Warehouse, ArrowRight,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getClienteEventoSummaryService } from './services/clienteServices';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { MODULES } from '../Eventos/eventModules';

/* El cliente solo ve los modulos que no son exclusivos de admin
   (quedan fuera Inventario y Clientes). */
const CLIENT_MODULES = MODULES.filter((m) => !m.adminOnly);

/* ─── constants ─── */

const BAG_COLOR_CONFIG = {
  verde:  { label: 'Verde',  bar: '#10b981', dot: '#10b981', light: '#d1fae5' },
  blanco: { label: 'Blanco', bar: '#94a3b8', dot: '#94a3b8', light: '#f1f5f9' },
  negra:  { label: 'Negra',  bar: '#52525b', dot: '#52525b', light: '#f4f4f5' },
  roja:   { label: 'Roja',   bar: '#ef4444', dot: '#ef4444', light: '#fee2e2' },
};

const SERVICE_LABEL = { aseo: 'Aseo', residuos: 'Residuos', integral: 'Integral' };

/* Las categorias son texto libre, asi que el color se asigna por posicion. */
const CATEGORY_PALETTE = [
  '#234465', '#DD7419', '#10b981', '#7C3AED', '#0ea5e9',
  '#f59e0b', '#ec4899', '#4f6d44', '#64748b', '#dc2626',
];

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Oculto temporalmente junto con la seccion Impacto Ambiental.
//
// function KpiCard({ icon: Icon, label, value, unit, note, formula, source, isEstimate, accent, idx }) {
//   return (
//     <div
//       className="relative rounded-2xl overflow-hidden border border-border bg-card p-6 animate-in fade-in slide-in-from-bottom-3"
//       style={{ animationDelay: `${idx * 70}ms`, animationFillMode: 'both' }}
//     >
//       {/* accent stripe */}
//       <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: accent }} />
//
//       <div className="pl-3">
//         {/* Label row */}
//         <div className="flex items-center gap-2 mb-3">
//           <div
//             className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
//             style={{ backgroundColor: `${accent}18` }}
//           >
//             <Icon className="w-4 h-4" style={{ color: accent }} />
//           </div>
//           <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground">
//             {label}
//           </span>
//         </div>
//
//         {/* Value */}
//         <div className="flex items-baseline gap-1.5 mb-1">
//           <span className="text-4xl font-black tabular-nums leading-none text-foreground">
//             {value}
//           </span>
//           <span className="text-base font-bold text-muted-foreground">{unit}</span>
//         </div>
//
//         {note && (
//           <p className="text-[11px] font-medium mt-1 mb-3" style={{ color: accent }}>
//             {note}
//           </p>
//         )}
//
//         {/* Technical detail */}
//         <div className="mt-4 pt-3 border-t border-border space-y-2">
//           {isEstimate && (
//             <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
//               Estimación divulgativa
//             </span>
//           )}
//           <p className="text-xs font-mono bg-muted text-foreground rounded-md px-2.5 py-1.5 leading-relaxed">
//             {formula}
//           </p>
//           <p className="text-[11px] text-muted-foreground leading-relaxed">{source}</p>
//         </div>
//       </div>
//     </div>
//   );
// }

/* ─── StatPill ─── */

function StatPill({ icon: Icon, label, value, idx }) {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-card py-5 px-3 animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDelay: `${idx * 60}ms`, animationFillMode: 'both' }}
    >
      <Icon className="w-4 h-4 text-muted-foreground" />
      <p className="text-3xl font-black tabular-nums text-foreground leading-none">{value}</p>
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide text-center leading-tight">{label}</p>
    </div>
  );
}

// Oculto temporalmente junto con la seccion Impacto Ambiental.
//
// function SkeletonKpi() {
//   return (
//     <div className="rounded-2xl border border-border bg-card p-6 animate-pulse">
//       <div className="flex items-center gap-2 mb-3">
//         <div className="w-8 h-8 rounded-lg bg-muted shrink-0" />
//         <div className="h-3 bg-muted rounded w-28" />
//       </div>
//       <div className="h-10 bg-muted rounded w-24 mb-1" />
//       <div className="h-3 bg-muted rounded w-20 mt-4" />
//     </div>
//   );
// }

/* Cifra grande de cabecera de la seccion de residuos. */
function TotalTile({ label, value, unit }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-2xl font-black tabular-nums text-foreground leading-tight mt-0.5">
        {value}
        {unit && <span className="text-sm font-bold text-muted-foreground ml-1">{unit}</span>}
      </p>
    </div>
  );
}

/* Cifra de la barra ingresado / clasificado / pendiente. */
function ProgressStat({ label, value, tone }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`text-xl font-black tabular-nums leading-tight ${tone}`}>
        {value.toFixed(1)}
        <span className="text-xs font-bold text-muted-foreground ml-1">kg</span>
      </p>
    </div>
  );
}

function EmptyTab({ text }) {
  return <p className="text-sm text-muted-foreground text-center py-10">{text}</p>;
}

/* "2026-08-23" -> "23 ago" sin pasar por new Date(): la cadena ya viene
   calculada en hora Colombia por el API. */
const MONTH_ABBR = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

function formatDayTick(iso) {
  if (typeof iso !== 'string') return iso;
  const [, month, day] = iso.split('-');
  if (!month || !day) return iso;
  return `${Number(day)} ${MONTH_ABBR[Number(month) - 1] ?? ''}`.trim();
}

/* ─── Page ─── */

function ClienteEventoDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClienteEventoSummaryService(eventId).then((res) => {
      if (res.status) setSummary(res.summary);
      else toast.error(res.errors ?? 'Error al cargar el resumen.');
      setLoading(false);
    });
  }, [eventId]);

  const ev        = summary?.event;
  const stats     = summary?.stats ?? {};
  const kgByColor = summary?.wasteSummary?.kgByColor ?? {};
  const totalKg   = summary?.wasteSummary?.totalKg ?? 0;
  const bagsByColor = summary?.wasteSummary?.bagsByColor ?? {};
  const totalBags = summary?.wasteSummary?.totalBags ?? 0;
  const byZone    = summary?.wasteSummary?.byZone ?? [];
  const byDay     = summary?.wasteSummary?.byDay ?? [];
  const distribution = summary?.wasteSummary?.distribution ?? {};

  /* En que se clasifico el material que entro al acopio. */
  const categoryRows = (distribution.byCategory ?? []).map((row, idx) => ({
    ...row,
    kg: Number(row.kg) || 0,
    fill: CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length],
  }));

  const categoryChartConfig = categoryRows.reduce(
    (acc, row) => ({ ...acc, [row.category]: { label: row.category, color: row.fill } }),
    {}
  );

  const inputKg       = Number(distribution.totalInputKg) || 0;
  const distributedKg = Number(distribution.distributedKg) || 0;
  const remainingKg   = Number(distribution.remainingKg) || 0;
  const pctClassified = Number(distribution.pctClassified) || 0;

  /* Una fila por color con kg, bolsas y % del total. Se descartan los
     colores sin registros para no dibujar segmentos vacios. */
  const colorRows = Object.entries(kgByColor)
    .map(([key, kg]) => {
      const cfg = BAG_COLOR_CONFIG[key] ?? { label: key, bar: '#94a3b8' };
      const kgNum = Number(kg) || 0;
      return {
        key,
        label: cfg.label,
        fill: cfg.bar,
        kg: kgNum,
        bags: Number(bagsByColor[key]) || 0,
        pct: totalKg > 0 ? Math.round((kgNum / totalKg) * 100) : 0,
      };
    })
    .filter((row) => row.kg > 0)
    .sort((a, b) => b.kg - a.kg);

  const colorChartConfig = colorRows.reduce(
    (acc, row) => ({ ...acc, [row.label]: { label: row.label, color: row.fill } }),
    {}
  );
  // Oculto temporalmente junto con la seccion Impacto Ambiental.
  // const kpis      = summary?.kpis ?? {};
  //
  // const kpiList = [
  //   {
  //     icon: Recycle,
  //     label: '% Aprovechamiento',
  //     value: kpis.aprovechamiento ?? 0,
  //     unit: '%',
  //     note: 'Meta ≥ 60 %',
  //     accent: '#10b981',
  //     formula: '(kg verde + kg blanca) ÷ kg total × 100',
  //     source: 'Bolsas verde y blanca se consideran aprovechables. Bolsas negra y roja son no aprovechables.',
  //   },
  //   {
  //     icon: Leaf,
  //     label: '% Evitado de Relleno Sanitario',
  //     value: kpis.evitadoRellenoSanitario ?? 0,
  //     unit: '%',
  //     note: 'Meta ≥ 85 %',
  //     accent: '#22c55e',
  //     formula: '(kg total − kg negra) ÷ kg total × 100',
  //     source: 'Solo bolsa negra se considera residuo destinado a relleno sanitario.',
  //   },
  //   {
  //     icon: Wind,
  //     label: 'CO₂ Evitado',
  //     value: (kpis.co2AvoidedKg ?? 0).toLocaleString('es-CO'),
  //     unit: 'kg CO₂',
  //     accent: '#0ea5e9',
  //     isEstimate: true,
  //     formula: 'kg desviados de relleno × 2.53',
  //     source: 'Factor 2.53 kg CO₂/kg desviado — IPCC 2006 (RSU).',
  //   },
  //   {
  //     icon: Trees,
  //     label: 'Equivalente en Árboles',
  //     value: (kpis.treesEquivalent ?? 0).toLocaleString('es-CO'),
  //     unit: 'árboles',
  //     accent: '#84cc16',
  //     isEstimate: true,
  //     formula: 'kg CO₂ evitado ÷ 21.77',
  //     source: 'Un árbol maduro absorbe ~21.77 kg CO₂/año (referencia divulgativa estándar).',
  //   },
  // ];

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-7">

        {/* Back */}
        <button
          type="button"
          onClick={() => navigate('/cliente/eventos')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Mis eventos
        </button>

        {/* Event header */}
        {loading ? (
          <div className="animate-pulse space-y-2 pt-1">
            <div className="h-8 bg-muted rounded w-72" />
            <div className="h-4 bg-muted rounded w-52 mt-2" />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2" style={{ animationFillMode: 'both' }}>
            <h1 className="text-3xl font-black tracking-tight text-foreground leading-tight">
              {ev?.name}
            </h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {ev?.location && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {ev.location}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                {ev?.dateType === 'stages'
                  ? `${formatDate(ev.startDate)} — ${formatDate(ev.endDate)}`
                  : formatDate(ev?.date)}
              </span>
              {summary?.serviceType && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                  {SERVICE_LABEL[summary.serviceType] ?? summary.serviceType}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Informe final */}
        {!loading && summary?.reportUrl && (
          <div className="rounded-2xl border border-brand/30 bg-brand/5 p-5 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-brand" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">Informe Final disponible</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Informe completo de operación del evento.
                </p>
              </div>
            </div>
            <Button asChild className="shrink-0">
              <a href={summary.reportUrl} target="_blank" rel="noopener noreferrer">
                Ver informe <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </Button>
          </div>
        )}

        {/* Stats strip */}
        {loading ? (
          <div className="flex gap-3 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 flex-1 bg-muted rounded-2xl" />)}
          </div>
        ) : (
          <div className="flex gap-3">
            <StatPill idx={0} icon={Users}      label="Colaboradores"     value={stats.totalCollaborators ?? 0} />
            <StatPill idx={1} icon={LayoutGrid}  label="Zonas"            value={stats.totalZones ?? 0} />
            <StatPill idx={2} icon={Warehouse}   label="Centros de Acopio" value={stats.totalAcopioZones ?? 0} />
          </div>
        )}

        {/* Módulos del evento */}
        <section>
          <h2 className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground mb-4">
            Detalle del evento
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CLIENT_MODULES.map((m, idx) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() =>
                    navigate(`/cliente/eventos/${eventId}/${m.id}`, {
                      state: m.id === 'reporte' ? { backTo: `/cliente/eventos/${eventId}` } : undefined,
                    })
                  }
                  className="group flex items-center gap-3.5 text-left rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-md hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                    style={{ backgroundColor: `${m.color}18` }}
                  >
                    <Icon className="w-4.5 h-4.5" style={{ color: m.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground">{m.title}</p>
                    <p className="text-xs text-muted-foreground leading-snug line-clamp-1">{m.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-1" />
                </button>
              );
            })}
          </div>
        </section>

        {/* Impacto Ambiental — oculto temporalmente.
            Para restaurarlo, descomentar el bloque completo.
        <section>
          <h2 className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground mb-4">
            Impacto Ambiental
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => <SkeletonKpi key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {kpiList.map((kpi, idx) => (
                <KpiCard key={kpi.label} {...kpi} idx={idx} />
              ))}
            </div>
          )}
        </section>
        */}

        {/* Distribucion de residuos: totales, composicion, acopio y evolucion */}
        <section>
          <h2 className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground mb-4">
            Distribución de Residuos
          </h2>

          {loading ? (
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="space-y-4 animate-pulse">
                <div className="h-16 bg-muted rounded-xl" />
                <div className="h-48 bg-muted rounded-xl" />
              </div>
            </div>
          ) : totalKg === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="text-sm text-muted-foreground text-center py-8">
                Sin registros de residuos aún.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <TotalTile
                  label="Total gestionado"
                  value={Number(totalKg).toFixed(1)}
                  unit="kg"
                />
                <TotalTile
                  label="Bolsas"
                  value={totalBags > 0 ? totalBags.toLocaleString('es-CO') : '\u2014'}
                  unit=""
                />
                <TotalTile
                  label="Promedio por bolsa"
                  value={totalBags > 0 ? (totalKg / totalBags).toFixed(1) : '\u2014'}
                  unit={totalBags > 0 ? 'kg' : ''}
                />
              </div>

              <Card className="border-border shadow-sm">
                <CardContent className="p-5">
                  <Tabs defaultValue="categoria">
                    <TabsList className="w-full grid grid-cols-4 h-9 rounded-xl bg-muted p-1">
                      <TabsTrigger value="categoria" className="rounded-lg text-xs">
                        Clasificación
                      </TabsTrigger>
                      <TabsTrigger value="color" className="rounded-lg text-xs">
                        Por color
                      </TabsTrigger>
                      <TabsTrigger value="acopio" className="rounded-lg text-xs">
                        Por acopio
                      </TabsTrigger>
                      <TabsTrigger value="dia" className="rounded-lg text-xs">
                        Por día
                      </TabsTrigger>
                    </TabsList>

                    {/* En que se clasifico el material ingresado */}
                    <TabsContent value="categoria" className="mt-5">
                      {categoryRows.length === 0 ? (
                        <EmptyTab text="Este evento aún no tiene material clasificado por categoría." />
                      ) : (
                        <div className="space-y-5">
                          {/* Ingresado / clasificado / pendiente */}
                          <div>
                            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 mb-3">
                              <ProgressStat label="Ingresado" value={inputKg} tone="text-foreground" />
                              <ProgressStat label="Clasificado" value={distributedKg} tone="text-brand" />
                              <ProgressStat label="Pendiente" value={remainingKg} tone="text-muted-foreground" />
                            </div>
                            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-brand rounded-full transition-all duration-700"
                                style={{ width: `${Math.min(100, pctClassified)}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1.5">
                              {pctClassified}% del material ingresado ya está clasificado.
                            </p>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center gap-6">
                            <ChartContainer
                              config={categoryChartConfig}
                              className="aspect-square h-48 w-48 shrink-0"
                            >
                              <PieChart>
                                <ChartTooltip
                                  cursor={false}
                                  content={<ChartTooltipContent nameKey="category" hideLabel />}
                                />
                                <Pie
                                  data={categoryRows}
                                  dataKey="kg"
                                  nameKey="category"
                                  innerRadius="58%"
                                  outerRadius="92%"
                                  paddingAngle={2}
                                >
                                  {categoryRows.map((row) => (
                                    <Cell key={row.category} fill={row.fill} stroke="var(--card)" />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ChartContainer>

                            <div className="flex-1 w-full space-y-3">
                              {categoryRows.map((row) => (
                                <div key={row.category}>
                                  <div className="flex items-center gap-3 mb-1">
                                    <span
                                      className="w-2.5 h-2.5 rounded-full shrink-0"
                                      style={{ backgroundColor: row.fill }}
                                    />
                                    <span className="text-sm font-medium text-foreground flex-1 truncate">
                                      {row.category}
                                    </span>
                                    <span className="text-sm font-bold text-foreground tabular-nums">
                                      {row.kg.toFixed(1)} kg
                                    </span>
                                    <span
                                      className="text-xs font-bold tabular-nums w-10 text-right"
                                      style={{ color: row.fill }}
                                    >
                                      {row.pct}%
                                    </span>
                                  </div>
                                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full"
                                      style={{ width: `${row.pct}%`, backgroundColor: row.fill }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    {/* Composicion por color de bolsa */}
                    <TabsContent value="color" className="mt-5">
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        <ChartContainer
                          config={colorChartConfig}
                          className="aspect-square h-48 w-48 shrink-0"
                        >
                          <PieChart>
                            <ChartTooltip
                              cursor={false}
                              content={<ChartTooltipContent nameKey="label" hideLabel />}
                            />
                            <Pie
                              data={colorRows}
                              dataKey="kg"
                              nameKey="label"
                              innerRadius="58%"
                              outerRadius="92%"
                              paddingAngle={2}
                            >
                              {colorRows.map((row) => (
                                <Cell key={row.key} fill={row.fill} stroke="var(--card)" />
                              ))}
                            </Pie>
                          </PieChart>
                        </ChartContainer>

                        <div className="flex-1 w-full space-y-3">
                          {colorRows.map((row) => (
                            <div key={row.key} className="flex items-center gap-3">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: row.fill }}
                              />
                              <span className="text-sm font-medium text-foreground flex-1 truncate">
                                {row.label}
                              </span>
                              <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                                {row.bags > 0 ? `${row.bags} bolsas` : 'sin conteo'}
                              </span>
                              <span className="text-sm font-bold text-foreground tabular-nums w-20 text-right">
                                {row.kg.toFixed(1)} kg
                              </span>
                              <span
                                className="text-xs font-bold tabular-nums w-10 text-right"
                                style={{ color: row.fill }}
                              >
                                {row.pct}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    {/* De que centro de acopio viene cada kilo */}
                    <TabsContent value="acopio" className="mt-5">
                      {byZone.length === 0 ? (
                        <EmptyTab text="Sin registros por centro de acopio." />
                      ) : (
                        <ChartContainer
                          config={{ kg: { label: 'Kg' } }}
                          className="w-full"
                          style={{ height: `${Math.max(170, byZone.length * 46)}px` }}
                        >
                          <BarChart
                            data={byZone}
                            layout="vertical"
                            margin={{ left: 4, right: 16, top: 4, bottom: 4 }}
                          >
                            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                            <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
                            <YAxis
                              type="category"
                              dataKey="zoneName"
                              tickLine={false}
                              axisLine={false}
                              width={110}
                              fontSize={11}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="kg" fill="#234465" radius={[0, 6, 6, 0]} />
                          </BarChart>
                        </ChartContainer>
                      )}
                    </TabsContent>

                    {/* Evolucion dia a dia */}
                    <TabsContent value="dia" className="mt-5">
                      {byDay.length === 0 ? (
                        <EmptyTab text="Sin registros por día." />
                      ) : (
                        <ChartContainer config={{ kg: { label: 'Kg' } }} className="w-full h-56">
                          <BarChart data={byDay} margin={{ left: 4, right: 8, top: 4, bottom: 4 }}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                            <XAxis
                              dataKey="date"
                              tickLine={false}
                              axisLine={false}
                              fontSize={11}
                              tickFormatter={formatDayTick}
                            />
                            <YAxis tickLine={false} axisLine={false} fontSize={11} width={40} />
                            <ChartTooltip
                              content={<ChartTooltipContent labelFormatter={formatDayTick} />}
                            />
                            <Bar dataKey="kg" fill="#DD7419" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ChartContainer>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}
        </section>

        <div className="h-4" />
      </div>
    </div>
  );
}

export default ClienteEventoDetailPage;
