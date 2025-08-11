// src/pages/Login.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { z } from 'zod';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  User,
} from 'firebase/auth';
import { auth, googleProvider } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
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
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  ShieldAlert,
  Github,
  ChevronLeft,
} from 'lucide-react';

/*
  Login.tsx — Large, expanded, mobile-friendly, 3D-styled login page.

  Goals implemented in this file:
  - Mobile-first design with larger touch targets
  - Text-friendly: accessible contrast, readable font sizes
  - Subtle 3D card with tilt + layered parallax elements
  - Performance-minded animations (respects prefers-reduced-motion)
  - No expensive backdrop blur; limited animated gradients and motion
  - Full Firebase Auth (email/password + Google), remembering email option
  - Helpful inline comments and utilities for future tuning

  NOTES:
  - This file is expanded with helper subcomponents (within same file) to reach
    the requested larger size while keeping a single-file previewable React
    component. In a real project, you may split these into separate files.
  - Replace icon svg paths or image assets (logo, google-icon) with your own
    optimized versions to keep bundle size small.
*/

// -----------------------------
// Types & validation schema
// -----------------------------

type FormErrors = { email?: string; password?: string; general?: string };
type LoadingState = 'idle' | 'email-password' | 'google-popup' | 'google-redirect';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

// -----------------------------
// Utilities
// -----------------------------

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

const getPasswordStrength = (password: string) => {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 6) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  // normalize 0..4 -> 0..3
  return clamp(Math.round((score / 4) * 3), 0, 3);
};

const strengthLabels = ['Too Short', 'Weak', 'Medium', 'Strong'];
const strengthPercents = [0, 33, 66, 100];

// Respect user's motion preference
const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);
  return reduced;
};

// -----------------------------
// Small presentational subcomponents
// -----------------------------

function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

function IconButton({ onClick, label, children }: { onClick?: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex items-center justify-center rounded-full p-2 hover:bg-gray-100 active:bg-gray-200 transition"
    >
      {children}
    </button>
  );
}

// Small decorative SVG used as subtle surface texture (keeps vector small)
function SoftGrainSVG({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="0"
      height="0"
      style={{ position: 'absolute' }}
      aria-hidden
    >
      <defs>
        <filter id="grain">
          <feTurbulence baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feBlend mode="overlay" />
        </filter>
      </defs>
    </svg>
  );
}

// -----------------------------
// Main component
// -----------------------------

export default function Login() {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();

  // redirect if already logged in
  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  // animation controls
  const controls = useAnimation();
  const prefersReducedMotion = usePrefersReducedMotion();

  // subtle entrance for the card
  useEffect(() => {
    if (prefersReducedMotion) {
      controls.set({ opacity: 1, y: 0 });
    } else {
      controls.start({ opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } });
    }
  }, [controls, prefersReducedMotion]);

  // remember email
  useEffect(() => {
    try {
      const remembered = localStorage.getItem('clarifyOcrRememberedEmail');
      if (remembered) {
        setEmail(remembered);
        setRememberMe(true);
      }
    } catch (e) {
      // ignore
    }

    // handle redirect (for signInWithRedirect flow)
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          toast({ title: 'Welcome back!', description: `Hello, ${result.user.displayName || 'User'}` });
          navigate('/');
        }
      } catch (err) {
        // non-fatal — show a simple toast
        toast({ title: 'Error', description: 'Google Sign-In failed.', variant: 'destructive' });
      } finally {
        setLoadingState('idle');
      }
    };
    handleRedirect();
  }, [navigate]);

  // form validation
  const validateForm = useCallback((): boolean => {
    try {
      loginSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (err: any) {
      const newErrors: FormErrors = {};
      err.errors.forEach((e: any) => {
        newErrors[e.path[0] as keyof FormErrors] = e.message;
      });
      setErrors(newErrors);
      return false;
    }
  }, [email, password]);

  const clearFieldError = useCallback(
    (field: keyof FormErrors) => {
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    [errors]
  );

  const handleSuccessfulSignIn = useCallback(
    (user: User) => {
      toast({ title: 'Login successful', description: 'Welcome to Clarify OCR!' });
      try {
        if (rememberMe) localStorage.setItem('clarifyOcrRememberedEmail', email);
        else localStorage.removeItem('clarifyOcrRememberedEmail');
      } catch {}
      navigate('/');
    },
    [email, rememberMe, navigate]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoadingState('email-password');
    setErrors((prev) => ({ ...prev, general: undefined }));
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      handleSuccessfulSignIn(cred.user);
    } catch (error: any) {
      setLoadingState('idle');
      let msg = 'Login failed. Try again.';
      let field: keyof FormErrors | 'general' = 'general';
      switch (error.code) {
        case 'auth/invalid-email':
          field = 'email';
          msg = 'Invalid email format.';
          break;
        case 'auth/user-not-found':
          field = 'email';
          msg = 'Account not found.';
          break;
        case 'auth/wrong-password':
          field = 'password';
          msg = 'Incorrect password.';
          break;
        case 'auth/too-many-requests':
          msg = 'Too many attempts. Try again later.';
          break;
        default:
          break;
      }
      setErrors((prev) => ({ ...prev, [field]: msg }));
    }
  };

  const handleGoogleSignIn = async () => {
    setLoadingState('google-popup');
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    try {
      const res = await signInWithPopup(auth, googleProvider);
      handleSuccessfulSignIn(res.user);
    } catch (error: any) {
      setLoadingState('idle');
      let attemptRedirect = false;
      switch (error.code) {
        case 'auth/popup-blocked':
          attemptRedirect = true;
          break;
        case 'auth/popup-closed-by-user':
          toast({ title: 'Info', description: 'Popup was closed.' });
          break;
        default:
          toast({ title: 'Error', description: 'Google Sign-In failed.', variant: 'destructive' });
          break;
      }
      if (attemptRedirect) {
        setLoadingState('google-redirect');
        await signInWithRedirect(auth, googleProvider);
      }
    }
  };

  // password strength meter
  const passwordStrength = getPasswordStrength(password);

  // small performance tweak: limit re-renders for mouse movement
  const tiltRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (prefersReducedMotion) return;
    const el = tiltRef.current;
    if (!el) return;
    let raf = 0;
    const handle = (ev: MouseEvent) => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const px = (ev.clientX - rect.left) / rect.width; // 0..1
        const py = (ev.clientY - rect.top) / rect.height; // 0..1
        const rotateY = (px - 0.5) * 10; // -5..5 deg
        const rotateX = (0.5 - py) * 8; // -4..4 deg
        el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });
    };
    const reset = () => {
      if (raf) cancelAnimationFrame(raf);
      el.style.transform = '';
    };
    el.addEventListener('mousemove', handle);
    el.addEventListener('mouseleave', reset);
    return () => {
      el.removeEventListener('mousemove', handle);
      el.removeEventListener('mouseleave', reset);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [prefersReducedMotion]);

  // -----------------------------
  // Render
  // -----------------------------

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-blue-50 to-indigo-100 p-4">
      {/* subtle decorative shapes for depth - minimal animation */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.12 }}
          transition={{ duration: 1 }}
          className="absolute -left-24 -top-16 w-72 h-72 rounded-full bg-orange-200"
          style={{ transform: 'rotate(12deg)' }}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.08 }}
          transition={{ duration: 1.2 }}
          className="absolute -right-20 bottom-8 w-80 h-80 rounded-full bg-indigo-200"
          style={{ transform: 'rotate(-8deg)' }}
        />
      </div>

      {/* Main 3D card container */}
      <motion.div
        ref={tiltRef as any}
        className="w-full max-w-md mx-auto relative"
        initial={{ opacity: 0, y: 40 }}
        animate={controls}
        style={{ willChange: 'transform' }}
      >
        {/* layered shadow planes to give depth without expensive filters */}
        <div className="absolute inset-0 flex items-center justify-center -z-10">
          <div className="w-[88%] h-2 rounded-md bg-gradient-to-r from-black/5 to-black/3 transform translate-y-10 opacity-30" />
        </div>

        <Card className="rounded-3xl overflow-visible bg-white border shadow-lg">
          {/* floating header plate */}
          <div className="relative overflow-visible">
            <motion.div
              className="-mt-6 mx-6 rounded-xl p-5 text-center"
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.45 }}
              style={{
                background: 'linear-gradient(90deg, rgba(249,115,22,1) 0%, rgba(79,70,229,1) 50%, rgba(37,99,235,1) 100%)',
                boxShadow: '0 8px 30px rgba(79,70,229,0.12), inset 0 -1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center justify-center">
                <img
                  src="/icon.png"
                  alt="Clarify OCR logo"
                  className="h-12 w-auto drop-shadow-sm"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                />
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold text-white mt-2">Clarify OCR</CardTitle>
              <CardDescription className="text-sm text-blue-50 mt-1 flex items-center justify-center">
                <ShieldAlert className="h-4 w-4 mr-1" /> Secure & fast
              </CardDescription>
            </motion.div>
          </div>

          <CardHeader className="pt-8 px-6">
            <CardTitle className="text-lg sm:text-xl text-center text-gray-900">Sign in to your account</CardTitle>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* email */}
              <div>
                <Label htmlFor="email" className="flex items-center text-gray-800 text-sm sm:text-base">
                  <Mail className="h-4 w-4 mr-2 text-gray-500" /> Email address
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    placeholder="you@example.com"
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearFieldError('email');
                    }}
                    disabled={loadingState !== 'idle'}
                    className="pl-10 pr-3 py-3 rounded-xl text-base"
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                <AnimatePresence>
                  {errors.email && (
                    <motion.p
                      id="email-error"
                      className="text-xs text-red-600 mt-1 flex items-start"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <AlertCircle className="h-3.5 w-3.5 mr-1 mt-0.5" /> {errors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* password */}
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="flex items-center text-gray-800 text-sm sm:text-base">
                    <Lock className="h-4 w-4 mr-2 text-gray-500" /> Password
                  </Label>
                  <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
                    Forgot?
                  </Link>
                </div>

                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    placeholder="••••••••"
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearFieldError('password');
                    }}
                    disabled={loadingState !== 'idle'}
                    className="pl-10 pr-12 py-3 rounded-xl text-base"
                    autoComplete="current-password"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={loadingState !== 'idle'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* password strength */}
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <div>
                        Strength: <span className="font-medium">{strengthLabels[passwordStrength]}</span>
                      </div>
                      <div className="text-right">{password.length} chars</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
                      <div
                        style={{ width: `${strengthPercents[passwordStrength]}%` }}
                        className={`h-2 rounded-full ${
                          passwordStrength === 0 ? 'bg-red-500' : passwordStrength === 1 ? 'bg-orange-500' : passwordStrength === 2 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                      />
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {errors.password && (
                    <motion.p
                      id="password-error"
                      className="text-xs text-red-600 mt-1 flex items-start"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <AlertCircle className="h-3.5 w-3.5 mr-1 mt-0.5" /> {errors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* remember */}
              <div className="flex items-center space-x-2">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                />
                <Label htmlFor="remember-me" className="text-gray-700 cursor-pointer text-sm">
                  Remember me
                </Label>
              </div>

              {/* general error */}
              <AnimatePresence>
                {errors.general && (
                  <motion.div
                    className="rounded-md bg-red-50 border border-red-100 p-3 text-red-700 text-sm"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {errors.general}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* submit */}
              <div>
                <Button
                  type="submit"
                  disabled={loadingState !== 'idle'}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                >
                  {loadingState === 'email-password' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin inline-block" /> Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </div>

              {/* divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* social buttons */}
              <div className="grid gap-3">
                <Button
                  onClick={handleGoogleSignIn}
                  disabled={loadingState !== 'idle'}
                  className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 flex items-center justify-center gap-3 py-3 rounded-xl"
                >
                  {loadingState === 'google-popup' || loadingState === 'google-redirect' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> {loadingState === 'google-popup' ? 'Signing in...' : 'Redirecting...'}
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      <span>Sign in with Google</span>
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => toast({ title: 'Not implemented', description: 'GitHub sign-in not wired.' })}
                  disabled
                  className="w-full bg-black text-white py-3 rounded-xl flex items-center justify-center gap-3"
                >
                  <Github className="h-4 w-4" /> Sign in with GitHub (coming)
                </Button>
              </div>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col items-center gap-2 pb-6 px-6">
            <div className="text-sm text-gray-600">
              New to Clarify OCR?{' '}
              <Link to="/register" className="text-blue-600 font-bold hover:underline">
                Create an account
              </Link>
            </div>
            <div className="text-xs text-gray-500 flex items-center">
              <ShieldAlert className="h-3 w-3 mr-1" /> © {new Date().getFullYear()} Clarify OCR. All rights reserved.
            </div>
          </CardFooter>
        </Card>

        {/* Decorative floating glass plates to simulate layered 3D (pure transforms) */}
        <div aria-hidden className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 w-[72%]">
          <div className="h-3 rounded-full bg-gradient-to-r from-indigo-100 to-blue-100 opacity-60 transform translate-y-4 filter blur-[2px]" />
        </div>
      </motion.div>
    </div>
  );
}
