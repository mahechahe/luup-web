import { X, Clock, FileText, Calendar } from 'lucide-react';
import { getIncidentStyle } from './IncidentBadge';

function getDayKey(raw) {
  if (!raw) return 'Sin fecha';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return 'Sin fecha';
  return d.toISOString().split('T')[0]; // "2026-02-24"
}

function formatDayLabel(key) {
  if (key === 'Sin fecha') return 'Sin fecha';
  const d = new Date(key + 'T12:00:00');
  return d.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function groupByDay(incidents) {
  const sorted = [...incidents].sort((a, b) => {
    const da = new Date(a.createdAt ?? a.created_at ?? 0);
    const db = new Date(b.createdAt ?? b.created_at ?? 0);
    return db - da;
  });

  const groups = [];
  const seen = new Map();

  sorted.forEach((inc) => {
    const key = getDayKey(inc.createdAt ?? inc.created_at);
    if (!seen.has(key)) {
      seen.set(key, []);
      groups.push({ key, label: formatDayLabel(key), items: seen.get(key) });
    }
    seen.get(key).push(inc);
  });

  return groups;
}

export function IncidentHistoryModal({ open, onClose, person, incidents }) {
  if (!open || !person) return null;

  const groups = groupByDay(incidents ?? []);
  const total = incidents?.length ?? 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-card text-card-foreground rounded-xl shadow-xl mx-4 flex flex-col max-h-[80vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground">Historial de incidencias</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {person.firstName} {person.lastName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lista agrupada por día */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Sin incidencias</p>
              <p className="text-xs text-muted-foreground mt-1">
                Este colaborador no tiene incidencias registradas.
              </p>
            </div>
          ) : (
            groups.map(({ key, label, items }) => (
              <div key={key}>
                {/* Encabezado del día */}
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs font-bold text-foreground capitalize">{label}</span>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {items.length} {items.length === 1 ? 'registro' : 'registros'}
                  </span>
                </div>

                {/* Incidencias del día */}
                <ol className="relative border-l border-border space-y-4 ml-2">
                  {items.map((inc, i) => {
                    const style = getIncidentStyle(inc.name);
                    return (
                      <li key={inc.id ?? i} className="ml-5">
                        <span
                          className={`absolute -left-[5px] mt-1 w-2.5 h-2.5 rounded-full border-2 border-card ${style.dot}`}
                        />
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}
                            >
                              {inc.name}
                            </span>
                            {inc.note && (
                              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                {inc.note}
                              </p>
                            )}
                          </div>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {inc.time}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            {total} incidencia{total !== 1 ? 's' : ''} · {groups.length} día{groups.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}