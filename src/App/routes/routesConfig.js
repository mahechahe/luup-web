import { lazy } from 'react';

/* Rutas para usuarios no autenticados */
export const routesNoAuth = [
  {
    path: 'iniciar-sesion',
    component: lazy(() => import('./Login/Login')),
  },
];

/* Rutas para usuarios autenticados */
export const routesAuth = [
  {
    path: '404',
    component: lazy(() => import('./404/Error404Page')),
  },
  {
    path: 'dashboard',
    component: lazy(() => import('./Dashboard/Dashboard')),
  },
  {
    path: 'mi-perfil',
    workerOnly: true,
    component: lazy(() => import('./Perfil/MiPerfilPage')),
  },

  // --- MÓDULO DE INVENTARIO ---
  {
    path: 'inventario',
    component: lazy(() => import('./Inventario/InventarioPage')),
  },

  // --- MÓDULO DE EVENTOS Y LOGÍSTICA ---
  // IMPORTANTE: Las rutas más largas/específicas deben ir ARRIBA de las generales
  {
    path: 'eventos/listado',
    component: lazy(() => import('./Eventos/EventosPage')),
  },
  {
    path: 'eventos/mis-eventos',
    component: lazy(() => import('./Eventos/WorkerEventosPage')),
  },
  {
    path: 'eventos/zonas-acopios',
    component: lazy(() => import('./Zonas/ZonasGestionDetalle')),
  },
  {
    path: 'eventos/:eventId/canvas',
    component: lazy(() => import('./Eventos/Canvas/CanvasPage')),
  },
  {
    path: 'eventos/:eventId/map-layout',
    component: lazy(() => import('./Eventos/MapLayout/MapLayoutPage')),
  },
  {
    path: 'eventos/:eventId/zonas/asignacion-masiva',
    adminOnly: true,
    component: lazy(() => import('./Eventos/Zonas/AsignacionMasivaPage')),
  },
  {
    path: 'eventos/:eventId/zonas',
    component: lazy(() => import('./Eventos/Zonas/ZonasPage')),
  },
  {
    path: 'eventos/:eventId/checkin',
    component: lazy(() => import('./Eventos/Checkin/CheckinPage')),
  },
  {
    path: 'eventos/:eventId/inventario',
    component: lazy(() => import('./Eventos/Inventario/EventoInventarioPage')),
  },
  {
    path: 'eventos/:eventId',
    component: lazy(() => import('./Eventos/EventoModulesPage')),
  },

  // --- MÓDULO DE COLABORADORES ---
  {
    path: 'colaboradores',
    component: lazy(() => import('./Colaboradores/ColaboradoresPage')),
  },
  {
    path: 'colaboradores/:collaboratorId',
    component: lazy(
      () => import('./Colaboradores/CollaboratorDetail/CollaboratorDetailPage')
    ),
  },

  // --- MÓDULO DE REPORTES ---
  {
    path: 'reportes',
    component: lazy(() => import('./Reportes/ReportesPage')),
  },
  {
    path: 'reportes/:eventId',
    component: lazy(() => import('./Reportes/ReporteEventoPage')),
  },

  {
    path: 'eventos/:eventId/clientes',
    component: lazy(() => import('./Eventos/Clientes/EventoClientesPage')),
  },
  {
    path: 'eventos/:eventId/worker',
    component: lazy(() => import('./Eventos/WorkerEventoModulesPage')),
  },
  {
    path: 'eventos/:eventId/worker/resumen',
    component: lazy(() => import('./Eventos/WorkerEventoResumenPage')),
  },
];

/* Rutas exclusivas para usuarios CLIENT/visualizador */
export const routesClient = [
  {
    path: 'cliente/dashboard',
    component: lazy(() => import('./Cliente/ClienteDashboardPage')),
  },
  {
    path: 'cliente/eventos',
    component: lazy(() => import('./Cliente/ClienteEventosPage')),
  },
  {
    path: 'cliente/eventos/:eventId',
    component: lazy(() => import('./Cliente/ClienteEventoDetailPage')),
  },
  // --- Vista de solo lectura de un evento, reutilizando las mismas páginas del admin ---
  {
    path: 'cliente/eventos/:eventId/canvas',
    component: lazy(() => import('./Eventos/Canvas/CanvasPage')),
  },
  {
    path: 'cliente/eventos/:eventId/zonas',
    component: lazy(() => import('./Eventos/Zonas/ZonasPage')),
  },
  {
    path: 'cliente/eventos/:eventId/checkin',
    component: lazy(() => import('./Eventos/Checkin/CheckinPage')),
  },
  {
    path: 'cliente/eventos/:eventId/inventario',
    component: lazy(() => import('./Cliente/ClienteEventoInventarioPage')),
  },
  {
    path: 'cliente/eventos/:eventId/map-layout',
    component: lazy(() => import('./Eventos/MapLayout/MapLayoutPage')),
  },
  {
    path: 'cliente/eventos/:eventId/reporte',
    component: lazy(() => import('./Reportes/ReporteEventoPage')),
  },
];
