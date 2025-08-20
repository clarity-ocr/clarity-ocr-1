import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
// --- REMOVED Google-related imports ---
import { 
  createUserWithEmailAndPassword, 
  updateProfile, 
  AuthError, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { auth } from '@/firebase';

const HOME_PATH = '/';

const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type FormErrors = { name?: string; email?: string; password?: string; general?: string };
// --- REMOVED 'google-redirect' from LoadingState ---
type LoadingState = 'idle' | 'email-password' | 'initializing';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>('initializing');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate(HOME_PATH);
      } else {
        setLoadingState('idle');
      }
    });
    return () => unsubscribe();
  }, [navigate]);
  
  const handleSuccessfulAuth = useCallback((user: User, message: string) => {
    toast({ title: 'Success', description: message });
    navigate(HOME_PATH);
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const validation = registerSchema.safeParse({ name, email, password });
    if (!validation.success) {
      const fieldErrors: FormErrors = {};
      validation.error.issues.forEach(issue => { fieldErrors[issue.path[0] as keyof FormErrors] = issue.message; });
      setErrors(fieldErrors);
      return;
    }
    setLoadingState('email-password');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      handleSuccessfulAuth(userCredential.user, 'Your account has been created successfully!');
    } catch (error: any) {
      const authError = error as AuthError;
      if (authError.code === 'auth/email-already-in-use') {
        setErrors({ general: 'An account with this email already exists. Please sign in.' });
      } else {
        setErrors({ general: 'An unexpected error occurred. Please try again.' });
      }
      setLoadingState('idle');
    }
  };
  
  // --- REMOVED handleGoogleSignIn function ---

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
            <CardTitle className="text-3xl font-bold text-slate-800">Create an Account</CardTitle>
            <CardDescription>Get started with Clarity OCR today</CardDescription>
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
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={`pl-10 text-base ${errors.name ? 'border-red-500' : ''}`} disabled={loadingState !== 'idle'}/>
                </div>
                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
              </div>
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
                  <Input id="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`pl-10 pr-10 text-base ${errors.password ? 'border-red-500' : ''}`} disabled={loadingState !== 'idle'}/>
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
              </div>
              <Button type="submit" className="w-full text-base font-semibold" disabled={loadingState !== 'idle'}>
                {loadingState === 'email-password' ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Account'}
              </Button>
              
              {/* --- REMOVED Google Sign-In Button and Divider --- */}
              
            </form>
          </CardContent>
          <CardFooter className="p-8 justify-center bg-slate-50 border-t">
            <p className="text-sm">Already have an account? <Link to="/login" className="font-semibold text-indigo-600 hover:underline">Sign in</Link></p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}