// src/pages/Login.tsx
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
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence, useAnimation, useInView } from 'framer-motion';
import { z } from 'zod';
// Firebase Authentication
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  User,
  AuthError,
} from 'firebase/auth';
import { auth, googleProvider } from '@/firebase'; // Import from your firebase config
// Import the useAuth hook
import { useAuth } from '@/contexts/AuthContext';
// =============================================================================
// TYPE DEFINITIONS
// =============================================================================
type FormErrors = {
  email?: string;
  password?: string;
  general?: string;
};
type LoadingState = 'idle' | 'email-password' | 'google-popup' | 'google-redirect';
// =============================================================================
// VALIDATION SCHEMA
// =============================================================================
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
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
export default function Login() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [isCardHovered, setIsCardHovered] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<{ email: boolean; password: boolean }>({ email: false, password: false });
  const navigate = useNavigate();
  // Get auth context
  const { user } = useAuth();
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);
  
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
        opacity: [0.2, 0.4, 0.2],
        y: [0, -15, 0],
        transition: {
          duration: 10,
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
    const loadRememberedEmail = () => {
      try {
        const rememberedEmail = localStorage.getItem('clarifyOcrRememberedEmail');
        if (rememberedEmail) {
          setEmail(rememberedEmail);
          setRememberMe(true);
        }
      } catch (error) {
        console.warn("[Clarify OCR Login] Could not load remembered email:", error);
      }
    };
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log("[Clarify OCR Login] Google Sign-In via redirect successful:", result.user.uid);
          toast({
            title: "Sign-In Successful",
            description: `Welcome back, ${result.user.displayName || 'User'}!`,
          });
          // The auth state change will be handled by the AuthContext
          navigate('/'); // Navigate to home after successful redirect sign-in
        }
      } catch (error: any) {
        console.error("[Clarify OCR Login] Error handling Google Sign-In redirect result:", error);
        let errorMessage = "Google Sign-In via redirect failed. Please try again.";
        if (error.code === 'auth/account-exists-with-different-credential') {
          errorMessage = "An account already exists with the same email address but different sign-in credentials.";
        } else if (error.code === 'auth/auth-domain-config-required') {
          errorMessage = " authDomain configuration is required.";
        } else if (error.code === 'auth/operation-not-allowed') {
          errorMessage = "Google Sign-In is not enabled.";
        } else if (error.code === 'auth/unauthorized-domain') {
          errorMessage = "This domain is not authorized for Google Sign-In.";
        } else if (error.code === 'auth/user-cancelled') {
          errorMessage = "The sign-in attempt was cancelled.";
        }
        toast({
          title: "Google Sign-In Failed",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoadingState('idle');
      }
    };
    loadRememberedEmail();
    handleRedirectResult();
  }, [navigate]);
  // =============================================================================
  // UTILITY FUNCTIONS (COMPONENT-LEVEL)
  // =============================================================================
  const validateForm = useCallback((): boolean => {
    try {
      loginSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.errors.forEach((err) => {
          if (err.path && err.path.length > 0) {
            const field = err.path[0] as keyof FormErrors;
            newErrors[field] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  }, [email, password]);
  const clearFieldError = useCallback((field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((prevErrors) => ({ ...prevErrors, [field]: undefined }));
    }
  }, [errors]);
  const handleSuccessfulSignIn = useCallback((user: User) => {
    toast({
      title: "Login Successful",
      description: "Welcome to Clarify OCR!",
    });
    if (rememberMe) {
      try {
        localStorage.setItem('clarifyOcrRememberedEmail', email);
      } catch (e) {
        console.warn("[Clarify OCR Login] Could not set rememberedEmail:", e);
      }
    } else {
      try {
        localStorage.removeItem('clarifyOcrRememberedEmail');
      } catch (e) {
        console.warn("[Clarify OCR Login] Could not remove rememberedEmail:", e);
      }
    }
    // The auth state change will be handled by the AuthContext
    navigate('/'); // Navigate to home
  }, [email, rememberMe, navigate]);
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      handleSuccessfulSignIn(userCredential.user);
    } catch (error: any) {
      setLoadingState('idle');
      let errorMessage = "Login failed. Please try again.";
      let fieldError: keyof FormErrors | 'general' | null = null;
      switch (error.code as AuthError['code']) {
        case 'auth/invalid-email':
          fieldError = 'email';
          errorMessage = "The email address is badly formatted.";
          break;
        case 'auth/user-disabled':
          fieldError = 'email';
          errorMessage = "This account has been disabled.";
          break;
        case 'auth/user-not-found':
          fieldError = 'email';
          errorMessage = "No account found with this email.";
          break;
        case 'auth/wrong-password':
          fieldError = 'password';
          errorMessage = "Incorrect password.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many failed attempts. Try again later.";
          fieldError = 'general';
          break;
        case 'auth/invalid-credential':
          fieldError = 'general';
          errorMessage = "Invalid credentials provided.";
          break;
        case 'auth/operation-not-allowed':
          errorMessage = "Email/password login is not enabled.";
          fieldError = 'general';
          break;
        default:
          fieldError = 'general';
          errorMessage = "An unexpected error occurred. Please try again.";
          break;
      }
      if (fieldError) {
        setErrors((prev) => ({ ...prev, [fieldError]: errorMessage }));
      } else {
        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  };
  const handleGoogleSignIn = async () => {
    setLoadingState('google-popup');
    setErrors({});
    try {
      // Ensure the provider is correctly configured
      googleProvider.setCustomParameters({
        prompt: 'select_account', // Always prompt to select an account
      });
      const result = await signInWithPopup(auth, googleProvider);
      handleSuccessfulSignIn(result.user);
    } catch (error: any) {
      setLoadingState('idle');
      let errorMessage = "Google Sign-In failed. Please try again.";
      let shouldShowToast = true;
      let shouldAttemptRedirect = false;
      switch (error.code as AuthError['code']) {
        case 'auth/popup-closed-by-user':
          errorMessage = "Sign-in popup was closed. Please try again.";
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = "Sign-in request was cancelled. Please try again.";
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
          errorMessage = " authDomain configuration is required.";
          break;
        case 'auth/operation-not-allowed':
          errorMessage = "Google Sign-In is not enabled.";
          break;
        case 'auth/unauthorized-domain':
          errorMessage = "This domain is not authorized for Google Sign-In.";
          break;
        default:
          errorMessage = "An unexpected error occurred during Google Sign-In.";
          break;
      }
      if (shouldShowToast) {
        toast({
          title: "Google Sign-In Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
      // Correctly reuse the existing googleProvider instance for redirect
      if (shouldAttemptRedirect) {
        const redirectProvider = googleProvider; // Use the imported instance
        redirectProvider.setCustomParameters({ prompt: 'select_account' });
        await handleGoogleSignInRedirect(redirectProvider);
      }
    }
  };
  const handleGoogleSignInRedirect = async (provider: typeof googleProvider) => {
    setLoadingState('google-redirect');
    try {
      await signInWithRedirect(auth, provider);
      // The page will redirect, and `getRedirectResult` in the effect will handle success
    } catch (error: any) {
      setLoadingState('idle');
      console.error("[Clarify OCR Login] Google Sign-In Redirect error:", error);
      toast({
        title: "Redirect Failed",
        description: "Could not initiate Google Sign-In redirect.",
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
              <div className="relative p-6 sm:p-8 text-center z-10">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                  className="flex justify-center mb-4"
                >
                  <img
                    src="/icon.png" // Ensure your logo is at public/logo.png
                    alt="Clarify OCR Logo"
                    className="h-16 w-auto drop-shadow-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.style.display = 'none';
                      console.warn("[Clarify OCR Login] Failed to load logo at /icon.png");
                    }}
                  />
                </motion.div>
                <CardTitle className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow-md">
                  Clarify OCR
                </CardTitle>
                <CardDescription className="text-blue-100 mt-3 flex items-center justify-center text-sm sm:text-base">
                  <ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Secure & Modern Login
                </CardDescription>
              </div>
            </div>
            <CardHeader className="space-y-2 pt-6 sm:pt-8">
              <CardTitle className="text-xl sm:text-2xl font-bold text-center text-gray-800">
                Sign in to your account
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input */}
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Label htmlFor="email" className="text-gray-700 flex items-center font-medium">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
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
                      className={`pl-10 sm:pl-12 py-3 text-base rounded-xl border-2 transition-all duration-300 ${
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
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
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
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-gray-700 flex items-center font-medium">
                      <Lock className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                      Password
                    </Label>
                    <Link
                      to="/forgot-password" // Make sure this route exists or remove if not needed
                      className="text-sm text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded font-medium"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearFieldError('password');
                      }}
                      className={`pl-10 sm:pl-12 pr-12 py-3 text-base rounded-xl border-2 transition-all duration-300 ${
                        errors.password
                          ? "border-red-500 focus:ring-0"
                          : isFocused.password
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      autoComplete="current-password"
                      required
                      placeholder="Your password"
                      disabled={loadingState !== 'idle'}
                      aria-describedby={errors.password ? "password-error" : undefined}
                      onFocus={() => setIsFocused({ ...isFocused, password: true })}
                      onBlur={() => setIsFocused({ ...isFocused, password: false })}
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      disabled={loadingState !== 'idle'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
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
                {/* Remember Me */}
                <motion.div
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <input
                    type="checkbox"
                    id="remember-me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    disabled={loadingState !== 'idle'}
                  />
                  <Label htmlFor="remember-me" className="text-base font-normal text-gray-700 cursor-pointer">
                    Remember me
                  </Label>
                </motion.div>
                <Link
  to="/forgotpassword"
  className="text-sm text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded font-medium"
>
  Forgot password?
</Link>

                {/* Login Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-3 sm:py-4 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center text-base"
                    disabled={loadingState !== 'idle'}
                    aria-busy={loadingState === 'email-password'}
                  >
                    {loadingState === 'email-password' ? (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Signing In...
                      </motion.span>
                    ) : (
                      <span>Sign In</span>
                    )}
                  </Button>
                </motion.div>
                {/* Divider */}
                <div className="relative my-6 sm:my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
                  </div>
                </div>
                {/* Social Login Buttons */}
                <motion.div
                  className="grid grid-cols-1 gap-3" 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Button
                    onClick={handleGoogleSignIn}
                    className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold py-3 rounded-xl shadow hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    disabled={loadingState !== 'idle'}
                    aria-busy={loadingState === 'google-popup' || loadingState === 'google-redirect'}
                  >
                    {(loadingState === 'google-popup' || loadingState === 'google-redirect') ? (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {loadingState === 'google-popup' ? 'Signing in...' : 'Redirecting...'}
                      </motion.span>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path>
                        </svg>
                        <span>Sign in with Google</span>
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-center items-center gap-3 pb-6 sm:pb-8 px-4 sm:px-6">
              <motion.div
                className="text-sm sm:text-base text-gray-600 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                New to Clarify OCR?
                <Link to="/register" className="text-blue-600 font-bold hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 ml-1">
                  Create an account
                </Link>
              </motion.div>
              <motion.div
                className="text-xs sm:text-sm text-gray-500 text-center flex items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                <ShieldAlert className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                &copy; {new Date().getFullYear()} Clarify OCR. All rights reserved.
              </motion.div>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
      {/* Google Sign-In Redirect Overlay */}
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
              className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center border border-gray-200"
            >
              <div className="flex justify-center mb-6">
                <div className="bg-blue-100 p-4 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <h3 id="redirect-title" className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">
                Redirecting to Google
              </h3>
              <p id="redirect-description" className="text-gray-600 mb-6 text-sm sm:text-base">
                Please complete the sign-in process in the new window or tab.
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