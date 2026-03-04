import { constants } from '@/App/utils/constants/apiConstants';
import axios from 'axios';

const { BASE_URL } = constants;
const INVENTORY_URL = `${BASE_URL}/inventory`;

/**
 * GET /inventory
 * Retorna: { status, items: [{ id, nombre, cantidad, precioUnitario }] }
 */
export const getInventoryItemsService = async () => {
  try {
    const { data } = await axios.get(INVENTORY_URL);
    return { status: true, items: data?.data ?? [], errors: null };
  } catch (error) {
    return {
      status: false,
      items: [],
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