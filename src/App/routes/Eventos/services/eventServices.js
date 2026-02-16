import { constants } from '@/app/utils/constants/apiConstants';
import axios from 'axios';

const { BASE_URL, ENDPOINTS } = constants;
const EVENTS_URL = `${BASE_URL}/${ENDPOINTS.EVENTS}`;
const COLLABORATOR_URL = `${BASE_URL}/${ENDPOINTS.COLLABORATOR}`;

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

export const getEventoDetailService = async (eventId) => {
  try {
    const { data } = await axios.get(`${EVENTS_URL}/${eventId}`);
    return { status: true, event: data?.data, errors: null };
  } catch (error) {
    return {
      status: false,
      event: null,
      errors: error?.response?.data?.message || 'Error al obtener el evento.',
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
      errors:
        error?.response?.data?.message || 'Error al actualizar el evento.',
    };
  }
};

export const getEventCollaboratorsService = async (body) => {
  try {
    const { data } = await axios.post(`${EVENTS_URL}/collaborators`, {
      page: body.page,
      limit: body.limit,
      firstName: body.firstName || undefined,
      cedula: body.cedula || undefined,
    });
    return {
      status: true,
      collaborators: data?.data?.collaborators ?? [],
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
      collaborators: [],
      pagination: { page: 1, limit: body.limit, total: 0, totalPages: 1 },
      errors:
        error?.response?.data?.message || 'Error al obtener colaboradores.',
    };
  }
};

export const uploadEventMapService = async (eventId, file) => {
  try {
    const formData = new FormData();
    formData.append('eventId', eventId);
    formData.append('file', file);
    const { data } = await axios.post(`${EVENTS_URL}/upload-map`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { status: true, data: data?.data, errors: null };
  } catch (error) {
    return {
      status: false,
      data: null,
      errors: error?.response?.data?.message || 'Error al subir el plano.',
    };
  }
};
