'use client';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  addDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { useEffect, useState, useRef, Suspense } from 'react';
import AppHeader from '@/components/AppHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Send, Image as ImageIcon, Briefcase, User, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LoginDialog } from '@/components/LoginDialog';

interface Conversation {
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

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
  imageUrl?: string;
}

function MessagesPageContent() {
  const { user, userProfile } = useAuth();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const convos = snapshot.docs.map(
        doc => ({ id: doc.id, ...doc.data() } as Conversation)
      );
      setConversations(convos);

      const conversationIdFromUrl = searchParams.get('conversationId');
      if (conversationIdFromUrl) {
        const foundConvo = convos.find(c => c.id === conversationIdFromUrl);
        if (foundConvo) {
          setSelectedConversation(foundConvo);
        }
      } else if (convos.length > 0 && !selectedConversation) {
        setSelectedConversation(convos[0]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, searchParams, selectedConversation]);

  useEffect(() => {
    if (!selectedConversation) return;

    const q = query(
      collection(db, 'conversations', selectedConversation.id, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const msgs = snapshot.docs.map(
        doc => ({ id: doc.id, ...doc.data() } as Message)
      );
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (
      !newMessage.trim() ||
      !selectedConversation ||
      !user
    )
      return;

    const messageText = newMessage;
    setNewMessage('');

    try {
      const conversationRef = doc(db, 'conversations', selectedConversation.id);
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

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <AppHeader />
        <div className="text-center p-8">Loading conversations...</div>
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
          <p className="text-muted-foreground mb-4">You need to be logged in to view your inbox.</p>
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
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr] overflow-hidden">
        <div className="flex flex-col border-r bg-card">
          <div className="p-4">
            <h1 className="text-2xl font-bold font-headline">Inbox</h1>
          </div>
          <Separator />
          <ScrollArea className="flex-1">
            {conversations.length === 0 && !loading && (
              <p className="p-4 text-muted-foreground text-sm">No conversations yet.</p>
            )}
            {conversations.map(convo => {
              const partner = getConvoPartner(convo);
              return (
                <div
                  key={convo.id}
                  className={cn(
                    'flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/50',
                    selectedConversation?.id === convo.id && 'bg-muted'
                  )}
                  onClick={() => setSelectedConversation(convo)}
                >
                  <Avatar>
                    <AvatarImage src={partner.avatar} data-ai-hint="person face" />
                    <AvatarFallback>{partner.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 truncate">
                    <p className="font-semibold">{partner.name}</p>
                    <p className="text-sm font-semibold truncate text-primary">{convo.taskTitle}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {convo.lastMessage}
                    </p>
                  </div>
                </div>
              );
            })}
          </ScrollArea>
        </div>

        {selectedConversation ? (
          <div className="flex flex-col">
            <div className="flex-1 flex flex-col p-6 space-y-4 overflow-y-auto">
              <ScrollArea className="flex-1 pr-4 -mr-4">
                <div className="space-y-6">
                  {messages.map(msg => {
                    const fromMe = msg.senderId === user.uid;
                    const partner = getConvoPartner(selectedConversation);
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          'flex items-end gap-2',
                          fromMe ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {!fromMe && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={partner.avatar} data-ai-hint="person face" />
                            <AvatarFallback>
                              {partner.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
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
            </div>
            <div className="p-4 border-t bg-card">
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
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-muted/20">
            <Briefcase className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold font-headline">Welcome to your Inbox</h2>
            <p className="text-muted-foreground">Select a conversation to start messaging.</p>
          </div>
        )}
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
    