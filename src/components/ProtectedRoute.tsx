import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

// A full-page loader component for a better user experience during auth checks
const FullPageLoader: React.FC = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
    <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
  </div>
);

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 1. While Firebase is checking the auth state, show a loading screen.
  // This prevents the page from flashing the login screen before the user is confirmed.
  if (loading) {
    return <FullPageLoader />;
  }

  // 2. If the user is not authenticated, redirect them to the login page.
  // CRITICAL: We pass the current location in the 'state'.
  // This tells the login page where to redirect back to after a successful login.
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. If the user is authenticated, render the requested component.
  return children;
};

export default ProtectedRoute;