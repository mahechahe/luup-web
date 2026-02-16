import { constants } from '@/app/utils/constants/apiConstants';
import axios from 'axios';

const { BASE_URL, ENDPOINTS } = constants;
const USER_URL = `${BASE_URL}/${ENDPOINTS.USER}`;
const COLLABORATOR_URL = `${BASE_URL}/${ENDPOINTS.COLLABORATOR}`;

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
 *
 * @param {{
 *   firstName: string,
 *   lastName: string,
 *   phone: string,
 *   cedula: string,
 *   typeDocument: number,
 *   email?: string,
 *   age?: number,
 *   gender?: 'male' | 'female' | 'other'
 * }} body
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
 *
 * @param {{
 *   collaboratorId: number,
 *   firstName: string,
 *   lastName: string,
 *   phone: string,
 *   cedula: string,
 *   typeDocument: number,
 *   email?: string,
 *   age?: number,
 *   gender?: 'male' | 'female' | 'other'
 * }} body
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
 *
 * @param {File} file - Archivo .xlsx / .xls a subir
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
