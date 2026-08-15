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

export const upsertEventInventoryService = async ({
  eventId,
  inventoryItemId,
  cantidadCargada,
}) => {
  try {
    const { data } = await axios.post(`${INVENTORY_URL}/event/${eventId}`, {
      inventoryItemId,
      cantidadCargada,
    });
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
