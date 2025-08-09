// src/pages/ResetPassword.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '@/firebase';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Lock, Loader2, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { z } from 'zod';

// Validation schema for new password
const passwordSchema = z.string().min(6, { message: "Password must be at least 6 characters" });

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // State for form data and UI
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  
  // State for process flow
  const [isVerifying, setIsVerifying] = useState<boolean>(true); // Initial check of the oobCode
  const [isValidCode, setIsValidCode] = useState<boolean | null>(null); // null = checking, true = valid, false = invalid/expired
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  
  // State for errors
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string; general?: string }>({});
  const [userEmail, setUserEmail] = useState<string | null>(null); // Store email associated with the code

  // Get parameters from the URL
  const oobCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode');

  // 1. On component mount, verify the oobCode
  useEffect(() => {
    const verifyCode = async () => {
      // Basic URL parameter checks
      if (!oobCode) {
        console.warn("[ResetPassword] No oobCode found in URL parameters.");
        setIsValidCode(false);
        setIsVerifying(false);
        setFieldErrors(prev => ({ ...prev, general: "Invalid password reset link: Missing code." }));
        toast({
          title: "Invalid Link",
          description: "The password reset link is invalid or missing required information.",
          variant: "destructive",
        });
        return;
      }

      if (mode !== 'resetPassword') {
        console.warn("[ResetPassword] Invalid mode in URL parameters:", mode);
        setIsValidCode(false);
        setIsVerifying(false);
        setFieldErrors(prev => ({ ...prev, general: "Invalid password reset link: Incorrect mode." }));
        toast({
          title: "Invalid Link",
          description: "The link you used is not for resetting a password.",
          variant: "destructive",
        });
        return;
      }

      try {
        console.log("[ResetPassword] Verifying password reset code...");
        // This Firebase function checks if the oobCode is valid and not expired.
        // It also returns the email associated with the code.
        const email = await verifyPasswordResetCode(auth, oobCode);
        console.log("[ResetPassword] Password reset code is valid for email:", email);
        setUserEmail(email);
        setIsValidCode(true);
      } catch (err: any) {
        console.error("[ResetPassword] Invalid or expired password reset code:", err);
        setIsValidCode(false);
        
        let errorMessage = "This password reset link is invalid or has expired.";
        if (err.code === 'auth/invalid-action-code') {
            errorMessage = "This password reset link is invalid or has expired.";
        } else if (err.code === 'auth/expired-action-code') {
            errorMessage = "This password reset link has expired. Please request a new one.";
        } else {
            console.warn("[ResetPassword] Unexpected error verifying code:", err.code, err.message);
        }
        
        setFieldErrors(prev => ({ ...prev, general: errorMessage }));
        toast({
          title: "Invalid Link",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyCode();
  }, [oobCode, mode]); // Re-run if oobCode or mode changes (unlikely)

  // 2. Validate form inputs
  const validateForm = (): boolean => {
    setFieldErrors({}); // Clear previous errors
    let isValid = true;

    // Validate new password strength
    const passwordResult = passwordSchema.safeParse(newPassword);
    if (!passwordResult.success) {
      setFieldErrors(prev => ({ ...prev, password: passwordResult.error.errors[0].message }));
      isValid = false;
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
        setFieldErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match." }));
        isValid = false;
    }

    return isValid;
  };

  // 3. Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Double-check state before proceeding
    if (!oobCode || isValidCode !== true) {
        setFieldErrors(prev => ({ ...prev, general: "Cannot reset password. The link is invalid or expired." }));
        return;
    }

    if (!validateForm()) {
        return; // Stop if validation fails
    }

    setIsSubmitting(true);
    setFieldErrors({}); // Clear errors on new attempt

    try {
      console.log("[ResetPassword] Attempting to confirm password reset...");
      // This is the core Firebase function that actually changes the password.
      await confirmPasswordReset(auth, oobCode, newPassword);
      
      console.log("[ResetPassword] Password reset successful.");
      setIsSuccess(true); // Update state to show success message
      
      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated successfully.",
      });
      
      // Optional: Automatically redirect to login after a few seconds
      // setTimeout(() => navigate('/login'), 3000);
      
    } catch (err: any) {
      console.error("[ResetPassword] Error confirming password reset:", err);
      let errorMessage = "Failed to reset password. Please try again.";

      // Handle specific Firebase errors during the reset confirmation
      switch (err.code) {
        case 'auth/invalid-action-code':
          errorMessage = "This password reset link is no longer valid. It may have expired or already been used.";
          break;
        case 'auth/user-disabled':
          errorMessage = "This account has been disabled.";
          break;
        case 'auth/weak-password':
          errorMessage = "The new password is too weak.";
          setFieldErrors(prev => ({ ...prev, password: "The new password is too weak." }));
          break;
        case 'auth/expired-action-code':
          errorMessage = "This password reset link has expired.";
          break;
        default:
          console.warn("[ResetPassword] Unexpected error during password reset confirmation:", err.code, err.message);
          break;
      }

      // If it wasn't a field-specific error, show it as general
      if (!fieldErrors.password) {
        setFieldErrors(prev => ({ ...prev, general: errorMessage }));
      }
      
      toast({
        title: "Reset Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDERING LOGIC ---

  // 1. Initial verification loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-blue-50 to-indigo-100 py-6 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden">
            <CardHeader className="space-y-2 pt-8 text-center">
              <div className="mx-auto">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-800">
                Verifying Link...
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Please wait while we verify your password reset link.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // 2. Invalid or expired link state
  if (isValidCode === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-blue-50 to-indigo-100 py-6 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden">
            <CardHeader className="space-y-2 pt-8 text-center">
              <div className="mx-auto bg-red-100 p-3 rounded-full">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">
                Invalid Link
              </CardTitle>
              <CardDescription className="text-gray-600">
                {fieldErrors.general || "The password reset link is invalid or has expired."}
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col gap-3">
              <Button
                onClick={() => navigate('/forgot-password')}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Request New Link
              </Button>
              <Button
                onClick={() => navigate('/login')}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }

  // 3. Success state after password is changed
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-blue-50 to-indigo-100 py-6 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden">
            <CardHeader className="space-y-2 pt-8 text-center">
              <div className="mx-auto bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">
                Password Updated!
              </CardTitle>
              <CardDescription className="text-gray-600">
                Your password for <span className="font-semibold">{userEmail}</span> has been changed successfully.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                You can now sign in with your new password.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-green-600 to-teal-700 hover:from-green-700 hover:to-teal-800 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Sign In Now
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }

  // 4. Main form for entering new password (only shown if oobCode is valid)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-blue-50 to-indigo-100 py-6 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden">
          <CardHeader className="space-y-2 pt-8">
            <CardTitle className="text-2xl font-bold text-center text-gray-800 flex items-center justify-center">
              <Lock className="mr-2 h-6 w-6 text-blue-600" />
              Set New Password
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Create a new password for your account ({userEmail}).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* General Error Message */}
              {fieldErrors.general && (
                <div className="text-sm text-red-500 flex items-start bg-red-50 p-3 rounded-lg">
                  <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{fieldErrors.general}</span>
                </div>
              )}

              {/* New Password Input */}
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-gray-700 flex items-center font-medium">
                  <Lock className="h-5 w-5 mr-2 flex-shrink-0" />
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                    }}
                    className={`pl-12 pr-12 py-3 text-base rounded-xl border-2 transition-all duration-300 ${
                      fieldErrors.password ? "border-red-500 focus:ring-0" : "border-gray-300 hover:border-gray-400"
                    }`}
                    autoComplete="new-password"
                    required
                    disabled={isSubmitting}
                    aria-describedby={fieldErrors.password ? "password-error" : undefined}
                    placeholder="Enter new password"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p id="password-error" className="text-sm text-red-500 flex items-start">
                    <AlertTriangle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-gray-700 flex items-center font-medium">
                  <Lock className="h-5 w-5 mr-2 flex-shrink-0" />
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }));
                    }}
                    className={`pl-12 pr-12 py-3 text-base rounded-xl border-2 transition-all duration-300 ${
                      fieldErrors.confirmPassword ? "border-red-500 focus:ring-0" : "border-gray-300 hover:border-gray-400"
                    }`}
                    autoComplete="new-password"
                    required
                    disabled={isSubmitting}
                    aria-describedby={fieldErrors.confirmPassword ? "confirm-password-error" : undefined}
                    placeholder="Confirm new password"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    aria-pressed={showConfirmPassword}
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p id="confirm-password-error" className="text-sm text-red-500 flex items-start">
                    <AlertTriangle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-teal-700 hover:from-green-700 hover:to-teal-800 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-gray-500">
            <button
              onClick={() => navigate('/login')}
              className="text-blue-600 hover:underline font-medium flex items-center"
              disabled={isSubmitting}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Login
            </button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}