import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/firebase';

export interface AuthUser extends User {
  stripeRole?: 'free' | 'pro' | 'business';
  admin?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  // ✅ ADDED: A function to manually refresh the user state
  refreshUser: () => Promise<void>;
  simulateUserUpgrade: (role: 'pro' | 'business') => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, refreshUser: async () => {}, simulateUserUpgrade: () => {} });

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ REFACTORED: Put the state update logic into a reusable function
  const updateUserState = useCallback(async (firebaseUser: User | null) => {
    if (firebaseUser) {
      // Force a refresh of the ID token to get the latest claims (like 'admin')
      const tokenResult = await firebaseUser.getIdTokenResult(true); 
      
      const stripeRole = (tokenResult.claims.stripeRole as 'free' | 'pro' | 'business') || 'free';
      const admin = (tokenResult.claims.admin as boolean) || false;
      
      // We create a new object to avoid direct mutation of the internal firebaseUser
      const userWithDetails: AuthUser = {
        ...firebaseUser,
        // We have to manually copy properties because the spread doesn't get them all
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        uid: firebaseUser.uid,
        photoURL: firebaseUser.photoURL,
        // Our custom properties
        stripeRole,
        admin,
      };
      setUser(userWithDetails);
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      await updateUserState(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, [updateUserState]);
  
  // ✅ ADDED: The implementation of our new refresh function
  const refreshUser = useCallback(async () => {
    await updateUserState(auth.currentUser);
  }, [updateUserState]);

  const simulateUserUpgrade = (role: 'pro' | 'business') => {
    setUser(currentUser => {
        if (!currentUser) return null;
        return { ...currentUser, stripeRole: role };
    });
  };

  const value = useMemo(() => ({ user, loading, refreshUser, simulateUserUpgrade }), [user, loading, refreshUser]);

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