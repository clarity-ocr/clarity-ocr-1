import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/firebase';

// Extended User Interface
export interface AuthUser extends User {
  stripeRole?: 'free' | 'pro' | 'business';
  admin?: boolean;
  onboardingCompleted?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper: Syncs Firebase User with Firestore Profile
  const syncUserWithFirestore = useCallback(async (firebaseUser: User) => {
    try {
      // 1. Get Auth Token Claims
      const tokenResult = await firebaseUser.getIdTokenResult(true);
      const stripeRole = (tokenResult.claims.stripeRole as 'free' | 'pro' | 'business') || 'free';
      const admin = (tokenResult.claims.admin as boolean) || false;

      // 2. Get User Profile from Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      let onboardingCompleted = false;

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        onboardingCompleted = userData.onboardingCompleted || false;
      } else {
        // Create profile if it doesn't exist
        await setDoc(userDocRef, {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          createdAt: serverTimestamp(),
          role: 'user',
          onboardingCompleted: false,
        });
      }

      const userWithDetails: AuthUser = {
        ...firebaseUser,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        uid: firebaseUser.uid,
        photoURL: firebaseUser.photoURL,
        stripeRole,
        admin,
        onboardingCompleted,
      };
      
      setUser(userWithDetails);
    } catch (error) {
      console.error("Error fetching user details:", error);
      setUser(firebaseUser as AuthUser);
    }
  }, []);

  // 1. Listen for Redirect Results (Fallback flow)
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          await syncUserWithFirestore(result.user);
        }
      } catch (error) {
        console.error("Redirect Auth Error:", error);
      }
    };
    checkRedirect();
  }, [syncUserWithFirestore]);

  // 2. Listen for Auth State Changes (Main flow)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await syncUserWithFirestore(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [syncUserWithFirestore]);

  const refreshUser = useCallback(async () => {
    if (auth.currentUser) {
        await syncUserWithFirestore(auth.currentUser);
    }
  }, [syncUserWithFirestore]);

  // ROBUST GOOGLE LOGIN STRATEGY
  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Popup failed, trying redirect...", error);
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, googleProvider);
      } else {
        throw error;
      }
    }
  };

  const completeOnboarding = async () => {
    if (!auth.currentUser) return;
    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userDocRef, { onboardingCompleted: true }, { merge: true });
      await refreshUser(); 
    } catch (error) {
      console.error("Error completing onboarding:", error);
      throw error;
    }
  };

  const value = useMemo(() => ({ 
    user, 
    loading, 
    refreshUser, 
    loginWithGoogle,
    completeOnboarding 
  }), [user, loading, refreshUser]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}