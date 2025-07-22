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
    // Listener for platform settings
    const settingsDocRef = doc(db, 'settings', 'platform');
    const unsubscribeSettings = onSnapshot(settingsDocRef, (doc) => {
      if (doc.exists()) {
        setSettings(doc.data() as PlatformSettings);
      } else {
        setSettings({ commissionRate: 0.1, currencySymbol: 'Rs' });
      }
    });

    // Listener for authentication state changes
    const authUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        // If no user, stop loading. Profile will be null.
        setUserProfile(null);
        setLoading(false);
      }
      // If there IS a user, the profile listener below will handle setting loading to false.
    });

    return () => {
      unsubscribeSettings();
      authUnsubscribe();
    };
  }, []);

  useEffect(() => {
    // If we have a user, set up a listener for their profile document
    if (user) {
      setLoading(true); // Start loading while we fetch the profile
      const userDocRef = doc(db, 'users', user.uid);
      const profileUnsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data() as UserProfile);
        } else {
          setUserProfile(null); // User exists in Auth, but not in Firestore
        }
        setLoading(false); // Stop loading once profile is fetched
      }, (error) => {
          console.error("Error listening to user profile:", error);
          setUserProfile(null);
          setLoading(false);
      });
      return () => profileUnsubscribe();
    }
  }, [user]); // This effect depends only on the user object

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, settings }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
