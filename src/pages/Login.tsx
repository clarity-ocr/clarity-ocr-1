import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { z } from 'zod';
import { signInWithEmailAndPassword, AuthError, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/firebase';

// --- Interactive 3D Binocular Icon Component ---
const InteractiveBinocularIcon = () => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 200 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  // Transformations for 3D rotation and parallax effects
  const rotateY = useTransform(springX, [-0.5, 0.5], ['-25deg', '25deg']);
  const rotateX = useTransform(springY, [-0.5, 0.5], ['25deg', '-25deg']);
  
  const shadowX = useTransform(springX, [-0.5, 0.5], ['-15px', '15px']);
  const shadowY = useTransform(springY, [-0.5, 0.5], ['-15px', '15px']);
  
  const glareX = useTransform(springX, [-0.5, 0.5], ['10%', '90%']);
  const glareY = useTransform(springY, [-0.5, 0.5], ['5%', '95%']);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const xPct = (e.clientX - rect.left) / rect.width - 0.5;
      const yPct = (e.clientY - rect.top) / rect.height - 0.5;
      x.set(xPct);
      y.set(yPct);
    };

    const handleMouseLeave = () => {
      x.set(0);
      y.set(0);
    };

    const currentRef = ref.current;
    if (currentRef) {
      currentRef.addEventListener('mousemove', handleMouseMove);
      currentRef.addEventListener('mouseleave', handleMouseLeave);
    }
    
    return () => {
      if (currentRef) {
        currentRef.removeEventListener('mousemove', handleMouseMove);
        currentRef.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [x, y]);
  
  return (
    <div ref={ref} className="w-full h-32 flex items-center justify-center -mt-8 mb-4 cursor-grab">
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative w-32 h-24"
      >
        <motion.div 
          className="absolute inset-0 bg-sky-500/20 dark:bg-purple-500/20 rounded-full blur-3xl"
          style={{ x: shadowX, y: shadowY }}
        />
        <svg 
          viewBox="0 0 100 80" 
          className="absolute inset-0 w-full h-full drop-shadow-xl"
          style={{ transform: 'translateZ(25px)' }}
        >
          <defs>
            <radialGradient id="lens-glare" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" style={{ stopColor: 'rgba(255, 255, 255, 0.4)', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: 'rgba(255, 255, 255, 0)', stopOpacity: 1 }} />
            </radialGradient>
            <linearGradient id="body-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          
          {/* Main Body */}
          <path d="M10 20 L2 35 V 65 L10 75 H35 L42 65 V 35 L35 20 H10 Z M65 20 L58 35 V 65 L65 75 H90 L98 65 V 35 L90 20 H65 Z" fill="url(#body-gradient)" stroke="#e5e7eb" strokeWidth="0.5" />
          <path d="M42 45 H 58 V 55 H 42 Z" fill="#6b7280" />
          <circle cx="50" cy="15" r="3" fill="#6b7280" />
          
          {/* Lenses with reflection */}
          <g>
            <circle cx="23.5" cy="48" r="16" fill="#1f2937"/>
            <motion.circle cx={glareX} cy={glareY} r="8" fill="url(#lens-glare)" />
          </g>
           <g>
            <circle cx="76.5" cy="48" r="16" fill="#1f2937"/>
            <motion.circle cx={glareX} cy={glareY} r="8" fill="url(#lens-glare)" />
          </g>
        </svg>
      </motion.div>
    </div>
  );
};

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
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
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
      let errorMessage = "An unexpected error occurred. Please try again.";
      switch (authError.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = "Invalid email or password. Please try again.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Access temporarily disabled due to too many failed login attempts.";
          break;
      }
      setErrors({ general: errorMessage });
      setLoadingState('idle');
    }
  };

  if (loadingState === 'initializing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0D1121]">
        <Loader2 className="h-10 w-10 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0D1121] text-slate-800 dark:text-slate-200 font-sans p-4 relative overflow-hidden">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap'); .font-sora { font-family: 'Sora', sans-serif; }`}</style>
      <div className="absolute inset-0 -z-10 bg-white dark:bg-[#0D1121]"></div>
      <div className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-[150%] h-[150%] opacity-20 dark:opacity-30 bg-[radial-gradient(circle_at_center,_#06b6d420,_#3b82f640,_#8b5cf660,_transparent_70%)]" aria-hidden="true"></div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md relative z-10">
        <Card className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-slate-200/80 dark:border-slate-700/80 rounded-2xl shadow-lg">
          <CardHeader className="text-center p-8">
            <InteractiveBinocularIcon />
            <CardTitle className="text-3xl font-bold font-sora text-slate-900 dark:text-white">Welcome Back</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Sign in to continue to Clarity OCR</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence>
                {errors.general && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-sm p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg flex items-start gap-2 border border-red-500/20">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" /> <p>{errors.general}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`pl-10 h-11 bg-white/50 dark:bg-slate-900/50 ${errors.email ? 'border-red-500' : ''}`} disabled={loadingState !== 'idle'}/>
                </div>
                {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`pl-10 pr-10 h-11 bg-white/50 dark:bg-slate-900/50 ${errors.password ? 'border-red-500' : ''}`} disabled={loadingState !== 'idle'}/>
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="remember-me" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="peer h-4 w-4 shrink-0 rounded-sm border border-slate-300 dark:border-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50 checked:bg-sky-600 checked:border-sky-600"/>
                  <Label htmlFor="remember-me" className="text-sm font-normal text-slate-600 dark:text-slate-400">Remember me</Label>
                </div>
                <Link to="/forgot-password" className="text-sm font-semibold text-sky-600 dark:text-sky-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Button type="submit" size="lg" className="w-full text-base h-12 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold shadow-lg shadow-sky-500/20 hover:scale-105 transition-transform disabled:opacity-70" disabled={loadingState !== 'idle'}>
                {loadingState === 'email-password' ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign In'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="p-8 justify-center bg-black/5 dark:bg-black/10 border-t border-slate-200/50 dark:border-slate-700/50">
            <p className="text-sm text-slate-600 dark:text-slate-400">Don't have an account? <Link to="/register" className="font-semibold text-sky-600 dark:text-sky-400 hover:underline">Sign up</Link></p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}