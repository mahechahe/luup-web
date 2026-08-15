import {
  ArrowLeft, Calendar, MapPin, Leaf, Recycle, Wind, Trees,
  FileText, ExternalLink, Users, LayoutGrid, Warehouse, Navigation, ArrowRight,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getClienteEventoSummaryService } from './services/clienteServices';
import { MODULES } from '../Eventos/eventModules';

/* Módulos visibles solo en la vista de cliente (no aparecen en el hub de admin). */
const CLIENT_ONLY_MODULES = [
  {
    id: 'map-layout',
    title: 'Mapa en vivo',
    description: 'Ubicación en tiempo real de los colaboradores dentro del evento.',
    icon: Navigation,
    color: '#0ea5e9',
    index: '02b',
  },
];

const CLIENT_MODULES = (() => {
  const withoutClientes = MODULES.filter((m) => m.id !== 'clientes');
  const canvasIdx = withoutClientes.findIndex((m) => m.id === 'canvas');
  return [
    ...withoutClientes.slice(0, canvasIdx + 1),
    ...CLIENT_ONLY_MODULES,
    ...withoutClientes.slice(canvasIdx + 1),
  ];
})();

/* ─── constants ─── */

const BAG_COLOR_CONFIG = {
  verde:  { label: 'Verde',  bar: '#10b981', dot: '#10b981', light: '#d1fae5' },
  blanco: { label: 'Blanco', bar: '#94a3b8', dot: '#94a3b8', light: '#f1f5f9' },
  negra:  { label: 'Negra',  bar: '#52525b', dot: '#52525b', light: '#f4f4f5' },
  roja:   { label: 'Roja',   bar: '#ef4444', dot: '#ef4444', light: '#fee2e2' },
};

const SERVICE_LABEL = { aseo: 'Aseo', residuos: 'Residuos', integral: 'Integral' };

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ─── KpiCard ─── */

function KpiCard({ icon: Icon, label, value, unit, note, formula, source, isEstimate, accent, idx }) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-border bg-card p-6 animate-in fade-in slide-in-from-bottom-3"
      style={{ animationDelay: `${idx * 70}ms`, animationFillMode: 'both' }}
    >
      {/* accent stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: accent }} />

      <div className="pl-3">
        {/* Label row */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${accent}18` }}
          >
            <Icon className="w-4 h-4" style={{ color: accent }} />
          </div>
          <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground">
            {label}
          </span>
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="text-4xl font-black tabular-nums leading-none text-foreground">
            {value}
          </span>
          <span className="text-base font-bold text-muted-foreground">{unit}</span>
        </div>

        {note && (
          <p className="text-[11px] font-medium mt-1 mb-3" style={{ color: accent }}>
            {note}
          </p>
        )}

        {/* Technical detail */}
        <div className="mt-4 pt-3 border-t border-border space-y-2">
          {isEstimate && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
              Estimación divulgativa
            </span>
          )}
          <p className="text-xs font-mono bg-muted text-foreground rounded-md px-2.5 py-1.5 leading-relaxed">
            {formula}
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{source}</p>
        </div>
      </div>
    </div>
  );
}

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

/* ─── WasteBar ─── */

function WasteBar({ color, kg, pct, cfg, idx }) {
  return (
    <div
      className="animate-in fade-in slide-in-from-left-2"
      style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: cfg.bar }}
          />
          <span className="text-sm font-semibold text-foreground">{cfg.label}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold text-foreground tabular-nums">
            {Number(kg).toFixed(1)} <span className="text-xs font-normal text-muted-foreground">kg</span>
          </span>
          <span
            className="text-xs font-bold tabular-nums min-w-[2.5rem] text-right"
            style={{ color: cfg.bar }}
          >
            {pct}%
          </span>
        </div>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            backgroundColor: cfg.bar,
            transitionDelay: `${idx * 80 + 200}ms`,
          }}
        />
      </div>
    </div>
  );
}

/* ─── Skeleton helpers ─── */

function SkeletonKpi() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-muted shrink-0" />
        <div className="h-3 bg-muted rounded w-28" />
      </div>
      <div className="h-10 bg-muted rounded w-24 mb-1" />
      <div className="h-3 bg-muted rounded w-20 mt-4" />
    </div>
  );
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
  const kpis      = summary?.kpis ?? {};

  const kpiList = [
    {
      icon: Recycle,
      label: '% Aprovechamiento',
      value: kpis.aprovechamiento ?? 0,
      unit: '%',
      note: 'Meta ≥ 60 %',
      accent: '#10b981',
      formula: '(kg verde + kg blanca) ÷ kg total × 100',
      source: 'Bolsas verde y blanca se consideran aprovechables. Bolsas negra y roja son no aprovechables.',
    },
    {
      icon: Leaf,
      label: '% Evitado de Relleno Sanitario',
      value: kpis.evitadoRellenoSanitario ?? 0,
      unit: '%',
      note: 'Meta ≥ 85 %',
      accent: '#22c55e',
      formula: '(kg total − kg negra) ÷ kg total × 100',
      source: 'Solo bolsa negra se considera residuo destinado a relleno sanitario.',
    },
    {
      icon: Wind,
      label: 'CO₂ Evitado',
      value: (kpis.co2AvoidedKg ?? 0).toLocaleString('es-CO'),
      unit: 'kg CO₂',
      accent: '#0ea5e9',
      isEstimate: true,
      formula: 'kg desviados de relleno × 2.53',
      source: 'Factor 2.53 kg CO₂/kg desviado — IPCC 2006 (RSU).',
    },
    {
      icon: Trees,
      label: 'Equivalente en Árboles',
      value: (kpis.treesEquivalent ?? 0).toLocaleString('es-CO'),
      unit: 'árboles',
      accent: '#84cc16',
      isEstimate: true,
      formula: 'kg CO₂ evitado ÷ 21.77',
      source: 'Un árbol maduro absorbe ~21.77 kg CO₂/año (referencia divulgativa estándar).',
    },
  ];

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

        {/* KPIs */}
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

        {/* Waste distribution */}
        <section>
          <h2 className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground mb-4">
            Distribución de Residuos
          </h2>
          <div className="rounded-2xl border border-border bg-card p-6">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-2.5 bg-muted rounded-full" />
                  </div>
                ))}
              </div>
            ) : totalKg === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Sin registros de residuos aún.
              </p>
            ) : (
              <div className="space-y-5">
                {Object.entries(kgByColor).map(([color, kg], idx) => {
                  const cfg = BAG_COLOR_CONFIG[color] ?? {
                    label: color, bar: '#94a3b8', dot: '#94a3b8', light: '#f1f5f9',
                  };
                  const pct = totalKg > 0 ? Math.round((kg / totalKg) * 100) : 0;
                  return (
                    <WasteBar key={color} color={color} kg={kg} pct={pct} cfg={cfg} idx={idx} />
                  );
                })}

                <div className="pt-4 border-t border-border flex items-baseline justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Total gestionado
                  </span>
                  <span className="text-2xl font-black tabular-nums text-foreground">
                    {Number(totalKg).toFixed(1)}{' '}
                    <span className="text-sm font-semibold text-muted-foreground">kg</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

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
            <a
              href={summary.reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-bold text-brand hover:opacity-80 shrink-0 transition-opacity"
            >
              Ver informe <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}

export default ClienteEventoDetailPage;
