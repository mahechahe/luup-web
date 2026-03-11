import { constants } from '@/App/utils/constants/apiConstants';
import axios from 'axios';

const { BASE_URL } = constants;
const INVENTORY_URL = `${BASE_URL}/inventory`;

/**
 * GET /inventory?nombre=...&descripcion=...&page=1&limit=10
 * Retorna: { status, items, pagination, errors }
 */
export const getInventoryItemsService = async ({ page = 1, limit = 10, nombre, descripcion } = {}) => {
  try {
    const params = { page, limit };
    if (nombre) params.nombre = nombre;
    if (descripcion) params.descripcion = descripcion;
    const { data } = await axios.get(INVENTORY_URL, { params });
    return {
      status: true,
      items: data?.data?.items ?? [],
      pagination: data?.data?.pagination ?? { page: 1, limit, total: 0, totalPages: 1 },
      errors: null,
    };
  } catch (error) {
    return {
      status: false,
      items: [],
      pagination: { page: 1, limit, total: 0, totalPages: 1 },
      errors: error?.response?.data?.message || 'Error al obtener el inventario.',
    };
  }
};

/**
 * POST /inventory
 * Body: { nombre, cantidad, precioUnitario }
 */
export const createInventoryItemService = async (body) => {
  try {
    const { data } = await axios.post(INVENTORY_URL, body);
    return { status: true, item: data?.data ?? null, errors: null };
  } catch (error) {
    return {
      status: false,
      item: null,
      errors: error?.response?.data?.message || 'Error al crear el ítem.',
    };
  }
};

/**
 * PUT /inventory
 * Body: { itemId, nombre, cantidad, precioUnitario }
 */
export const updateInventoryItemService = async (body) => {
  try {
    const { data } = await axios.put(INVENTORY_URL, body);
    return { status: true, item: data?.data ?? null, errors: null };
  } catch (error) {
    return {
      status: false,
      item: null,
      errors: error?.response?.data?.message || 'Error al actualizar el ítem.',
    };
  }
};

/**
 * DELETE /inventory
 * Body: { itemId }
 */
export const deleteInventoryItemService = async (itemId) => {
  try {
    const { data } = await axios.delete(INVENTORY_URL, { data: { itemId } });
    return { status: true, data, errors: null };
  } catch (error) {
    return {
      status: false,
      errors: error?.response?.data?.message || 'Error al eliminar el ítem.',
    };
  }
};