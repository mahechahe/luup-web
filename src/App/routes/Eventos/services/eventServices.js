import { constants } from '@/app/utils/constants/apiConstants';
import { paramShowMessageApi } from '@/App/utils/functions/paramShowMessageApi';
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

export const getEventZonesWithStaffService = async (eventId) => {
  try {
    const { data } = await axios.get(`${EVENTS_URL}/zones/${eventId}`);
    return {
      status: true,
      zones: data?.data?.zones ?? [],
      errors: null,
    };
  } catch (error) {
    return {
      status: false,
      zones: [],
      errors: error?.response?.data?.message || 'Error al obtener las zonas del evento.',
    };
  }
};

export const createIncidentService = async (body) => {
  try {
    const { data } = await axios.post(`${EVENTS_URL}/incidents`, body);
    return {
      status: true,
      incident: data?.data?.incident ?? null,
      errors: null,
    };
  } catch (error) {
    return {
      status: false,
      incident: null,
      errors: error?.response?.data?.message || 'Error al registrar la incidencia.',
    };
  }
};

export const getEventZonesService = async (eventId) => {
  try {
    const { data } = await axios.get(`${EVENTS_URL}/${eventId}/zones`);
    return { status: true, data: data?.data, errors: null };
  } catch (error) {
    return {
      status: false,
      data: null,
      errors: error?.response?.data?.message || 'Error al obtener las zonas.',
    };
  }
};

export const updateEventZonesService = async (body) => {
  try {
    const res = await axios.put(`${EVENTS_URL}/zones/update`, body);
    paramShowMessageApi(res);
    return { status: true, data: res?.data?.data, errors: null };
  } catch (error) {
    paramShowMessageApi(error?.response);
    return {
      status: false,
      data: null,
      errors:
        error?.response?.data?.message || 'Error al actualizar las zonas.',
    };
  }
};

export const deleteEventZoneService = async (zoneId) => {
  try {
    const res = await axios.delete(`${EVENTS_URL}/zones/${zoneId}`);
    paramShowMessageApi(res);
    return { status: true, data: res?.data?.data, errors: null };
  } catch (error) {
    paramShowMessageApi(error?.response);
    return {
      status: false,
      data: null,
      errors: error?.response?.data?.message || 'Error al eliminar la zona.',
    };
  }
};

export const createWasteEntryService = async (zoneId, body) => {
  try {
    const { data } = await axios.post(`${EVENTS_URL}/zones/${zoneId}/waste`, body);
    return {
      status: true,
      entry: data?.data?.entry ?? null,
      errors: null,
    };
  } catch (error) {
    return {
      status: false,
      entry: null,
      errors: error?.response?.data?.message || 'Error al registrar la basura.',
    };
  }
};

export const upsertAttendanceService = async (body) => {
  try {
    const { data } = await axios.put(`${EVENTS_URL}/attendance/upsert`, body);
    return { status: true, data: data?.data, errors: null };
  } catch (error) {
    return {
      status: false,
      data: null,
      errors:
        error?.response?.data?.message ||
        'Error al actualizar la asistencia.',
    };
  }
};

export const getEventAttendanceService = async (eventId, filters = {}) => {
  try {
    const body = { eventId: Number(eventId) };
    if (filters.name) body.name = filters.name;
    if (filters.cedula) body.cedula = filters.cedula;

    const { data } = await axios.post(`${EVENTS_URL}/attendance/list`, body);
    return {
      status: true,
      data: data?.data,
      errors: null,
    };
  } catch (error) {
    return {
      status: false,
      data: null,
      errors:
        error?.response?.data?.message ||
        'Error al obtener la asistencia del evento.',
    };
  }
};
