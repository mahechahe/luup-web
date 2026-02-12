import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute({ canActive, redirectPath = '/iniciar-sesion' }) {
  if (!canActive) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
