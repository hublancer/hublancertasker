'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useSound } from './use-sound';

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
  addNotification: (userId: string, message: string, link: string) => Promise<void>;
  playNewTaskSound: () => void;
  playMessageSound: () => void;
  playNotificationSound: () => void;
}

const AuthContext = createContext<AuthContextType>({ 
    user: null, 
    userProfile: null, 
    settings: null, 
    loading: true,
    addNotification: async () => {},
    playNewTaskSound: () => {},
    playMessageSound: () => {},
    playNotificationSound: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const [playNewTaskSound] = useSound({ frequency: 300, type: 'triangle' });
  const [playMessageSound] = useSound({ frequency: 440, type: 'sine' });
  const [playNotificationSound] = useSound({ frequency: 520, type: 'square', duration: 0.2 });

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
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeSettings();
      authUnsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      setLoading(true);
      const userDocRef = doc(db, 'users', user.uid);
      const profileUnsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data() as UserProfile);
        } else {
          setUserProfile(null);
        }
        setLoading(false); 
      }, (error) => {
          console.error("Error listening to user profile:", error);
          setUserProfile(null);
          setLoading(false);
      });
      return () => profileUnsubscribe();
    } else {
        setUserProfile(null);
        setLoading(false);
    }
  }, [user]);

  const addNotification = useCallback(async (userId: string, message: string, link: string) => {
    if (!userId) return;
    try {
        await addDoc(collection(db, 'users', userId, 'notifications'), {
            message,
            link,
            read: false,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error adding notification: ", error);
    }
  }, []);

  const value = {
      user,
      userProfile,
      loading,
      settings,
      addNotification,
      playNewTaskSound,
      playMessageSound,
      playNotificationSound,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
