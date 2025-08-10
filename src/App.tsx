// src/App.tsx
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from '@/pages/ForgotPassword'; 
import ResetPassword from '@/pages/ResetPassword';
import Index from "@/pages/Index";
import Checklist from "./pages/Checklist";
import History from './pages/History'; 
import SharedAnalysis from './pages/SharedChecklist';
import FeaturesPage from '@/pages/FeaturesPage';
import AboutPage from '@/pages/AboutPage';
import TermsPage from '@/pages/TermsPage';
import PrivacyPage from '@/pages/PrivacyPage';
import ProtectedRoute from "@/components/ProtectedRoute";

// Logo display component
const LogoDisplay: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white p-4">
      <img 
        src="/logoback.png" 
        alt="Clarify OCR Logo" 
        className="max-w-full max-h-full"
      />
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <Index />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/logoback" element={<LogoDisplay />} />
        
        {/* Protected Routes */}
        <Route
          path="/checklist/:id"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <Checklist />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <History />
            </ProtectedRoute>
          }
        />
        <Route
          path="/features"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <FeaturesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/about"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <AboutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/terms"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <TermsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/privacy"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <PrivacyPage />
            </ProtectedRoute>
          }
        />
        
        {/* Public Routes */}
        <Route path="/shared/:id" element={<SharedAnalysis />} />
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;