import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, FileText, Loader2, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  listHistoricalEventsService,
  createHistoricalEventService,
  updateHistoricalEventService,
  deleteHistoricalEventService,
  uploadHistoricalReportService,
} from '../../Cliente/services/clienteServices';

const emptyRow = () => ({ category: '', weightKg: '' });

/* Suma en centavos para no arrastrar error de punto flotante, igual que el API. */
function sumKg(rows) {
  const cents = rows.reduce((acc, r) => {
    const n = Number(String(r.weightKg).replace(',', '.'));
    return acc + (Number.isFinite(n) ? Math.round(n * 100) : 0);
  }, 0);
  return cents / 100;
}

/* ─── Formulario de alta / edición ─── */

function HistoricalForm({ clientId, editing, onCancel, onSaved }) {
  const [name, setName] = useState('');
  const [rows, setRows] = useState([emptyRow()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setRows(
        editing.distributions.length
          ? editing.distributions.map((d) => ({
              category: d.category,
              weightKg: String(d.weightKg),
            }))
          : [emptyRow()]
      );
    } else {
      setName('');
      setRows([emptyRow()]);
    }
  }, [editing]);

  const setRow = (idx, patch) =>
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const removeRow = (idx) =>
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));

  const handleSave = async () => {
    const cleanName = name.trim();
    if (!cleanName) {
      toast.error('El nombre del evento es obligatorio.');
      return;
    }

    const distributions = rows
      .map((r) => ({
        category: r.category.trim(),
        weightKg: String(r.weightKg).replace(',', '.').trim(),
      }))
      .filter((r) => r.category || r.weightKg);

    if (distributions.length === 0) {
      toast.error('Agrega al menos una categoría con su peso.');
      return;
    }
    const incomplete = distributions.find((r) => !r.category || !r.weightKg);
    if (incomplete) {
      toast.error('Cada categoría necesita nombre y peso.');
      return;
    }

    setSaving(true);
    const body = { name: cleanName, distributions };
    const res = editing
      ? await updateHistoricalEventService(editing.historicalEventId, body)
      : await createHistoricalEventService(clientId, body);
    setSaving(false);

    if (!res.status) {
      toast.error(res.errors ?? 'No se pudo guardar el evento.');
      return;
    }

    toast.success(editing ? 'Evento actualizado.' : 'Evento histórico creado.');
    onSaved();
  };

  const total = sumKg(rows);

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="hist-name">Nombre del evento</Label>
        <Input
          id="hist-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Festival Verde 2024"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Distribución de kilogramos</Label>
          <span className="text-xs text-muted-foreground tabular-nums">
            Total: <span className="font-bold text-foreground">{total.toFixed(2)} kg</span>
          </span>
        </div>

        {rows.map((row, idx) => (
          // Las filas no tienen id estable hasta guardarse; el índice es la única clave.
          // eslint-disable-next-line react/no-array-index-key
          <div key={idx} className="flex items-center gap-2">
            <Input
              value={row.category}
              onChange={(e) => setRow(idx, { category: e.target.value })}
              placeholder="Categoría (ej. Plástico)"
              className="flex-1"
              maxLength={120}
            />
            <Input
              value={row.weightKg}
              onChange={(e) => setRow(idx, { weightKg: e.target.value })}
              placeholder="0.00"
              inputMode="decimal"
              className="w-28 text-right"
            />
            <span className="text-xs text-muted-foreground w-5">kg</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => removeRow(idx)}
              disabled={rows.length === 1}
              aria-label={`Quitar categoría ${idx + 1}`}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setRows((prev) => [...prev, emptyRow()])}
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar categoría
        </Button>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {editing ? 'Guardar cambios' : 'Crear evento'}
        </Button>
      </div>
    </div>
  );
}

/* ─── Fila de un evento histórico ─── */

function HistoricalRow({ item, onEdit, onDelete, onUpload, uploading }) {
  const fileRef = useRef(null);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{item.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
            {item.totalKg.toFixed(2)} kg · {item.distributions.length}{' '}
            {item.distributions.length === 1 ? 'categoría' : 'categorías'}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(item)} aria-label={`Editar ${item.name}`}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(item)}
            aria-label={`Eliminar ${item.name}`}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="mt-3 space-y-1">
        {item.distributions.map((d) => (
          <div key={d.id} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground truncate">{d.category}</span>
            <span className="font-semibold text-foreground tabular-nums shrink-0 ml-3">
              {d.weightKg.toFixed(2)} kg
              <span className="text-muted-foreground font-normal ml-1.5">({d.pct}%)</span>
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center gap-2">
        {item.reportUrl && (
          <Button asChild variant="outline" size="sm">
            <a href={item.reportUrl} target="_blank" rel="noopener noreferrer">
              <Download className="h-3.5 w-3.5" />
              Ver informe
            </a>
          </Button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(item, file);
            e.target.value = '';
          }}
        />
        <Button
          variant={item.hasReport ? 'ghost' : 'default'}
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {item.hasReport ? 'Reemplazar PDF' : 'Subir PDF'}
        </Button>
      </div>
    </div>
  );
}

/* ─── Modal ─── */

export default function HistoricalEventsDrawer({ open, onClose, client }) {
  const clientId = client?.user?.userId;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);

  const load = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    const res = await listHistoricalEventsService(clientId);
    if (res.status) setItems(res.historical);
    else toast.error(res.errors ?? 'Error al cargar los eventos históricos.');
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    if (open) {
      setShowForm(false);
      setEditing(null);
      load();
    }
  }, [open, load]);

  const handleUpload = async (item, file) => {
    if (file.type !== 'application/pdf') {
      toast.error('El informe debe ser un archivo PDF.');
      return;
    }
    setUploadingId(item.historicalEventId);
    const res = await uploadHistoricalReportService(item.historicalEventId, file);
    setUploadingId(null);
    if (res.status) {
      toast.success('Informe subido correctamente.');
      load();
    } else {
      toast.error(res.errors ?? 'No se pudo subir el informe.');
    }
  };

  const handleDelete = async () => {
    const res = await deleteHistoricalEventService(toDelete.historicalEventId);
    setToDelete(null);
    if (res.status) {
      toast.success('Evento histórico eliminado.');
      load();
    } else {
      toast.error(res.errors ?? 'No se pudo eliminar el evento.');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-lg max-h-[90dvh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-5 pt-5 pb-4 border-b border-border shrink-0">
            <DialogTitle>Eventos históricos</DialogTitle>
            <DialogDescription>
              Eventos anteriores a Luup de {client?.user?.firstName} {client?.user?.lastName}.
              Solo guardan nombre, distribución de kilogramos y el informe en PDF.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {showForm ? (
              <HistoricalForm
                clientId={clientId}
                editing={editing}
                onCancel={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                onSaved={() => {
                  setShowForm(false);
                  setEditing(null);
                  load();
                }}
              />
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setEditing(null);
                  setShowForm(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Agregar evento histórico
              </Button>
            )}

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 && !showForm ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground">Sin eventos históricos</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Agrega eventos anteriores para que el cliente los vea junto a los demás.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <HistoricalRow
                  key={item.historicalEventId}
                  item={item}
                  uploading={uploadingId === item.historicalEventId}
                  onEdit={(it) => {
                    setEditing(it);
                    setShowForm(true);
                  }}
                  onDelete={setToDelete}
                  onUpload={handleUpload}
                />
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este evento histórico?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará &quot;{toDelete?.name}&quot;, su distribución de kilogramos y el
              informe en PDF. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
