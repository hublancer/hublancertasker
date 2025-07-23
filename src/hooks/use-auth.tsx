
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, collection, addDoc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
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
  lastMessageReadTimestamp?: any;
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
  revalidateProfile: () => Promise<void>;
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
    revalidateProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const [playNewTaskSound] = useSound({ frequency: 300, type: 'triangle' });
  const [playMessageSound] = useSound({ frequency: 440, type: 'sine' });
  const [playNotificationSound] = useSound({ frequency: 520, type: 'square', duration: 0.2 });
  
  const revalidateProfile = useCallback(async () => {
    if (!user) return;
    try {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const profileData = { uid: docSnap.id, ...docSnap.data() } as UserProfile;
            setUserProfile(profileData);
            sessionStorage.setItem('userProfile', JSON.stringify(profileData));
        }
    } catch (error) {
        console.error("Error revalidating profile:", error);
    }
  }, [user]);


  useEffect(() => {
    // Attempt to load settings from cache first
    const cachedSettings = sessionStorage.getItem('platformSettings');
    if (cachedSettings) {
        setSettings(JSON.parse(cachedSettings));
    } else {
        const settingsDocRef = doc(db, 'settings', 'platform');
        getDoc(settingsDocRef).then((doc) => {
            let platformSettings;
            if (doc.exists()) {
                platformSettings = doc.data() as PlatformSettings;
            } else {
                platformSettings = { commissionRate: 0.1, currencySymbol: 'Rs' };
            }
            setSettings(platformSettings);
            sessionStorage.setItem('platformSettings', JSON.stringify(platformSettings));
        });
    }

    const authUnsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Attempt to load user profile from cache
        const cachedProfile = sessionStorage.getItem('userProfile');
        if (cachedProfile) {
            const profile = JSON.parse(cachedProfile);
            // Quick check to ensure cached profile belongs to current user
            if (profile.uid === currentUser.uid) {
                setUserProfile(profile);
                setLoading(false);
            } else {
                // Mismatch, fetch from DB
                await revalidateProfile();
                setLoading(false);
            }
        } else {
            // No cache, fetch from DB
             await revalidateProfile();
             setLoading(false);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        sessionStorage.removeItem('userProfile');
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
    };
  // We only want revalidateProfile to be created once per user, so we add it here.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revalidateProfile]);


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
      revalidateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
