import { constants } from '@/App/utils/constants/apiConstants';
import axios from 'axios';

const { BASE_URL, ENDPOINTS } = constants;

export const getCollaboratorLocationHistoryService = async (
  eventId,
  userId,
  { page = 1, limit = 500 } = {}
) => {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    const { data } = await axios.get(
      `${BASE_URL}/${ENDPOINTS.LOCATION}/history/${eventId}/users/${userId}?${params}`
    );
    return {
      status: true,
      points: data?.data?.points ?? [],
      pagination: data?.data?.pagination ?? null,
      errors: null,
    };
  } catch (error) {
    return {
      status: false,
      points: [],
      pagination: null,
      errors:
        error?.response?.data?.message ||
        'Error al obtener el historial de ubicaciones.',
    };
  }
};
