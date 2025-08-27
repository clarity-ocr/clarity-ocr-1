import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { auth } from '@/firebase';
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, CheckCircle, KeyRound } from 'lucide-react';
import { z } from 'zod';

type ActionState = 'loading' | 'success' | 'error' | 'readyToReset';
type ActionType = 'verifyEmail' | 'resetPassword' | null;

const passwordSchema = z.string().min(6, 'Password must be at least 6 characters.');

export default function ActionHandlerPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [state, setState] = useState<ActionState>('loading');
  const [mode, setMode] = useState<ActionType>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const handleAction = async () => {
      const actionType = searchParams.get('mode') as ActionType;
      const oobCode = searchParams.get('oobCode');
      setMode(actionType);

      if (!actionType || !oobCode) {
        setErrorMessage('Invalid action link. It may be incomplete.');
        setState('error');
        return;
      }

      try {
        switch (actionType) {
          case 'verifyEmail':
            await applyActionCode(auth, oobCode);
            setState('success');
            setTimeout(() => navigate('/login'), 5000); // Give user time to read
            break;
          
          case 'resetPassword':
            await verifyPasswordResetCode(auth, oobCode);
            setState('readyToReset');
            break;

          default:
            throw new Error('Unsupported action.');
        }
      } catch (error: any) {
        setErrorMessage(error.code === 'auth/invalid-action-code' 
          ? 'This link has expired or has already been used. Please request a new one.'
          : 'An unexpected error occurred. Please try again.');
        setState('error');
      }
    };

    handleAction();
  }, [searchParams, navigate]);

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    const validation = passwordSchema.safeParse(newPassword);
    if (!validation.success) {
      setPasswordError(validation.error.issues[0].message);
      return;
    }
    
    const oobCode = searchParams.get('oobCode');
    if (!oobCode) return;

    setIsResetting(true);
    try {
        await confirmPasswordReset(auth, oobCode, newPassword);
        setState('success');
        setTimeout(() => navigate('/login'), 5000); // Give user time to read
    } catch (error: any) {
        setErrorMessage('Failed to reset password. The link may have expired.');
        setState('error');
    } finally {
        setIsResetting(false);
    }
  };

  const getTitle = () => {
    if (state === 'error') return 'An Error Occurred';
    if (state === 'success') {
      return mode === 'verifyEmail' ? 'Email Verified!' : 'Password Reset!';
    }
    if (state === 'readyToReset') return 'Choose a New Password';
    return 'Verifying...';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          {state === 'success' && <CheckCircle className="h-16 w-16 mx-auto text-green-500" />}
          {state === 'error' && <AlertCircle className="h-16 w-16 mx-auto text-red-500" />}
          {state === 'readyToReset' && <KeyRound className="h-12 w-12 mx-auto text-indigo-500" />}
          <CardTitle className="mt-4 text-2xl font-bold">{getTitle()}</CardTitle>
        </CardHeader>

        {state === 'loading' && (
            <CardContent>
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-indigo-500" />
              <p className="mt-4 text-slate-600">Please wait while we process your request.</p>
            </CardContent>
        )}

        {state === 'success' && (
            <CardContent>
              <CardDescription>
                {mode === 'verifyEmail' 
                  ? "Your account has been successfully activated." 
                  : "Your password has been changed successfully."}
              </CardDescription>
              <p className="mt-4 text-sm text-slate-500">You will be redirected to the login page shortly.</p>
              <Button onClick={() => navigate('/login')} className="mt-4">Login Now</Button>
            </CardContent>
        )}

        {state === 'error' && (
            <CardContent>
              <p className="text-red-700">{errorMessage}</p>
              <Button asChild variant="link" className="mt-4"><Link to="/login">Return to Login</Link></Button>
            </CardContent>
        )}

        {state === 'readyToReset' && (
            <form onSubmit={handlePasswordResetSubmit}>
                <CardContent className="space-y-4 text-left">
                    <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required autoComplete="new-password" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
                    </div>
                    {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isResetting}>
                        {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save New Password
                    </Button>
                </CardFooter>
            </form>
        )}
      </Card>
    </div>
  );
}