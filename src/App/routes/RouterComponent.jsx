import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useUserStore } from '../context/userStore';
import { hasAdminAccess, isClientUser, ROLE_IDS } from '../utils/roles';
import AppLayout from '../components/AppLayout/AppLayout';
import ProtectedRoute from './ProtectedRoute';
import { routesAuth, routesNoAuth, routesClient } from './routesConfig';
import { AppBar } from '../components/AppBar/AppBar';

function RouterComponent() {
  const { userIsLogin, user } = useUserStore();
  const isAdmin = hasAdminAccess(user?.roleId);
  const isClient = isClientUser(user?.roleId);

  const filteredRoutesAuth = routesAuth.filter((route) => {
    if (isClient) return false;
    if (route.workerOnly && user?.roleId !== ROLE_IDS.COLABORADOR) return false;
    if (route.path.startsWith('colaboradores') && !isAdmin) return false;
    if (route.path.startsWith('inventario') && !isAdmin) return false;
    if (route.adminOnly && !isAdmin) return false;
    if (route.path === 'eventos/:eventId/inventario' && !isAdmin) return false;
    return true;
  });

  const defaultAuth = isClient ? '/cliente/dashboard' : '/dashboard';

  return (
    <Routes>
      {/* Rutas para usuarios no autenticados */}
      <Route
        element={
          <ProtectedRoute canActive={!userIsLogin} redirectPath={defaultAuth} />
        }
      >
        {routesNoAuth.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <Suspense fallback={null}>
                <route.component />
              </Suspense>
            }
          />
        ))}
      </Route>

      {/* Rutas para admin / worker */}
      <Route
        element={
          <ProtectedRoute
            canActive={userIsLogin && !isClient}
            redirectPath={
              userIsLogin ? '/cliente/dashboard' : '/iniciar-sesion'
            }
          />
        }
      >
        <Route element={<AppLayout />}>
          <Route
            path="eventos"
            element={<Navigate to="/eventos/listado" replace />}
          />
          {filteredRoutesAuth.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <Suspense fallback={null}>
                  <AppBar>
                    <route.component />
                  </AppBar>
                </Suspense>
              }
            />
          ))}
        </Route>
      </Route>

      {/* Rutas para cliente/visualizador */}
      <Route
        element={
          <ProtectedRoute
            canActive={userIsLogin && isClient}
            redirectPath="/iniciar-sesion"
          />
        }
      >
        <Route element={<AppLayout />}>
          {routesClient.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <Suspense fallback={null}>
                  <AppBar>
                    <route.component />
                  </AppBar>
                </Suspense>
              }
            />
          ))}
        </Route>
      </Route>

      {userIsLogin ? (
        <Route path="*" element={<Navigate to={defaultAuth} />} />
      ) : (
        <Route path="*" element={<Navigate to="/iniciar-sesion" />} />
      )}
    </Routes>
  );
}

export default RouterComponent;
