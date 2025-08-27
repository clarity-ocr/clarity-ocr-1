import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { z } from 'zod';
// ✅ 1. Ensure you import the necessary Firebase function
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/firebase';

const emailSchema = z.string().email({ message: 'Please enter a valid email address' });

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false); // ✅ 2. Add state to show a success message
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
      // ✅ 3. This is the critical line that sends the email. It's now correctly included.
      await sendPasswordResetEmail(auth, email);
      
      // On success, show the success state
      setIsSubmitted(true);
      
    } catch (error: any) {
      console.error("Password reset error:", error);
      // Provide a user-friendly error regardless of the specific Firebase code
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

  // If the email was sent, show a success screen instead of the form
  if (isSubmitted) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
                <Card className="shadow-xl bg-white rounded-2xl">
                    <CardHeader className="text-center">
                        <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
                        <CardTitle className="text-2xl font-bold mt-4">Check Your Inbox</CardTitle>
                        <CardDescription className="mt-2">
                            A password reset link has been sent to <br/>
                            <span className="font-semibold text-slate-800">{email}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-center text-sm text-slate-600">
                            Click the link in the email to set a new password.
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button asChild variant="link" className="w-full">
                            <Link to="/login">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Login
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
  }

  // The default view with the form
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="shadow-xl bg-white rounded-2xl">
          <CardHeader>
            <div className="flex items-center gap-4 mb-2">
                <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="flex-shrink-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-grow">
                    <CardTitle className="text-2xl font-bold text-slate-800">Forgot Password</CardTitle>
                    <CardDescription>Enter your email to receive a reset link.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    autoComplete="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className={`pl-10 text-base ${error ? 'border-red-500' : ''}`} 
                    disabled={loading}
                  />
                </div>
                {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full text-base font-semibold" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send Reset Link'}
              </Button>
              <Button asChild variant="link" className="text-sm">
                <Link to="/login">Back to Login</Link>
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}