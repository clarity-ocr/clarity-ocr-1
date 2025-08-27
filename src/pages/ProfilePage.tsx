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
import { Loader2, ArrowLeft } from 'lucide-react';

export default function ProfilePage() {
  // ✅ FIX: Get the refreshUser function from the context
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ✅ ADDED: Effect to sync local state if the user object in context changes
  useEffect(() => {
    setDisplayName(user?.displayName || '');
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    // ✅ FIX: Use auth.currentUser, which is the "live" Firebase user object
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "Please log in again.", variant: "destructive"});
      return;
    }
    
    // Prevent API call if there's no change
    if (currentUser.displayName === displayName) {
        toast({ title: "No changes to save." });
        return;
    }
    
    setIsUpdating(true);
    try {
      // ✅ FIX: Pass the correct user object to the updateProfile function
      await updateProfile(currentUser, { displayName });
      
      // ✅ FIX: Refresh the user state in our context to update the UI everywhere
      await refreshUser();
      
      toast({ title: "Success", description: "Your profile has been updated." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="flex-shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-grow">
              <CardTitle>My Profile</CardTitle>
              <CardDescription>Manage your account settings.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleUpdateProfile}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                readOnly
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="submit" disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
            <Button variant="destructive" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log Out
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}