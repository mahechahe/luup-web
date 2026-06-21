import { constants } from '@/App/utils/constants/apiConstants';
import axios from 'axios';

const { BASE_URL, ENDPOINTS } = constants;
const EVENTS_URL = `${BASE_URL}/${ENDPOINTS.EVENTS}`;

const getFailedZones = (results, zones) =>
  results.flatMap((result, index) => {
    if (result.status === 'fulfilled') return [];

    const zone = zones[index];
    return [
      {
        id: zone.id,
        name: zone.name,
        error:
          result.reason?.response?.data?.message ||
          result.reason?.message ||
          'No se pudo consultar la zona.',
      },
    ];
  });

export const getAcopioZonesService = async (eventId) => {
  try {
    const { data: zonesResp } = await axios.get(
      `${EVENTS_URL}/zones/${eventId}`
    );
    const allZones = zonesResp?.data?.zones ?? [];
    const acopioZones = allZones.filter((z) => z.category === 'acopio');
    return { status: true, zones: acopioZones, errors: null };
  } catch (error) {
    return {
      status: false,
      zones: [],
      errors: error?.response?.data?.message || 'Error al obtener las zonas.',
    };
  }
};

export const getWasteLogsReportService = async (eventId, zoneId = null) => {
  try {
    let zonesToFetch;

    if (zoneId) {
      zonesToFetch = [{ id: zoneId, name: null }];
    } else {
      const { data: zonesResp } = await axios.get(
        `${EVENTS_URL}/zones/${eventId}`
      );
      const allZones = zonesResp?.data?.zones ?? [];
      zonesToFetch = allZones.filter((z) => z.category === 'acopio');
    }

    if (zonesToFetch.length === 0) {
      return {
        status: true,
        logs: [],
        partial: false,
        failedZones: [],
        errors: null,
      };
    }

    const results = await Promise.allSettled(
      zonesToFetch.map((zone) =>
        axios.get(`${EVENTS_URL}/zones/${zone.id}/waste`).then((res) => ({
          zone: {
            id: res.data?.data?.zoneId ?? zone.id,
            name: res.data?.data?.zoneName ?? zone.name,
          },
          logs: res.data?.data?.logs ?? [],
        }))
      )
    );

    const successfulResults = results.filter((r) => r.status === 'fulfilled');
    const failedZones = getFailedZones(results, zonesToFetch);

    if (successfulResults.length === 0) {
      return {
        status: false,
        logs: [],
        partial: false,
        failedZones,
        errors: 'No se pudo consultar ninguna zona de acopio.',
      };
    }

    const logs = successfulResults
      .flatMap(({ value: { zone, logs } }) =>
        logs.map((log) => ({ ...log, zoneId: zone.id, zoneName: zone.name }))
      )
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return {
      status: true,
      logs,
      partial: failedZones.length > 0,
      failedZones,
      errors: null,
    };
  } catch (error) {
    return {
      status: false,
      logs: [],
      partial: false,
      failedZones: [],
      errors:
        error?.response?.data?.message || 'Error al obtener los ingresos.',
    };
  }
};

export const getTruckExitsReportService = async (eventId) => {
  try {
    const { data: zonesResp } = await axios.get(
      `${EVENTS_URL}/zones/${eventId}`
    );
    const allZones = zonesResp?.data?.zones ?? [];
    const acopioZones = allZones.filter((z) => z.category === 'acopio');

    if (acopioZones.length === 0) {
      return {
        status: true,
        exits: [],
        zones: [],
        partial: false,
        failedZones: [],
        errors: null,
      };
    }

    const results = await Promise.allSettled(
      acopioZones.map((zone) =>
        axios
          .get(`${EVENTS_URL}/zones/${zone.id}/waste/exits`)
          .then((res) => ({ zone, exits: res.data?.data?.exits ?? [] }))
      )
    );

    const successfulResults = results.filter((r) => r.status === 'fulfilled');
    const failedZones = getFailedZones(results, acopioZones);

    if (successfulResults.length === 0) {
      return {
        status: false,
        exits: [],
        zones: acopioZones,
        partial: false,
        failedZones,
        errors: 'No se pudo consultar ninguna zona de acopio.',
      };
    }

    const exits = successfulResults
      .flatMap(({ value: { zone, exits } }) =>
        exits.map((exit) => ({ ...exit, zoneId: zone.id, zoneName: zone.name }))
      )
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return {
      status: true,
      exits,
      zones: acopioZones,
      partial: failedZones.length > 0,
      failedZones,
      errors: null,
    };
  } catch (error) {
    return {
      status: false,
      exits: [],
      zones: [],
      partial: false,
      failedZones: [],
      errors: error?.response?.data?.message || 'Error al obtener las salidas.',
    };
  }
};

export const getEventPhotosService = async (eventId) => {
  try {
    const { data } = await axios.get(`${EVENTS_URL}/${eventId}/photos`);
    return {
      status: true,
      photos: data?.data?.photos ?? [],
      total: data?.data?.total ?? 0,
      errors: null,
    };
  } catch (error) {
    return {
      status: false,
      photos: [],
      total: 0,
      errors: error?.response?.data?.message || 'Error al obtener las fotos.',
    };
  }
};

export const getReportesEventosService = async (body) => {
  try {
    const { data } = await axios.post(`${EVENTS_URL}/list`, body);
    return {
      status: true,
      events: data?.data?.events ?? [],
      pagination: data?.data?.pagination ?? {
        page: 1,
        limit: body.limit ?? 20,
        total: 0,
        totalPages: 1,
      },
      errors: null,
    };
  } catch (error) {
    return {
      status: false,
      events: [],
      pagination: { page: 1, limit: body.limit ?? 20, total: 0, totalPages: 1 },
      errors:
        error?.response?.data?.data?.message || 'Error al obtener los eventos.',
    };
  }
};

export const generateAttendanceExcelService = async (body) => {
  try {
    const { data } = await axios.post(
      `${EVENTS_URL}/attendance/report/excel`,
      body
    );
    return {
      status: true,
      url: data?.data?.data?.url ?? null,
      errors: null,
    };
  } catch (error) {
    return {
      status: false,
      url: null,
      errors:
        error?.response?.data?.data?.message ||
        'Error al generar el reporte Excel.',
    };
  }
};

export const getAttendanceReportService = async (body) => {
  try {
    const { data } = await axios.post(`${EVENTS_URL}/attendance/report`, body);
    const payload = data?.data?.data;
    return {
      status: true,
      collaborators: payload?.collaborators ?? [],
      pagination: payload?.pagination ?? {
        page: 1,
        limit: body.limit ?? 25,
        total: 0,
        totalPages: 1,
      },
      errors: null,
    };
  } catch (error) {
    return {
      status: false,
      collaborators: [],
      pagination: { page: 1, limit: body.limit ?? 25, total: 0, totalPages: 1 },
      errors:
        error?.response?.data?.data?.message ||
        'Error al obtener el reporte de asistencias.',
    };
  }
};
