import { constants } from '@/App/utils/constants/apiConstants';
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
      errors:
        error?.response?.data?.message ||
        'Error al obtener las zonas del evento.',
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
      errors:
        error?.response?.data?.message || 'Error al registrar la incidencia.',
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
    let payload;
    let headers = {};

    if (body.file) {
      payload = new FormData();
      payload.append('entryType', body.entryType ?? 'bags');
      if (body.quantity != null) payload.append('quantity', body.quantity);
      if (body.weightKg != null) payload.append('weightKg', body.weightKg);
      if (body.bagColor)         payload.append('bagColor', body.bagColor);
      if (body.note)             payload.append('note', body.note);
      payload.append('file', body.file);
      headers = { 'Content-Type': 'multipart/form-data' };
    } else {
      payload = {
        entryType: body.entryType ?? 'bags',
        quantity:  body.quantity  ?? null,
        weightKg:  body.weightKg  ?? null,
        bagColor:  body.bagColor  ?? null,
        note:      body.note      ?? null,
      };
    }

    const res = await axios.post(
      `${EVENTS_URL}/zones/${zoneId}/waste`,
      payload,
      { headers }
    );
    paramShowMessageApi(res);
    return {
      status: true,
      entry: res.data?.data?.log ?? null,
      errors: null,
    };
  } catch (error) {
    paramShowMessageApi(error?.response);
    return {
      status: false,
      entry: null,
      errors: error?.response?.data?.message || 'Error al registrar la basura.',
    };
  }
};

export const getZoneWasteHistoryService = async (zoneId) => {
  try {
    const res = await axios.get(`${EVENTS_URL}/zones/${zoneId}/waste`);
    paramShowMessageApi(res);
    return {
      status: true,
      logs: res.data?.data?.logs ?? [],
      errors: null,
    };
  } catch (error) {
    paramShowMessageApi(error?.response);
    return {
      status: false,
      logs: [],
      errors:
        error?.response?.data?.message || 'Error al obtener el historial.',
    };
  }
};

export const getWasteDistributionsService = async (zoneId) => {
  try {
    const res = await axios.get(
      `${EVENTS_URL}/zones/${zoneId}/waste/distributions`,
    );
    paramShowMessageApi(res);
    return { status: true, summary: res.data?.data ?? null, errors: null };
  } catch (error) {
    paramShowMessageApi(error?.response);
    return {
      status: false,
      summary: null,
      errors:
        error?.response?.data?.message ||
        'Error al obtener la distribución de kilogramos.',
    };
  }
};

export const createWasteDistributionService = async (zoneId, body) => {
  try {
    const res = await axios.post(
      `${EVENTS_URL}/zones/${zoneId}/waste/distributions`,
      body,
    );
    paramShowMessageApi(res);
    return { status: true, summary: res.data?.data ?? null, errors: null };
  } catch (error) {
    paramShowMessageApi(error?.response);
    return {
      status: false,
      summary: null,
      errors: error?.response?.data?.message || 'Error al guardar la distribución.',
    };
  }
};

export const updateWasteDistributionService = async (
  zoneId,
  distributionId,
  body,
) => {
  try {
    const res = await axios.put(
      `${EVENTS_URL}/zones/${zoneId}/waste/distributions/${distributionId}`,
      body,
    );
    paramShowMessageApi(res);
    return { status: true, summary: res.data?.data ?? null, errors: null };
  } catch (error) {
    paramShowMessageApi(error?.response);
    return {
      status: false,
      summary: null,
      errors:
        error?.response?.data?.message || 'Error al actualizar la distribución.',
    };
  }
};

export const deleteWasteDistributionService = async (
  zoneId,
  distributionId,
) => {
  try {
    const res = await axios.delete(
      `${EVENTS_URL}/zones/${zoneId}/waste/distributions/${distributionId}`,
    );
    paramShowMessageApi(res);
    return { status: true, summary: res.data?.data ?? null, errors: null };
  } catch (error) {
    paramShowMessageApi(error?.response);
    return {
      status: false,
      summary: null,
      errors: error?.response?.data?.message || 'Error al eliminar la distribución.',
    };
  }
};

export const getWasteSignedUrlService = async (zoneId, logId) => {
  try {
    const res = await axios.get(
      `${EVENTS_URL}/zones/${zoneId}/waste/${logId}/signed-url`
    );
    paramShowMessageApi(res);
    return {
      status: true,
      signedUrl: res.data?.data?.signedUrl ?? null,
      errors: null,
    };
  } catch (error) {
    paramShowMessageApi(error?.response);
    return {
      status: false,
      signedUrl: null,
      errors: error?.response?.data?.message || 'Error al obtener la imagen.',
    };
  }
};

export const updateDeliveryService = async ({
  attendanceId,
  type,
  received,
  snackDetail,
}) => {
  try {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const yyyy = today.getFullYear();
    const body = {
      attendanceId,
      type,
      received,
      dateRegister: `${mm}-${dd}-${yyyy}`,
    };
    if (type === 'snack' && snackDetail) body.snackDetail = snackDetail;
    const { data } = await axios.patch(
      `${EVENTS_URL}/attendance/delivery`,
      body
    );
    return { status: true, data: data?.data, errors: null };
  } catch (error) {
    return {
      status: false,
      data: null,
      errors:
        error?.response?.data?.message || 'Error al actualizar la entrega.',
    };
  }
};

export const upsertAttendanceService = async (body) => {
  try {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const yyyy = today.getFullYear();
    const requestedDate = body.dateRegister;
    const dateRegister = /^\d{4}-\d{2}-\d{2}$/.test(requestedDate ?? '')
      ? `${requestedDate.slice(5, 7)}-${requestedDate.slice(8, 10)}-${requestedDate.slice(0, 4)}`
      : requestedDate || `${mm}-${dd}-${yyyy}`;
    const { data } = await axios.put(`${EVENTS_URL}/attendance/upsert`, {
      ...body,
      dateRegister,
    });
    return { status: true, data: data?.data, errors: null };
  } catch (error) {
    return {
      status: false,
      data: null,
      errors:
        error?.response?.data?.message || 'Error al actualizar la asistencia.',
    };
  }
};

export const getWorkerCurrentEventService = async () => {
  try {
    const { data } = await axios.get(`${EVENTS_URL}/worker/current`);
    return {
      status: true,
      assigned: data?.data?.assigned ?? false,
      currentEvent: data?.data?.currentEvent ?? null,
      errors: null,
    };
  } catch (error) {
    return {
      status: false,
      assigned: false,
      currentEvent: null,
      errors:
        error?.response?.data?.message || 'Error al obtener el evento actual.',
    };
  }
};

export const getWorkerEventHistoryService = async ({
  page = 1,
  limit = 10,
}) => {
  try {
    const { data } = await axios.get(
      `${EVENTS_URL}/worker/history?page=${page}&limit=${limit}`
    );
    return {
      status: true,
      history: data?.data?.history ?? [],
      pagination: data?.data?.pagination ?? {
        page,
        limit,
        total: 0,
        totalPages: 1,
      },
      errors: null,
    };
  } catch (error) {
    return {
      status: false,
      history: [],
      pagination: { page, limit, total: 0, totalPages: 1 },
      errors:
        error?.response?.data?.message || 'Error al obtener el historial.',
    };
  }
};

export const getAttendanceRecordsService = async (eventId, filters = {}) => {
  try {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const yyyy = today.getFullYear();
    const body = {
      eventId: Number(eventId),
      dateRegister: `${mm}-${dd}-${yyyy}`,
    };
    if (filters.name) body.name = filters.name;
    if (filters.cedula) body.cedula = filters.cedula;
    if (filters.page) body.page = filters.page;
    if (filters.limit) body.limit = filters.limit;
    const { data } = await axios.post(`${EVENTS_URL}/attendance/records`, body);
    return { status: true, data: data?.data, errors: null };
  } catch (error) {
    return {
      status: false,
      data: null,
      errors:
        error?.response?.data?.message ||
        'Error al obtener los registros de asistencia.',
    };
  }
};

export const getEventAttendanceService = async (eventId, filters = {}) => {
  try {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const yyyy = today.getFullYear();
    const body = {
      eventId: Number(eventId),
      dateRegister: `${mm}-${dd}-${yyyy}`,
    };
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

export const getWorkerZonesService = async (eventId) => {
  try {
    const { data } = await axios.get(`${EVENTS_URL}/zones/${eventId}/my-zones`);
    return {
      status: true,
      zones: data?.data?.zones ?? [],
      errors: null,
    };
  } catch (error) {
    return {
      status: false,
      zones: [],
      errors: error?.response?.data?.message || 'Error al obtener tus zonas.',
    };
  }
};

export const getWorkerAttendanceService = async (eventId) => {
  try {
    const { data } = await axios.get(
      `${EVENTS_URL}/worker/attendance/${eventId}`
    );
    return {
      status: true,
      attendance: data?.data ?? null,
      errors: null,
    };
  } catch (error) {
    return {
      status: false,
      attendance: null,
      errors:
        error?.response?.data?.message || 'Error al obtener tu asistencia.',
    };
  }
};

export const getStation3RecordsService = async (eventId, filters = {}) => {
  try {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const yyyy = today.getFullYear();
    const body = {
      eventId: Number(eventId),
      dateRegister: `${mm}-${dd}-${yyyy}`,
      page: filters.page ?? 1,
      limit: filters.limit ?? 25,
    };
    if (filters.name) body.name = filters.name;
    if (filters.cedula) body.cedula = filters.cedula;
    const { data } = await axios.post(
      `${EVENTS_URL}/attendance/station3`,
      body
    );
    return { status: true, data: data?.data, errors: null };
  } catch (error) {
    return {
      status: false,
      data: null,
      errors:
        error?.response?.data?.message ||
        'Error al obtener los registros de estación 3.',
    };
  }
};

export const getStation4RecordsService = async (eventId, filters = {}) => {
  try {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const yyyy = today.getFullYear();
    const body = {
      eventId: Number(eventId),
      dateRegister: `${mm}-${dd}-${yyyy}`,
      page: filters.page ?? 1,
      limit: filters.limit ?? 25,
      station4: true,
    };
    if (filters.name) body.name = filters.name;
    if (filters.cedula) body.cedula = filters.cedula;
    const { data } = await axios.post(
      `${EVENTS_URL}/attendance/station3`,
      body
    );
    return { status: true, data: data?.data, errors: null };
  } catch (error) {
    return {
      status: false,
      data: null,
      errors:
        error?.response?.data?.message ||
        'Error al obtener los registros de estación 3.',
    };
  }
};

export const checkoutService = async ({
  attendanceId,
  returnedUniform,
  exitTime,
  createdBy,
  items,
}) => {
  try {
    const body = { attendanceId, returnedUniform, exitTime, createdBy };
    if (items && items.length > 0) body.items = items;
    const { data } = await axios.patch(
      `${EVENTS_URL}/attendance/checkout`,
      body
    );
    return { status: true, data: data?.data?.data, errors: null };
  } catch (error) {
    return {
      status: false,
      data: null,
      errors:
        error?.response?.data?.message || 'Error al registrar el checkout.',
    };
  }
};

export const confirmAssignmentService = async (attendanceId) => {
  try {
    const { data } = await axios.patch(
      `${EVENTS_URL}/worker/attendance/${attendanceId}/confirm-station-2`,
      {}
    );
    return { status: true, data: data?.data, errors: null };
  } catch (error) {
    return {
      status: false,
      data: null,
      errors:
        error?.response?.data?.message || 'Error al confirmar la asignación.',
    };
  }
};

export const confirmInventoryService = async (eventId) => {
  try {
    const { data } = await axios.patch(
      `${EVENTS_URL}/worker/attendance/${eventId}/confirm-inventory`,
      {}
    );
    return { status: true, data: data?.data, errors: null };
  } catch (error) {
    return {
      status: false,
      data: null,
      errors:
        error?.response?.data?.message || 'Error al confirmar el inventario.',
    };
  }
};

export const transferPersonZoneService = async ({
  userId,
  fromZoneId,
  toZoneId,
  eventId,
}) => {
  try {
    const { data } = await axios.post(`${EVENTS_URL}/zones/transfer`, {
      userId,
      fromZoneId,
      toZoneId,
      eventId,
    });
    return {
      status: true,
      data: data?.data ?? null,
      errors: null,
    };
  } catch (error) {
    return {
      status: false,
      data: null,
      errors:
        error?.response?.data?.message || 'Error al trasladar la persona.',
    };
  }
};

export const createTruckExitService = async (zoneId, body) => {
  try {
    let payload;
    let headers = {};

    if (body.file) {
      payload = new FormData();
      payload.append('quantity', body.quantity);
      payload.append('weightKg', body.weightKg);
      payload.append('driverName', body.driverName);
      payload.append('driverCedula', body.driverCedula);
      payload.append('plate', body.plate);
      if (body.note) payload.append('note', body.note);
      payload.append('file', body.file);
      headers = { 'Content-Type': 'multipart/form-data' };
    } else {
      payload = {
        quantity: body.quantity,
        weightKg: body.weightKg,
        driverName: body.driverName,
        driverCedula: body.driverCedula,
        plate: body.plate,
        note: body.note ?? null,
      };
    }

    const res = await axios.post(
      `${EVENTS_URL}/zones/${zoneId}/waste/exits`,
      payload,
      { headers },
    );
    paramShowMessageApi(res);
    return {
      status: true,
      exit: res.data?.data?.exit ?? null,
      errors: null,
    };
  } catch (error) {
    paramShowMessageApi(error?.response);
    return {
      status: false,
      exit: null,
      errors: error?.response?.data?.message || 'Error al registrar la salida.',
    };
  }
};

export const getZoneTruckExitsService = async (zoneId) => {
  try {
    const res = await axios.get(`${EVENTS_URL}/zones/${zoneId}/waste/exits`);
    paramShowMessageApi(res);
    return {
      status: true,
      exits: res.data?.data?.exits ?? [],
      errors: null,
    };
  } catch (error) {
    paramShowMessageApi(error?.response);
    return {
      status: false,
      exits: [],
      errors: error?.response?.data?.message || 'Error al obtener las salidas.',
    };
  }
};

export const getTruckExitSignedUrlService = async (zoneId, exitId) => {
  try {
    const res = await axios.get(
      `${EVENTS_URL}/zones/${zoneId}/waste/exits/${exitId}/signed-url`,
    );
    paramShowMessageApi(res);
    return {
      status: true,
      signedUrl: res.data?.data?.signedUrl ?? null,
      errors: null,
    };
  } catch (error) {
    paramShowMessageApi(error?.response);
    return {
      status: false,
      signedUrl: null,
      errors: error?.response?.data?.message || 'Error al obtener la imagen.',
    };
  }
};

export const createRequirementService = async (zoneId, { note, file }) => {
  try {
    let payload;
    let headers = {};

    if (file) {
      payload = new FormData();
      payload.append('note', note);
      payload.append('file', file);
      headers = { 'Content-Type': 'multipart/form-data' };
    } else {
      payload = { note };
    }

    const res = await axios.post(`${EVENTS_URL}/zones/${zoneId}/requirements`, payload, { headers });
    return {
      status: true,
      requirement: res.data?.data?.requirement ?? null,
      errors: null,
    };
  } catch (error) {
    paramShowMessageApi(error?.response);
    return {
      status: false,
      requirement: null,
      errors: error?.response?.data?.message || 'Error al registrar el requerimiento.',
    };
  }
};

export const getRequirementSignedUrlService = async (zoneId, requirementId) => {
  try {
    const res = await axios.get(
      `${EVENTS_URL}/zones/${zoneId}/requirements/${requirementId}/signed-url`
    );
    return { status: true, url: res.data?.data?.url ?? null };
  } catch (error) {
    return { status: false, url: null };
  }
};

export const getZoneRequirementsService = async (zoneId) => {
  try {
    const res = await axios.get(`${EVENTS_URL}/zones/${zoneId}/requirements`);
    paramShowMessageApi(res);
    return {
      status: true,
      requirements: res.data?.data?.requirements ?? [],
      errors: null,
    };
  } catch (error) {
    paramShowMessageApi(error?.response);
    return {
      status: false,
      requirements: [],
      errors: error?.response?.data?.message || 'Error al obtener los requerimientos.',
    };
  }
};

export const getAttendanceHistoryService = async (body) => {
  try {
    const { data } = await axios.post(`${EVENTS_URL}/attendance/history`, body);
    return { status: true, data: data?.data, errors: null };
  } catch (error) {
    return {
      status: false,
      data: null,
      errors:
        error?.response?.data?.message ||
        'Error al obtener el histórico de asistencia.',
    };
  }
};
