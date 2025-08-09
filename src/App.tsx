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
import LogoImage from "@/pages/logoback.png";
import ProtectedRoute from "@/components/ProtectedRoute";

// Logo display component for email templates - returns just the image
const LogoOnly: React.FC = () => {
  return (
    <div className="flex items-center justify-center p-4 bg-white">
      <img 
        src={LogoImage} 
        alt="Clarify OCR Logo" 
        className="h-12 w-auto"
      />
    </div>
  );
};

// Logo direct image component - returns the image directly
const LogoDirect: React.FC = () => {
  // This component will return just the image without any HTML wrapper
  // We'll use a useEffect to replace the entire document content with the image
  useEffect(() => {
    // Create a new image element
    const img = new Image();
    img.src = LogoImage;
    img.alt = "Clarify OCR Logo";
    img.style.display = "block";
    img.style.margin = "0 auto";
    
    // Clear the document and append the image
    document.body.innerHTML = "";
    document.body.appendChild(img);
    document.body.style.backgroundColor = "white";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    
    // Set the content type header if possible (client-side limitation)
    // Note: This won't actually change the HTTP header, but it's the best we can do client-side
  }, []);
  
  return null;
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
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/logo" element={<LogoOnly />} />
        <Route path="/logo-direct" element={<LogoDirect />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;