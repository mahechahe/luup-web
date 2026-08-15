import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarIcon,
  ChevronDown,
  Clock,
  ImageIcon,
  Loader2,
  Package2,
  RefreshCw,
  Scale,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getWasteSignedUrlService } from '@/App/routes/Eventos/services/eventServices';
import {
  getAcopioZonesService,
  getWasteLogsReportService,
} from '../services/reportesServices';
import WasteDistributionReportModal from '../components/WasteDistributionReportModal';

const PAGE_SIZE = 100;

const ZONE_PALETTE = [
  {
    border: 'border-l-emerald-500',
    badge:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  {
    border: 'border-l-blue-500',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  },
  {
    border: 'border-l-amber-500',
    badge:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  },
  {
    border: 'border-l-violet-500',
    badge:
      'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  },
  {
    border: 'border-l-rose-500',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  },
  {
    border: 'border-l-cyan-500',
    badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  },
];

const BAG_COLOR_STYLES = {
  verde:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  blanco: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  negra: 'bg-zinc-800 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-200',
  roja: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const BAG_COLOR_OPTIONS = [
  { value: 'verde', label: 'Verde' },
  { value: 'blanco', label: 'Blanco' },
  { value: 'negra', label: 'Negra' },
  { value: 'roja', label: 'Roja' },
];

const EMPTY_FILTERS = { bagColor: '', date: '', zoneId: '' };

function StatChip({ icon: Icon, label, value, highlight }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl text-center ${
        highlight ? 'bg-brand/10 text-brand' : 'bg-muted text-muted-foreground'
      }`}
    >
      <Icon className="w-4 h-4 mb-0.5" />
      <span className="text-lg font-bold leading-none">{value}</span>
      <span className="text-[10px] font-medium leading-tight">{label}</span>
    </div>
  );
}

function WasteLogCard({ log, colorIndex }) {
  const palette = ZONE_PALETTE[colorIndex % ZONE_PALETTE.length];
  const [imgOpen, setImgOpen] = useState(false);
  const [imgUrl, setImgUrl] = useState(null);
  const [imgLoading, setImgLoading] = useState(false);

  const dt = new Date(log.createdAt);
  const dateStr = dt.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = dt.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const handleViewImage = async () => {
    setImgOpen(true);
    if (imgUrl) return;
    setImgLoading(true);
    const res = await getWasteSignedUrlService(log.zoneId, log.id);
    if (res.status) {
      setImgUrl(res.signedUrl);
    } else {
      toast.error('No se pudo cargar la imagen.');
      setImgOpen(false);
    }
    setImgLoading(false);
  };

  return (
    <>
      <div
        className={`bg-card border border-border border-l-4 ${palette.border} rounded-2xl p-4`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5 min-w-0">
            <span className="text-xs text-muted-foreground font-medium">
              {dateStr} · {timeStr}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {log.entryType === 'tools' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#234465]/10 dark:bg-[#7493B2]/20 text-[#234465] dark:text-[#7493B2]">
                  <Wrench className="w-3 h-3" />
                  Herramienta
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#DD7419]/10 text-[#DD7419]">
                  <Trash2 className="w-3 h-3" />
                  Bolsa
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {log.quantity != null && (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-foreground">
                  <Package2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  {log.quantity}{' '}
                  {log.entryType === 'tools'
                    ? `herramienta${log.quantity !== 1 ? 's' : ''}`
                    : `bolsa${log.quantity !== 1 ? 's' : ''}`}
                </span>
              )}
              {log.weightKg != null && (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-foreground">
                  <Scale className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  {log.weightKg} kg
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {log.bagColor && (
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${
                    BAG_COLOR_STYLES[log.bagColor] ??
                    'bg-muted text-muted-foreground'
                  }`}
                >
                  Bolsa {log.bagColor}
                </span>
              )}
              {log.imageUrl && (
                <button
                  onClick={handleViewImage}
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 hover:opacity-80 transition-opacity"
                >
                  <ImageIcon className="w-3 h-3" />
                  Ver foto
                </button>
              )}
            </div>
            {log.note && (
              <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-2">
                {log.note}
              </p>
            )}
          </div>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${palette.badge}`}
          >
            {log.zoneName}
          </span>
        </div>
      </div>

      <Dialog open={imgOpen} onOpenChange={setImgOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Foto del ingreso · {dateStr} {timeStr}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center min-h-48">
            {imgLoading ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Cargando imagen…
                </p>
              </div>
            ) : imgUrl ? (
              <img
                src={imgUrl}
                alt="Foto del ingreso de residuos"
                className="w-full rounded-xl object-contain max-h-[60vh]"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function groupByDayAndHour(logs) {
  const map = {};
  for (const log of logs) {
    const dt = new Date(log.createdAt);
    const dayKey = dt.toLocaleDateString('es-CO', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const hourLabel = `${String(dt.getHours()).padStart(2, '0')}:00`;

    if (!map[dayKey]) {
      map[dayKey] = {
        label: dayKey,
        totalQty: 0,
        totalKg: 0,
        count: 0,
        hours: {},
      };
    }
    map[dayKey].totalQty += log.quantity ?? 0;
    map[dayKey].totalKg += log.weightKg ?? 0;
    map[dayKey].count += 1;

    if (!map[dayKey].hours[hourLabel]) {
      map[dayKey].hours[hourLabel] = { qty: 0, kg: 0, count: 0 };
    }
    map[dayKey].hours[hourLabel].qty += log.quantity ?? 0;
    map[dayKey].hours[hourLabel].kg += log.weightKg ?? 0;
    map[dayKey].hours[hourLabel].count += 1;
  }

  return Object.values(map).map((day) => ({
    ...day,
    totalKg: Math.round(day.totalKg * 100) / 100,
    hours: Object.entries(day.hours)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hour, d]) => ({ hour, ...d, kg: Math.round(d.kg * 100) / 100 })),
  }));
}

function ConsolidadoView({ logs }) {
  const [expandedDays, setExpandedDays] = useState({});
  const days = useMemo(() => groupByDayAndHour(logs), [logs]);

  const toggle = (label) =>
    setExpandedDays((prev) => ({ ...prev, [label]: !prev[label] }));

  if (days.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Sin datos para consolidar.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {days.map((day) => (
        <div
          key={day.label}
          className="bg-card border border-border rounded-2xl overflow-hidden"
        >
          <button
            onClick={() => toggle(day.label)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-foreground capitalize">
                {day.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {day.count} registro{day.count !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">
                  {day.totalQty} bolsas
                </p>
                <p className="text-xs text-muted-foreground">
                  {day.totalKg} kg
                </p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform ${
                  expandedDays[day.label] ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {expandedDays[day.label] && (
            <div className="border-t border-border px-4 pb-3 pt-3 bg-muted/20">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                Por hora
              </p>
              <div className="flex flex-col gap-1.5">
                {day.hours.map((h) => (
                  <div
                    key={h.hour}
                    className="flex items-center justify-between bg-card rounded-xl px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground">
                        {h.hour}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {h.count} reg.
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-foreground">
                        {h.qty} bolsas
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {h.kg} kg
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function LogCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3">
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="h-3 w-32 rounded" />
        <Skeleton className="h-4 w-44 rounded" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-5 w-24 rounded-full shrink-0" />
    </div>
  );
}

export default function IngresosSection({ eventId }) {
  const [logs, setLogs] = useState([]);
  const [acopioZones, setAcopioZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('lista');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [reportWarning, setReportWarning] = useState(null);
  const [distributionOpen, setDistributionOpen] = useState(false);

  const selectedDate = filters.date
    ? parse(filters.date, 'yyyy-MM-dd', new Date())
    : undefined;

  const zoneColorMap = useMemo(() => {
    const uniqueIds = [...new Set(logs.map((l) => l.zoneId))];
    return Object.fromEntries(uniqueIds.map((id, i) => [id, i]));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filters.bagColor && log.bagColor !== filters.bagColor) return false;
      if (filters.date) {
        const logDate = new Date(log.createdAt).toISOString().slice(0, 10);
        if (logDate !== filters.date) return false;
      }
      return true;
    });
  }, [logs, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const pagedLogs = filteredLogs.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const totalQty = useMemo(
    () => logs.reduce((sum, l) => sum + (l.quantity ?? 0), 0),
    [logs]
  );
  const totalKg = useMemo(
    () =>
      Math.round(logs.reduce((sum, l) => sum + (l.weightKg ?? 0), 0) * 100) /
      100,
    [logs]
  );

  const hasActiveFilters = filters.bagColor || filters.date || filters.zoneId;

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const fetchLogs = useCallback(
    async (zoneId = '') => {
      setLoading(true);
      setReportWarning(null);
      const res = await getWasteLogsReportService(eventId, zoneId || null);
      if (res.status) {
        setLogs(res.logs);
        setPage(1);
        if (res.partial) {
          const warning = `Reporte parcial: no se pudo consultar ${
            res.failedZones.length
          } zona${res.failedZones.length === 1 ? '' : 's'} de acopio.`;
          setReportWarning(warning);
          toast.warning(warning);
        }
      } else {
        setLogs([]);
        toast.error(res.errors ?? 'Error al cargar los ingresos.');
      }
      setLoading(false);
    },
    [eventId]
  );

  const handleZoneChange = (value) => {
    const zoneId = value === 'all' ? '' : value;
    handleFilterChange('zoneId', zoneId);
    fetchLogs(zoneId);
  };

  useEffect(() => {
    if (!eventId) return;
    getAcopioZonesService(eventId).then((res) => {
      if (res.status) {
        setAcopioZones(res.zones);
      } else {
        toast.error(res.errors ?? 'Error al cargar las zonas de acopio.');
      }
    });
    fetchLogs();
  }, [eventId, fetchLogs]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => setDistributionOpen(true)}
          disabled={acopioZones.length === 0}
          className="h-10 rounded-xl gap-2 border-[#DD7419]/30 text-[#A6520B] hover:bg-[#DD7419]/10 hover:text-[#8E4508]"
        >
          <Scale className="w-4 h-4" />
          Ver distribución
        </Button>
        <button
          onClick={() => fetchLogs(filters.zoneId)}
          disabled={loading}
          className="w-10 h-10 rounded-xl border border-border bg-card flex items-center justify-center text-foreground hover:bg-muted transition-colors disabled:opacity-40"
          title="Actualizar ingresos"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {reportWarning && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          {reportWarning} Los datos mostrados pueden estar incompletos.
        </div>
      )}

      {!loading && logs.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <StatChip
            icon={Package2}
            label="Bolsas ingresadas"
            value={totalQty}
            highlight
          />
          <StatChip icon={Scale} label="Kilogramos" value={`${totalKg} kg`} />
        </div>
      )}

      <div className="flex gap-1 p-1 bg-muted rounded-xl">
        {['lista', 'consolidado'].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 py-1.5 text-sm font-medium rounded-lg capitalize transition-all ${
              view === v
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {view === 'lista' &&
        !loading &&
        (acopioZones.length > 0 || logs.length > 0) && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Filtros
              </p>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    handleClearFilters();
                    fetchLogs('');
                  }}
                  className="flex items-center gap-1 text-xs text-brand hover:underline"
                >
                  <X className="w-3 h-3" />
                  Limpiar
                </button>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Select
                value={filters.zoneId || 'all'}
                onValueChange={handleZoneChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los centros de acopio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    Todos los centros de acopio
                  </SelectItem>
                  {acopioZones.map((zone) => (
                    <SelectItem key={zone.id} value={String(zone.id)}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select
                  value={filters.bagColor || 'all'}
                  onValueChange={(v) =>
                    handleFilterChange('bagColor', v === 'all' ? '' : v)
                  }
                >
                  <SelectTrigger className="flex-1 w-full">
                    <SelectValue placeholder="Todos los colores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los colores</SelectItem>
                    {BAG_COLOR_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 h-9 justify-start text-left font-normal rounded-md border-border bg-card text-sm"
                    >
                      <CalendarIcon className="mr-2 w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      {selectedDate ? (
                        <span className="text-foreground">
                          {format(selectedDate, "d 'de' MMMM yyyy", {
                            locale: es,
                          })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          Seleccionar día
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(day) => {
                        handleFilterChange(
                          'date',
                          day ? format(day, 'yyyy-MM-dd') : ''
                        );
                        setCalendarOpen(false);
                      }}
                      locale={es}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <LogCardSkeleton key={i} />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
            <Trash2 className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            Sin ingresos
          </p>
          <p className="text-xs text-muted-foreground max-w-xs">
            No hay registros de ingreso de residuos para este evento.
          </p>
        </div>
      ) : view === 'lista' ? (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {filteredLogs.length} registro
              {filteredLogs.length !== 1 ? 's' : ''}
              {hasActiveFilters &&
                ` (filtrado${filteredLogs.length !== 1 ? 's' : ''})`}
            </span>
            {filteredLogs.length === 0 && hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-brand hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-medium text-foreground mb-1">
                Sin resultados
              </p>
              <p className="text-xs text-muted-foreground">
                No hay registros con los filtros aplicados.
              </p>
            </div>
          ) : (
            <>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page <= 1}
                    className="px-4 py-2 text-sm font-medium rounded-xl border border-border bg-card text-foreground disabled:opacity-40 hover:bg-muted transition-colors"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages}
                    className="px-4 py-2 text-sm font-medium rounded-xl border border-border bg-card text-foreground disabled:opacity-40 hover:bg-muted transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {pagedLogs.map((log) => (
                  <WasteLogCard
                    key={log.id}
                    log={log}
                    colorIndex={zoneColorMap[log.zoneId] ?? 0}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page <= 1}
                    className="px-4 py-2 text-sm font-medium rounded-xl border border-border bg-card text-foreground disabled:opacity-40 hover:bg-muted transition-colors"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages}
                    className="px-4 py-2 text-sm font-medium rounded-xl border border-border bg-card text-foreground disabled:opacity-40 hover:bg-muted transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <ConsolidadoView logs={logs} />
      )}

      <WasteDistributionReportModal
        open={distributionOpen}
        onOpenChange={setDistributionOpen}
        zones={acopioZones}
      />
    </div>
  );
}
