import {
  LayoutDashboard, Recycle, Leaf, Wind, Trees, Calendar, MapPin, ChevronRight,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  const kpis = dashboard?.kpis ?? {};
  const kgByColor = dashboard?.kgByColor ?? {};
  const totalKg = dashboard?.totalKg ?? 0;
  const comparison = dashboard?.eventComparison ?? [];

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

        {/* KPIs globales */}
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

        {/* Distribución global de kg por color */}
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
                <div className="space-y-3">
                  {BAG_COLORS.map(({ key, label, dot }) => {
                    const kg = kgByColor[key] ?? 0;
                    const pct = totalKg > 0 ? Math.round((kg / totalKg) * 100) : 0;
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                            <span className="text-sm font-medium text-foreground">{label}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-bold text-foreground">{Number(kg).toFixed(1)} kg</span>
                            <span className="text-xs text-muted-foreground">({pct}%)</span>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${dot}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
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
                <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />
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
              {comparison.map((ev) => (
                <button
                  key={ev.eventId}
                  type="button"
                  onClick={() => navigate(`/cliente/eventos/${ev.eventId}`)}
                  className="w-full text-left"
                >
                  <Card className="border-border hover:border-brand/40 hover:shadow-sm transition-all group">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Calendar className="w-4 h-4 text-brand" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground text-sm truncate">{ev.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {ev.dateType === 'stages'
                                ? `${formatDate(ev.startDate)} — ${formatDate(ev.endDate)}`
                                : formatDate(ev.date)}
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {SERVICE_LABEL[ev.serviceType] ?? ev.serviceType}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-muted-foreground">KG Total</p>
                          <p className="text-base font-bold text-foreground">{Number(ev.totalKg).toFixed(0)} kg</p>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-muted-foreground">Aprovech.</p>
                          <p className="text-base font-bold text-foreground">{ev.kpis.aprovechamiento}%</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-brand transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

export default ClienteDashboardPage;
