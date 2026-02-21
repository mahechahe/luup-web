import { X, Clock, FileText } from 'lucide-react';
import { getIncidentStyle } from './IncidentBadge';

export function IncidentHistoryModal({ open, onClose, person, incidents }) {
  if (!open || !person) return null;

  const list = [...(incidents ?? [])].reverse();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-xl mx-4 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground">
              Historial de incidencias
            </h2>
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

        {/* Lista */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {list.length === 0 ? (
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
            <ol className="relative border-l border-border space-y-6 ml-2">
              {list.map((inc, i) => {
                const style = getIncidentStyle(inc.name);
                return (
                  <li key={inc.id ?? i} className="ml-5">
                    <span
                      className={`absolute -left-[5px] mt-1 w-2.5 h-2.5 rounded-full border-2 border-white ${style.dot}`}
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
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            {list.length} incidencia{list.length !== 1 ? 's' : ''} registrada{list.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
