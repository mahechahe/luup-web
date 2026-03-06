import { constants } from '@/App/utils/constants/apiConstants';
import axios from 'axios';

const { BASE_URL, ENDPOINTS } = constants;
const INVENTORY_URL = `${BASE_URL}/${ENDPOINTS.INVENTORY}`;

export const assignInventoryToCollaboratorService = async ({
  inventoryItemId,
  userId,
  quantity,
  createdBy,
}) => {
  try {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const { data } = await axios.post(`${INVENTORY_URL}/collaborator`, {
      inventoryItemId,
      userId,
      quantity,
      createdBy,
      dateRegister: `${yyyy}-${mm}-${dd}`,
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

export const getInventoryListService = async ({ page = 1, nombre } = {}) => {
  try {
    const body = { page };
    if (nombre) body.nombre = nombre;
    const { data } = await axios.post(`${INVENTORY_URL}/list`, body);
    return {
      status: true,
      items: data?.data?.items ?? [],
      pagination: data?.data?.pagination ?? {
        page: 1,
        limit: 25,
        total: 0,
        totalPages: 1,
      },
      errors: null,
    };
  } catch (error) {
    return {
      status: false,
      items: [],
      pagination: { page: 1, limit: 25, total: 0, totalPages: 1 },
      errors:
        error?.response?.data?.message || 'Error al obtener el inventario.',
    };
  }
};
