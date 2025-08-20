// src/components/GuestRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const FullPageLoader = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-white">
    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
  </div>
);

const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  // 1. While the auth state is loading, show a spinner and wait.
  if (loading) {
    return <FullPageLoader />;
  }

  // 2. After loading, if a user exists, redirect them away from the guest page.
  if (user) {
    return <Navigate to="/" replace />;
  }

  // 3. If loading is complete and there IS NO user, show the guest page (Login/Register).
  return <>{children}</>;
};

export default GuestRoute;