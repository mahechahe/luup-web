import { useEffect, useMemo, useState } from 'react';
import { Loader2, Scale, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  createWasteDistributionService,
  updateWasteDistributionService,
} from '../../services/eventServices';

const EMPTY_FORM = { category: '', weightKg: '' };
const QUICK_CATEGORIES = [
  'Plástico',
  'Papel y cartón',
  'Vidrio',
  'Metales',
  'Orgánicos',
  'No aprovechables',
];

const formatKg = (value) =>
  Number(value ?? 0).toLocaleString('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const parseLocalizedKg = (rawValue) => {
  const raw = String(rawValue ?? '').trim().replace(/\s/g, '');
  if (!raw || !/^\d[\d.,]*$/.test(raw)) return { value: 0, valid: false };

  const lastDot = raw.lastIndexOf('.');
  const lastComma = raw.lastIndexOf(',');
  const hasBothSeparators = lastDot >= 0 && lastComma >= 0;

  if (hasBothSeparators) {
    const decimalIndex = Math.max(lastDot, lastComma);
    const decimals = raw.slice(decimalIndex + 1);
    if (!/^\d{1,2}$/.test(decimals)) return { value: 0, valid: false };

    const integerPart = raw.slice(0, decimalIndex).replace(/[.,]/g, '');
    const normalized = `${integerPart}.${decimals}`;
    return { value: Number(normalized), valid: /^\d+\.\d{1,2}$/.test(normalized) };
  }

  const separator = lastComma >= 0 ? ',' : lastDot >= 0 ? '.' : null;
  if (!separator) return { value: Number(raw), valid: /^\d+$/.test(raw) };

  const parts = raw.split(separator);
  if (parts.some((part) => !/^\d+$/.test(part))) {
    return { value: 0, valid: false };
  }

  if (parts.length === 2 && parts[1].length <= 2) {
    return { value: Number(`${parts[0]}.${parts[1]}`), valid: true };
  }

  const validThousands =
    parts[0].length >= 1 &&
    parts[0].length <= 3 &&
    parts.slice(1).every((part) => part.length === 3);
  if (!validThousands) return { value: 0, valid: false };

  return { value: Number(parts.join('')), valid: true };
};

export function WasteDistributionModal({
  open,
  onClose,
  zone,
  distribution,
  summary,
  onSave,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const editing = !!distribution;

  useEffect(() => {
    if (!open) return;
    setForm(
      distribution
        ? {
            category: distribution.category,
            weightKg: String(distribution.weightKg),
          }
        : EMPTY_FORM,
    );
    setError(null);
  }, [open, distribution]);

  const availableKg = useMemo(
    () =>
      Number(summary?.remainingKg ?? 0) +
      (distribution ? Number(distribution.weightKg) : 0),
    [summary, distribution],
  );
  const parsedWeight = parseLocalizedKg(form.weightKg);
  const weightKg = parsedWeight.value;
  const hasValidPrecision = parsedWeight.valid;
  const exceedsAvailable =
    hasValidPrecision && Math.round(weightKg * 100) > Math.round(availableKg * 100);
  const isValid =
    form.category.trim().length > 0 &&
    form.category.trim().length <= 120 &&
    hasValidPrecision &&
    weightKg > 0 &&
    !exceedsAvailable;

  const handleClose = () => {
    if (saving) return;
    setForm(EMPTY_FORM);
    setError(null);
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isValid) return;
    setSaving(true);
    setError(null);

    const body = {
      category: form.category.trim(),
      weightKg: Number(weightKg.toFixed(2)),
    };
    const res = editing
      ? await updateWasteDistributionService(zone.id, distribution.id, body)
      : await createWasteDistributionService(zone.id, body);

    if (!res.status) {
      setError(res.errors);
      setSaving(false);
      return;
    }

    onSave(zone.id, res.summary);
    setSaving(false);
    handleClose();
  };

  return (
    <Dialog
      open={open && !!zone}
      onOpenChange={(isOpen) => !isOpen && handleClose()}
    >
      <DialogContent className="w-full max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="flex-row items-center gap-3 px-5 pt-5 pb-4 space-y-0 bg-gradient-to-r from-[#DD7419]/12 to-transparent">
          <div className="w-10 h-10 rounded-xl bg-[#DD7419] text-white flex items-center justify-center shadow-sm">
            <Scale className="w-5 h-5" />
          </div>
          <div className="flex-1 text-left">
            <DialogTitle className="text-base font-bold">
              {editing ? 'Editar distribución' : 'Distribuir kilogramos'}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">{zone?.name}</p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-5 py-4 space-y-4">
            <div className="rounded-xl border border-[#DD7419]/20 bg-[#DD7419]/7 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#DD7419]/70">
                  Disponible para asignar
                </p>
                <p className="text-2xl font-black text-[#DD7419] leading-none mt-1">
                  {formatKg(availableKg)}
                  <span className="text-xs font-semibold ml-1">kg</span>
                </p>
              </div>
              <Scale className="w-6 h-6 text-[#DD7419]/35" />
            </div>

            <div>
              <label
                htmlFor="waste-distribution-category"
                className="text-xs font-semibold text-foreground"
              >
                Categoría <span className="text-destructive">*</span>
              </label>
              <div className="flex flex-wrap gap-1.5 mt-2" aria-label="Categorías rápidas">
                {QUICK_CATEGORIES.map((category) => {
                  const selected =
                    form.category.trim().toLocaleLowerCase('es') ===
                    category.toLocaleLowerCase('es');

                  return (
                    <button
                      key={category}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setForm((current) => ({ ...current, category }))
                      }
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all ${
                        selected
                          ? 'border-[#DD7419] bg-[#DD7419] text-white shadow-sm'
                          : 'border-[#DD7419]/25 bg-[#DD7419]/5 text-[#A6520B] hover:border-[#DD7419]/55 hover:bg-[#DD7419]/10'
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
              <div className="relative mt-1.5">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="waste-distribution-category"
                  value={form.category}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      category: e.target.value,
                    }))
                  }
                  maxLength={120}
                  placeholder="Ej. Plástico, vidrio, orgánicos…"
                  autoFocus
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#DD7419]/25 focus:border-[#DD7419]"
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Elige una opción rápida o escribe una categoría personalizada.
              </p>
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-foreground">
                Peso asignado <span className="text-destructive">*</span>
              </span>
              <div className="relative mt-1.5">
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.weightKg}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      weightKg: e.target.value.replace(/[^\d.,\s]/g, ''),
                    }))
                  }
                  onBlur={() => {
                    if (parsedWeight.valid && parsedWeight.value > 0) {
                      setForm((current) => ({
                        ...current,
                        weightKg: formatKg(parsedWeight.value),
                      }));
                    }
                  }}
                  placeholder="Ej. 1.427,60"
                  className="w-full h-11 px-3 pr-12 rounded-lg border border-border bg-background text-lg font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#DD7419]/25 focus:border-[#DD7419]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                  kg
                </span>
              </div>
              {exceedsAvailable && (
                <p className="text-xs text-destructive mt-1.5">
                  El peso supera los {formatKg(availableKg)} kg disponibles.
                </p>
              )}
              {!exceedsAvailable && form.weightKg && !hasValidPrecision && (
                <p className="text-xs text-destructive mt-1.5">
                  Usa máximo dos decimales. Ejemplo: 1.427,60 o 1427.60.
                </p>
              )}
              {!form.weightKg && (
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Puedes usar coma o punto decimal: 1.427,60 = 1427.60 kg.
                </p>
              )}
            </label>

            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="flex gap-2 px-5 pb-5">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#DD7419] hover:bg-[#C96514] text-white"
              disabled={saving || !isValid}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando…
                </>
              ) : editing ? (
                'Guardar cambios'
              ) : (
                'Agregar categoría'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
