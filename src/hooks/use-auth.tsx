'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, collection } from 'firebase/firestore';

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

export interface PlatformSettings {
    commissionRate: number; // e.g., 0.1 for 10%
    currencySymbol: string; // e.g., 'Rs', '$'
}


interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  settings: PlatformSettings | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, userProfile: null, settings: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
        setUserProfile(null);
        // Don't set loading to false here, wait for settings to load
      }
    });

    return () => authUnsubscribe();
  }, []);

  useEffect(() => {
    const settingsDocRef = doc(db, 'settings', 'platform');
    const unsubscribeSettings = onSnapshot(settingsDocRef, (doc) => {
      if (doc.exists()) {
        setSettings(doc.data() as PlatformSettings);
      } else {
        // Set default settings if none exist
        setSettings({ commissionRate: 0.1, currencySymbol: 'Rs' });
      }
      // Settings loaded, now check if we should stop loading screen
      if (!user) {
        setLoading(false);
      }
    });

    return () => unsubscribeSettings();
  }, [user]);

  useEffect(() => {
    if (user) {
        setLoading(true);
        const userDocRef = doc(db, 'users', user.uid);
        const snapshotUnsubscribe = onSnapshot(userDocRef, (doc) => {
             if (doc.exists()) {
                setUserProfile(doc.data() as UserProfile);
            }
            // User profile loaded, now we can stop loading
            setLoading(false);
        });
        return () => snapshotUnsubscribe();
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, settings }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
