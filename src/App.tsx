import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Index from '@/pages/Index';
import Checklist from './pages/Checklist';
import History from './pages/History';
import SharedChecklist from './pages/SharedChecklist';
import FeaturesPage from '@/pages/FeaturesPage';
import AboutPage from '@/pages/AboutPage';
import TermsPage from '@/pages/TermsPage';
import PrivacyPage from '@/pages/PrivacyPage';
import ProtectedRoute from '@/components/ProtectedRoute'; // Import our new component
import LogoDisplay from './pages/LogoDisplay';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* --- PUBLIC AUTHENTICATION & INFORMATIONAL ROUTES --- */}
          {/* These pages do not require a user to be logged in. */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/logoback" element={<LogoDisplay/>} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          
          {/* --- PROTECTED APPLICATION ROUTES --- */}
          {/* All routes below require the user to be logged in. */}
          {/* Our new ProtectedRoute component handles the logic. */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checklist/:id"
            element={
              <ProtectedRoute>
                <Checklist />
              </ProtectedRoute>
            }
          />
           <Route
            path="/share/:id"
            element={
              <ProtectedRoute>
                <SharedChecklist />
              </ProtectedRoute>
            }
          />
          
          {/* Fallback route for any unknown URL */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;