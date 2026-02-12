import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useUserStore } from '../context/userStore';
import AppLayout from '../components/AppLayout/AppLayout';
import ProtectedRoute from './ProtectedRoute';
import { routesAuth, routesNoAuth } from './routesConfig';
import { AppBar } from '../components/AppBar/AppBar';

function RouterComponent() {
  const { userIsLogin } = useUserStore();

  return (
    <Routes>
      {/* Rutas para usuarios no autenticados */}
      <Route
        element={
          <ProtectedRoute canActive={!userIsLogin} redirectPath="/dashboard" />
        }
      >
        {routesNoAuth.map((route) => {
          return (
            <Route
              key={route.path}
              path={route.path}
              element={
                <Suspense fallback={null}>
                  <route.component />
                </Suspense>
              }
            />
          );
        })}
      </Route>

      {/* Rutas para usuarios autenticados */}
      <Route
        element={
          <ProtectedRoute
            canActive={userIsLogin}
            redirectPath="/iniciar-sesion"
          />
        }
      >
        <Route element={<AppLayout />}>
          {routesAuth.map((route) => {
            return (
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
            );
          })}
        </Route>
      </Route>

      {/* Rutas por defecto en caso de URL desconocida */}
      {userIsLogin ? (
        <Route path="*" element={<Navigate to="/dashboard" />} />
      ) : (
        <Route path="*" element={<Navigate to="/iniciar-sesion" />} />
      )}
    </Routes>
  );
}

export default RouterComponent;
