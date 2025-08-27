import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { auth } from '@/firebase';
// ✅ 1. Import the new password reset functions
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { Card, CardContent,  CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, CheckCircle, KeyRound } from 'lucide-react';
import { z } from 'zod';

type ActionState = 'loading' | 'success' | 'error' | 'readyToReset'; // ✅ 2. Add a new state
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters.');

export default function ActionHandlerPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [state, setState] = useState<ActionState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [newPassword, setNewPassword] = useState(''); // ✅ 3. Add state for the new password form
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const handleAction = async () => {
      const mode = searchParams.get('mode');
      const oobCode = searchParams.get('oobCode');

      if (!mode || !oobCode) {
        setErrorMessage('Invalid action link. Please try again.');
        setState('error');
        return;
      }

      try {
        switch (mode) {
          case 'verifyEmail':
            await applyActionCode(auth, oobCode);
            setState('success');
            setTimeout(() => navigate('/login'), 4000);
            break;
          
          // ✅ 4. Add the new case for password resets
          case 'resetPassword':
            // First, just verify the code is valid before showing the form.
            await verifyPasswordResetCode(auth, oobCode);
            setState('readyToReset'); // If it's valid, we show the form.
            break;

          default:
            throw new Error('Unsupported action.');
        }
      } catch (error: any) {
        setErrorMessage(error.code === 'auth/invalid-action-code' 
          ? 'This link has expired or has already been used.'
          : 'An unexpected error occurred. Please try again.');
        setState('error');
      }
    };

    handleAction();
  }, [searchParams, navigate]);

  // ✅ 5. Add a submit handler for the new password form
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
    if (!oobCode) return; // Should not happen if we are in this state

    setIsResetting(true);
    try {
        await confirmPasswordReset(auth, oobCode, newPassword);
        setState('success'); // Reuse the success screen
        setTimeout(() => navigate('/login'), 4000);
    } catch (error: any) {
        setErrorMessage('Failed to reset password. The link may have expired.');
        setState('error');
    } finally {
        setIsResetting(false);
    }
  };


  const renderContent = () => {
    switch (state) {
      case 'loading':
        return (
            <CardContent>
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-indigo-500" />
              <p className="mt-4 text-slate-600">Please wait while we verify your action.</p>
            </CardContent>
        );
      case 'success':
        return (
            <CardContent>
              <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
              <p className="mt-4 text-slate-700">Success! Your action has been completed.</p>
              <p className="text-sm text-slate-500">You will be redirected shortly.</p>
            </CardContent>
        );
      case 'error':
        return (
            <CardContent>
              <AlertCircle className="h-16 w-16 mx-auto text-red-500" />
              <p className="mt-4 text-red-700">{errorMessage}</p>
              <Button asChild variant="link" className="mt-4"><Link to="/login">Return to Login</Link></Button>
            </CardContent>
        );
      case 'readyToReset': // ✅ 6. Render the new password form
        return (
            <form onSubmit={handlePasswordResetSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                    </div>
                    {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isResetting}>
                        {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Reset Password
                    </Button>
                </CardFooter>
            </form>
        );
    }
  };

  const getTitle = () => {
    switch (state) {
        case 'loading': return 'Verifying...';
        case 'success': return 'Action Successful!';
        case 'error': return 'An Error Occurred';
        case 'readyToReset': return 'Choose a New Password';
        default: return 'Clarity OCR';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
            <KeyRound className="h-12 w-12 mx-auto text-indigo-500" />
            <CardTitle className="mt-4">{getTitle()}</CardTitle>
        </CardHeader>
        {renderContent()}
      </Card>
    </div>
  );
}