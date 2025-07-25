
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
  getDoc,
} from 'firebase/firestore';
import { useEffect, useState, Suspense } from 'react';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Briefcase, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginDialog } from '@/components/LoginDialog';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import UserAvatar from '../UserAvatar';

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
}

function MessagesPageContent() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

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
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
        const convosPromises = snapshot.docs.map(async (docSnap) => {
            const convoData = { id: docSnap.id, ...docSnap.data() } as Conversation;
            return convoData;
        });

      const convos = await Promise.all(convosPromises);
      setConversations(convos);
      setLoading(false);

      // Handle redirect for admin disputes
      const taskId = searchParams.get('taskId');
      if (userProfile?.role === 'admin' && taskId) {
        const convoForTask = convos.find(c => c.taskId === taskId);
        if (convoForTask) {
          router.replace(`/messages/${convoForTask.id}`);
        }
      }
    });

    return () => unsubscribe();
  }, [user, authLoading, router, searchParams, userProfile]);

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
    if (userProfile?.accountType === 'client') {
      return {
        name: convo.taskerName,
        avatar: convo.taskerAvatar,
      };
    }
    return {
      name: convo.clientName,
      avatar: convo.clientAvatar,
    };
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
                <h2 className="text-xl font-bold font-headline">No conversations yet</h2>
                <p className="text-muted-foreground">When a task is assigned, your conversation will appear here.</p>
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
    )
}
