import {
  ChevronDown,
  ChevronUp,
  Plus,
  StickyNote,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { AddPersonModal } from './AddPersonModal';
import { CATEGORIES, COLORS } from './constants';

export function ZoneAccordionItem({
  zone,
  isSelected,
  isAdmin,
  onSelect,
  onUpdate,
  onAddPeople,
  onRemovePerson,
  onDeleteRequest,
}) {
  const [modalRole, setModalRole] = useState(null); // 'jefe' | 'colaborador' | null
  const jefeLabel = zone.category === 'acopio' ? 'Jefe de Acopio' : 'Jefe de Zona';
  const jefes = zone.people.filter((p) => p.role === 'jefe');
  const colaboradores = zone.people.filter((p) => p.role === 'colaborador');

  // Solo deshabilita en el modal a quienes ya tienen ESE mismo rol
  const existingIdsForRole = (role) =>
    new Set(zone.people.filter((p) => p.role === role).map((p) => p.id));

  return (
    <>
    {modalRole && (
      <AddPersonModal
        zoneId={zone.id}
        role={modalRole}
        existingIds={existingIdsForRole(modalRole)}
        onConfirm={onAddPeople}
        onClose={() => setModalRole(null)}
      />
    )}
    <div
      id={`accordion-item-${zone.id}`}
      className={`rounded-lg overflow-hidden transition-all duration-200 ${
        isSelected
          ? 'ring-2 ring-[#234465] shadow-md'
          : 'border border-border shadow-sm'
      }`}
    >
      {/* Header */}
      <div
        onClick={() => onSelect(isSelected ? null : zone.id)}
        className={`flex items-center justify-between p-3 cursor-pointer select-none ${
          isSelected
            ? 'bg-[#234465]/5 border-b border-[#234465]/10'
            : 'bg-white hover:bg-muted/40'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: zone.color }}
          />
          <span className="font-semibold text-xs text-foreground truncate max-w-[100px]">
            {zone.name}
          </span>
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
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
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" />
            {zone.people.length}/{zone.maxCapacity}
          </span>
          {isSelected ? (
            <ChevronUp className="w-3.5 h-3.5 text-[#234465]" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Cuerpo expandido */}
      {isSelected && (
        <div className="p-3 space-y-3 bg-white">
          {/* Nombre + Color */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">
                Nombre
              </label>
              <input
                readOnly={!isAdmin}
                className={`w-full border border-border rounded-md px-2 py-1.5 text-xs outline-none transition ${
                  isAdmin
                    ? 'focus:border-[#234465] bg-white'
                    : 'bg-muted/30 cursor-default'
                }`}
                value={zone.name}
                onChange={(e) =>
                  isAdmin && onUpdate(zone.id, { name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">
                Color
              </label>
              <div className="flex gap-1">
                {COLORS.map((c) => (
                  <button
                    key={c.hex}
                    disabled={!isAdmin}
                    onClick={() =>
                      isAdmin && onUpdate(zone.id, { color: c.hex })
                    }
                    className={`w-5 h-5 rounded border-2 transition ${
                      zone.color === c.hex
                        ? 'border-[#234465] scale-110'
                        : 'border-transparent'
                    } ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Categoría + Capacidad */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">
                Categoría
              </label>
              <select
                disabled={!isAdmin}
                value={zone.category || 'general'}
                onChange={(e) =>
                  isAdmin && onUpdate(zone.id, { category: e.target.value })
                }
                className={`w-full text-xs p-1.5 rounded-md border border-border outline-none ${
                  isAdmin
                    ? 'bg-white focus:border-[#234465]'
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
              <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">
                Capacidad
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
                className={`w-full text-xs p-1.5 rounded-md border border-border outline-none ${
                  isAdmin
                    ? 'focus:border-[#234465]'
                    : 'bg-muted/30 cursor-default'
                }`}
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1 flex items-center gap-1">
              <StickyNote className="w-3 h-3" /> Notas
            </label>
            <textarea
              readOnly={!isAdmin}
              value={zone.notes || ''}
              onChange={(e) =>
                isAdmin && onUpdate(zone.id, { notes: e.target.value })
              }
              placeholder={isAdmin ? 'Notas logísticas...' : 'Sin notas'}
              className={`w-full text-xs p-1.5 rounded-md border border-border resize-none h-14 outline-none ${
                isAdmin
                  ? 'focus:border-[#234465] bg-muted/20'
                  : 'bg-muted/30 cursor-default'
              }`}
            />
          </div>

          {/* Personas */}
          <div className="space-y-2">
            {/* Jefe */}
            <PeopleSubsection
              label={jefeLabel}
              people={jefes}
              isAdmin={isAdmin}
              canAdd={jefes.length === 0}
              onAdd={() => setModalRole('jefe')}
              onRemove={(personId) => onRemovePerson(zone.id, personId)}
            />
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
              onClick={() => onDeleteRequest(zone.id)}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-destructive hover:bg-destructive/5 rounded-md py-1.5 transition border border-destructive/20"
            >
              <Trash2 className="w-3.5 h-3.5" /> Eliminar zona
            </button>
          )}
        </div>
      )}
    </div>
    </>
  );
}

/* ── Subsección de personas (jefe / colaboradores) ────── */
function PeopleSubsection({ label, people, isAdmin, canAdd, onAdd, onRemove }) {
  return (
    <div className="bg-muted/30 rounded-lg border border-border p-2.5">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
          <Users className="w-3 h-3" /> {label}
        </h4>
        {isAdmin && canAdd && (
          <button
            onClick={onAdd}
            className="flex items-center gap-0.5 text-[9px] font-semibold text-[#234465] hover:text-[#234465]/70 transition"
          >
            <Plus className="w-3 h-3" /> Agregar
          </button>
        )}
      </div>

      <div className="space-y-1 max-h-24 overflow-y-auto">
        {people.map((p) => (
          <div
            key={p.id}
            className="flex justify-between items-center bg-white px-2 py-1.5 rounded border border-border text-xs group"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{p.name}</p>
              {p.cedula && (
                <p className="text-[10px] text-muted-foreground">{p.cedula}</p>
              )}
            </div>
            {isAdmin && (
              <button
                onClick={() => onRemove(p.id)}
                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition shrink-0 ml-2"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        {people.length === 0 && (
          <p className="text-[10px] text-center text-muted-foreground py-1 italic">
            Sin asignar
          </p>
        )}
      </div>
    </div>
  );
}
