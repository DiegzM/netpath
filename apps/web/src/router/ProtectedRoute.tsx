import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

interface ProtectedRouteProps {
  requireUser?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requireUser = false }) => {
  const { user, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return null;
  }

  if (requireUser && !user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return <Outlet />;
};
