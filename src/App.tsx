import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// --- CONTEXT & AUTH ---
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// --- PAGE COMPONENTS ---
import Index from './pages/Index';
import Login from './pages/Login'; // Assuming you have these pages
import Register from './pages/Register'; // Assuming you have these pages
import ChecklistPage from './pages/Checklist';
import History from './pages/History';
import PricingPage from './pages/PricingPage';
import AdminPage from './pages/AdminPage'; // For creating coupons
import PublicChecklistPage from './pages/PublicChecklist';
import NotFound from './pages/NotFound';

/**
 * A special route component that only allows access to users with an 'admin' claim.
 */
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="flex h-screen w-full items-center justify-center">Loading...</div>; // Or a spinner component
    if (!user || !user.admin) {
        // If not an admin, redirect to the home page.
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
        <Routes>
          {/* ====================================================== */}
          {/*                  PUBLIC ROUTES                         */}
          {/* ====================================================== */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/public/:id" element={<PublicChecklistPage />} />

          {/* ====================================================== */}
          {/*                  PROTECTED ROUTES                      */}
          {/* ====================================================== */}
          <Route path="/checklist/:id" element={<ProtectedRoute><ChecklistPage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          
          {/* ====================================================== */}
          {/*                  ADMIN-ONLY ROUTE                      */}
          {/* ====================================================== */}
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

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