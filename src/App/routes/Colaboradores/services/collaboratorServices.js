import { constants } from '@/App/utils/constants/apiConstants';
import axios from 'axios';

const { BASE_URL, ENDPOINTS } = constants;
const USER_URL = `${BASE_URL}/${ENDPOINTS.USER}`;
const COLLABORATOR_URL = `${BASE_URL}/${ENDPOINTS.COLLABORATOR}`;
const RATINGS_URL = `${BASE_URL}/${ENDPOINTS.RATINGS}`;

export const getOwnCollaboratorProfileService = async () => {
  try {
    const { data } = await axios.get(`${COLLABORATOR_URL}/me`);
    return { status: true, profile: data?.data ?? null, errors: null };
  } catch (error) {
    return {
      status: false,
      profile: null,
      errors:
        error?.response?.data?.message ||
        error?.response?.data?.data?.message ||
        'Error al obtener tu perfil.',
    };
  }
};

export const updateOwnCollaboratorPhotoService = async (file) => {
  try {
    const formData = new FormData();
    formData.append('photo', file);
    const { data } = await axios.put(`${COLLABORATOR_URL}/me/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { status: true, photoUrl: data?.data?.photoUrl ?? null, errors: null };
  } catch (error) {
    return {
      status: false,
      photoUrl: null,
      errors:
        error?.response?.data?.message ||
        error?.response?.data?.data?.message ||
        'Error al actualizar tu foto.',
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

/**
 * Obtiene la lista paginada de colaboradores con filtros opcionales.
 */
/**
 * Obtiene los tipos de documento disponibles.
 *
 * Respuesta esperada:
 * { data: [{ id: number, code: string, name: string }] }
 */
export const getDocumentTypesService = async () => {
  try {
    const { data } = await axios.get(`${COLLABORATOR_URL}/document-types`);
    return { status: true, documentTypes: data?.data ?? [], errors: null };
  } catch (error) {
    return {
      status: false,
      documentTypes: [],
      errors:
        error?.response?.data?.message ||
        'Error al obtener los tipos de documento.',
    };
  }
};

export const getColaboradoresService = async (body) => {
  try {
    const { data } = await axios.post(`${COLLABORATOR_URL}/list`, body);
    return {
      status: true,
      users: data?.data?.users ?? [],
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
      users: [],
      pagination: { page: 1, limit: body.limit, total: 0, totalPages: 1 },
      errors:
        error?.response?.data?.message || 'Error al obtener los colaboradores.',
    };
  }
};

/**
 * Crea un nuevo colaborador.
 */
export const createColaboradorService = async (body) => {
  try {
    const { data } = await axios.post(`${COLLABORATOR_URL}`, body);
    return { status: true, data, errors: null };
  } catch (error) {
    return {
      status: false,
      data: null,
      errors:
        error?.response?.data?.message || 'Error al crear el colaborador.',
    };
  }
};

/**
 * Actualiza un colaborador existente.
 */
export const updateColaboradorService = async (body) => {
  try {
    const { data } = await axios.put(`${COLLABORATOR_URL}/update`, body);
    return { status: true, data, errors: null };
  } catch (error) {
    return {
      status: false,
      data: null,
      errors:
        error?.response?.data?.message || 'Error al actualizar el colaborador.',
    };
  }
};

/**
 * Obtiene la URL firmada del template de carga masiva.
 */
export const getCollaboratorTemplateService = async () => {
  try {
    const { data } = await axios.get(`${COLLABORATOR_URL}/template`);
    return { status: true, url: data?.data?.url ?? null, errors: null };
  } catch (error) {
    return {
      status: false,
      url: null,
      errors: error?.response?.data?.message || 'Error al obtener el template.',
    };
  }
};

/**
 * Carga masiva de colaboradores mediante un archivo Excel.
 */
export const uploadExcelCollaboratorsService = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await axios.post(
      `${COLLABORATOR_URL}/upload-excel`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return { status: true, result: data.data, errors: null };
  } catch (error) {
    return {
      status: false,
      result: null,
      errors:
        error?.response?.data?.message || 'Error al cargar el archivo Excel.',
    };
  }
};

export const getCollaboratorDetailService = async (collaboratorId) => {
  try {
    const { data } = await axios.get(`${COLLABORATOR_URL}/${collaboratorId}`);
    return { status: true, collaborator: data?.data ?? null, errors: null };
  } catch (error) {
    return {
      status: false,
      collaborator: null,
      errors:
        error?.response?.data?.message || 'Error al obtener el colaborador.',
    };
  }
};

// services/collaboratorServices.js

// services/collaboratorServices.js

// services/collaboratorServices.js

export const updateCollaboratorPhotoService = async (collaboratorId, file) => {
  try {
    const formData = new FormData();
    formData.append('photo', file);
    const { data } = await axios.put(
      `${COLLABORATOR_URL}/${collaboratorId}/photo`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return { status: true, photoUrl: data?.data?.photoUrl ?? null, errors: null };
  } catch (error) {
    return {
      status: false,
      photoUrl: null,
      errors:
        error?.response?.data?.message || 'Error al actualizar la foto de perfil.',
    };
  }
};

export const deleteCollaboratorService = async (collaboratorId) => {
  try {
    // La URL es la que tienes en Postman (sin el ID al final)
    const url = `${COLLABORATOR_URL}/delete`;

    // En DELETE con Axios, el body se envía dentro de una propiedad llamada 'data'
    const { data } = await axios.delete(url, {
      data: {
        userId: collaboratorId, // Esto envía { "userId": 11 }
      },
    });

    return { status: true, data, errors: null };
  } catch (error) {
    console.error('Error en el service:', error.response);
    return {
      status: false,
      errors:
        error?.response?.data?.message || 'Error al eliminar el colaborador.',
    };
  }
};
