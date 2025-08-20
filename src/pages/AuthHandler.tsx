import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRedirectResult } from 'firebase/auth';
import { auth } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const AuthHandler: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const processRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // User is signed in.
          // The onAuthStateChanged listener in AuthContext will now pick up the user.
          // We can navigate them to the home page.
          toast({
            title: "Sign-In Successful",
            description: `Welcome, ${result.user.displayName || 'User'}!`,
          });
          navigate('/', { replace: true });
        } else {
          // This can happen if the page is refreshed or visited directly.
          // Send them to the login page to be safe.
          navigate('/login', { replace: true });
        }
      } catch (error: any) {
        console.error("Auth Handler Error:", error);
        toast({
          title: "Authentication Failed",
          description: "There was a problem signing you in. Please try again.",
          variant: "destructive",
        });
        navigate('/login', { replace: true });
      }
    };

    processRedirect();
  }, [navigate, toast]);

  // Display a loader while processing
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      <p className="text-slate-600">Finalizing sign-in...</p>
    </div>
  );
};

export default AuthHandler;