import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const FullPageLoader: React.FC = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-background">
    <Loader2 className="h-12 w-12 animate-spin text-primary" />
  </div>
);

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 1. While the AuthProvider is determining the user's status, show a loader.
  // This is the key to preventing the "flash and redirect" problem.
  if (loading) {
    return <FullPageLoader />;
  }

  // 2. Once loading is complete, check if a user exists.
  // For this app, if no user exists (even anonymous), it means something is wrong.
  // We redirect them to the home page to restart the process.
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // 3. If loading is false and a user exists, they are authorized. Render the page.
  return children;
};

export default ProtectedRoute;