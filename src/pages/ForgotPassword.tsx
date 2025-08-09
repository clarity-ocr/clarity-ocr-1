// src/pages/ForgotPassword.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth'; // We'll still use this to trigger the email
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
import { Mail, Loader2, ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { z } from 'zod';

// Validation schema for email
const emailSchema = z.string().email({ message: "Please enter a valid email address" });

export default function ForgotPassword() {
  const [email, setEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userExists, setUserExists] = useState<boolean | null>(null); // null = unknown, true = exists, false = new
  const navigate = useNavigate();

  const validateEmail = (): boolean => {
    try {
      emailSchema.parse(email);
      setError(null);
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setUserExists(null); // Reset user status check

    try {
      console.log(`[ForgotPassword] Attempting to send OTP to: ${email}`);
      // This triggers Firebase to send the standard password reset email.
      // We will intercept this in the ResetPassword page.
      await sendPasswordResetEmail(auth, email);
      
      // If sendPasswordResetEmail succeeds, the email exists in Firebase
      console.log(`[ForgotPassword] OTP email sent successfully to: ${email}`);
      setUserExists(true);
      setIsSubmitted(true);
      toast({
        title: "OTP Email Sent",
        description: "Check your inbox for the verification code.",
      });
    } catch (err: any) {
      console.error("[ForgotPassword] Error during OTP request:", err);
      
      // Handle specific Firebase errors
      if (err.code === 'auth/user-not-found') {
        // This is the key: Firebase tells us the user doesn't exist
        console.log(`[ForgotPassword] User not found for email: ${email}. This is a new user.`);
        setUserExists(false);
        // Don't show a toast error here, we'll show the message on the UI
      } else if (err.code === 'auth/invalid-email') {
        setError("The email address is badly formatted.");
        toast({
          title: "Request Failed",
          description: "The email address is badly formatted.",
          variant: "destructive",
        });
      } else {
        // For other errors (network, etc.), show a generic message
        console.error("[ForgotPassword] Unexpected error sending OTP email:", err);
        setError("Failed to process request. Please try again.");
        toast({
          title: "Request Failed",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset the form to try a different email
  const handleTryAnotherEmail = () => {
    setIsSubmitted(false);
    setError(null);
    setUserExists(null);
    setEmail(''); // Optionally clear the email field
  };

  // If the email was sent successfully
  if (isSubmitted && userExists === true) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-blue-50 to-indigo-100 py-6 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden">
            <CardHeader className="space-y-2 pt-8 text-center">
              <div className="mx-auto bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">
                Check Your Email
              </CardTitle>
              <CardDescription className="text-gray-600">
                We've sent a verification code to <span className="font-semibold break-words">{email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                Please check your email for the code.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button
                onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Enter Verification Code
              </Button>
              <Button
                onClick={handleTryAnotherEmail}
                variant="outline"
                className="w-full"
              >
                Use a Different Email
              </Button>
              <Button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
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

  // If the email does not exist (user is new)
  if (userExists === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-blue-50 to-indigo-100 py-6 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden">
            <CardHeader className="space-y-2 pt-8 text-center">
              <div className="mx-auto bg-orange-100 p-3 rounded-full">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">
                New User Detected
              </CardTitle>
              <CardDescription className="text-gray-600">
                The email <span className="font-semibold break-words">{email}</span> is not associated with an existing account.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                You need to register for an account first.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button
                onClick={handleTryAnotherEmail}
                variant="outline"
                className="w-full"
              >
                Try a Different Email
              </Button>
              <Button
                onClick={() => navigate('/register')}
                className="w-full bg-gradient-to-r from-green-600 to-teal-700 hover:from-green-700 hover:to-teal-800 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Register Now
              </Button>
              <Link
                to="/login"
                className="text-blue-600 hover:underline font-medium flex items-center justify-center text-sm w-full"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Login
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Default form view
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
            <CardTitle className="text-2xl font-bold text-center text-gray-800">
              Reset Your Password
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Enter your email address and we'll send you a verification code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 flex items-center font-medium">
                  <Mail className="h-5 w-5 mr-2 flex-shrink-0" />
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    className={`pl-12 py-3 text-base rounded-xl border-2 transition-all duration-300 ${
                      error ? "border-red-500 focus:ring-0" : "border-gray-300 hover:border-gray-400"
                    }`}
                    autoComplete="email"
                    required
                    disabled={isSubmitting}
                    aria-describedby={error ? "email-error" : undefined}
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                </div>
                {error && (
                  <p id="email-error" className="text-sm text-red-500 flex items-start">
                    <AlertTriangle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                    {error}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  "Send Verification Code"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link
              to="/login"
              className="text-blue-600 hover:underline font-medium flex items-center"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Login
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}