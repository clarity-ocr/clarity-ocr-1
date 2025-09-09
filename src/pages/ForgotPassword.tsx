import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Loader2, ArrowLeft, CheckCircle, KeyRound } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { z } from 'zod';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/firebase';

const emailSchema = z.string().email({ message: 'Please enter a valid email address' });

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setIsSubmitted(true);
    } catch (error: any) {
      console.error("Password reset error:", error);
      setError('Could not send reset email. Please ensure the email address is correct and registered.');
      toast({
        title: 'Error Sending Email',
        description: 'Please check the email address and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const cardVariants: Variants = {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1, 
      transition: { duration: 0.4, ease: 'easeOut' } 
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0D1121] text-slate-800 dark:text-slate-200 font-sans p-4 relative overflow-hidden">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap'); .font-sora { font-family: 'Sora', sans-serif; }`}</style>
      <div className="absolute inset-0 -z-10 bg-white dark:bg-[#0D1121]"></div>
      <div className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-[150%] h-[150%] opacity-20 dark:opacity-30 bg-[radial-gradient(circle_at_center,_#06b6d420,_#3b82f640,_#8b5cf660,_transparent_70%)]" aria-hidden="true"></div>
      
      <div className="w-full max-w-md relative z-10">
        {!isSubmitted ? (
          <motion.div variants={cardVariants} initial="initial" animate="animate">
            <Card className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-slate-200/80 dark:border-slate-700/80 rounded-2xl shadow-lg">
              <CardHeader className="text-center">
                 <div className="w-20 h-20 bg-gradient-to-br from-sky-100 to-indigo-200 dark:from-sky-900/50 dark:to-indigo-900/50 rounded-full mx-auto mb-4 flex items-center justify-center ring-4 ring-white/20 dark:ring-slate-700/30">
                  <KeyRound className="w-10 h-10 text-sky-600 dark:text-sky-400" />
                </div>
                <CardTitle className="text-3xl font-bold font-sora text-slate-900 dark:text-white">Forgot Password</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">No problem! Enter your email to get a reset link.</CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input 
                        id="email" 
                        type="email" 
                        autoComplete="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        className={`pl-10 h-11 bg-white/50 dark:bg-slate-900/50 ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'}`} 
                        disabled={loading}
                      />
                    </div>
                    {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 p-6 pt-2">
                  <Button type="submit" size="lg" className="w-full text-base h-12 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold shadow-lg shadow-sky-500/20 hover:scale-105 transition-transform" disabled={loading}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send Reset Link'}
                  </Button>
                  {/* [FIXED] Removed the `asChild` prop which was causing a runtime crash */}
                  <Button variant="ghost" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white" onClick={() => navigate(-1)}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Login
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </motion.div>
        ) : (
          <motion.div variants={cardVariants} initial="initial" animate="animate">
            <Card className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-slate-200/80 dark:border-slate-700/80 rounded-2xl shadow-lg">
                <CardHeader className="text-center p-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/50 dark:to-emerald-900/50 rounded-full mx-auto mb-4 flex items-center justify-center ring-4 ring-white/20 dark:ring-slate-700/30">
                        <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-3xl font-bold mt-4 font-sora text-slate-900 dark:text-white">Check Your Inbox</CardTitle>
                    <CardDescription className="mt-2 text-slate-600 dark:text-slate-400">
                        A password reset link has been sent to <br/>
                        <span className="font-semibold text-slate-800 dark:text-white">{email}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                        Click the link in the email to set a new password. If you don't see it, check your spam folder.
                    </p>
                </CardContent>
                <CardFooter className="p-6">
                    <Button asChild className="w-full h-11 text-base bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">
                        <Link to="/login">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Login
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}