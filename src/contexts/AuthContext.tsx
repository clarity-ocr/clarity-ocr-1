import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/firebase';

// This is the shape of our user object throughout the app
export interface AuthUser extends User {
  stripeRole?: 'free' | 'pro' | 'business';
  admin?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  // This is our new "magic" function for the simulation
  simulateUserUpgrade: (role: 'pro' | 'business') => void;
}

// We add a default empty function to the context definition
const AuthContext = createContext<AuthContextType>({ user: null, loading: true, simulateUserUpgrade: () => {} });

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const tokenResult = await firebaseUser.getIdTokenResult(true);
        
        const stripeRole = (tokenResult.claims.stripeRole as 'free' | 'pro' | 'business') || 'free';
        const admin = (tokenResult.claims.admin as boolean) || false;
        
        setUser({ ...firebaseUser, stripeRole, admin });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // This function allows any component to "pretend" the user has upgraded.
  // It only changes the state on the frontend for the current session.
  const simulateUserUpgrade = (role: 'pro' | 'business') => {
    setUser(currentUser => {
        if (!currentUser) return null;
        // Return a new user object with the upgraded role
        return { ...currentUser, stripeRole: role };
    });
  };

  const value = useMemo(() => ({ user, loading, simulateUserUpgrade }), [user, loading]);

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