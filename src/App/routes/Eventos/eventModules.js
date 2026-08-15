import {
  MapIcon,
  ListChecks,
  UserCheck,
  BarChart2,
  Users,
  Boxes,
} from 'lucide-react';

/** Módulos de un evento, compartidos entre el hub de admin y la vista de cliente. */
export const MODULES = [
  {
    id: 'canvas',
    title: 'Layout',
    description:
      'Diseña y gestiona las zonas del evento sobre el plano del recinto. Asigna colaboradores y coordinadores.',
    icon: MapIcon,
    color: '#234465',
    index: '01',
  },
  {
    id: 'zonas',
    title: 'Zonas',
    description:
      'Visualiza y administra todas las zonas en formato lista. Gestiona personal asignado y capacidades.',
    icon: ListChecks,
    color: '#DD7419',
    index: '02',
  },
  {
    id: 'checkin',
    title: 'Check-in',
    description:
      'Controla asistencia y registros de entrada y salida del personal asignado a las zonas.',
    icon: UserCheck,
    color: '#7493B2',
    index: '03',
  },
  {
    id: 'inventario',
    title: 'Inventario',
    description:
      'Carga el inventario disponible para este evento y define cuántas unidades hay de cada ítem.',
    icon: Boxes,
    color: '#7C3AED',
    index: '04',
    adminOnly: true,
  },
  {
    id: 'reporte',
    title: 'Reporte',
    description:
      'Consulta asistencias, ingresos de residuos, salidas de camiones y galería fotográfica.',
    icon: BarChart2,
    color: '#4f6d44',
    index: '05',
    adminOnly: false,
  },
  {
    id: 'clientes',
    title: 'Clientes',
    description:
      'Gestiona accesos de cliente y asigna el tipo de servicio para este evento.',
    icon: Users,
    color: '#0f766e',
    index: '06',
    adminOnly: true,
  },
];
