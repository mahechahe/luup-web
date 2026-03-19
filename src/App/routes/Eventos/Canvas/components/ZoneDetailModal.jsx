import {
  ArrowLeftRight,
  Crown,
  Package,
  PackageOpen,
  Plus,
  Shield,
  StickyNote,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { AddPersonModal } from './AddPersonModal';
import { COLORS, ZONE_ROLES } from './constants';

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
  const [modalRole, setModalRole] = useState(null); // 'supervisor' | 'coordinador' | 'colaborador' | 'responsable_acopio' | null

  const supervisores = zone.people.filter((p) => p.role === 'supervisor');
  const coordinadores = zone.people.filter((p) => p.role === 'coordinador');
  const colaboradores = zone.people.filter((p) => p.role === 'colaborador');
  const responsablesAcopio = zone.people.filter((p) => p.role === 'responsable_acopio');

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
    } else if (modalRole === 'responsable_acopio') {
      // RESPONSABLE DE ACOPIO: No puede estar en ninguna otra zona ni tener otro rol
      // Excluir a TODOS los que ya están asignados en cualquier zona
      zones.forEach((z) => {
        z.people.forEach((p) => {
          excludedSet.add(p.id);
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
      <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center sm:justify-center sm:p-4">
        {/* Modal — bottom sheet en mobile, centrado en sm+ */}
        <div
          className="bg-card text-card-foreground w-full rounded-t-2xl sm:rounded-xl shadow-2xl sm:max-w-2xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Pill handle visible solo en mobile */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: zone.color }}
              />
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                {zone.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
            {/* Nombre + Color */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
              <div className="flex-1">
                <label className="text-xs font-bold text-muted-foreground uppercase block mb-2">
                  Nombre de la zona
                </label>
                <input
                  readOnly={!isAdmin}
                  className={`w-full border border-border rounded-lg px-3 py-2 text-sm outline-none transition ${
                    isAdmin
                      ? 'focus:border-[#234465] focus:ring-2 focus:ring-[#234465]/20 bg-background text-foreground'
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
                      className={`w-8 h-8 sm:w-7 sm:h-7 rounded-lg border-2 transition ${
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

            {/* Tipo de zona + Capacidad */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
              <div className="flex-1">
                <label className="text-xs font-bold text-muted-foreground uppercase block mb-2">
                  Tipo de zona
                </label>
                <div
                  className={`inline-flex rounded-lg border border-border bg-muted/30 p-1 gap-1 ${
                    !isAdmin ? 'opacity-60 pointer-events-none' : ''
                  }`}
                >
                  <button
                    onClick={() =>
                      isAdmin && onUpdate(zone.id, { category: 'general' })
                    }
                    className={`flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-md text-xs font-semibold transition-all ${
                      (zone.category || 'general') !== 'acopio'
                        ? 'bg-[#234465] text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Zona
                  </button>
                  <button
                    onClick={() =>
                      isAdmin && onUpdate(zone.id, { category: 'acopio' })
                    }
                    className={`flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-md text-xs font-semibold transition-all ${
                      zone.category === 'acopio'
                        ? 'bg-[#DD7419] text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Package className="w-3 h-3" />
                    Centro de acopio
                  </button>
                </div>
              </div>
              <div className="sm:w-36">
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
                  className={`w-full text-sm p-2 rounded-lg border border-border outline-none text-foreground ${
                    isAdmin
                      ? 'focus:border-[#234465] focus:ring-2 focus:ring-[#234465]/20 bg-background'
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
                      Límite de basuras{' '}
                      <span className="text-destructive">*</span>
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
                          ? 'focus:border-[#DD7419] focus:ring-2 focus:ring-[#DD7419]/20 bg-background text-foreground'
                          : 'bg-muted/30 cursor-default'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                      Límite de peso (kg){' '}
                      <span className="text-destructive">*</span>
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
                          ? 'focus:border-[#DD7419] focus:ring-2 focus:ring-[#DD7419]/20 bg-background text-foreground'
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
                    ? 'focus:border-[#234465] focus:ring-2 focus:ring-[#234465]/20 bg-background text-foreground'
                    : 'bg-muted/30 cursor-default'
                }`}
              />
            </div>

            {/* Personas — jerarquía */}
            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 mb-3">
                <Users className="w-3.5 h-3.5" /> Personal de zona
              </h4>

              <div className="space-y-2 mt-2">
                {/* Nivel 1 — Coordinador */}
                <PeopleSubsection
                  label="Coordinador"
                  sublabel="Nivel superior · Supervisa múltiples zonas"
                  icon={<Crown className="w-3.5 h-3.5 text-[#DD7419]" />}
                  accentColor="#DD7419"
                  people={coordinadores}
                  isAdmin={isAdmin}
                  canAdd={coordinadores.length === 0}
                  onAdd={() => setModalRole('coordinador')}
                  onRemove={(personId) => onRemovePerson(zone.id, personId)}
                />

                {/* Nivel 2 — Supervisor */}
                <PeopleSubsection
                  label="Supervisor de Zona"
                  sublabel="Responsable únicamente de su zona asignada"
                  icon={
                    <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                  }
                  accentColor="#234465"
                  colorClass="text-[#234465] dark:text-[#7493B2]"
                  people={supervisores}
                  isAdmin={isAdmin}
                  canAdd={supervisores.length === 0}
                  onAdd={() => setModalRole('supervisor')}
                  onRemove={(personId) => onRemovePerson(zone.id, personId)}
                />

                {/* Nivel 3 — Colaboradores */}
                <PeopleSubsection
                  label="Colaboradores"
                  sublabel="Personal operativo de la zona"
                  icon={<Users className="w-3.5 h-3.5 text-muted-foreground" />}
                  accentColor={null}
                  people={colaboradores}
                  isAdmin={isAdmin}
                  canAdd={true}
                  canTransfer={true}
                  onAdd={() => setModalRole('colaborador')}
                  onRemove={(personId) => onRemovePerson(zone.id, personId)}
                  onTransfer={(personId) => onAddPeople(zone.id, personId)}
                />

                {/* ✅ Responsable de Acopio — solo visible en zonas de categoría 'acopio' */}
                {zone.category === 'acopio' && (
                  <PeopleSubsection
                    label="Responsable de Acopio"
                    sublabel="Acceso únicamente a su centro de acopio"
                    icon={<PackageOpen className="w-3.5 h-3.5 text-[#DD7419]" />}
                    accentColor="#DD7419"
                    people={responsablesAcopio}
                    isAdmin={isAdmin}
                    canAdd={true}
                    onAdd={() => setModalRole('responsable_acopio')}
                    onRemove={(personId) => onRemovePerson(zone.id, personId)}
                  />
                )}
              </div>
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

            {/* Espaciado extra para evitar que el contenido quede bajo el home indicator */}
            <div className="h-2 sm:hidden" />
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Subsección de personas ────── */
function PeopleSubsection({
  label,
  sublabel,
  icon,
  accentColor,
  colorClass,
  people,
  isAdmin,
  canAdd,
  canTransfer = false,
  onAdd,
  onRemove,
  onTransfer,
}) {
  return (
    <div
      className="rounded-lg border bg-muted/20 p-3"
      style={{ borderColor: accentColor ? `${accentColor}30` : undefined }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4
            className={`text-xs font-bold uppercase flex items-center gap-1.5 ${
              colorClass ?? 'text-muted-foreground'
            }`}
            style={
              !colorClass && accentColor ? { color: accentColor } : undefined
            }
          >
            {icon} {label}
          </h4>
          {sublabel && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {sublabel}
            </p>
          )}
        </div>
        {isAdmin && canAdd && (
          <button
            onClick={onAdd}
            className={`flex items-center gap-1 text-xs font-semibold shrink-0 transition ${
              !accentColor || accentColor === '#234465'
                ? 'text-[#234465] dark:text-[#7493B2]'
                : ''
            }`}
            style={
              accentColor && accentColor !== '#234465'
                ? { color: accentColor }
                : undefined
            }
          >
            <Plus className="w-3.5 h-3.5" /> Agregar
          </button>
        )}
      </div>

      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {people.map((p) => (
          <div
            key={p.id}
            className="flex justify-between items-center bg-muted/30 px-3 py-2 rounded-lg border border-border text-sm group"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{p.name}</p>
              {p.cedula && (
                <p className="text-xs text-muted-foreground">{p.cedula}</p>
              )}
            </div>
            {isAdmin && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0 ml-2">
                {canTransfer && (
                  <button
                    onClick={() => onTransfer(p.id)}
                    className="text-muted-foreground hover:text-[#234465] dark:hover:text-[#7493B2] transition"
                    title="Trasladar"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => onRemove(p.id)}
                  className="text-muted-foreground hover:text-destructive transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
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