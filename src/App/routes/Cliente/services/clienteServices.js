import { constants } from '@/App/utils/constants/apiConstants';
import axios from 'axios';

const { BASE_URL } = constants;
const CLIENT_URL = `${BASE_URL}/client`;

export const getClienteEventosService = async () => {
  try {
    const { data } = await axios.get(`${CLIENT_URL}/portal/events`);
    return { status: true, events: data?.data ?? [], errors: null };
  } catch (error) {
    return { status: false, events: [], errors: error?.response?.data?.message || 'Error al obtener los eventos.' };
  }
};

export const getClienteEventoSummaryService = async (eventId) => {
  try {
    const { data } = await axios.get(`${CLIENT_URL}/portal/events/${eventId}/summary`);
    return { status: true, summary: data?.data ?? null, errors: null };
  } catch (error) {
    return { status: false, summary: null, errors: error?.response?.data?.message || 'Error al obtener el resumen.' };
  }
};

export const getClienteDashboardService = async () => {
  try {
    const { data } = await axios.get(`${CLIENT_URL}/portal/dashboard`);
    return { status: true, dashboard: data?.data ?? null, errors: null };
  } catch (error) {
    return { status: false, dashboard: null, errors: error?.response?.data?.message || 'Error al obtener el dashboard.' };
  }
};

// ── Admin ──────────────────────────────────────────────────────────────────

export const createClienteUserService = async (body) => {
  try {
    const { data } = await axios.post(`${CLIENT_URL}/users`, body);
    return { status: true, user: data?.data ?? null, errors: null };
  } catch (error) {
    return { status: false, user: null, errors: error?.response?.data?.message || 'Error al crear el cliente.' };
  }
};

export const listClienteUsersService = async () => {
  try {
    const { data } = await axios.get(`${CLIENT_URL}/users`);
    return { status: true, users: data?.data ?? [], errors: null };
  } catch (error) {
    return { status: false, users: [], errors: error?.response?.data?.message || 'Error al obtener los clientes.' };
  }
};

export const assignClienteToEventService = async (eventId, body) => {
  try {
    const { data } = await axios.post(`${CLIENT_URL}/events/${eventId}/assign`, body);
    return { status: true, data: data?.data ?? null, errors: null };
  } catch (error) {
    return { status: false, data: null, errors: error?.response?.data?.message || 'Error al asignar el cliente.' };
  }
};

export const removeClienteFromEventService = async (eventId, clientId) => {
  try {
    const { data } = await axios.delete(`${CLIENT_URL}/events/${eventId}/assign/${clientId}`);
    return { status: true, data: data?.data ?? null, errors: null };
  } catch (error) {
    return { status: false, data: null, errors: error?.response?.data?.message || 'Error al remover el cliente.' };
  }
};

export const updateEventClienteService = async (eventId, clientId, body) => {
  try {
    const { data } = await axios.put(`${CLIENT_URL}/events/${eventId}/clients/${clientId}`, body);
    return { status: true, data: data?.data ?? null, errors: null };
  } catch (error) {
    return { status: false, data: null, errors: error?.response?.data?.message || 'Error al actualizar el cliente.' };
  }
};

export const uploadReportService = async (eventId, clientId, file) => {
  try {
    const form = new FormData();
    form.append('report', file);
    const { data } = await axios.post(
      `${CLIENT_URL}/events/${eventId}/assign/${clientId}/report`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return { status: true, data: data?.data ?? null, errors: null };
  } catch (error) {
    return { status: false, data: null, errors: error?.response?.data?.message || 'Error al subir el informe.' };
  }
};

export const getEventClientesService = async (eventId) => {
  try {
    const { data } = await axios.get(`${CLIENT_URL}/events/${eventId}/clients`);
    return { status: true, clients: data?.data ?? [], errors: null };
  } catch (error) {
    return { status: false, clients: [], errors: error?.response?.data?.message || 'Error al obtener los clientes del evento.' };
  }
};
