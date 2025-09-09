import React, { useState, useEffect, useRef} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { z } from 'zod';
import { 
  createUserWithEmailAndPassword, 
  updateProfile, 
  sendEmailVerification,
  AuthError, 
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '@/firebase';

// --- [NEW] Interactive 3D Register Icon Component ---
const InteractiveRegisterIcon = () => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 200 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const rotateY = useTransform(springX, [-0.5, 0.5], ['-25deg', '25deg']);
  const rotateX = useTransform(springY, [-0.5, 0.5], ['25deg', '-25deg']);
  
  const shadowX = useTransform(springX, [-0.5, 0.5], ['-15px', '15px']);
  const shadowY = useTransform(springY, [-0.5, 0.5], ['-15px', '15px']);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const xPct = (e.clientX - rect.left) / rect.width - 0.5;
      const yPct = (e.clientY - rect.top) / rect.height - 0.5;
      x.set(xPct);
      y.set(yPct);
    };

    const handleMouseLeave = () => { x.set(0); y.set(0); };

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
        className="relative w-28 h-28"
      >
        <motion.div 
          className="absolute inset-0 bg-sky-500/20 dark:bg-purple-500/20 rounded-full blur-3xl"
          style={{ x: shadowX, y: shadowY }}
        />
        <svg 
          viewBox="0 0 100 100" 
          className="absolute inset-0 w-full h-full drop-shadow-xl"
          style={{ transform: 'translateZ(25px)' }}
        >
            <defs>
                <linearGradient id="register-icon-gradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
            </defs>
            {/* Document Shape */}
            <path d="M30 15 L70 15 C75 15, 80 20, 80 25 L80 85 C80 90, 75 95, 70 95 L30 95 C25 95, 20 90, 20 85 L20 25 C20 20, 25 15, 30 15 Z" fill="rgba(255, 255, 255, 0.1)" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1" style={{transform: 'translateZ(-10px) rotate(15deg) translateX(10px)'}} />
            {/* User Profile Shape */}
            <g style={{ transform: 'translateZ(20px)' }}>
                <circle cx="50" cy="35" r="20" fill="url(#register-icon-gradient)" />
                <path d="M20 90 C20 70, 80 70, 80 90 Z" fill="url(#register-icon-gradient)" />
            </g>
        </svg>
      </motion.div>
    </div>
  );
};

const HOME_PATH = '/';

const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type FormErrors = { name?: string; email?: string; password?: string; general?: string };
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
      if (user && user.emailVerified) {
        navigate(HOME_PATH);
      } else {
        setLoadingState('idle');
      }
    });
    return () => unsubscribe();
  }, [navigate]);
  
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
      await sendEmailVerification(userCredential.user);
      
      toast({
        title: 'Account Created!',
        description: "We've sent a verification link to your email address.",
      });

      navigate('/verify-email');
      
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
  
  if (loadingState === 'initializing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D1121]">
        <Loader2 className="h-10 w-10 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0D1121] text-slate-800 dark:text-slate-200 font-sans p-4 relative overflow-hidden">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap'); .font-sora { font-family: 'Sora', sans-serif; }`}</style>
      <div className="absolute inset-0 -z-10 bg-white dark:bg-[#0D1121]"></div>
      <div className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-[150%] h-[150%] opacity-20 dark:opacity-30 bg-[radial-gradient(circle_at_center,_#06b6d420,_#3b82f640,_#8b5cf660,_transparent_70%)]" aria-hidden="true"></div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md relative z-20">
        <Card className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-slate-200/80 dark:border-slate-700/80 rounded-2xl shadow-lg">
          <CardHeader className="text-center p-8">
             <InteractiveRegisterIcon />
            <CardTitle className="text-3xl font-bold font-sora text-slate-900 dark:text-white">Create an Account</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Get started with Clarity OCR today</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence>
                {errors.general && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg flex items-start gap-2 border border-red-500/20">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" /> <p>{errors.general}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">Full Name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={`pl-10 h-11 bg-white/50 dark:bg-slate-900/50 ${errors.name ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'}`} disabled={loadingState !== 'idle'}/>
                </div>
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`pl-10 h-11 bg-white/50 dark:bg-slate-900/50 ${errors.email ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'}`} disabled={loadingState !== 'idle'}/>
                </div>
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input id="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`pl-10 pr-10 h-11 bg-white/50 dark:bg-slate-900/50 ${errors.password ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'}`} disabled={loadingState !== 'idle'}/>
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-5 w-5 text-slate-500" /> : <Eye className="h-5 w-5 text-slate-500" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
              </div>
              <Button type="submit" size="lg" className="w-full text-base h-12 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold shadow-lg shadow-sky-500/20 hover:scale-105 transition-transform" disabled={loadingState !== 'idle'}>
                {loadingState === 'email-password' ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Account'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="p-8 justify-center bg-black/5 dark:bg-black/10 border-t border-slate-200/50 dark:border-slate-700/50">
            <p className="text-sm text-slate-600 dark:text-slate-400">Already have an account? <Link to="/login" className="font-semibold text-sky-600 dark:text-sky-400 hover:underline">Sign in</Link></p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}