// src/pages/Login.tsx
/**
 * Login.tsx — Clarify OCR
 *
 * Purpose:
 * - Mobile-first, accessible, and secure client-side login component.
 * - Implements email/password sign-in and Google sign-in (popup + redirect).
 * - Robust validation using zod, helpful UX, and careful error handling.
 * - Defensive fallbacks for missing UI components to avoid white screens.
 * - Security notes and hooks for server-side integrations (HttpOnly cookies, CSRF, rate-limiting).
 *
 * To integrate securely:
 * - Implement server-side session cookies (HttpOnly, Secure, SameSite=strict).
 * - Use refresh-token rotation on the server; do not store refresh tokens in localStorage.
 * - Implement server-side rate limiting and reCAPTCHA verification for sign-in attempts.
 * - Ensure your Firebase project is configured and googleProvider is correctly set up.
 *
 * Author: ChatGPT (GPT-5 Thinking mini)
 * Date: 2025-08-12
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";

import { z } from "zod";
import { motion, AnimatePresence, useAnimation, useInView } from "framer-motion";

import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  User,
  AuthError,
} from "firebase/auth";

import { auth, googleProvider } from "@/firebase"; // ensure these exports exist
import { useAuth } from "@/contexts/AuthContext";

// UI components — adjust paths to your project
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { toast } from "@/components/ui/use-toast"; // optional toast helper
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  ShieldAlert,
  LogOut,
  User as UserIcon,
} from "lucide-react";

/* ---------------------------
   Types & Validation Schema
   --------------------------- */

type FormErrors = {
  email?: string;
  password?: string;
  general?: string;
};

type LoadingState = "idle" | "email-password" | "google-popup" | "google-redirect";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// password strength basic helper (client-only)
const computePasswordStrength = (pw: string) => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(4, score);
};

const strengthLabels = ["None", "Weak", "Fair", "Good", "Strong"];
const strengthColors = ["bg-gray-200", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-green-500"];

/* ---------------------------
   Local Rate-Limiter (client-side)
   ---------------------------
   NOTE: Client-side rate-limiting is *not* a security boundary.
   Use it to improve UX and reduce accidental rapid-fire attempts.
   Server must still enforce rate limits and reCAPTCHA.
*/
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const MAX_ATTEMPTS_PER_WINDOW = 5;

/* ---------------------------
   Utility: local attempt tracker
   --------------------------- */
const recordAttempt = (key = "clarify_login_attempts") => {
  try {
    const raw = localStorage.getItem(key);
    const now = Date.now();
    let arr: number[] = raw ? JSON.parse(raw) : [];
    // prune old entries
    arr = arr.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    arr.push(now);
    localStorage.setItem(key, JSON.stringify(arr));
    return arr.length;
  } catch {
    return 0;
  }
};

const getAttemptCount = (key = "clarify_login_attempts") => {
  try {
    const raw = localStorage.getItem(key);
    const now = Date.now();
    if (!raw) return 0;
    const arr: number[] = JSON.parse(raw);
    return arr.filter((t) => now - t < RATE_LIMIT_WINDOW_MS).length;
  } catch {
    return 0;
  }
};

const clearAttempts = (key = "clarify_login_attempts") => {
  try {
    localStorage.removeItem(key);
  } catch {}
};

/* ---------------------------
   Main Component
   --------------------------- */

export default function Login(): JSX.Element {
  const navigate = useNavigate();
  const controls = useAnimation();

  // form state
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [isFocused, setIsFocused] = useState({ email: false, password: false });

  // rate-limit UX state
  const [attemptCount, setAttemptCount] = useState(() => getAttemptCount());
  const [cooldownMs, setCooldownMs] = useState<number | null>(null);
  const cooldownTimerRef = useRef<number | null>(null);

  // auth context
  let authContext: any = null;
  try {
    authContext = useAuth();
  } catch (err) {
    // defensive — useAuth might be missing in tests
    console.warn("[Login] useAuth hook threw:", err);
  }
  const user = authContext?.user ?? null;

  // animation / in view
  const cardRef = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(cardRef, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) controls.start("visible");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView]);

  // background animation controls (same pattern as earlier file)
  const backgroundControls = useAnimation();
  useEffect(() => {
    const animateBackground = async () => {
      await backgroundControls.start({
        opacity: [0.25, 0.45, 0.25],
        y: [0, -12, 0],
        transition: { duration: 12, repeat: Infinity, ease: "easeInOut" },
      });
    };
    animateBackground();
  }, [backgroundControls]);

  // redirect if already logged in
  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  // on mount: load remembered email if any
  useEffect(() => {
    try {
      const e = localStorage.getItem("clarifyOcrRememberedEmail");
      if (e) {
        setEmail(e);
        setRememberMe(true);
      }
    } catch (err) {
      console.warn("[Login] failed to load remembered email:", err);
    }
  }, []);

  // monitor attempt count
  useEffect(() => {
    setAttemptCount(getAttemptCount());
  }, []);

  // cooldown timer: if attempts exceeded, set a short cooldown in UI
  useEffect(() => {
    if (attemptCount >= MAX_ATTEMPTS_PER_WINDOW) {
      // compute earliest timestamp remaining
      const raw = localStorage.getItem("clarify_login_attempts");
      if (!raw) return;
      const arr: number[] = JSON.parse(raw);
      const now = Date.now();
      const earliest = Math.min(...arr);
      const remaining = RATE_LIMIT_WINDOW_MS - (now - earliest);
      setCooldownMs(remaining);
      // set timer to update countdown and clear attempts when done
      cooldownTimerRef.current && clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = window.setTimeout(() => {
        clearAttempts();
        setAttemptCount(0);
        setCooldownMs(null);
      }, remaining ?? 0);
    }
    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
    };
  }, [attemptCount]);

  /* ----------------------------
     Validation helpers
     ---------------------------- */
  const validateForm = useCallback((): boolean => {
    try {
      loginSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        err.errors.forEach((e) => {
          if (e.path && e.path.length > 0) {
            const field = e.path[0] as keyof FormErrors;
            newErrors[field] = e.message;
          }
        });
        setErrors(newErrors);
      } else {
        console.error("[Login] validation error:", err);
      }
      return false;
    }
  }, [email, password]);

  const clearFieldError = useCallback((field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const passwordStrength = useMemo(() => computePasswordStrength(password), [password]);

  /* ----------------------------
     Google Redirect result handling
     (for signInWithRedirect flow)
     ---------------------------- */
  useEffect(() => {
    let cancelled = false;
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user && !cancelled) {
          toast?.({
            title: "Signed in",
            description: `Welcome back, ${result.user.displayName || "User"}`,
          });
          // The actual session persistence should be handled server-side
          navigate("/");
        }
      } catch (err: any) {
        console.warn("[Login] getRedirectResult error:", err);
        // Show friendly message
        toast?.({ title: "Google sign-in failed", description: "Please try again." });
      } finally {
        setLoadingState("idle");
      }
    };
    handleRedirect();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  /* ----------------------------
     Submit handlers
     ---------------------------- */

  // Helper to show server-level guidance text if server-side requirements missing
  const ensureServerGuidance = () => {
    // NOTE: This does not check server; only informs developer via console
    if (!auth) {
      console.error(
        "[Login] Firebase auth instance missing. Ensure `auth` is exported from '@/firebase'."
      );
    }
  };

  useEffect(() => {
    ensureServerGuidance();
  }, []);

  // main email/password submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // client-side rate-limit check: for UX only
    const attemptsNow = recordAttempt();
    setAttemptCount(attemptsNow);
    if (attemptsNow >= MAX_ATTEMPTS_PER_WINDOW) {
      setErrors({ general: `Too many attempts. Try again in a minute.` });
      return;
    }

    if (!validateForm()) return;

    setLoadingState("email-password");
    setErrors((prev) => ({ ...prev, general: undefined }));

    try {
      // IMPORTANT: For production, prefer server-side sign-in (exchange credentials securely).
      // If you use Firebase client SDK, ensure you still create a secure server session if needed.
      const uc = await signInWithEmailAndPassword(auth, email, password);
      // On success: clear attempts and optionally notify user
      clearAttempts();
      setAttemptCount(0);

      // Example: prefer server-side session handling. If you use custom tokens, call your backend endpoint
      // to exchange credentials for server-side cookie session (HttpOnly, Secure).
      //
      // Example (pseudo):
      // await fetch('/api/sessionLogin', { method: 'POST', body: JSON.stringify({ idToken: await uc.user.getIdToken() }), credentials: 'include' })

      // For now, accept auth client state and navigate
      toast?.({ title: "Login successful", description: "Welcome back!" });
      setLoadingState("idle");
      if (rememberMe) {
        try {
          localStorage.setItem("clarifyOcrRememberedEmail", email);
        } catch {}
      } else {
        try {
          localStorage.removeItem("clarifyOcrRememberedEmail");
        } catch {}
      }
      navigate("/");
    } catch (err: any) {
      setLoadingState("idle");
      // Interpret common firebase errors into friendly messages
      const code = err?.code ?? "unknown";
      let message = "Login failed. Please try again.";

      switch (code) {
        case "auth/invalid-email":
          setErrors({ email: "The email address is badly formatted." });
          message = "Invalid email address.";
          break;
        case "auth/user-disabled":
          setErrors({ email: "This account has been disabled." });
          message = "Account disabled.";
          break;
        case "auth/user-not-found":
          setErrors({ email: "No account found with this email." });
          message = "Account not found.";
          break;
        case "auth/wrong-password":
          setErrors({ password: "Incorrect password." });
          message = "Incorrect password.";
          break;
        case "auth/too-many-requests":
          message = "Too many requests — try again later.";
          setErrors({ general: message });
          break;
        default:
          setErrors({ general: message });
          console.error("[Login] signIn error:", err);
          break;
      }

      // increment attempt recorded earlier; already recorded via recordAttempt
      toast?.({ title: "Sign-in failed", description: message, variant: "destructive" });
    }
  };

  // google sign-in handler (popup)
  const handleGoogleSignIn = async () => {
    setLoadingState("google-popup");
    setErrors({});
    try {
      googleProvider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, googleProvider);
      // On success
      toast?.({ title: "Signed in", description: `Welcome ${result.user.displayName || "User"}` });
      clearAttempts();
      setAttemptCount(0);
      setLoadingState("idle");
      navigate("/");
    } catch (err: any) {
      setLoadingState("idle");
      const code = err?.code ?? "";
      let message = "Google Sign-In failed. Please try again.";
      if (code === "auth/popup-closed-by-user") message = "Sign-in popup was closed.";
      if (code === "auth/popup-blocked") {
        // fallback: initiate redirect flow
        try {
          setLoadingState("google-redirect");
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (rerr) {
          console.error("[Login] signInWithRedirect failed", rerr);
        }
      }
      toast?.({ title: "Google Sign-In Failed", description: message, variant: "destructive" });
    }
  };

  /* ----------------------------
     Accessibility helpers
     ---------------------------- */

  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  /* ----------------------------
     UI fallback if Card missing (prevents white screen)
     ---------------------------- */
  const missingUi =
    typeof Card === "undefined" ||
    typeof CardHeader === "undefined" ||
    typeof CardContent === "undefined" ||
    typeof CardFooter === "undefined";

  if (missingUi) {
    console.error("[Login] Missing Card components at '@/components/ui/card'.");
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="max-w-lg w-full bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">UI components missing</h2>
          <p className="text-sm text-gray-600 mb-4">
            The shared Card components could not be imported. Check your component exports at
            <code className="bg-gray-100 px-1 rounded mx-1">@/components/ui/card</code>.
          </p>
          <div className="flex gap-3">
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded">Reload</button>
            <Link to="/" className="px-4 py-2 bg-gray-100 rounded">Go home</Link>
          </div>
        </div>
      </div>
    );
  }

  /* ----------------------------
     Main render
     ---------------------------- */

  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0 }}
      animate={prefersReducedMotion ? {} : { opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-indigo-50 p-4"
      style={{ perspective: 1200 }}
    >
      {/* decorative blobs */}
      <motion.div animate={backgroundControls} className="absolute top-24 left-8 w-48 h-48 bg-sky-200 rounded-full mix-blend-multiply opacity-20 pointer-events-none" />
      <motion.div animate={backgroundControls} className="absolute bottom-32 right-8 w-64 h-64 bg-indigo-200 rounded-full mix-blend-multiply opacity-20 pointer-events-none" />

      <div ref={cardRef} className="w-full max-w-md z-10">
        <Card className="overflow-hidden rounded-2xl shadow-xl">
          {/* Header band */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-sky-600 opacity-90" />
            <div className="relative px-6 py-8 text-center">
              <img
                src="/icon.png"
                alt="Clarify OCR logo"
                className="mx-auto h-14 w-auto mb-3"
                onError={(e) => {
                  const t = e.target as HTMLImageElement;
                  if (t) {
                    t.onerror = null;
                    t.style.display = "none";
                  }
                }}
              />
              <CardTitle className="text-white text-2xl font-extrabold">Clarify OCR</CardTitle>
              <CardDescription className="text-indigo-200 mt-2">Secure sign in — students & lecturers</CardDescription>
            </div>
          </div>

          <CardContent className="px-6 py-8 bg-white">
            <form onSubmit={handleSubmit} className="space-y-5" aria-labelledby="login-heading" noValidate>
              <h2 id="login-heading" className="sr-only">Sign in to Clarify OCR</h2>

              {/* Email field */}
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Email</span>
                </Label>

                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError("email");
                  }}
                  onFocus={() => setIsFocused((s) => ({ ...s, email: true }))}
                  onBlur={() => setIsFocused((s) => ({ ...s, email: false }))}
                  required
                  disabled={loadingState !== "idle"}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={`mt-2 block w-full rounded-xl border-2 p-3 text-sm placeholder-gray-400 ${
                    errors.email ? "border-red-400" : isFocused.email ? "border-indigo-400 ring-1 ring-indigo-100" : "border-gray-200"
                  }`}
                />

                <AnimatePresence>
                  {errors.email && (
                    <motion.p id="email-error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2 text-xs text-red-600 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.email}</span>
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Password field */}
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Password</span>
                  </Label>
                  <Link to="/forgot-password" className="text-xs text-indigo-600 hover:underline">Forgot password?</Link>
                </div>

                <div className="relative mt-2">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearFieldError("password");
                    }}
                    onFocus={() => setIsFocused((s) => ({ ...s, password: true }))}
                    onBlur={() => setIsFocused((s) => ({ ...s, password: false }))}
                    required
                    disabled={loadingState !== "idle"}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    className={`block w-full rounded-xl border-2 p-3 pr-12 text-sm placeholder-gray-400 ${
                      errors.password ? "border-red-400" : isFocused.password ? "border-indigo-400 ring-1 ring-indigo-100" : "border-gray-200"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
                    tabIndex={0}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div>Password strength</div>
                    <div className="font-medium text-gray-600">{strengthLabels[passwordStrength]}</div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1 overflow-hidden">
                    <div className={`${strengthColors[passwordStrength]} h-2`} style={{ width: `${(passwordStrength / 4) * 100}%` }} />
                  </div>
                </div>

                <AnimatePresence>
                  {errors.password && (
                    <motion.p id="password-error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2 text-xs text-red-600 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.password}</span>
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Remember & sign-in */}
              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loadingState !== "idle"}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Remember me</span>
                </label>

                {/* Show a small dynamic hint about rate limiting */}
                <div className="text-xs text-gray-500">
                  {attemptCount >= MAX_ATTEMPTS_PER_WINDOW ? (
                    <span>Too many attempts — try again soon</span>
                  ) : (
                    <span>{Math.max(0, MAX_ATTEMPTS_PER_WINDOW - attemptCount)} attempts left</span>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div>
                <Button
                  type="submit"
                  onClick={() => {}}
                  disabled={loadingState !== "idle" || attemptCount >= MAX_ATTEMPTS_PER_WINDOW}
                  className="w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3"
                >
                  {loadingState === "email-password" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </div>

              {/* or divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center" aria-hidden>
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* Social sign in (Google) */}
              <div>
                <Button
                  onClick={handleGoogleSignIn}
                  disabled={loadingState !== "idle"}
                  className="w-full bg-white border border-gray-300 py-3 rounded-xl flex items-center justify-center gap-2 text-sm"
                >
                  {loadingState === "google-popup" || loadingState === "google-redirect" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {loadingState === "google-popup" ? "Signing in..." : "Redirecting..."}
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path>
                      </svg>
                      <span>Sign in with Google</span>
                    </>
                  )}
                </Button>
              </div>

              {/* general error */}
              <AnimatePresence>
                {errors.general && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <div>{errors.general}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </CardContent>

          <CardFooter className="bg-white px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-sm text-gray-600">
              New to Clarify OCR?{" "}
              <Link to="/register" className="text-indigo-600 font-medium hover:underline">Create an account</Link>
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              <span>&copy; {new Date().getFullYear()} Clarify OCR</span>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Google redirect overlay */}
      <AnimatePresence>
        {loadingState === "google-redirect" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full text-center">
              <Loader2 className="mx-auto w-7 h-7 animate-spin text-blue-600" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Redirecting to Google</h3>
              <p className="mt-2 text-sm text-gray-600">If the redirect does not complete, check your pop-up blocker settings.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ----------------------------
   Security Notes (developer)
   ----------------------------
   1) Never store tokens in localStorage for sensitive auth flows. Prefer HttpOnly secure cookies issued by your server.
   2) Implement server-side rate limiting and abuse detection.
   3) Use reCAPTCHA (or hCaptcha) server-side verification before issuing critical operations (password reset, account creation, or after suspicious login attempts).
   4) Use refresh token rotation and short-lived access tokens.
   5) Ensure CORS & CSP headers are correctly set on your server.
   6) Enforce strong password policies and consider MFA (2FA) for sensitive accounts.
   7) Logging: do not log sensitive tokens or passwords in production logs.
   8) Use secure cookie attributes: `HttpOnly; Secure; SameSite=Strict`.
   9) For enterprise, consider hardware-backed key storage or federation (SAML/OIDC) with strict session policies.
*/

