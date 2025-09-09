import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile, signOut } from 'firebase/auth';
import { auth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, User, Mail } from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setDisplayName(user?.displayName || '');
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "Please log in again.", variant: "destructive"});
      return;
    }
    
    if (currentUser.displayName === displayName && user?.displayName === displayName) {
        toast({ title: "No changes to save." });
        return;
    }
    
    setIsUpdating(true);
    try {
      await updateProfile(currentUser, { displayName });
      await refreshUser();
      toast({ title: "Success", description: "Your profile has been updated." });
    } catch (error: any) {
      toast({ title: "Error updating profile", description: error.message, variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      toast({ title: "Logged Out" });
      navigate('/login');
    } catch (error: any) {
      toast({ title: "Logout Failed", description: error.message, variant: "destructive" });
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D1121] text-slate-800 dark:text-slate-200 font-sans flex items-center justify-center p-4 relative overflow-hidden">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap'); .font-sora { font-family: 'Sora', sans-serif; }`}</style>
      <div className="absolute inset-0 -z-10 bg-white dark:bg-[#0D1121]"></div>
      <div className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-[150%] h-[150%] opacity-20 dark:opacity-30 bg-[radial-gradient(circle_at_center,_#06b6d420,_#3b82f640,_#8b5cf660,_transparent_70%)]" aria-hidden="true"></div>

      <div className="w-full max-w-md relative z-10">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="absolute -top-14 left-0 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-300 dark:border-slate-700 hover:bg-white/80 dark:hover:bg-slate-800/80">
            <ArrowLeft className="w-4 h-4" />
        </Button>
        <Card className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-slate-200/80 dark:border-slate-700/80 rounded-2xl shadow-lg">
          <CardHeader className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-sky-100 to-indigo-200 dark:from-sky-900/50 dark:to-indigo-900/50 rounded-full mx-auto mb-4 flex items-center justify-center ring-4 ring-white/20 dark:ring-slate-700/30">
              <User className="w-12 h-12 text-sky-600 dark:text-sky-400" />
            </div>
            <CardTitle className="text-3xl font-bold font-sora text-slate-900 dark:text-white">My Profile</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Manage your account settings.</CardDescription>
          </CardHeader>
          <form onSubmit={handleUpdateProfile}>
            <CardContent className="space-y-6 pt-2">
              <div className="space-y-2">
                <Label htmlFor="displayName">Name</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                    className="pl-10 h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                 <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    readOnly
                    className="pl-10 h-11 disabled:opacity-80"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-4">
              <Button variant="destructive" onClick={handleLogout} disabled={isLoggingOut} className="w-full sm:w-auto">
                {isLoggingOut && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log Out
              </Button>
              <Button type="submit" disabled={isUpdating} className="w-full sm:w-auto bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold shadow-lg shadow-sky-500/20 hover:scale-105 transition-transform">
                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}