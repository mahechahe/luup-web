import { constants } from '@/app/utils/constants/apiConstants';
import axios from 'axios';

const { BASE_URL, ENDPOINTS } = constants;
const EVENTS_URL = `${BASE_URL}/${ENDPOINTS.EVENTS}`;

export const getEventosService = async (body) => {
  try {
    const { data } = await axios.post(`${EVENTS_URL}/list`, body);
    return {
      status: true,
      events: data?.data?.events ?? [],
      pagination: data?.data?.pagination ?? {
        page: 1,
        limit: body.limit,
        total: 0,
        totalPages: 1,
      },
      errors: null,
    };
  } catch (error) {
    return {
      status: false,
      events: [],
      pagination: { page: 1, limit: body.limit, total: 0, totalPages: 1 },
      errors: error?.response?.data?.message || 'Error al obtener los eventos.',
    };
  }
};

export const createEventoService = async (body) => {
  try {
    const { data } = await axios.post(`${EVENTS_URL}`, body);
    return { status: true, data, errors: null };
  } catch (error) {
    return {
      status: false,
      data: null,
      errors: error?.response?.data?.message || 'Error al crear el evento.',
    };
  }
};

export const updateEventoService = async (body) => {
  try {
    const { data } = await axios.put(`${EVENTS_URL}/update`, body);
    return { status: true, data, errors: null };
  } catch (error) {
    return {
      status: false,
      data: null,
      errors: error?.response?.data?.message || 'Error al actualizar el evento.',
    };
  }
};
