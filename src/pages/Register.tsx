// src/pages/Register.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { z } from 'zod';
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  updateProfile,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth, googleProvider } from '@/firebase';
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
} from 'lucide-react';

/*
  Register.tsx - 3D, mobile-friendly, text-friendly registration page

  This file is intentionally expanded with helper subcomponents, detailed
  comments, and accessible markup to make it easy to adapt, split, or test.

  Key features implemented:
   - Mobile-first layout and large tap targets
   - Clear, high-contrast typography
   - Subtle 3D card tilt & parallax layers
   - Respect for prefers-reduced-motion
   - Lightweight background accents (no heavy blur filters by default)
   - Email/password registration + Google sign-up (popup + redirect fallback)
   - Zod validation with inline error UI
   - Password strength meter
   - Remember to replace `auth` & `googleProvider` imports with your configured firebase module
*/

// ----------------------------
// Types & validation schema
// ----------------------------

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
};

type LoadingState = 'idle' | 'email-password' | 'google-popup' | 'google-redirect';

const registerSchema = z
  .object({
    name: z.string().min(1, { message: 'Name is required' }),
    email: z.string().email({ message: 'Please enter a valid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ----------------------------
// Helpers
// ----------------------------

const strengthLabels = ['Too Short', 'Weak', 'Medium', 'Strong'];
const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];

const getPasswordStrength = (password: string) => {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 6) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  // normalize to 0..3
  return Math.max(0, Math.min(3, Math.round((score / 4) * 3)));
};

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

// ----------------------------
// Small presentational subcomponents
// ----------------------------

function FieldError({ id, children }: { id?: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className="text-sm text-red-600 mt-2 flex items-start">
      <AlertCircle className="h-4 w-4 mr-2" /> <span>{children}</span>
    </p>
  );
}

function IconText({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center text-sm sm:text-base text-gray-700">
      <span className="mr-2">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

// ----------------------------
// Main component
// ----------------------------

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [isFocused, setIsFocused] = useState({ name: false, email: false, password: false, confirmPassword: false });

  const navigate = useNavigate();
  const reducedMotion = usePrefersReducedMotion();

  // animation controls for entrance
  const controls = useAnimation();
  useEffect(() => {
    if (reducedMotion) controls.set({ opacity: 1, y: 0 });
    else controls.start({ opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } });
  }, [controls, reducedMotion]);

  // listen for redirect auth results and auth state
  const signUpRef = useRef(false);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u && signUpRef.current) {
        // a sign-up just completed
        toast({ title: 'Welcome!', description: `Hi ${u.displayName || 'User'} — welcome to Clarify OCR` });
        signUpRef.current = false;
        navigate('/');
      }
    });

    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          signUpRef.current = true;
        }
      } catch (err: any) {
        console.error('Redirect sign-up error', err);
        toast({ title: 'Google Sign-Up failed', description: 'Please try again', variant: 'destructive' });
      } finally {
        setLoadingState('idle');
      }
    };

    handleRedirect();
    return () => unsub();
  }, [navigate]);

  // validation
  const validateForm = useCallback(() => {
    try {
      registerSchema.parse({ name, email, password, confirmPassword });
      setErrors({});
      return true;
    } catch (err: any) {
      const newErrors: FormErrors = {};
      if (err?.errors) {
        err.errors.forEach((e: any) => {
          const field = e.path?.[0] as keyof FormErrors;
          if (field) newErrors[field] = e.message;
        });
      }
      setErrors(newErrors);
      return false;
    }
  }, [name, email, password, confirmPassword]);

  const clearFieldError = useCallback((field: keyof FormErrors) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, [errors]);

  const handleSuccessfulSignUp = useCallback(async (u: User, displayName?: string) => {
    if (displayName) {
      try {
        await updateProfile(u, { displayName });
      } catch (err) {
        console.warn('Failed to update profile displayName', err);
      }
    }
    signUpRef.current = true; // will be handled by onAuthStateChanged listener
  }, []);

  // form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoadingState('email-password');
    setErrors((prev) => ({ ...prev, general: undefined }));
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      handleSuccessfulSignUp(cred.user, name);
    } catch (error: any) {
      setLoadingState('idle');
      let msg = 'Registration failed. Please try again.';
      let field: keyof FormErrors | null = 'general';
      switch (error.code) {
        case 'auth/email-already-in-use':
          msg = 'This email is already in use.';
          field = 'email';
          break;
        case 'auth/weak-password':
          msg = 'Password is too weak.';
          field = 'password';
          break;
        case 'auth/invalid-email':
          msg = 'Invalid email address.';
          field = 'email';
          break;
        case 'auth/operation-not-allowed':
          msg = 'Email/password sign-up is disabled.';
          break;
        default:
          break;
      }
      if (field) setErrors((prev) => ({ ...prev, [field]: msg }));
      else toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  // Google sign-up
  const handleGoogleSignUp = async () => {
    setLoadingState('google-popup');
    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      const res = await signInWithPopup(auth, googleProvider);
      handleSuccessfulSignUp(res.user);
    } catch (error: any) {
      setLoadingState('idle');
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        // fallback to redirect
        setLoadingState('google-redirect');
        try {
          googleProvider.setCustomParameters({ prompt: 'select_account' });
          await signInWithRedirect(auth, googleProvider);
        } catch (err) {
          setLoadingState('idle');
          toast({ title: 'Google Sign-Up failed', description: 'Please check your pop-up settings', variant: 'destructive' });
        }
      } else {
        toast({ title: 'Google Sign-Up failed', description: 'Please try again', variant: 'destructive' });
      }
    }
  };

  const passwordStrength = getPasswordStrength(password);

  // 3D tilt via pointer (lightweight) — only when motion not reduced
  const tiltRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (reducedMotion) return;
    const el = tiltRef.current;
    if (!el) return;
    let raf = 0;
    const onMove = (ev: MouseEvent) => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const px = (ev.clientX - rect.left) / rect.width;
        const py = (ev.clientY - rect.top) / rect.height;
        const ry = (px - 0.5) * 10; // -5..5
        const rx = (0.5 - py) * 8; // -4..4
        el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
    };
    const onLeave = () => (el.style.transform = '');
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-blue-50 to-indigo-100 p-4">
      {/* decorative accents (low-cost) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.08 }}
          transition={{ duration: 1 }}
          className="absolute -left-20 -top-16 w-72 h-72 rounded-full bg-orange-200"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.06 }}
          transition={{ duration: 1.2 }}
          className="absolute -right-24 bottom-8 w-80 h-80 rounded-full bg-indigo-200"
        />
      </div>

      <motion.div
        ref={tiltRef as any}
        className="w-full max-w-md mx-auto relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={controls}
        style={{ willChange: 'transform' }}
      >
        {/* subtle shadow plane */}
        <div className="absolute inset-0 flex items-end justify-center -z-10 pointer-events-none">
          <div className="w-[86%] h-3 rounded-md bg-gradient-to-r from-black/5 to-black/2 translate-y-6 opacity-30" />
        </div>

        <Card className="rounded-3xl overflow-hidden bg-white border shadow-lg">
          {/* HEADER */}
          <div className="bg-gradient-to-r from-orange-500 to-indigo-700 p-6 text-center">
            <img
              src="/icon.png"
              alt="Clarify OCR"
              className="h-12 w-auto mx-auto"
              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            />
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-white mt-3">Clarify OCR</CardTitle>
            <CardDescription className="text-blue-100 mt-1">Secure • Fast • Simple</CardDescription>
          </div>

          <CardContent className="px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <Label htmlFor="name" className="text-gray-800 text-sm sm:text-base flex items-center font-medium">
                  <svg className="h-5 w-5 mr-2 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Full name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearFieldError('name');
                  }}
                  placeholder="John Doe"
                  className={`mt-1 rounded-xl py-3 text-base ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                  required
                  disabled={loadingState !== 'idle'}
                />
                <FieldError id="name-error">{errors.name}</FieldError>
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-gray-800 text-sm sm:text-base flex items-center font-medium">
                  <Mail className="h-5 w-5 mr-2 text-gray-500" /> Email address
                </Label>
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError('email');
                  }}
                  placeholder="you@example.com"
                  className={`mt-1 rounded-xl py-3 text-base ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  required
                  disabled={loadingState !== 'idle'}
                />
                <FieldError id="email-error">{errors.email}</FieldError>
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password" className="text-gray-800 text-sm sm:text-base flex items-center font-medium">
                  <Lock className="h-5 w-5 mr-2 text-gray-500" /> Password
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearFieldError('password');
                      if (errors.confirmPassword && confirmPassword === e.target.value) clearFieldError('confirmPassword');
                    }}
                    placeholder="Create a strong password"
                    className={`rounded-xl py-3 text-base pr-12 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                    required
                    disabled={loadingState !== 'idle'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <div>Strength: <span className={`font-medium ${strengthColors[getPasswordStrength(password)]}`}>{strengthLabels[getPasswordStrength(password)]}</span></div>
                      <div>{password.length} chars</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
                      <div className={`h-2 rounded-full ${strengthColors[getPasswordStrength(password)]}`} style={{ width: `${(getPasswordStrength(password)/3)*100}%` }} />
                    </div>
                  </div>
                )}

                <FieldError id="password-error">{errors.password}</FieldError>
              </div>

              {/* Confirm Password */}
              <div>
                <Label htmlFor="confirmPassword" className="text-gray-800 text-sm sm:text-base flex items-center font-medium">
                  <Lock className="h-5 w-5 mr-2 text-gray-500" /> Confirm password
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearFieldError('confirmPassword');
                      if (errors.confirmPassword && password === e.target.value) clearFieldError('confirmPassword');
                    }}
                    placeholder="Confirm your password"
                    className={`rounded-xl py-3 text-base pr-12 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                    required
                    disabled={loadingState !== 'idle'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <FieldError id="confirm-password-error">{errors.confirmPassword}</FieldError>
              </div>

              {/* General error */}
              <AnimatePresence>
                {errors.general && (
                  <motion.div className="rounded-md bg-red-50 border border-red-100 p-3 text-red-700 text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {errors.general}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit button */}
              <div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition-transform active:scale-95"
                  disabled={loadingState !== 'idle'}
                >
                  {loadingState === 'email-password' ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Creating account...
                    </span>
                  ) : (
                    'Create account'
                  )}
                </Button>
              </div>

              {/* social divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Or sign up with</span>
                </div>
              </div>

              {/* Social buttons */}
              <div className="grid gap-3">
                <Button
                  onClick={handleGoogleSignUp}
                  className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-semibold py-3 rounded-xl flex items-center justify-center gap-3"
                  disabled={loadingState !== 'idle'}
                >
                  {loadingState === 'google-popup' || loadingState === 'google-redirect' ? (
                    <span className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> {loadingState === 'google-popup' ? 'Signing up...' : 'Redirecting...'}
                    </span>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      <span>Sign up with Google</span>
                    </>
                  )}
                </Button>

                <Button onClick={() => toast({ title: 'Not implemented', description: 'GitHub sign-up not wired yet' })} disabled className="w-full bg-black text-white py-3 rounded-xl flex items-center justify-center gap-3">
                  <Github className="h-4 w-4" /> Sign up with GitHub (coming)
                </Button>
              </div>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4">
            <div className="text-sm text-gray-600">
              Already have an account?
              <Link to="/login" className="ml-2 text-blue-600 font-semibold hover:underline">
                Sign in
              </Link>
            </div>
            <div className="text-xs text-gray-500 flex items-center">
              <ShieldAlert className="h-4 w-4 mr-2" /> © {new Date().getFullYear()} Clarify OCR
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
