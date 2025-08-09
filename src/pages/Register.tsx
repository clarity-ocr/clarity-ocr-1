// src/pages/Register.tsx
/**
 * @fileoverview Enhanced Registration Page Component for Clarify OCR.
 *
 * This component renders the user registration interface, handling email/password
 * account creation and Google Sign-Up. It includes robust form validation,
 * comprehensive error handling, loading states, and a fallback mechanism for
 * Google Sign-Up popup blockers using redirects.
 *
 * Features:
 * - Email/Password Registration with Zod validation
 * - Google Sign-Up with popup and redirect fallback
 * - Password visibility toggle
 * - Responsive design with Tailwind CSS and Framer Motion animations
 * - Detailed error messages for various Firebase Auth errors
 * - Loading indicators and overlays for user feedback
 * - Security considerations (password strength)
 * - Accessibility features (aria-labels, semantic HTML)
 * - Enhanced 3D animations and visual styles
 * - Input focus glows
 * - Password strength indicator
 * - Subtle animated background elements
 *
 * @module RegisterPage
 * @requires react
 * @requires react-router-dom
 * @requires @/components/ui/button
 * @requires @/components/ui/input
 * @requires @/components/ui/label
 * @requires @/components/ui/card
 * @requires @/components/ui/use-toast
 * @requires lucide-react
 * @requires framer-motion
 * @requires zod
 * @requires firebase/auth
 * @requires ./firebase (for auth and googleProvider)
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// UI Components and Libraries
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle, ShieldAlert, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence, useAnimation, useInView } from 'framer-motion';
import { z } from 'zod';
// Firebase Authentication
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  updateProfile,
  User,
  AuthError,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '@/firebase'; // Import from your firebase config
// =============================================================================
// TYPE DEFINITIONS
// =============================================================================
type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
};
type LoadingState = 'idle' | 'email-password' | 'google-popup' | 'google-redirect';
// =============================================================================
// VALIDATION SCHEMA
// =============================================================================
const registerSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
// Password strength indicator helper
const getPasswordStrength = (password: string) => {
  if (password.length === 0) return 0;
  if (password.length < 6) return 1;
  if (password.length < 10) return 2;
  return 3;
};
const strengthLabels = ['Too Short', 'Weak', 'Medium', 'Strong'];
const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function Register() {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [isCardHovered, setIsCardHovered] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<{ name: boolean; email: boolean; password: boolean; confirmPassword: boolean }>({ name: false, email: false, password: false, confirmPassword: false });
  const navigate = useNavigate();
  const authStateListenerRef = useRef<() => void>();
  const isSigningUpRef = useRef(false);
  
  // Refs for animation on scroll
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true, margin: "-100px" });
  const controls = useAnimation();
  
  // Animate card on scroll
  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);
  
  // Background animation controls
  const backgroundControls = useAnimation();
  
  // Animate background elements on mount
  useEffect(() => {
    const animateBackground = async () => {
      await backgroundControls.start({
        opacity: [0.3, 0.6, 0.3],
        y: [0, -20, 0],
        transition: {
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        },
      });
    };
    animateBackground();
  }, [backgroundControls]);
  
  // =============================================================================
  // EFFECTS
  // =============================================================================
  useEffect(() => {
    // Set up auth state listener to handle redirect after Google sign-up
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && isSigningUpRef.current) {
        console.log("[Clarify OCR Register] Auth state changed after sign-up:", user.uid);
        isSigningUpRef.current = false;
        
        // Show success toast
        toast({
          title: "Registration Successful",
          description: `Welcome to Clarify OCR, ${user.displayName || name || 'User'}!`,
        });
        
        // Navigate to home
        navigate('/');
      }
    });
    
    authStateListenerRef.current = unsubscribe;
    
    // Handle redirect result for Google sign-up
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log("[Clarify OCR Register] Google Sign-Up via redirect successful:", result.user.uid);
          isSigningUpRef.current = true;
          
          // Update profile with display name if available
          if (result.user.displayName) {
            try {
              await updateProfile(result.user, { displayName: result.user.displayName });
            } catch (error) {
              console.error("[Clarify OCR Register] Failed to update user profile display name:", error);
            }
          }
        }
      } catch (error: any) {
        console.error("[Clarify OCR Register] Error handling Google Sign-Up redirect result:", error);
        let errorMessage = "Google Sign-Up via redirect failed. Please try again.";
        if (error.code === 'auth/account-exists-with-different-credential') {
          errorMessage = "An account already exists with the same email address but different sign-in credentials.";
        } else if (error.code === 'auth/auth-domain-config-required') {
          errorMessage = "authDomain configuration is required.";
        } else if (error.code === 'auth/operation-not-allowed') {
          errorMessage = "Google Sign-Up is not enabled.";
        } else if (error.code === 'auth/unauthorized-domain') {
          errorMessage = "This domain is not authorized for Google Sign-Up.";
        } else if (error.code === 'auth/user-cancelled') {
          errorMessage = "The sign-up attempt was cancelled.";
        }
        toast({
          title: "Google Sign-Up Failed",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoadingState('idle');
      }
    };
    
    handleRedirectResult();
    
    // Clean up listener on unmount
    return () => {
      if (authStateListenerRef.current) {
        authStateListenerRef.current();
      }
    };
  }, [name, navigate]);
  
  // =============================================================================
  // UTILITY FUNCTIONS (COMPONENT-LEVEL)
  // =============================================================================
  const validateForm = useCallback((): boolean => {
    try {
      registerSchema.parse({ name, email, password, confirmPassword });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.errors.forEach((err) => {
          if (err.path && err.path.length > 0) {
            // Handle nested paths like 'confirmPassword'
            const field = err.path[0] as keyof FormErrors;
            newErrors[field] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  }, [name, email, password, confirmPassword]);
  
  const clearFieldError = useCallback((field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((prevErrors) => ({ ...prevErrors, [field]: undefined }));
    }
  }, [errors]);
  
  const handleSuccessfulSignUp = useCallback(async (user: User, displayName?: string) => {
    // Update the user's profile with the display name if provided
    if (displayName) {
      try {
        await updateProfile(user, { displayName });
        console.log("[Clarify OCR Register] User profile updated with display name:", displayName);
      } catch (error) {
        console.error("[Clarify OCR Register] Failed to update user profile display name:", error);
        // Don't block the sign-up process if profile update fails
      }
    }
    
    // Set flag to indicate we're in the sign-up process
    isSigningUpRef.current = true;
    
    // The auth state change will be handled by the onAuthStateChanged listener
    // which will then navigate to the home page
  }, []);
  
  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    
    setLoadingState('email-password');
    setErrors((prev) => ({ ...prev, general: undefined }));
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("[Clarify OCR Register] Email/Password registration successful:", userCredential.user.uid);
      
      // Update profile with name
      await updateProfile(userCredential.user, { displayName: name });
      
      // Set flag to indicate we're in the sign-up process
      isSigningUpRef.current = true;
      
      // The auth state change will be handled by the onAuthStateChanged listener
      // which will then navigate to the home page
    } catch (error: any) {
      setLoadingState('idle');
      let errorMessage = "Registration failed. Please try again.";
      let fieldError: keyof FormErrors | 'general' | null = null;
      
      switch (error.code as AuthError['code']) {
        case 'auth/email-already-in-use':
          fieldError = 'email';
          errorMessage = "An account already exists with this email address.";
          break;
        case 'auth/invalid-email':
          fieldError = 'email';
          errorMessage = "The email address is badly formatted.";
          break;
        case 'auth/operation-not-allowed':
          errorMessage = "Email/password registration is not enabled.";
          fieldError = 'general';
          break;
        case 'auth/weak-password':
          fieldError = 'password';
          errorMessage = "The password is too weak. Please choose a stronger password.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many attempts. Please try again later.";
          fieldError = 'general';
          break;
        default:
          fieldError = 'general';
          errorMessage = "An unexpected error occurred during registration. Please try again.";
          break;
      }
      
      if (fieldError) {
        setErrors((prev) => ({ ...prev, [fieldError]: errorMessage }));
      } else {
        toast({
          title: "Registration Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  };
  
  const handleGoogleSignUp = async () => {
    setLoadingState('google-popup');
    setErrors({});
    
    try {
      // Ensure the provider is correctly configured
      googleProvider.setCustomParameters({
        prompt: 'select_account', // Always prompt to select an account
      });
      
      const result = await signInWithPopup(auth, googleProvider);
      console.log("[Clarify OCR Register] Google Sign-Up via popup successful:", result.user.uid);
      
      // Set flag to indicate we're in the sign-up process
      isSigningUpRef.current = true;
      
      // The auth state change will be handled by the onAuthStateChanged listener
      // which will then navigate to the home page
    } catch (error: any) {
      setLoadingState('idle');
      let errorMessage = "Google Sign-Up failed. Please try again.";
      let shouldShowToast = true;
      let shouldAttemptRedirect = false;
      
      switch (error.code as AuthError['code']) {
        case 'auth/popup-closed-by-user':
          errorMessage = "Sign-up popup was closed. Please try again.";
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = "Sign-up request was cancelled. Please try again.";
          shouldShowToast = false; // Often spurious
          break;
        case 'auth/popup-blocked':
          errorMessage = "Popup blocked. Initiating redirect flow...";
          shouldShowToast = true;
          shouldAttemptRedirect = true;
          break;
        case 'auth/account-exists-with-different-credential':
          errorMessage = "An account exists with the same email but different sign-in method.";
          break;
        case 'auth/auth-domain-config-required':
          errorMessage = "authDomain configuration is required.";
          break;
        case 'auth/operation-not-allowed':
          errorMessage = "Google Sign-Up is not enabled.";
          break;
        case 'auth/unauthorized-domain':
          errorMessage = "This domain is not authorized for Google Sign-Up.";
          break;
        default:
          errorMessage = "An unexpected error occurred during Google Sign-Up.";
          break;
      }
      
      if (shouldShowToast) {
        toast({
          title: "Google Sign-Up Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
      
      // Correctly reuse the existing googleProvider instance for redirect
      if (shouldAttemptRedirect) {
        const redirectProvider = googleProvider; // Use the imported instance
        redirectProvider.setCustomParameters({ prompt: 'select_account' });
        await handleGoogleSignUpRedirect(redirectProvider);
      }
    }
  };
  
  const handleGoogleSignUpRedirect = async (provider: typeof googleProvider) => {
    setLoadingState('google-redirect');
    try {
      await signInWithRedirect(auth, provider);
      // The page will redirect, and `getRedirectResult` in the effect will handle success
    } catch (error: any) {
      setLoadingState('idle');
      console.error("[Clarify OCR Register] Google Sign-Up Redirect error:", error);
      toast({
        title: "Redirect Failed",
        description: "Could not initiate Google Sign-Up redirect.",
        variant: "destructive",
      });
    }
  };
  
  // Calculate password strength
  const passwordStrength = getPasswordStrength(password);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      style={{ perspective: 1200 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-blue-50 to-indigo-100 py-6 px-4 sm:px-6 lg:px-8 overflow-hidden relative"
    >
      {/* Subtle Animated Background Elements */}
      <motion.div
        animate={backgroundControls}
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply opacity-20"
      />
      <motion.div
        animate={backgroundControls}
        className="absolute top-3/4 right-1/4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply opacity-20"
      />
      <motion.div
        animate={backgroundControls}
        className="absolute bottom-1/4 left-1/2 w-56 h-56 bg-indigo-200 rounded-full mix-blend-multiply opacity-20"
      />
      
      <motion.div
        ref={cardRef}
        className="w-full max-w-md relative z-10"
        initial="hidden"
        animate={controls}
        variants={{
          hidden: { opacity: 0, y: 50, rotateX: 15 },
          visible: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.8, ease: "easeOut" } },
        }}
        whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
      >
        <motion.div
          className="relative"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: isCardHovered ? 5 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden relative"
                style={{ transform: "translateZ(20px)" }}
                onMouseEnter={() => setIsCardHovered(true)}
                onMouseLeave={() => setIsCardHovered(false)}
          >
            <div className="relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-orange-500 via-blue-600 to-indigo-700 opacity-90"
                animate={{
                  background: [
                    "linear-gradient(to right, #f97316, #2563eb, #4f46e5)",
                    "linear-gradient(to right, #2563eb, #4f46e5, #f97316)",
                    "linear-gradient(to right, #4f46e5, #f97316, #2563eb)",
                    "linear-gradient(to right, #f97316, #2563eb, #4f46e5)",
                  ],
                }}
                transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
              />
              <div className="relative p-8 text-center z-10">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                  className="flex justify-center mb-4"
                >
                  <img
                    src="/icon.png" // Ensure your logo is at public/logo.png
                    alt="Clarify OCR Logo"
                    className="h-20 w-auto drop-shadow-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.style.display = 'none';
                      console.warn("[Clarify OCR Register] Failed to load logo at /logo.png");
                    }}
                  />
                </motion.div>
                <CardTitle className="text-4xl font-extrabold text-white drop-shadow-md">
                  Clarify OCR
                </CardTitle>
                <CardDescription className="text-blue-100 mt-3 flex items-center justify-center text-base">
                  <ShieldAlert className="h-5 w-5 mr-2" />
                  Secure & Modern Registration
                </CardDescription>
              </div>
            </div>
            
            <CardHeader className="space-y-2 pt-8">
              <CardTitle className="text-2xl font-bold text-center text-gray-800">
                Create a new account
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Input */}
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Label htmlFor="name" className="text-gray-700 flex items-center font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Full Name
                  </Label>
                  <div className="relative">
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        clearFieldError('name');
                      }}
                      className={`pl-12 py-3 text-base rounded-xl border-2 transition-all duration-300 ${
                        errors.name
                          ? "border-red-500 focus:ring-0"
                          : isFocused.name
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      autoComplete="name"
                      required
                      disabled={loadingState !== 'idle'}
                      aria-describedby={errors.name ? "name-error" : undefined}
                      onFocus={() => setIsFocused({ ...isFocused, name: true })}
                      onBlur={() => setIsFocused({ ...isFocused, name: false })}
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <AnimatePresence>
                    {errors.name && (
                      <motion.p
                        id="name-error"
                        className="text-sm text-red-500 flex items-start"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                        {errors.name}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
                
                {/* Email Input */}
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Label htmlFor="email" className="text-gray-700 flex items-center font-medium">
                    <Mail className="h-5 w-5 mr-2 flex-shrink-0" />
                    Email Address
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearFieldError('email');
                      }}
                      className={`pl-12 py-3 text-base rounded-xl border-2 transition-all duration-300 ${
                        errors.email
                          ? "border-red-500 focus:ring-0"
                          : isFocused.email
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      autoComplete="email"
                      required
                      disabled={loadingState !== 'idle'}
                      aria-describedby={errors.email ? "email-error" : undefined}
                      onFocus={() => setIsFocused({ ...isFocused, email: true })}
                      onBlur={() => setIsFocused({ ...isFocused, email: false })}
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                  </div>
                  <AnimatePresence>
                    {errors.email && (
                      <motion.p
                        id="email-error"
                        className="text-sm text-red-500 flex items-start"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                        {errors.email}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
                
                {/* Password Input */}
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Label htmlFor="password" className="text-gray-700 flex items-center font-medium">
                    <Lock className="h-5 w-5 mr-2 flex-shrink-0" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearFieldError('password');
                        // Clear confirmPassword error if passwords start matching
                        if (errors.confirmPassword && e.target.value === confirmPassword) {
                          clearFieldError('confirmPassword');
                        }
                      }}
                      className={`pl-12 pr-12 py-3 text-base rounded-xl border-2 transition-all duration-300 ${
                        errors.password
                          ? "border-red-500 focus:ring-0"
                          : isFocused.password
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      autoComplete="new-password"
                      required
                      placeholder="Create a password"
                      disabled={loadingState !== 'idle'}
                      aria-describedby={errors.password ? "password-error" : undefined}
                      onFocus={() => setIsFocused({ ...isFocused, password: true })}
                      onBlur={() => setIsFocused({ ...isFocused, password: false })}
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      disabled={loadingState !== 'idle'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-1"
                    >
                      <div className="flex items-center text-xs text-gray-600 mb-1">
                        <span>Password Strength:</span>
                        <span className={`ml-2 font-medium ${strengthColors[passwordStrength]}`}>
                          {strengthLabels[passwordStrength]}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <motion.div
                          className={`h-1.5 rounded-full ${strengthColors[passwordStrength]}`}
                          initial={{ width: "0%" }}
                          animate={{ width: `${(passwordStrength / 3) * 100}%` }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        />
                      </div>
                    </motion.div>
                  )}
                  
                  <AnimatePresence>
                    {errors.password && (
                      <motion.p
                        id="password-error"
                        className="text-sm text-red-500 flex items-start"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                        {errors.password}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
                
                {/* Confirm Password Input */}
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Label htmlFor="confirm-password" className="text-gray-700 flex items-center font-medium">
                    <Lock className="h-5 w-5 mr-2 flex-shrink-0" />
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        clearFieldError('confirmPassword');
                        // Clear confirmPassword error if passwords start matching
                        if (errors.confirmPassword && password === e.target.value) {
                          clearFieldError('confirmPassword');
                        }
                      }}
                      className={`pl-12 pr-12 py-3 text-base rounded-xl border-2 transition-all duration-300 ${
                        errors.confirmPassword
                          ? "border-red-500 focus:ring-0"
                          : isFocused.confirmPassword
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      autoComplete="new-password"
                      required
                      placeholder="Confirm your password"
                      disabled={loadingState !== 'idle'}
                      aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                      onFocus={() => setIsFocused({ ...isFocused, confirmPassword: true })}
                      onBlur={() => setIsFocused({ ...isFocused, confirmPassword: false })}
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      aria-pressed={showConfirmPassword}
                      disabled={loadingState !== 'idle'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <AnimatePresence>
                    {errors.confirmPassword && (
                      <motion.p
                        id="confirm-password-error"
                        className="text-sm text-red-500 flex items-start"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                        {errors.confirmPassword}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <AnimatePresence>
                    {errors.general && (
                      <motion.p
                        id="general-error"
                        className="text-sm text-red-500 flex items-start"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                        {errors.general}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
                
                {/* Register Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center text-base"
                    disabled={loadingState !== 'idle'}
                    aria-busy={loadingState === 'email-password'}
                  >
                    {loadingState === 'email-password' ? (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating Account...
                      </motion.span>
                    ) : (
                      <span>Create Account</span>
                    )}
                  </Button>
                </motion.div>
              </form>
              
              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">Or sign up with</span>
                </div>
              </div>
              
              {/* Social Login Buttons */}
              <motion.div
                className="grid grid-cols-1 gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Button
                  onClick={handleGoogleSignUp}
                  className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold py-3 rounded-xl shadow hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  disabled={loadingState !== 'idle'}
                  aria-busy={loadingState === 'google-popup' || loadingState === 'google-redirect'}
                >
                  {(loadingState === 'google-popup' || loadingState === 'google-redirect') ? (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {loadingState === 'google-popup' ? 'Signing up...' : 'Redirecting...'}
                    </motion.span>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path>
                      </svg>
                      <span>Sign up with Google</span>
                    </>
                  )}
                </Button>
              </motion.div>
            </CardContent>
            
            <CardFooter className="flex flex-col sm:flex-row justify-center items-center gap-3 pb-8">
              <motion.div
                className="text-base text-gray-600 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                Already have an account?
                <Link to="/login" className="text-blue-600 font-bold hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 ml-1">
                  Sign in
                </Link>
              </motion.div>
              <motion.div
                className="text-sm text-gray-500 text-center flex items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
              >
                <ShieldAlert className="h-4 w-4 mr-1" />
                &copy; {new Date().getFullYear()} Clarify OCR. All rights reserved.
              </motion.div>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
      
      {/* Google Sign-Up Redirect Overlay */}
      <AnimatePresence>
        {loadingState === 'google-redirect' && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center z-50 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-modal="true"
            role="dialog"
            aria-labelledby="redirect-title"
            aria-describedby="redirect-description"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotateX: -30 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotateX: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center border border-gray-200"
            >
              <div className="flex justify-center mb-6">
                <div className="bg-blue-100 p-4 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <h3 id="redirect-title" className="text-2xl font-bold text-gray-800 mb-3">
                Redirecting to Google
              </h3>
              <p id="redirect-description" className="text-gray-600 mb-6">
                Please complete the sign-up process in the new window or tab.
                You will be redirected back automatically.
              </p>
              <div className="flex justify-center mb-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-hidden="true" />
              </div>
              <p className="text-xs text-gray-500">
                If you are not redirected, please check your pop-up blocker settings.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}