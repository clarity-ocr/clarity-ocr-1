import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; 
import { Toaster as ShadcnToaster } from "@/components/ui/toaster"; 

// --- CONTEXT & AUTH ---
import { AuthProvider, useAuth } from './contexts/AuthContext';

// --- PAGE COMPONENTS ---
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding'; // NEW IMPORT
import ChecklistPage from './pages/Checklist';
import History from './pages/History';
import PricingPage from './pages/PricingPage';
import AdminPage from './pages/AdminPage';
import PublicChecklistPage from './pages/PublicChecklist';
import NotFound from './pages/NotFound';
import VerifyEmailPage from './pages/VerifyEmailPage'; 
import ForgotPassword from './pages/ForgotPassword';
import ProfilePage from './pages/ProfilePage';
import ActionHandlerPage from './pages/ActionHandlerPage';
import { Loader2 } from 'lucide-react';

// ===================================================================
// --- ROUTE GUARDS ---
// ===================================================================

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-900"><Loader2 className="h-10 w-10 animate-spin text-slate-500" /></div>;
    }
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Force onboarding if not completed and trying to access main app
    if (!user.onboardingCompleted && window.location.pathname !== '/onboarding') {
        return <Navigate to="/onboarding" replace />;
    }

    return <>{children}</>;
};

const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-900"><Loader2 className="h-10 w-10 animate-spin text-slate-500" /></div>;
    }
    
    if (user) {
        // Redirect based on onboarding status
        return <Navigate to={user.onboardingCompleted ? "/" : "/onboarding"} replace />;
    }
    
    return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) {
        return <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-900"><Loader2 className="h-10 w-10 animate-spin text-slate-500" /></div>;
    }
    if (!user?.admin) {
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
};


// ===================================================================
// --- MAIN APP COMPONENT ---
// ===================================================================
const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
        <ShadcnToaster />
        <Routes>
          {/* ====================================================== */}
          {/*                  GUEST-ONLY ROUTES                     */}
          {/* ====================================================== */}
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
          
          {/* ====================================================== */}
          {/*                  PUBLIC ROUTES                         */}
          {/* ====================================================== */}
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/public/:id" element={<PublicChecklistPage />} />

          {/* ====================================================== */}
          {/*       PROTECTED ROUTES (Require Login)                 */}
          {/* ====================================================== */}
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} /> {/* NEW ROUTE */}
          <Route path="/checklist/:id" element={<ProtectedRoute><ChecklistPage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          
          {/* ====================================================== */}
          {/*                  ADMIN-ONLY ROUTE                      */}
          {/* ====================================================== */}
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/auth/action" element={<ActionHandlerPage />} />

          {/* ====================================================== */}
          {/*                  FALLBACK ROUTE                        */}
          {/* ====================================================== */}
          <Route path="/not-found" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/not-found" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;