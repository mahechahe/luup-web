import { constants } from '@/App/utils/constants/apiConstants';
import axios from 'axios';

const { BASE_URL, ENDPOINTS } = constants;

export const getEventUsersWithLocationService = async (
  eventId,
  { page = 1, limit = 10, name = '', cedula = '' } = {}
) => {
  try {
    const params = new URLSearchParams();
    if (page) params.set('page', String(page));
    if (limit) params.set('limit', String(limit));
    if (name) params.set('name', name);
    if (cedula) params.set('cedula', cedula);
    const { data } = await axios.get(
      `${BASE_URL}/${ENDPOINTS.LOCATION}/event/${eventId}/users?${params.toString()}`
    );
    return {
      status: true,
      users: data?.data?.users ?? [],
      pagination: data?.data?.pagination ?? null,
      errors: null,
    };
  } catch (error) {
    return {
      status: false,
      users: [],
      pagination: null,
      errors:
        error?.response?.data?.message ||
        'Error al obtener los usuarios del evento.',
    };
  }
};

export const registerUserDeviceService = async ({
  userId,
  eventId,
  role,
  deviceId,
}) => {
  try {
    const { data } = await axios.post(
      `${BASE_URL}/${ENDPOINTS.LOCATION}/register`,
      { userId, eventId, role, deviceId }
    );
    return { status: true, data: data?.data ?? null, errors: null };
  } catch (error) {
    return {
      status: false,
      data: null,
      errors:
        error?.response?.data?.message ||
        'Error al registrar el dispositivo.',
    };
  }
};

export const getLiveLocationsService = async (eventId) => {
  try {
    const { data } = await axios.get(
      `${BASE_URL}/${ENDPOINTS.LOCATION}/live/${eventId}`
    );
    return { status: true, data: data?.data ?? [], errors: null };
  } catch (error) {
    return {
      status: false,
      data: [],
      errors:
        error?.response?.data?.message ||
        'Error al obtener ubicaciones en tiempo real.',
    };
  }
};
