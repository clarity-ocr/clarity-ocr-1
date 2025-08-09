// src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";

type Props = {
  children: JSX.Element;
  user: any | null;
  loading: boolean;
};

const ProtectedRoute: React.FC<Props> = ({ children, user, loading }) => {
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
