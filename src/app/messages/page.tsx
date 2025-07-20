import AppHeader from '@/components/AppHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

const conversations = [
  {
    id: 1,
    name: 'John D.',
    lastMessage: "Sounds good, I can be there at 2pm.",
    avatar: 'https://placehold.co/40x40.png',
    active: true,
  },
  {
    id: 2,
    name: 'Sarah P.',
    lastMessage: 'I have a question about the task...',
    avatar: 'https://placehold.co/40x40.png',
    active: false,
  },
  {
    id: 3,
    name: 'Admin Support',
    lastMessage: 'Your payment has been processed.',
    avatar: 'https://placehold.co/40x40.png',
    active: false,
  },
];

const messages = [
  {
    from: 'me',
    text: 'Hi John, thanks for your application for the garden cleanup. Are you available this Saturday?',
  },
  {
    from: 'them',
    text: 'Hi! Yes, Saturday works for me. What time were you thinking?',
  },
  { from: 'me', text: 'Great. Would 2pm be okay?' },
  { from: 'them', text: 'Sounds good, I can be there at 2pm.' },
];

export default function MessagesPage() {
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
            {conversations.map(convo => (
              <div
                key={convo.id}
                className={cn(
                  'flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50',
                  convo.active && 'bg-muted'
                )}
              >
                <Avatar>
                  <AvatarImage src={convo.avatar} data-ai-hint="person face" />
                  <AvatarFallback>{convo.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 truncate">
                  <p className="font-semibold">{convo.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {convo.lastMessage}
                  </p>
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>

        <div className="flex flex-col">
          <div className="flex-1 flex flex-col p-6 space-y-4 overflow-y-auto">
            <ScrollArea className="flex-1 pr-4 -mr-4">
              <div className="space-y-6">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-end gap-2',
                      msg.from === 'me' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {msg.from === 'them' && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={conversations[0].avatar} data-ai-hint="person face" />
                        <AvatarFallback>J</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        'max-w-xs md:max-w-md lg:max-w-lg rounded-lg p-3 text-sm',
                        msg.from === 'me'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <p>{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="p-4 border-t bg-card">
            <div className="relative">
              <Input placeholder="Type a message..." className="pr-12" />
              <Button
                size="icon"
                className="absolute top-1/2 right-1.5 -translate-y-1/2 h-7 w-7"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
