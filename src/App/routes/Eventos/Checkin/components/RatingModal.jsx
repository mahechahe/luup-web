import { useEffect, useState } from 'react';
import {
  Star,
  X,
  Loader2,
  CheckCircle2,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDateRegisterLong } from '@/App/utils/functions/colombiaDate';
import {
  getRatingCriteriaService,
  getRatingByEventAndUserService,
  upsertRatingService,
} from '../../services/ratingServices';

function StarRating({ value, onChange, disabled }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="p-0.5 rounded transition-transform hover:scale-110 disabled:cursor-not-allowed"
          aria-label={`${n} estrellas`}
        >
          <Star
            className={`w-6 h-6 transition-colors ${
              n <= display
                ? 'fill-amber-400 text-amber-400'
                : 'fill-transparent text-muted-foreground/40'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function RatingModal({ open, onClose, eventId, collab, dateRegister }) {
  const [criteria, setCriteria] = useState([]);
  const [scores, setScores] = useState({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingRating, setExistingRating] = useState(null);

  useEffect(() => {
    if (!open || !collab) return;

    setLoading(true);
    setScores({});
    setNotes('');
    setExistingRating(null);

    Promise.all([
      getRatingCriteriaService(),
      getRatingByEventAndUserService({
        eventId,
        userId: collab.userId,
        dateRegister: dateRegister ?? undefined,
      }),
    ]).then(([criteriaRes, ratingRes]) => {
      const criteriaList = criteriaRes.criteria ?? [];
      setCriteria(criteriaList);

      if (ratingRes.rating) {
        setExistingRating(ratingRes.rating);
        const existingScores = {};
        (ratingRes.rating.scores ?? []).forEach((s) => {
          existingScores[s.criterionId] = s.score;
        });
        setScores(existingScores);
        setNotes(ratingRes.rating.notes ?? '');
      } else {
        const defaultScores = {};
        criteriaList.forEach((c) => {
          defaultScores[c.id] = 0;
        });
        setScores(defaultScores);
      }

      setLoading(false);
    });
  }, [open, collab, eventId, dateRegister]);

  if (!open || !collab) return null;

  const allScored = criteria.every((c) => (scores[c.id] ?? 0) >= 1);
  const overallAvg =
    criteria.length > 0
      ? (
          criteria.reduce((sum, c) => sum + (scores[c.id] ?? 0), 0) /
          criteria.length
        ).toFixed(1)
      : '—';

  const handleSave = async () => {
    if (!allScored) {
      toast.error('Debes calificar todos los criterios antes de guardar.');
      return;
    }

    setSaving(true);
    const scorePayload = criteria.map((c) => ({
      criterionId: c.id,
      score: scores[c.id],
    }));

    const res = await upsertRatingService({
      eventId,
      userId: collab.userId,
      dateRegister: dateRegister ?? null,
      scores: scorePayload,
      notes: notes.trim() || null,
    });

    setSaving(false);

    if (res.status) {
      toast.success(
        existingRating
          ? 'Calificación actualizada correctamente.'
          : 'Calificación guardada correctamente.'
      );
      onClose();
    } else {
      toast.error(res.errors ?? 'Error al guardar la calificación.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl border border-border flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground">
              Calificar colaborador
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {collab.firstName} {collab.lastName}
            </p>
            {dateRegister && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Registro del{' '}
                  <span className="font-semibold text-foreground">
                    {formatDateRegisterLong(dateRegister)}
                  </span>
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors mt-0.5 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Overwrite warning */}
              {existingRating && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/60">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    Ya existe una calificación para este registro. Si guardas
                    los cambios,{' '}
                    <span className="font-semibold">
                      se sobrescribirán las calificaciones anteriores
                    </span>
                    .
                  </p>
                </div>
              )}

              {/* Overall badge */}
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/50 border border-border">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Promedio general
                </span>
                <span className="flex items-center gap-1.5 text-lg font-bold text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {allScored ? overallAvg : '—'}
                  <span className="text-xs font-normal text-muted-foreground">
                    / 5
                  </span>
                </span>
              </div>

              {/* Criteria */}
              <div className="space-y-1">
                {criteria.map((c, idx) => (
                  <div
                    key={c.id}
                    className={`rounded-xl border px-4 py-3 space-y-2 transition-colors ${
                      (scores[c.id] ?? 0) >= 1
                        ? 'border-amber-200/60 bg-amber-50/40 dark:border-amber-800/40 dark:bg-amber-900/10'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-snug">
                          <span className="text-muted-foreground font-normal mr-1.5">
                            {idx + 1}.
                          </span>
                          {c.name}
                        </p>
                        {c.description && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                            {c.description}
                          </p>
                        )}
                      </div>
                      {(scores[c.id] ?? 0) >= 1 && (
                        <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      )}
                    </div>
                    <StarRating
                      value={scores[c.id] ?? 0}
                      onChange={(val) =>
                        setScores((prev) => ({ ...prev, [c.id]: val }))
                      }
                      disabled={saving}
                    />
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Notas (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={saving}
                  placeholder="Observaciones generales sobre el desempeño…"
                  rows={3}
                  className="w-full text-sm rounded-xl border border-border bg-background px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/30 placeholder:text-muted-foreground disabled:opacity-60"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="px-5 py-4 border-t border-border shrink-0 flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 h-10 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !allScored}
              className="flex-1 h-10 rounded-xl bg-amber-500 hover:bg-amber-500/90 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando…
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 fill-white text-white" />
                  {existingRating ? 'Actualizar' : 'Guardar'}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
