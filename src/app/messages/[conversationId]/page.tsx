
'use client';
import { useAuth, UserProfile } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  addDoc,
  serverTimestamp,
  updateDoc,
  getDoc,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  getDocs,
  where,
} from 'firebase/firestore';
import { useEffect, useState, useRef, Suspense, useCallback } from 'react';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, ArrowLeft, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';
import { type Conversation } from '../page';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { type Task } from '@/components/TaskCard';
import UserAvatar from '@/components/UserAvatar';

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
  imageUrl?: string;
}

function ConversationPageContent() {
  const { user, userProfile, addNotification } = useAuth();
  const params = useParams();
  const conversationId = params.conversationId as string;
  const router = useRouter();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<UserProfile | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const initialLimit = 20;

  const fetchInitialData = useCallback(async () => {
    if (!conversationId || !user) {
      if (!user) router.push('/messages');
      return;
    }
    setLoading(true);

    try {
      const convoRef = doc(db, 'conversations', conversationId);
      const docSnap = await getDoc(convoRef);

      if (docSnap.exists()) {
        const convoData = {
          id: docSnap.id,
          ...docSnap.data(),
        } as Conversation;
        if (!convoData.participants.includes(user.uid)) {
          console.error('User not in conversation');
          router.push('/messages');
          return;
        }
        setConversation(convoData);

        const taskRef = doc(db, 'tasks', convoData.taskId);
        const taskSnap = await getDoc(taskRef);
        if (taskSnap.exists()) {
          setTask(taskSnap.data() as Task);
        }

        const partnerId = convoData.participants.find(p => p !== user.uid);
        if (partnerId) {
          const partnerRef = doc(db, 'users', partnerId);
          const snap = await getDoc(partnerRef);
          if (snap.exists()) {
            setPartnerProfile(snap.data() as UserProfile);
          }
        }
      } else {
        router.push('/messages');
        return;
      }

      const messagesQuery = query(
        collection(db, 'conversations', conversationId, 'messages'),
        orderBy('createdAt', 'desc'),
        limit(initialLimit)
      );

      const snapshot = await getDocs(messagesQuery);
      const msgs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Message))
        .reverse();
      setMessages(msgs);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === initialLimit);

    } catch (error) {
      console.error("Error fetching conversation data:", error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, user, router]);


  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);


  useEffect(() => {
    if (messages.length) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages.length]);

  const loadMoreMessages = async () => {
    if (!hasMore || loadingMore || !lastVisible) return;
    setLoadingMore(true);

    const moreMessagesQuery = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'desc'),
      startAfter(lastVisible),
      limit(initialLimit)
    );
    const snapshot = await getDocs(moreMessagesQuery);
    const newMsgs = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Message))
      .reverse();

    setMessages(prev => [...newMsgs, ...prev]);
    setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
    setHasMore(snapshot.docs.length === initialLimit);
    setLoadingMore(false);
  };

  const handleSendMessage = async () => {
    if (
      !newMessage.trim() ||
      !conversation ||
      !user ||
      !userProfile ||
      task?.status === 'completed'
    )
      return;

    const messageText = newMessage;
    setNewMessage('');
    
    const tempMessageId = `temp-${Date.now()}`;
    const messageToSend: Message = {
        id: tempMessageId,
        senderId: user.uid,
        text: messageText,
        createdAt: new Date(),
    }
    setMessages(prev => [...prev, messageToSend]);


    try {
      const conversationRef = doc(db, 'conversations', conversation.id);
      await addDoc(collection(conversationRef, 'messages'), {
        senderId: user.uid,
        text: messageText,
        createdAt: serverTimestamp(),
      });

      await updateDoc(conversationRef, {
        lastMessage: messageText,
        lastMessageAt: serverTimestamp(),
      });
      
      const partnerId = conversation.participants.find(p => p !== user.uid);
      if(partnerId) {
        await addNotification(partnerId, `New message from ${userProfile.name} in "${conversation.taskTitle}"`, `/messages/${conversation.id}`);
      }
      
      // I'll leave the optimistic update for now. A full refresh would be another option.

    } catch (error) {
      console.error('Error sending message: ', error);
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== tempMessageId));
    }
  };

  const getPartner = () => {
    if (!conversation || !userProfile) return { name: '', avatar: '' };
    return userProfile.accountType === 'client'
      ? { name: conversation.taskerName, avatar: conversation.taskerAvatar }
      : { name: conversation.clientName, avatar: conversation.clientAvatar };
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading conversation...
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex h-screen items-center justify-center">
        Conversation not found.
      </div>
    );
  }

  const partner = getPartner();
  const isCompleted = task?.status === 'completed';

  return (
    <div className="flex flex-col h-screen bg-background">
      <AppHeader />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center p-2 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/messages')}
          >
            <ArrowLeft />
          </Button>
          <div className="flex items-center gap-3">
            <UserAvatar
              name={partner.name}
              imageUrl={partner.avatar}
              className="h-8 w-8"
            />
            <div>
              <p className="font-semibold">{partner.name}</p>
              <p className="text-sm text-primary font-semibold truncate">
                {conversation.taskTitle}
              </p>
            </div>
          </div>
          <div className="ml-auto">
            <Link href={`/task/${conversation.taskId}`}>
              <Button variant="outline" size="sm">
                View Task
              </Button>
            </Link>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4 md:p-6" viewportRef={scrollRef}>
          {hasMore && (
            <div className="text-center mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMoreMessages}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading...' : 'Load Previous Messages'}
              </Button>
            </div>
          )}
          <div className="space-y-6">
            {messages.map(msg => {
              const fromMe = msg.senderId === user?.uid;
              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex items-end gap-2',
                    fromMe ? 'justify-end' : 'justify-start'
                  )}
                >
                  {!fromMe && (
                    <UserAvatar
                      name={partner.name}
                      imageUrl={partner.avatar}
                      className="h-8 w-8"
                    />
                  )}
                  <div
                    className={cn(
                      'max-w-xs md:max-w-md lg:max-w-lg rounded-lg p-3 text-sm',
                      fromMe
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p>{msg.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t bg-card">
          {isCompleted ? (
            <div className="flex items-center justify-center p-2 rounded-md bg-yellow-100 text-yellow-800 text-sm">
              <Info className="h-4 w-4 mr-2" />
              This task is complete. Messaging is disabled.
            </div>
          ) : (
            <div className="relative">
              <Input
                placeholder="Type a message..."
                className="pr-12"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
              />
              <Button
                size="icon"
                className="absolute top-1/2 right-1.5 -translate-y-1/2 h-7 w-7"
                onClick={handleSendMessage}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConversationPage() {
  return (
    <Suspense fallback={<Skeleton className="h-screen w-screen" />}>
      <ConversationPageContent />
    </Suspense>
  );
}
