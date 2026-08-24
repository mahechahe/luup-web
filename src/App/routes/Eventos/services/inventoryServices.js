import { constants } from '@/App/utils/constants/apiConstants';
import { getColombiaDateISO } from '@/App/utils/functions/colombiaDate';
import axios from 'axios';

const { BASE_URL, ENDPOINTS } = constants;
const INVENTORY_URL = `${BASE_URL}/${ENDPOINTS.INVENTORY}`;

export const assignInventoryToCollaboratorService = async ({
  inventoryItemId,
  userId,
  quantity,
  createdBy,
  eventId,
}) => {
  try {
    const { data } = await axios.post(`${INVENTORY_URL}/collaborator`, {
      inventoryItemId,
      userId,
      quantity,
      createdBy,
      eventId,
      dateRegister: getColombiaDateISO(),
    });
    return { status: true, data: data?.data, errors: null };
  } catch (error) {
    return {
      status: false,
      data: null,
      errors:
        error?.response?.data?.message || 'Error al asignar el inventario.',
    };
  }
};

export const deleteInventoryAssignmentService = async (collaboratorItemId) => {
  try {
    const { data } = await axios.delete(`${INVENTORY_URL}/collaborator`, {
      data: { collaboratorItemId },
    });
    return { status: true, data: data?.data, errors: null };
  } catch (error) {
    return {
      status: false,
      data: null,
      errors:
        error?.response?.data?.message || 'Error al eliminar la asignación.',
    };
  }
};

export const updateInventoryItemCollaboratorService = async ({
  collaboratorItemId,
  returnedQuantity,
  usedQuantity,
  damagedQuantity,
  createdBy,
}) => {
  try {
    const { data } = await axios.patch(`${INVENTORY_URL}/collaborator`, {
      collaboratorItemId,
      returnedQuantity,
      usedQuantity,
      damagedQuantity,
      createdBy,
    });
    return { status: true, data: data?.data, errors: null };
  } catch (error) {
    return {
      status: false,
      data: null,
      errors:
        error?.response?.data?.message || 'Error al actualizar el inventario.',
    };
  }
};

export const getInventoryItemHistoryService = async (collaboratorItemId) => {
  try {
    const { data } = await axios.get(
      `${INVENTORY_URL}/collaborator/${collaboratorItemId}/history`
    );
    return { status: true, data: data?.data, errors: null };
  } catch (error) {
    return {
      status: false,
      data: null,
      errors:
        error?.response?.data?.message || 'Error al obtener el historial.',
    };
  }
};

export const getEventInventoryService = async (eventId) => {
  try {
    const { data } = await axios.get(`${INVENTORY_URL}/event/${eventId}`);
    return { status: true, items: data?.data ?? [], errors: null };
  } catch (error) {
    return {
      status: false,
      items: [],
      errors:
        error?.response?.data?.message ||
        'Error al obtener el inventario del evento.',
    };
  }
};

export const listEventInventoryService = async (
  eventId,
  { page = 1, limit = 10, nombre } = {}
) => {
  try {
    const body = { page, limit };
    if (nombre) body.nombre = nombre;
    const { data } = await axios.post(
      `${INVENTORY_URL}/event/${eventId}/list`,
      body
    );
    return {
      status: true,
      items: data?.data?.items ?? [],
      pagination: data?.data?.pagination ?? {
        page: 1,
        limit,
        total: 0,
        totalPages: 1,
      },
      errors: null,
    };
  } catch (error) {
    return {
      status: false,
      items: [],
      pagination: { page: 1, limit, total: 0, totalPages: 1 },
      errors:
        error?.response?.data?.message ||
        'Error al obtener el inventario del evento.',
    };
  }
};

/**
 * El ítem se manda por id (elegido del catálogo) o por nombre (escrito a mano);
 * con nombre, el API lo crea en el catálogo si no existe.
 */
export const upsertEventInventoryService = async ({
  eventId,
  inventoryItemId,
  nombre,
  cantidadCargada,
}) => {
  try {
    const body = { cantidadCargada };
    if (inventoryItemId) body.inventoryItemId = inventoryItemId;
    else body.nombre = nombre;

    const { data } = await axios.post(
      `${INVENTORY_URL}/event/${eventId}`,
      body
    );
    return { status: true, data: data?.data, errors: null };
  } catch (error) {
    return {
      status: false,
      data: null,
      errors:
        error?.response?.data?.message ||
        'Error al cargar el inventario del evento.',
    };
  }
};

/** Carga masiva desde Excel. Devuelve el resumen fila por fila. */
export const uploadEventInventoryExcelService = async ({ eventId, file }) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await axios.post(
      `${INVENTORY_URL}/event/${eventId}/upload-excel`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    return { status: true, data: data?.data ?? null, errors: null };
  } catch (error) {
    return {
      status: false,
      data: null,
      errors:
        error?.response?.data?.message ||
        'Error al procesar el archivo de inventario.',
    };
  }
};

/** URL firmada (15 min) de la plantilla de carga masiva. */
export const getEventInventoryTemplateService = async () => {
  try {
    const { data } = await axios.get(
      `${INVENTORY_URL}/event-inventory-template`
    );
    return { status: true, url: data?.data?.url ?? null, errors: null };
  } catch (error) {
    return {
      status: false,
      url: null,
      errors:
        error?.response?.data?.message ||
        'Error al generar la plantilla de carga masiva.',
    };
  }
};

export const deleteEventInventoryService = async ({
  eventId,
  inventoryItemId,
}) => {
  try {
    const { data } = await axios.delete(`${INVENTORY_URL}/event/${eventId}`, {
      data: { inventoryItemId },
    });
    return { status: true, data: data?.data, errors: null };
  } catch (error) {
    return {
      status: false,
      data: null,
      errors:
        error?.response?.data?.message ||
        'Error al quitar el ítem del inventario del evento.',
    };
  }
};
