// src/pages/Register.tsx
/**
 * Register.tsx
 *
 * Full-featured registration page for Clarify OCR
 * - Firebase registration (email/password)
 * - Update displayName on profile
 * - Avatar image upload + preview (client-side only)
 * - Inline validation with zod
 * - Password strength meter
 * - Accessible inputs with labels and aria-*
 * - Responsive Tailwind / mobile-first layout
 * - Framer Motion small entrance animations
 * - Defensive fallbacks if shared UI components are missing
 *
 * Drop into your React + Vite + Tailwind project (adjust imports if needed)
 *
 */

/* ===========================
   Imports & Dependencies
   =========================== */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import type { User } from "firebase/auth";

/* Tailwind + shadcn/ui-like component imports (adjust if your project differs) */
import { auth } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* Card components — if your project does not export these exact names, the fallback below will render instead */
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

/* Icons */
import { Eye, EyeOff, UploadCloud, User as UserIcon, ShieldAlert, Loader2 } from "lucide-react";

/* Toast (optional) */
import { toast } from "@/components/ui/use-toast";

/* ===========================
   Fallbacks (Defensive)
   If any shared ui component import is missing,
   we render a minimal fallback so user doesn't see a white screen.
   =========================== */

const MissingCardFallback = (props: { children?: React.ReactNode }) => (
  <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow p-6">{props.children}</div>
);

const hasCardExports =
  typeof Card !== "undefined" &&
  typeof CardHeader !== "undefined" &&
  typeof CardContent !== "undefined" &&
  typeof CardFooter !== "undefined";

/* Choose which Card to render: real or fallback */
const RenderCard: React.FC<React.ComponentProps<"div"> & { children?: React.ReactNode }> = (props) => {
  if (hasCardExports) {
    // @ts-ignore - using the imported Card component from user's ui lib
    return <Card {...props}>{props.children}</Card>;
  }
  return <MissingCardFallback {...(props as any)}>{props.children}</MissingCardFallback>;
};

/* ===========================
   Validation Schema
   =========================== */

const registerSchema = z
  .object({
    name: z.string().min(2, "Please enter your full name"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    acceptTerms: z.boolean().refine((v) => v === true, "You must accept the terms"),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

type RegisterForm = z.infer<typeof registerSchema>;

/* ===========================
   Utility helpers
   =========================== */

/**
 * computePasswordStrength:
 * returns a score 0..3 and details
 */
function computePasswordStrength(password: string) {
  const lengthScore = Math.min(3, Math.floor(password.length / 4)); // 0..3
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  let variety = 0;
  if (hasLower) variety++;
  if (hasUpper) variety++;
  if (hasNumber) variety++;
  if (hasSymbol) variety++;

  const score = Math.max(0, Math.min(3, Math.round((lengthScore + Math.min(3, variety)) / 2)));
  const labels = ["Too short", "Weak", "Medium", "Strong"];
  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-400", "bg-green-500"];
  return { score, label: labels[score], colorClass: colors[score] };
}

/* Small delay utility for UX simulation */
const sleep = (ms = 500) => new Promise((res) => setTimeout(res, ms));

/* ===========================
   Main Component
   =========================== */

export default function Register(): JSX.Element {
  const navigate = useNavigate();

  /* Form state */
  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  /* UI state */
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RegisterForm, string>>>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* Defensive: if firebase/auth not configured, show message */
  useEffect(() => {
    if (!auth) {
      console.warn("[Register] Firebase auth import is missing or undefined (auth).");
    }
  }, []);

  /* Compute password strength */
  const passwordStrength = useMemo(() => computePasswordStrength(form.password), [form.password]);

  /* Preview avatar client-side */
  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(String(e.target?.result ?? null));
    };
    reader.readAsDataURL(avatarFile);
    return () => {
      // no cleanup needed for FileReader itself
    };
  }, [avatarFile]);

  /* Handle input changes */
  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked as any) : value,
    }));
    // clear field error as user edits
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    setServerError(null);
  }, []);

  /* Avatar selection */
  const onAvatarSelect = useCallback((file?: File) => {
    if (!file) return;
    const maxSizeMB = 2;
    if (file.size > maxSizeMB * 1024 * 1024) {
      setServerError(`Avatar must be smaller than ${maxSizeMB}MB`);
      return;
    }
    setAvatarFile(file);
  }, []);

  /* wire file input click */
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /* Validate locally before attempting Firebase call */
  const validate = useCallback(() => {
    try {
      registerSchema.parse(form);
      setFieldErrors({});
      return true;
    } catch (err: any) {
      if (err?.issues && Array.isArray(err.issues)) {
        const issues = err.issues as Array<{ path: (string | number)[]; message: string }>;
        const nextErrors: Partial<Record<keyof RegisterForm, string>> = {};
        for (const issue of issues) {
          const p = issue.path?.[0];
          if (typeof p === "string") {
            (nextErrors as any)[p] = issue.message;
          }
        }
        setFieldErrors(nextErrors);
      } else {
        console.error("[Register] validation error", err);
      }
      return false;
    }
  }, [form]);

  /* Submit handler */
  const onSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      setServerError(null);

      if (!validate()) {
        // let UI show errors
        return;
      }

      if (!auth) {
        setServerError("Authentication is not configured. Please check your firebase setup.");
        return;
      }

      setLoading(true);

      try {
        // simulate a small delay for UX smoothness
        await sleep(350);

        const credential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        // update profile displayName (and optionally store avatar url if you upload to storage)
        try {
          await updateProfile(credential.user as User, { displayName: form.name });
        } catch (updateErr) {
          console.warn("[Register] updateProfile failed", updateErr);
        }

        // Optionally show a toast
        try {
          toast?.({
            title: "Account created",
            description: "Welcome! Your account has been created.",
          });
        } catch {
          // no-op if toast missing
        }

        // navigate to welcome/dashboard
        setTimeout(() => {
          navigate("/");
        }, 200);
      } catch (err: any) {
        console.error("[Register] createUserWithEmailAndPassword error:", err);
        const code = err?.code ?? "";
        let friendly = "Registration failed. Please try again.";
        if (code === "auth/email-already-in-use") friendly = "An account with this email already exists.";
        if (code === "auth/invalid-email") friendly = "Email is invalid.";
        if (code === "auth/weak-password") friendly = "Password is too weak.";
        setServerError(friendly);
      } finally {
        setLoading(false);
      }
    },
    [form, validate, navigate]
  );

  /* Accessibility: focus first invalid field when errors appear */
  useEffect(() => {
    if (!fieldErrors || Object.keys(fieldErrors).length === 0) return;
    const firstKey = Object.keys(fieldErrors)[0] as keyof RegisterForm | undefined;
    if (!firstKey) return;
    const el = document.querySelector<HTMLInputElement>(`input[name="${firstKey}"]`);
    el?.focus();
  }, [fieldErrors]);

  /* Small UI helpers */
  const isDisabled = loading;

  /* ===========================
     Render: large, mobile friendly layout
     =========================== */

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.995 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-3xl"
      >
        <RenderCard className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
          {/* Left: illustration / info */}
          <div className="hidden lg:flex flex-col justify-center items-center p-8 bg-gradient-to-b from-indigo-600 to-sky-600 text-white rounded-l-2xl">
            <div className="w-full max-w-xs">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/10 rounded-lg">
                  <UserIcon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Create your Clarify OCR account</h3>
                  <p className="text-sm text-indigo-200">Save, scan, and organize documents effortlessly.</p>
                </div>
              </div>

              <ul className="space-y-4 mt-4 text-sm">
                <li className="flex gap-3 items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-white/90" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L9 14.414 5.293 10.707a1 1 0 011.414-1.414L9 11.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-indigo-100">OCR powered extraction</div>
                </li>

                <li className="flex gap-3 items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-white/90" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M2 11a1 1 0 011-1h4v2H4a1 1 0 01-1-1z" />
                      <path d="M18 7a1 1 0 00-1-1h-4v2h4a1 1 0 001-1z" />
                    </svg>
                  </div>
                  <div className="text-indigo-100">Export tasks to JSON, PDF, CSV</div>
                </li>

                <li className="flex gap-3 items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-white/90" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2H2V5z" />
                      <path fillRule="evenodd" d="M2 9h16v6a2 2 0 01-2 2H4a2 2 0 01-2-2V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-indigo-100">Secure login & user management</div>
                </li>
              </ul>

              <div className="mt-8 text-xs text-indigo-100/80">By creating an account you agree to our Terms & Privacy policy.</div>
            </div>
          </div>

          {/* Right: form */}
          <div className="p-6 lg:p-10 bg-white rounded-2xl">
            <div className="max-w-md mx-auto">
              {/* Header */}
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
                <p className="mt-2 text-sm text-gray-500">
                  Start using Clarify OCR — fast, secure, and built for students & lecturers.
                </p>
              </div>

              {/* Avatar upload */}
              <form onSubmit={onSubmit} aria-describedby="register-form" className="space-y-5">
                <div>
                  <label htmlFor="avatar" className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                        {avatarPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-8 h-8 text-gray-400" />
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={openFilePicker}
                        className="absolute -bottom-1 -right-1 bg-white rounded-full p-2 shadow border text-indigo-600"
                        aria-label="Upload avatar"
                      >
                        <UploadCloud className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="ml-3 text-left">
                      <div className="text-sm font-medium text-gray-700">Profile photo (optional)</div>
                      <div className="text-xs text-gray-500">PNG, JPG — max 2MB</div>
                    </div>
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(ev) => {
                      const f = ev.target.files?.[0] ?? null;
                      if (f) onAvatarSelect(f);
                    }}
                  />
                </div>

                {/* Name */}
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Jeevasurya Palanisamy"
                    value={form.name}
                    onChange={onChange}
                    aria-invalid={!!fieldErrors.name}
                    aria-describedby={fieldErrors.name ? "name-error" : undefined}
                    className="mt-1"
                    required
                  />
                  {fieldErrors.name && <p id="name-error" className="text-xs mt-1 text-red-600">{fieldErrors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={onChange}
                    aria-invalid={!!fieldErrors.email}
                    aria-describedby={fieldErrors.email ? "email-error" : undefined}
                    className="mt-1"
                    required
                  />
                  {fieldErrors.email && <p id="email-error" className="text-xs mt-1 text-red-600">{fieldErrors.email}</p>}
                </div>

                {/* Password + show toggle */}
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      value={form.password}
                      onChange={onChange}
                      aria-invalid={!!fieldErrors.password}
                      aria-describedby={fieldErrors.password ? "password-error" : undefined}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {fieldErrors.password && <p id="password-error" className="text-xs mt-1 text-red-600">{fieldErrors.password}</p>}
                </div>

                {/* Password strength */}
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <div>Password strength</div>
                    <div className="font-medium text-gray-600">{passwordStrength.label}</div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${passwordStrength.colorClass}`} style={{ width: `${(passwordStrength.score / 3) * 100}%` }} />
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Repeat your password"
                    value={form.confirmPassword}
                    onChange={onChange}
                    aria-invalid={!!fieldErrors.confirmPassword}
                    aria-describedby={fieldErrors.confirmPassword ? "confirm-error" : undefined}
                    className="mt-1"
                    required
                  />
                  {fieldErrors.confirmPassword && <p id="confirm-error" className="text-xs mt-1 text-red-600">{fieldErrors.confirmPassword}</p>}
                </div>

                {/* Terms */}
                <div className="flex items-start gap-2">
                  <input
                    id="acceptTerms"
                    name="acceptTerms"
                    type="checkbox"
                    checked={form.acceptTerms}
                    onChange={onChange}
                    className="mt-1"
                    aria-invalid={!!fieldErrors.acceptTerms}
                    required
                  />
                  <label htmlFor="acceptTerms" className="text-sm text-gray-700">
                    I agree to the{" "}
                    <button type="button" onClick={() => setTermsOpen(true)} className="text-indigo-600 underline">
                      Terms & Conditions
                    </button>
                  </label>
                </div>
                {fieldErrors.acceptTerms && <p className="text-xs mt-1 text-red-600">{fieldErrors.acceptTerms}</p>}

                {/* Server error */}
                {serverError && <div className="rounded-md bg-red-50 text-red-700 p-3 text-sm">{serverError}</div>}

                {/* Submit */}
                <div className="pt-1">
                  <Button type="submit" disabled={isDisabled} className="w-full flex items-center justify-center gap-3">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create account"
                    )}
                  </Button>
                </div>

                {/* Footer small links */}
                <div className="text-center text-sm text-gray-500">
                  Already have an account?{" "}
                  <Link to="/login" className="text-indigo-600 underline">
                    Sign in
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </RenderCard>

        {/* Terms modal */}
        <AnimatePresence>
          {termsOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 flex items-center justify-center p-4"
            >
              <div className="absolute inset-0 bg-black/40" onClick={() => setTermsOpen(false)} aria-hidden />
              <motion.div initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: 20 }} className="relative max-w-2xl w-full bg-white rounded-xl shadow-lg p-6 z-50">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold">Terms & Conditions</h3>
                  <button onClick={() => setTermsOpen(false)} aria-label="Close terms" className="text-gray-500">Close</button>
                </div>

                <div className="mt-4 text-sm text-gray-700 max-h-[60vh] overflow-auto space-y-3">
                  <p><strong>Welcome to Clarify OCR</strong>. By creating an account you agree to the following:</p>
                  <p>1. Use our service responsibly. Do not upload illegal content.</p>
                  <p>2. We process documents and may temporarily store them for OCR processing.</p>
                  <p>3. We do not share your personal data without consent except as required by law.</p>
                  <p>4. Passwords should be kept secure. Use a strong password.</p>
                  <p>For the full Terms & Privacy policies, please visit our website or contact support.</p>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button onClick={() => setTermsOpen(false)} className="bg-indigo-600">I understand</Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ===========================
   End of Register.tsx
   =========================== */

/**
 * Notes & Integration Checklist:
 * - Ensure `@/firebase` exports a valid `auth` instance from firebase/auth.
 * - Ensure Button, Input, Label components exist at the imported paths.
 * - If you use a different UI library, you can replace the Button/Input/Label with HTML elements.
 * - Avatar upload above is client-side preview only. To persist avatars upload to Firebase Storage
 *   or your chosen storage provider then save the resulting URL in the user's profile.
 * - If you want the file exactly 1500 lines, tell me and I'll pad with comments or extra helper functions
 *   — but usually longer files are harder to maintain, so I kept it focused and readable.
 */
