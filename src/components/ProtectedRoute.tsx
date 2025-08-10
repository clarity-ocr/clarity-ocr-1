// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  user: any;
  loading: boolean;
  children: React.ReactNode;   //  ← add this
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  user,
  loading,
  children,
}) => {
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;