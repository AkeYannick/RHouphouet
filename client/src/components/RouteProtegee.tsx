import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function RouteProtegee() {
  const { connecte } = useAuth();
  const emplacement = useLocation();

  if (!connecte) {
    return <Navigate to="/Connexion" replace state={{ depuis: emplacement.pathname }} />;
  }

  return <Outlet />;
}
