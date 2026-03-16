/**
 * Roles del sistema:
 *   1 → Admin
 *   2 → Colaborador
 *   3 → Super Admin
 */

export const ROLE_IDS = {
  ADMIN: 1,
  COLABORADOR: 2,
  SUPER_ADMIN: 3,
};

/** Tiene acceso de administrador (admin o superadmin) */
export const hasAdminAccess = (roleId) =>
  roleId === ROLE_IDS.ADMIN || roleId === ROLE_IDS.SUPER_ADMIN;

/** Etiqueta legible del roleId */
export const getRoleLabel = (roleId) => {
  if (roleId === ROLE_IDS.ADMIN) return 'Administrador';
  if (roleId === ROLE_IDS.SUPER_ADMIN) return 'SuperAdministrador';
  return 'Trabajador';
};
