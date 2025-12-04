import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; 
import { Toaster as ShadcnToaster } from "@/components/ui/toaster"; 
import { Loader2 } from 'lucide-react';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';

// Pages
import Landing from './pages/Landing'; // Public Home
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/UploadPage';
import DocumentList from './pages/Documents/DocumentList';
import DocumentViewer from './pages/Documents/DocumentViewer';
import History from './pages/History';
import ProfilePage from './pages/ProfilePage';
import ChecklistPage from './pages/Checklist';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import ForgotPassword from './pages/ForgotPassword';
import VerifyEmailPage from './pages/VerifyEmailPage';
import NotFound from './pages/NotFound';

// Route Guards
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#0B0F19]"><Loader2 className="animate-spin text-sky-500" /></div>;
    if (!user) return <Navigate to="/login" replace />;
    if (!user.onboardingCompleted && window.location.pathname !== '/onboarding') return <Navigate to="/onboarding" replace />;
    return <>{children}</>;
};

const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (user) return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" />
        <ShadcnToaster />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Protected App Routes (Wrapped in DashboardLayout) */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/documents" element={<DocumentList />} />
            <Route path="/documents/:id" element={<DocumentViewer />} />
            <Route path="/history" element={<History />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/checklist/:id" element={<ChecklistPage />} />
          </Route>

          {/* Standalone Protected Route (No Sidebar) */}
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;