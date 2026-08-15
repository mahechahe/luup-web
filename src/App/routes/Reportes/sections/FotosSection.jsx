import { useCallback, useEffect, useMemo, useState } from 'react';
import { ImageIcon, RefreshCw, Trash2, Truck, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getWasteSignedUrlService,
  getTruckExitSignedUrlService,
} from '@/App/routes/Eventos/services/eventServices';
import { getEventPhotosService } from '../services/reportesServices';

const PAGE_SIZE = 20;

const TYPE_STYLES = {
  ingreso: {
    badge:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    icon: Trash2,
    label: 'Ingreso',
  },
  salida: {
    badge:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    icon: Truck,
    label: 'Salida',
  },
};

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

function PhotoCard({ photo }) {
  const [imgUrl, setImgUrl] = useState(null);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [open, setOpen] = useState(false);

  const typeStyle = TYPE_STYLES[photo.type];
  const TypeIcon = typeStyle.icon;

  const dt = new Date(photo.createdAt);
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

  useEffect(() => {
    let cancelled = false;

    const fetchUrl = async () => {
      const res =
        photo.type === 'ingreso'
          ? await getWasteSignedUrlService(photo.zoneId, photo.id)
          : await getTruckExitSignedUrlService(photo.zoneId, photo.id);

      if (cancelled) return;

      if (res.status && res.signedUrl) {
        setImgUrl(res.signedUrl);
      } else {
        setImgError(true);
      }
      setImgLoading(false);
    };

    fetchUrl();
    return () => {
      cancelled = true;
    };
  }, [photo.id, photo.type, photo.zoneId]);

  return (
    <>
      <button
        onClick={() => !imgLoading && !imgError && setOpen(true)}
        disabled={imgLoading || imgError}
        className="flex flex-col rounded-2xl overflow-hidden border border-border bg-card hover:shadow-md transition-shadow disabled:cursor-default group"
      >
        <div className="aspect-square w-full bg-muted relative overflow-hidden">
          {imgLoading ? (
            <Skeleton className="absolute inset-0 rounded-none" />
          ) : imgError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
              <span className="text-[10px] text-muted-foreground/60">
                No disponible
              </span>
            </div>
          ) : (
            <img
              src={imgUrl}
              alt={`Foto ${photo.type} ${photo.zoneName}`}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}
        </div>

        <div className="p-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeStyle.badge}`}
            >
              <TypeIcon className="w-2.5 h-2.5" />
              {typeStyle.label}
            </span>
            <span className="text-[10px] text-muted-foreground truncate">
              {photo.zoneName}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {dateStr} · {timeStr}
          </p>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeStyle.badge}`}
              >
                <TypeIcon className="w-2.5 h-2.5" />
                {typeStyle.label}
              </span>
              {photo.zoneName} · {dateStr} {timeStr}
            </DialogTitle>
          </DialogHeader>
          {imgUrl && (
            <img
              src={imgUrl}
              alt={`Foto ${photo.type}`}
              className="w-full rounded-xl object-contain max-h-[65vh]"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function PhotoCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
        <Skeleton className="h-3 w-28 rounded" />
      </div>
    </div>
  );
}

export default function FotosSection({ eventId }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: 'all', zoneId: 'all' });
  const [page, setPage] = useState(1);

  const acopioZones = useMemo(() => {
    const map = {};
    photos.forEach((p) => {
      map[p.zoneId] = p.zoneName;
    });
    return Object.entries(map).map(([id, name]) => ({ id, name }));
  }, [photos]);

  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      if (filters.type !== 'all' && p.type !== filters.type) return false;
      if (filters.zoneId !== 'all' && String(p.zoneId) !== filters.zoneId)
        return false;
      return true;
    });
  }, [photos, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredPhotos.length / PAGE_SIZE));
  const pagedPhotos = filteredPhotos.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const ingresosCount = useMemo(
    () => photos.filter((p) => p.type === 'ingreso').length,
    [photos]
  );
  const salidasCount = useMemo(
    () => photos.filter((p) => p.type === 'salida').length,
    [photos]
  );

  const hasActiveFilters = filters.type !== 'all' || filters.zoneId !== 'all';

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    const res = await getEventPhotosService(eventId);
    if (res.status) {
      setPhotos(res.photos);
      setPage(1);
    } else {
      toast.error(res.errors ?? 'Error al cargar las fotos.');
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    fetchPhotos();
  }, [eventId, fetchPhotos]);

  const Pagination = () =>
    totalPages > 1 ? (
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
    ) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <button
          onClick={() => fetchPhotos()}
          disabled={loading}
          className="w-10 h-10 rounded-xl border border-border bg-card flex items-center justify-center text-foreground hover:bg-muted transition-colors disabled:opacity-40"
          title="Actualizar fotos"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {!loading && photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <StatChip
            icon={ImageIcon}
            label="Total fotos"
            value={photos.length}
            highlight
          />
          <StatChip icon={Trash2} label="Ingresos" value={ingresosCount} />
          <StatChip icon={Truck} label="Salidas" value={salidasCount} />
        </div>
      )}

      {!loading && photos.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Filtros
            </p>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setFilters({ type: 'all', zoneId: 'all' });
                  setPage(1);
                }}
                className="flex items-center gap-1 text-xs text-brand hover:underline"
              >
                <X className="w-3 h-3" />
                Limpiar
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={filters.type}
              onValueChange={(v) => handleFilterChange('type', v)}
            >
              <SelectTrigger className="flex-1 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="ingreso">Ingresos</SelectItem>
                <SelectItem value="salida">Salidas</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.zoneId}
              onValueChange={(v) => handleFilterChange('zoneId', v)}
            >
              <SelectTrigger className="flex-1 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los centros de acopio</SelectItem>
                {acopioZones.map((z) => (
                  <SelectItem key={z.id} value={z.id}>
                    {z.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PhotoCardSkeleton key={i} />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
            <ImageIcon className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">Sin fotos</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            No hay registros con foto adjunta en este evento.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {filteredPhotos.length} foto
              {filteredPhotos.length !== 1 ? 's' : ''}
              {hasActiveFilters && ' (filtradas)'}
            </span>
          </div>

          {filteredPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-medium text-foreground mb-1">
                Sin resultados
              </p>
              <p className="text-xs text-muted-foreground">
                No hay fotos con los filtros aplicados.
              </p>
            </div>
          ) : (
            <>
              <Pagination />
              <div className="grid grid-cols-2 gap-3">
                {pagedPhotos.map((photo) => (
                  <PhotoCard key={`${photo.type}-${photo.id}`} photo={photo} />
                ))}
              </div>
              <Pagination />
            </>
          )}
        </>
      )}
    </div>
  );
}
