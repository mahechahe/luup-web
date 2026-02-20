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

  // --- MÓDULO DE EVENTOS Y LOGÍSTICA ---
  // IMPORTANTE: Las rutas más largas/específicas deben ir ARRIBA de las generales
  {
    path: 'eventos/listado', 
    component: lazy(() => import('./Eventos/EventosPage')),
  },
  {
    path: 'eventos/zonas-acopios', 
    component: lazy(() => import('./Zonas/ZonasGestionDetalle')), 
  },
  {
    path: 'eventos/:eventId',
    component: lazy(() => import('./Eventos/EventoDetail/EventoDetailPage')),
  },
  {
    path: 'eventos', 
    // Esta es la raíz. Si ninguna de las de arriba coincide, entra aquí.
    component: lazy(() => import('./Zonas/ZonasPage')),
  },

  // --- MÓDULO DE COLABORADORES ---
  {
    path: 'colaboradores',
    component: lazy(() => import('./Colaboradores/ColaboradoresPage')),
  },
  {
    path: 'colaboradores/:collaboratorId',
    component: lazy(() =>
      import('./Colaboradores/CollaboratorDetail/CollaboratorDetailPage')
    ),
  },
];