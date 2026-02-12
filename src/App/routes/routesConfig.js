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
    path: 'eventos',
    component: lazy(() => import('./Eventos/EventosPage')),
  },
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
