
'use client';
import { useAuth, UserProfile } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { useEffect, useState, Suspense, useCallback } from 'react';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Briefcase, MessageSquare } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginDialog } from '@/components/LoginDialog';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import UserAvatar from '@/components/UserAvatar';

export interface Conversation {
  id: string;
  taskId: string;
  taskTitle: string;
  participants: string[];
  clientName: string;
  taskerName: string;
  lastMessage: string;
  lastMessageAt: any;
  clientAvatar?: string;
  taskerAvatar?: string;
  partnerProfile?: UserProfile;
  taskStatus: 'open' | 'assigned' | 'completed' | 'pending-completion' | 'disputed';
}

function MessagesPageContent() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const fetchPartnerProfiles = useCallback(async (convos: Conversation[]) => {
    if (!user) return convos;
    const partnerIds = convos.map(c => c.participants.find(p => p !== user.uid)).filter(id => !!id) as string[];
    if (partnerIds.length === 0) return convos;

    const uniquePartnerIds = [...new Set(partnerIds)];
    const partners: Record<string, UserProfile> = {};

    // Firestore 'in' query is limited to 30 elements. Fetch in chunks if needed.
    const chunks = [];
    for (let i = 0; i < uniquePartnerIds.length; i += 30) {
        chunks.push(uniquePartnerIds.slice(i, i + 30));
    }
    
    for (const chunk of chunks) {
        const q = query(collection(db, 'users'), where('uid', 'in', chunk));
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
            partners[doc.id] = doc.data() as UserProfile;
        });
    }

    return convos.map(convo => {
        const partnerId = convo.participants.find(p => p !== user?.uid);
        if (partnerId && partners[partnerId]) {
            convo.partnerProfile = partners[partnerId];
        }
        return convo;
    });

  }, [user]);


  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    updateDoc(userRef, { lastMessageReadTimestamp: serverTimestamp() });

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      where('taskStatus', 'in', ['assigned', 'pending-completion', 'disputed']),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async snapshot => {
      const convosData = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Conversation));
      
      const convosWithProfiles = await fetchPartnerProfiles(convosData);

      setConversations(convosWithProfiles);
      setLoading(false);

      // Handle redirect for admin disputes
      const taskId = searchParams.get('taskId');
      if (userProfile?.role === 'admin' && taskId) {
        const convoForTask = convosWithProfiles.find(c => c.taskId === taskId);
        if (convoForTask) {
          router.replace(`/messages/${convoForTask.id}`);
        }
      }
    });

    return () => unsubscribe();
  }, [user, authLoading, router, searchParams, userProfile, fetchPartnerProfiles]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto p-4">
          <div className="p-4">
            <h1 className="text-2xl font-bold font-headline">Inbox</h1>
          </div>
          <Separator />
          <div className="p-4 space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <AppHeader />
        <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">View Your Messages</h2>
          <p className="text-muted-foreground mb-4">
            You need to be logged in to view your inbox.
          </p>
          <Button onClick={() => setIsLoginOpen(true)}>Login</Button>
        </main>
        <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
      </div>
    );
  }

  const getConvoPartner = (convo: Conversation) => {
      const partnerProfile = convo.partnerProfile;
      
      if (userProfile?.accountType === 'client') {
        return { name: convo.taskerName, avatar: convo.taskerAvatar, profile: partnerProfile };
      }
      return { name: convo.clientName, avatar: convo.clientAvatar, profile: partnerProfile };
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <AppHeader />
      <div className="flex-1 overflow-hidden">
        <div className="flex flex-col h-full">
          <div className="p-4">
            <h1 className="text-2xl font-bold font-headline">Inbox</h1>
          </div>
          <Separator />
          <ScrollArea className="flex-1">
            {conversations.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-muted/20">
                <Briefcase className="w-16 h-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-bold font-headline">
                  No active conversations
                </h2>
                <p className="text-muted-foreground">
                  When a task is assigned, your conversation will appear here.
                </p>
              </div>
            )}
            {conversations.map(convo => {
              const partner = getConvoPartner(convo);
              return (
                <Link
                  key={convo.id}
                  href={`/messages/${convo.id}`}
                  className="flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/50"
                >
                  <UserAvatar
                    name={partner.name}
                    imageUrl={partner.avatar}
                    className="h-10 w-10"
                    isOnline={partner.profile?.isOnline}
                    lastSeen={partner.profile?.lastSeen}
                  />
                  <div className="flex-1 truncate">
                    <p className="font-semibold">{partner.name}</p>
                    <p className="text-sm font-semibold truncate text-primary">
                      {convo.taskTitle}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {convo.lastMessage}
                    </p>
                  </div>
                </Link>
              );
            })}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MessagesPageContent />
    </Suspense>
  );
}
