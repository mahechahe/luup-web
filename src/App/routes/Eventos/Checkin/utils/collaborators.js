/** Helpers compartidos por las 4 estaciones del check-in. */

const ROLE_LABELS = {
  supervisor: 'Supervisor',
  coordinador: 'Coordinador',
  colaborador: 'Colaborador',
  responsable_acopio: 'Resp. Acopio',
};

export function roleLabel(role) {
  return ROLE_LABELS[role] ?? role;
}

export function roleBadgeClass(role) {
  if (role === 'supervisor')
    return 'bg-[#234465]/10 text-[#234465] dark:bg-[#234465]/20 dark:text-[#7493B2]';
  if (role === 'coordinador') return 'bg-[#DD7419]/10 text-[#DD7419]';
  return 'bg-[#7493B2]/10 text-[#7493B2]';
}

/**
 * Normaliza las cantidades de un ítem asignado. `pendingQuantity` viene del API,
 * pero se recalcula como respaldo para registros antiguos que no lo traen.
 */
export function getItemQuantities(item) {
  const assigned = item?.quantity ?? 0;
  const returned = item?.returnedQuantity ?? 0;
  const used = item?.usedQuantity ?? 0;
  const damaged = item?.damagedQuantity ?? 0;
  const pending = item?.pendingQuantity ?? assigned - returned - used - damaged;

  return {
    assigned,
    returned,
    used,
    damaged,
    pending,
    complete: pending === 0,
  };
}
