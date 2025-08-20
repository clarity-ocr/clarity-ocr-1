import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { signInWithEmailAndPassword, AuthError, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/firebase';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type FormErrors = { email?: string; password?: string; general?: string };
type LoadingState = 'idle' | 'email-password' | 'initializing';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>('initializing');
  const [rememberMe, setRememberMe] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation(); // Get location object

  // Determine where to redirect after login. Default to home page '/'.
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // If user is already logged in, send them to their original destination
        navigate(from, { replace: true });
      } else {
        const rememberedEmail = localStorage.getItem('clarityOcrRememberedEmail');
        if (rememberedEmail) {
          setEmail(rememberedEmail);
          setRememberMe(true);
        }
        setLoadingState('idle');
      }
    });
    return () => unsubscribe();
  }, [navigate, from]);

  const handleSuccessfulSignIn = useCallback((user: User) => {
    toast({
      title: 'Login Successful',
      description: `Welcome back, ${user.displayName || user.email}!`,
    });
    if (rememberMe) {
      localStorage.setItem('clarityOcrRememberedEmail', email);
    } else {
      localStorage.removeItem('clarityOcrRememberedEmail');
    }
    // Navigate to the originally requested page, or to the home page
    navigate(from, { replace: true });
  }, [email, rememberMe, toast, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const fieldErrors: FormErrors = {};
      validation.error.issues.forEach(issue => { fieldErrors[issue.path[0] as keyof FormErrors] = issue.message; });
      setErrors(fieldErrors);
      return;
    }
    setLoadingState('email-password');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      handleSuccessfulSignIn(userCredential.user);
    } catch (error: any) {
      const authError = error as AuthError;
      switch (authError.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setErrors({ general: "Invalid email or password. Please try again." });
          break;
        case 'auth/too-many-requests':
          setErrors({ general: "Access temporarily disabled due to too many failed login attempts." });
          break;
        default:
          setErrors({ general: "An unexpected error occurred. Please try again." });
          break;
      }
      setLoadingState('idle');
    }
  };

  if (loadingState === 'initializing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="shadow-xl bg-white rounded-2xl">
          <CardHeader className="text-center p-8">
             <img src="/icon.png" alt="Logo" className="h-16 w-auto mx-auto mb-4" />
            <CardTitle className="text-3xl font-bold text-slate-800">Welcome Back</CardTitle>
            <CardDescription>Sign in to continue to Clarity OCR</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence>
                {errors.general && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm p-3 bg-red-100 text-red-700 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" /> <p>{errors.general}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`pl-10 text-base ${errors.email ? 'border-red-500' : ''}`} disabled={loadingState !== 'idle'}/>
                </div>
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`pl-10 pr-10 text-base ${errors.password ? 'border-red-500' : ''}`} disabled={loadingState !== 'idle'}/>
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="remember-me" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 rounded border-gray-300"/>
                  <Label htmlFor="remember-me" className="text-sm font-normal">Remember me</Label>
                </div>
                <Link to="/forgot-password" className="text-sm font-semibold text-indigo-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Button type="submit" className="w-full text-base font-semibold" disabled={loadingState !== 'idle'}>
                {loadingState === 'email-password' ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign In'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="p-8 justify-center bg-slate-50 border-t">
            <p className="text-sm">Don't have an account? <Link to="/register" className="font-semibold text-indigo-600 hover:underline">Sign up</Link></p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}