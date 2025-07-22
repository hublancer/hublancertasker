'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  accountType: 'client' | 'tasker';
  role?: 'client' | 'tasker' | 'admin';
  name?: string;
  averageRating?: number;
  reviewCount?: number;
  photoURL?: string;
  wallet?: {
    balance: number;
  };
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, userProfile: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => authUnsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
        setLoading(true);
        const userDocRef = doc(db, 'users', user.uid);
        const snapshotUnsubscribe = onSnapshot(userDocRef, (doc) => {
             if (doc.exists()) {
                setUserProfile(doc.data() as UserProfile);
            }
            setLoading(false);
        });
        return () => snapshotUnsubscribe();
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
