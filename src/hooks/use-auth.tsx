
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, collection, addDoc, serverTimestamp, getDoc, setDoc, query, where, updateDoc, Timestamp } from 'firebase/firestore';
import { getDatabase, ref, onValue, set, onDisconnect, serverTimestamp as rtdbServerTimestamp } from "firebase/database";
import { useSound } from './use-sound';

export interface UserProfile {
  uid: string;
  email: string;
  accountType: 'client' | 'tasker';
  role?: 'client' | 'tasker' | 'admin';
  name?: string;
  photoURL?: string;
  bio?: string;
  skills?: string[];
  averageRating?: number;
  reviewCount?: number;
  phone?: string;
  isVerified?: boolean;
  kycStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  wallet?: {
    balance: number;
  };
  isOnline?: boolean;
  lastSeen?: any;
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
  playNotificationSound: () => void;
  revalidateProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
    user: null, 
    userProfile: null, 
    settings: null, 
    loading: true,
    addNotification: async () => {},
    playNewTaskSound: () => {},
    playNotificationSound: () => {},
    revalidateProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const [playNewTaskSound] = useSound({ frequency: 300, type: 'triangle' });
  const [playNotificationSound] = useSound({ frequency: 520, type: 'square', duration: 0.2 });
  
  const revalidateProfile = useCallback(async () => {
    if (!user) return;
    try {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const profileData = { uid: docSnap.id, ...docSnap.data() } as UserProfile;
            setUserProfile(profileData);
            sessionStorage.setItem(`userProfile-${user.uid}`, JSON.stringify(profileData));
        }
    } catch (error) {
        console.error("Error revalidating profile:", error);
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

  useEffect(() => {
    const settingsDocRef = doc(db, 'settings', 'platform');
    const settingsUnsubscribe = onSnapshot(settingsDocRef, (doc) => {
        if (doc.exists()) {
            setSettings(doc.data() as PlatformSettings);
        } else {
            setSettings({ commissionRate: 0.1, currencySymbol: 'Rs' });
        }
    });

    const authUnsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);

      if (currentUser) {
        setUser(currentUser);

        // Load from cache first
        const cachedProfile = sessionStorage.getItem(`userProfile-${currentUser.uid}`);
        if (cachedProfile) {
            setUserProfile(JSON.parse(cachedProfile));
        }
        
        // Firestore listener for profile
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const profileData = { uid: docSnap.id, ...docSnap.data() } as UserProfile;
                setUserProfile(profileData);
                sessionStorage.setItem(`userProfile-${currentUser.uid}`, JSON.stringify(profileData));
            } else {
                 console.log("User doc doesn't exist yet for UID:", currentUser.uid);
            }
            setLoading(false);
        });

        return () => {
            userUnsubscribe();
            settingsUnsubscribe();
        }

      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      settingsUnsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
      user,
      userProfile,
      loading,
      settings,
      addNotification,
      playNewTaskSound,
      playNotificationSound,
      revalidateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
