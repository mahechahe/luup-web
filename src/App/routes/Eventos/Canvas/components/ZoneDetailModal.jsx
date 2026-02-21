import {
  Plus,
  StickyNote,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { AddPersonModal } from './AddPersonModal';
import { CATEGORIES, COLORS, ZONE_ROLES } from './constants';

export function ZoneDetailModal({
  zone,
  zones,
  isAdmin,
  allAssignedPeopleIds,
  onUpdate,
  onAddPeople,
  onRemovePerson,
  onDeleteRequest,
  onClose,
}) {
  const [modalRole, setModalRole] = useState(null); // 'supervisor' | 'coordinador' | 'colaborador' | null

  const supervisores = zone.people.filter((p) => p.role === 'supervisor');
  const coordinadores = zone.people.filter((p) => p.role === 'coordinador');
  const colaboradores = zone.people.filter((p) => p.role === 'colaborador');

  // IDs a excluir según el rol que se está agregando
  const getExcludedIds = () => {
    if (!modalRole) return new Set();

    const excludedSet = new Set();

    if (modalRole === 'coordinador') {
      // COORDINADOR: Puede ser coordinador en múltiples zonas
      // Excluir:
      // 1. Personas que son supervisor o colaborador en CUALQUIER zona
      // 2. Personas que ya son coordinadores en ESTA zona
      zones.forEach((z) => {
        z.people.forEach((p) => {
          // Excluir si tiene rol diferente a coordinador en cualquier zona
          if (p.role !== 'coordinador') {
            excludedSet.add(p.id);
          }
          // Excluir si ya es coordinador en esta zona
          if (z.id === zone.id && p.role === 'coordinador') {
            excludedSet.add(p.id);
          }
        });
      });
    } else {
      // SUPERVISOR o COLABORADOR: NO pueden estar en múltiples zonas
      // Excluir:
      // 1. TODAS las personas asignadas en OTRAS zonas (cualquier rol)
      // 2. TODAS las personas ya asignadas en ESTA zona (cualquier rol)
      //    Para evitar que una persona tenga múltiples roles en la misma zona
      zones.forEach((z) => {
        z.people.forEach((p) => {
          // Si es otra zona, excluir a TODOS sus miembros
          if (z.id !== zone.id) {
            excludedSet.add(p.id);
          }
          // Si es la misma zona, excluir a TODOS (no pueden tener múltiples roles)
          if (z.id === zone.id) {
            excludedSet.add(p.id);
          }
        });
      });
    }

    return excludedSet;
  };

  return (
    <>
      {modalRole && (
        <AddPersonModal
          zoneId={zone.id}
          role={modalRole}
          existingIds={getExcludedIds()}
          onConfirm={onAddPeople}
          onClose={() => setModalRole(null)}
        />
      )}

      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
      >
        {/* Modal */}
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: zone.color }}
              />
              <h2 className="text-lg font-bold text-foreground">{zone.name}</h2>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  CATEGORIES.find((c) => c.id === (zone.category || 'general'))
                    ?.color
                }`}
              >
                {
                  CATEGORIES.find((c) => c.id === (zone.category || 'general'))
                    ?.label
                }
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Nombre + Color */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-xs font-bold text-muted-foreground uppercase block mb-2">
                  Nombre de la zona
                </label>
                <input
                  readOnly={!isAdmin}
                  className={`w-full border border-border rounded-lg px-3 py-2 text-sm outline-none transition ${
                    isAdmin
                      ? 'focus:border-[#234465] focus:ring-2 focus:ring-[#234465]/20 bg-white'
                      : 'bg-muted/30 cursor-default'
                  }`}
                  value={zone.name}
                  onChange={(e) =>
                    isAdmin && onUpdate(zone.id, { name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase block mb-2">
                  Color
                </label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c.hex}
                      disabled={!isAdmin}
                      onClick={() =>
                        isAdmin && onUpdate(zone.id, { color: c.hex })
                      }
                      className={`w-7 h-7 rounded-lg border-2 transition ${
                        zone.color === c.hex
                          ? 'border-[#234465] scale-110 shadow-md'
                          : 'border-transparent hover:border-muted-foreground/30'
                      } ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Categoría + Capacidad */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase block mb-2">
                  Categoría
                </label>
                <select
                  disabled={!isAdmin}
                  value={zone.category || 'general'}
                  onChange={(e) =>
                    isAdmin && onUpdate(zone.id, { category: e.target.value })
                  }
                  className={`w-full text-sm py-2 pl-3 pr-8 rounded-lg border border-border outline-none ${
                    isAdmin
                      ? 'bg-white focus:border-[#234465] focus:ring-2 focus:ring-[#234465]/20'
                      : 'bg-muted/30 cursor-not-allowed'
                  }`}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase block mb-2">
                  Capacidad máxima
                </label>
                <input
                  type="number"
                  readOnly={!isAdmin}
                  value={zone.maxCapacity}
                  onChange={(e) =>
                    isAdmin &&
                    onUpdate(zone.id, {
                      maxCapacity: parseInt(e.target.value) || 0,
                    })
                  }
                  className={`w-full text-sm p-2 rounded-lg border border-border outline-none ${
                    isAdmin
                      ? 'focus:border-[#234465] focus:ring-2 focus:ring-[#234465]/20'
                      : 'bg-muted/30 cursor-default'
                  }`}
                />
              </div>
            </div>

            {/* Límites de Centro de Acopio */}
            {(zone.category || 'general') === 'acopio' && (
              <div className="rounded-lg border border-[#DD7419]/25 bg-[#DD7419]/5 p-3 space-y-3">
                <p className="text-xs font-bold text-[#DD7419] uppercase">
                  Límites del centro de acopio
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                      Límite de basuras <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      readOnly={!isAdmin}
                      value={zone.wasteLimit ?? ''}
                      onChange={(e) =>
                        isAdmin &&
                        onUpdate(zone.id, {
                          wasteLimit: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                      className={`w-full text-sm p-2 rounded-lg border border-border outline-none ${
                        isAdmin
                          ? 'focus:border-[#DD7419] focus:ring-2 focus:ring-[#DD7419]/20 bg-white'
                          : 'bg-muted/30 cursor-default'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                      Límite de peso (kg) <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      readOnly={!isAdmin}
                      value={zone.weightLimit ?? ''}
                      onChange={(e) =>
                        isAdmin &&
                        onUpdate(zone.id, {
                          weightLimit: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                      className={`w-full text-sm p-2 rounded-lg border border-border outline-none ${
                        isAdmin
                          ? 'focus:border-[#DD7419] focus:ring-2 focus:ring-[#DD7419]/20 bg-white'
                          : 'bg-muted/30 cursor-default'
                      }`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notas */}
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase block mb-2 flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5" /> Notas
              </label>
              <textarea
                readOnly={!isAdmin}
                value={zone.notes || ''}
                onChange={(e) =>
                  isAdmin && onUpdate(zone.id, { notes: e.target.value })
                }
                placeholder={isAdmin ? 'Notas logísticas...' : 'Sin notas'}
                className={`w-full text-sm p-3 rounded-lg border border-border resize-none h-16 outline-none ${
                  isAdmin
                    ? 'focus:border-[#234465] focus:ring-2 focus:ring-[#234465]/20 bg-muted/20'
                    : 'bg-muted/30 cursor-default'
                }`}
              />
            </div>

            {/* Personas */}
            <div className="space-y-3">
              {/* Supervisor y Coordinador en la misma línea */}
              <div className="grid grid-cols-2 gap-3">
                <PeopleSubsection
                  label="Supervisor de Zona"
                  people={supervisores}
                  isAdmin={isAdmin}
                  canAdd={supervisores.length === 0}
                  onAdd={() => setModalRole('supervisor')}
                  onRemove={(personId) => onRemovePerson(zone.id, personId)}
                />
                <PeopleSubsection
                  label="Coordinador"
                  people={coordinadores}
                  isAdmin={isAdmin}
                  canAdd={coordinadores.length === 0}
                  onAdd={() => setModalRole('coordinador')}
                  onRemove={(personId) => onRemovePerson(zone.id, personId)}
                />
              </div>

              {/* Colaboradores */}
              <PeopleSubsection
                label="Colaboradores"
                people={colaboradores}
                isAdmin={isAdmin}
                canAdd={true}
                onAdd={() => setModalRole('colaborador')}
                onRemove={(personId) => onRemovePerson(zone.id, personId)}
              />
            </div>

            {/* Eliminar — solo admin */}
            {isAdmin && (
              <button
                onClick={() => {
                  onDeleteRequest(zone.id);
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg py-3 transition border border-destructive/20 font-medium"
              >
                <Trash2 className="w-4 h-4" /> Eliminar zona
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Subsección de personas (jefe / colaboradores) ────── */
function PeopleSubsection({ label, people, isAdmin, canAdd, onAdd, onRemove }) {
  return (
    <div className="bg-muted/30 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> {label}
        </h4>
        {isAdmin && canAdd && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1 text-xs font-semibold text-[#234465] hover:text-[#234465]/70 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-40 overflow-y-auto">
        {people.map((p) => (
          <div
            key={p.id}
            className="flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-border text-sm group"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{p.name}</p>
              {p.cedula && (
                <p className="text-xs text-muted-foreground">{p.cedula}</p>
              )}
            </div>
            {isAdmin && (
              <button
                onClick={() => onRemove(p.id)}
                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition shrink-0 ml-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        {people.length === 0 && (
          <p className="text-xs text-center text-muted-foreground py-2 italic">
            Sin asignar
          </p>
        )}
      </div>
    </div>
  );
}
