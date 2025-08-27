import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/firebase';
// ✅ FIXED: Removed unused 'User' import
import { sendEmailVerification, signOut } from 'firebase/auth';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MailCheck } from 'lucide-react';

// ✅ FIXED: We don't need the explicit 'React' import in modern React/Vite setups.

const HOME_PATH = '/';
const LOGIN_PATH = '/login';
const COOLDOWN_SECONDS = 60; // 60-second cooldown for resending email

export default function VerifyEmailPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // This is the core "magic" of the page.
  // It checks the user's verification status every 3 seconds.
  useEffect(() => {
    // Start a timer that runs repeatedly
    const interval = setInterval(async () => {
      // Get the most up-to-date user object from Firebase Auth
      const currentUser = auth.currentUser;
      if (currentUser) {
        // This is the critical command: it refreshes the user's status from Firebase's servers
        await currentUser.reload();
        
        // If the reloaded user object shows they are now verified...
        if (currentUser.emailVerified) {
          // Stop the timer and redirect them to the main app
          clearInterval(interval);
          toast({ title: "Success!", description: "Your email has been verified. Welcome!" });
          navigate(HOME_PATH);
        }
      }
    }, 3000); // Check every 3 seconds

    // This is a cleanup function. When the user navigates away, we stop the timer.
    return () => clearInterval(interval);
  }, [navigate, toast]);
  
  // This handles the cooldown timer for the "Resend" button
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResendEmail = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast({ title: "Error", description: "You are not logged in.", variant: "destructive" });
      return;
    }

    setIsResending(true);
    try {
      await sendEmailVerification(currentUser);
      toast({ title: "Email Sent", description: "A new verification link has been sent to your email." });
      setCooldown(COOLDOWN_SECONDS); // Start the cooldown
    } catch (error: any) {
      toast({
        title: "Error Sending Email",
        description: error.code === 'auth/too-many-requests' 
          ? "You have requested too many emails. Please wait a while before trying again."
          : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  }, [toast]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate(LOGIN_PATH);
  };

  // If auth is still loading, show a full-page spinner
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      </div>
    );
  }
  
  // If loading is done but there's no user, they shouldn't be here. Send to login.
  if (!user) {
    // Use a useEffect to navigate to avoid rendering during render cycle
    useEffect(() => {
        navigate(LOGIN_PATH);
    }, [navigate]);
    return null; // Render nothing while navigating
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <MailCheck className="h-16 w-16 mx-auto text-green-500" />
          <CardTitle className="text-2xl font-bold mt-4">Verify Your Email</CardTitle>
          <CardDescription className="mt-2">
            We've sent a verification link to <br />
            <span className="font-semibold text-slate-800">{user.email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-slate-600">
            Please check your inbox (and spam folder) and click the link to complete your registration. This page will automatically redirect you once you're verified.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 p-6">
          <Button 
            onClick={handleResendEmail} 
            disabled={isResending || cooldown > 0} 
            className="w-full"
          >
            {isResending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : cooldown > 0 ? (
              `Resend Email (${cooldown}s)`
            ) : (
              'Resend Verification Email'
            )}
          </Button>
          <Button variant="link" onClick={handleLogout} className="text-sm">
            Use a different account? Log Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}