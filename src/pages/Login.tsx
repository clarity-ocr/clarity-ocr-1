import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { signInWithEmailAndPassword, signInWithRedirect, getRedirectResult, AuthError, onAuthStateChanged, User } from 'firebase/auth';
import { auth, googleProvider } from '@/firebase';

// Define the path to redirect to after successful login for easy configuration
const HOME_PATH = '/';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type FormErrors = { email?: string; password?: string; general?: string };
type LoadingState = 'idle' | 'email-password' | 'google-redirect' | 'initializing';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>('initializing');
  const [rememberMe, setRememberMe] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // This single useEffect handles all initial auth states (redirects, existing sessions).
  useEffect(() => {
    // 1. Check for a Google Sign-In redirect result first.
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          toast({
            title: 'Sign-In Successful',
            description: `Welcome back, ${result.user.displayName || 'User'}!`,
          });
          navigate(HOME_PATH);
        } else {
          // 2. If no redirect, check for an existing persistent session.
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
              // User is already logged in, so redirect them.
              navigate(HOME_PATH);
            } else {
              // No user is signed in. The page is ready for interaction.
              const rememberedEmail = localStorage.getItem('clarityOcrRememberedEmail');
              if (rememberedEmail) {
                setEmail(rememberedEmail);
                setRememberMe(true);
              }
              setLoadingState('idle');
            }
          });
          // Cleanup the listener when the component unmounts.
          return () => unsubscribe();
        }
      })
      .catch((error) => {
        toast({ title: 'Google Sign-In Failed', description: error.message, variant: 'destructive' });
        setLoadingState('idle');
      });
  }, [navigate, toast]);

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
    navigate(HOME_PATH);
  }, [email, rememberMe, toast, navigate]);

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
          setErrors({ general: "Access temporarily disabled due to too many failed login attempts. Please try again later." });
          break;
        default:
          setErrors({ general: "An unexpected error occurred. Please try again." });
          break;
      }
      setLoadingState('idle');
    }
  };

  const handleGoogleSignIn = async () => {
    setLoadingState('google-redirect');
    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      toast({ title: 'Redirect Failed', description: "Could not initiate Google Sign-In.", variant: 'destructive' });
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
              <div className="relative text-center"><span className="text-xs uppercase text-gray-400 bg-white px-2 relative z-10">Or continue with</span><hr className="absolute top-1/2 w-full -z-0"/></div>
              <Button onClick={handleGoogleSignIn} variant="outline" className="w-full text-base font-semibold" disabled={loadingState !== 'idle'}>
                {loadingState === 'google-redirect' ? <Loader2 className="h-5 w-5 animate-spin" /> : <><svg className="mr-2 h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> Continue with Google</>}
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