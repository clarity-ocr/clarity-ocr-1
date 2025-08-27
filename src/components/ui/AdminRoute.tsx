import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export const AdminRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // Show a loading spinner while we check the user's auth status
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="h-10 w-10 animate-spin text-slate-500" />
      </div>
    );
  }

  // If loading is finished, check if the user is an admin
  // The `admin` property comes directly from your AuthContext!
  if (user?.admin) {
    // If they are an admin, render the child routes (the admin page)
    return <Outlet />;
  } else {
    // If they are not an admin, redirect them to the home page
    return <Navigate to="/" replace />;
  }
};