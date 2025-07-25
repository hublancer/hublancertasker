
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
} from 'firebase/firestore';
import { useEffect, useState, useRef, Suspense } from 'react';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, ArrowLeft, Info, XCircle } from 'lucide-react';
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
  const { user, userProfile } = useAuth();
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<UserProfile | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId || !user) {
      if (!user) router.push('/messages');
      return;
    };

    let partnerUnsub: (() => void) | undefined;

    const convoRef = doc(db, 'conversations', conversationId);
    const unsubscribeConvo = onSnapshot(convoRef, async (docSnap) => {
      if (docSnap.exists()) {
        const convoData = { id: docSnap.id, ...docSnap.data() } as Conversation;
        if (!convoData.participants.includes(user.uid)) {
            console.error("User not in conversation");
            router.push('/messages');
            return;
        }
        setConversation(convoData);
        
        const taskRef = doc(db, 'tasks', convoData.taskId);
        const taskSnap = await getDoc(taskRef);
        if (taskSnap.exists()) {
            setTask(taskSnap.data() as Task)
        }

        const partnerId = convoData.participants.find(p => p !== user.uid);
        if (partnerId) {
            const partnerRef = doc(db, 'users', partnerId);
            const snap = await getDoc(partnerRef);
            if(snap.exists()) {
                 setPartnerProfile(snap.data() as UserProfile);
            }
        }

      } else {
        router.push('/messages');
      }
      setLoading(false);
    });

    const messagesQuery = query(
        collection(db, 'conversations', conversationId, 'messages'),
        orderBy('createdAt', 'asc')
      );
  
    const unsubscribeMessages = onSnapshot(messagesQuery, snapshot => {
        const msgs = snapshot.docs.map(
            doc => ({ id: doc.id, ...doc.data() } as Message)
        );
        setMessages(msgs);
    });

    return () => {
        unsubscribeConvo();
        unsubscribeMessages();
        if (partnerUnsub) {
            partnerUnsub();
        }
    }
  }, [conversationId, user, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (
      !newMessage.trim() ||
      !conversation ||
      !user ||
      task?.status === 'completed'
    )
      return;

    const messageText = newMessage;
    setNewMessage('');

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
    } catch (error) {
      console.error('Error sending message: ', error);
    }
  };

  const getPartner = () => {
      if (!conversation || !userProfile) return { name: '', avatar: ''};
      return userProfile.accountType === 'client' ? 
        { name: conversation.taskerName, avatar: conversation.taskerAvatar } :
        { name: conversation.clientName, avatar: conversation.clientAvatar };
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading conversation...</div>;
  }
  
  if (!conversation) {
    return <div className="flex h-screen items-center justify-center">Conversation not found.</div>;
  }

  const partner = getPartner();
  const isCompleted = task?.status === 'completed';

  return (
    <div className="flex flex-col h-screen bg-background">
      <AppHeader />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center p-2 border-b">
            <Button variant="ghost" size="icon" onClick={() => router.push('/messages')}>
                <ArrowLeft />
            </Button>
            <div className="flex items-center gap-3">
                <UserAvatar 
                    name={partner.name}
                    imageUrl={partner.avatar}
                />
                <div>
                    <p className="font-semibold">{partner.name}</p>
                    <p className="text-sm text-primary font-semibold truncate">{conversation.taskTitle}</p>
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
        <ScrollArea className="flex-1 p-4 md:p-6">
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
    )
}
