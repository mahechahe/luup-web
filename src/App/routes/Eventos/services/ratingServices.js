import { constants } from '@/App/utils/constants/apiConstants';
import axios from 'axios';

const { BASE_URL, ENDPOINTS } = constants;
const RATINGS_URL = `${BASE_URL}/${ENDPOINTS.RATINGS}`;

export const getRatingCriteriaService = async () => {
  try {
    const { data } = await axios.get(`${RATINGS_URL}/criteria`);
    return { status: true, criteria: data?.data?.data ?? [], errors: null };
  } catch (error) {
    return {
      status: false,
      criteria: [],
      errors: error?.response?.data?.data?.message ?? 'Error al obtener criterios.',
    };
  }
};

export const upsertRatingService = async ({ eventId, userId, dateRegister, scores, notes }) => {
  try {
    const { data } = await axios.put(`${RATINGS_URL}/upsert`, {
      eventId,
      userId,
      dateRegister: dateRegister ?? null,
      scores,
      notes: notes ?? null,
    });
    return { status: true, rating: data?.data?.data ?? null, errors: null };
  } catch (error) {
    return {
      status: false,
      rating: null,
      errors: error?.response?.data?.data?.message ?? 'Error al guardar la calificación.',
    };
  }
};

export const getRatingByEventAndUserService = async ({ eventId, userId, dateRegister }) => {
  try {
    const { data } = await axios.post(`${RATINGS_URL}/by-event-user`, {
      eventId,
      userId,
      dateRegister: dateRegister ?? undefined,
    });
    return { status: true, rating: data?.data?.data ?? null, errors: null };
  } catch (error) {
    return {
      status: false,
      rating: null,
      errors: error?.response?.data?.data?.message ?? 'Error al obtener calificación.',
    };
  }
};

export const getCollaboratorRatingSummaryService = async (userId) => {
  try {
    const { data } = await axios.get(`${RATINGS_URL}/collaborator/${userId}/summary`);
    return { status: true, summary: data?.data?.data ?? null, errors: null };
  } catch (error) {
    return {
      status: false,
      summary: null,
      errors: error?.response?.data?.data?.message ?? 'Error al obtener resumen de calificaciones.',
    };
  }
};

export const getCollaboratorRatingHistoryService = async (userId, { page = 1, limit = 20 } = {}) => {
  try {
    const { data } = await axios.post(`${RATINGS_URL}/collaborator/${userId}/history`, { page, limit });
    return {
      status: true,
      ratings: data?.data?.data?.ratings ?? [],
      pagination: data?.data?.data?.pagination ?? null,
      errors: null,
    };
  } catch (error) {
    return {
      status: false,
      ratings: [],
      pagination: null,
      errors: error?.response?.data?.data?.message ?? 'Error al obtener historial de calificaciones.',
    };
  }
};
