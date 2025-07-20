'use client';

import { type Task } from './TaskCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, MapPin, Calendar } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from './ui/separator';

interface TaskDetailsProps {
  task: Task & {
    description: string;
    postedBy: string;
  };
  onBack: () => void;
}

const offers = [
  {
    id: 1,
    name: 'Brendan H.',
    avatar: 'https://placehold.co/40x40.png',
    rating: 4.9,
    reviews: 102,
    completionRate: '98%',
    offerPrice: 75,
    comment:
      "Hi Laura, I'm available this Saturday and have my own professional lawnmower and tools. I can get this done for you efficiently. Look forward to hearing from you.",
  },
  {
    id: 2,
    name: 'Gemma P.',
    avatar: 'https://placehold.co/40x40.png',
    rating: 5.0,
    reviews: 45,
    completionRate: '100%',
    offerPrice: 80,
    comment:
      'Hello! I am very experienced with gardening and can make your garden look perfect for your party. I can also dispose of all the waste for you.',
  },
];

const questions = [
  {
    id: 1,
    name: 'Mark T.',
    avatar: 'https://placehold.co/40x40.png',
    question:
      'Is there access to an outdoor tap for a pressure washer if needed?',
    answer:
      "Hi Mark, yes there's an outdoor tap at the back of the house you're welcome to use.",
  },
];

export default function TaskDetails({ task, onBack }: TaskDetailsProps) {
  const userRole = 'tasker'; // This would come from auth context

  const getStatusPill = (status: Task['status']) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center rounded-md bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800 ring-1 ring-inset ring-green-600/20">
            OPEN
          </span>
        );
      case 'assigned':
        return (
          <span className="inline-flex items-center rounded-md bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800 ring-1 ring-inset ring-blue-600/20">
            ASSIGNED
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-800 ring-1 ring-inset ring-gray-600/20">
            COMPLETED
          </span>
        );
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 bg-card text-card-foreground h-full">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 hidden md:flex"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to map
        </Button>

        <div className="space-y-2">
          <div className="flex items-center gap-4">
            {getStatusPill(task.status)}
          </div>
          <h1 className="text-3xl font-bold font-headline">{task.title}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="space-y-4 text-sm text-foreground">
              <div className="flex items-start">
                <Avatar className="h-10 w-10 mr-4">
                  <AvatarImage
                    src="https://placehold.co/40x40.png"
                    data-ai-hint="person face"
                  />
                  <AvatarFallback>{task.postedBy.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">POSTED BY</p>
                  <p className="text-muted-foreground">{task.postedBy}</p>
                </div>
              </div>
              <div className="flex items-start">
                <MapPin className="h-5 w-5 mr-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="font-semibold">LOCATION</p>
                  <p className="text-muted-foreground">{task.location}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Calendar className="h-5 w-5 mr-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="font-semibold">TO BE DONE ON</p>
                  <p className="text-muted-foreground">{task.date}</p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="font-bold mb-2">Details</h3>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {task.description}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-2">
                  TASK BUDGET
                </p>
                <p className="text-3xl font-bold">${task.price}</p>
                {userRole === 'tasker' && (
                  <Button className="w-full mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
                    Make an offer
                  </Button>
                )}
                {!userRole && (
                  <Button className="w-full mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
                    Login to Apply
                  </Button>
                )}
              </CardContent>
            </Card>
            <Button variant="outline" className="w-full">
              Report this task
            </Button>
          </div>
        </div>

        <Separator />

        <Tabs defaultValue="offers" className="w-full">
          <TabsList>
            <TabsTrigger value="offers">Offers ({offers.length})</TabsTrigger>
            <TabsTrigger value="questions">
              Questions ({questions.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="offers" className="mt-4">
            <div className="space-y-6">
              {offers.map(offer => (
                <Card key={offer.id}>
                  <CardContent className="p-4 flex flex-col md:flex-row gap-4">
                    <div className="flex-shrink-0 flex flex-col items-center md:border-r md:pr-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={offer.avatar}
                          data-ai-hint="person face"
                        />
                        <AvatarFallback>
                          {offer.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-semibold mt-2">{offer.name}</p>
                      <div className="text-xs text-muted-foreground">
                        <span>{offer.rating}★</span>
                        <span>({offer.reviews} reviews)</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {offer.completionRate} completion
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <p className="text-lg font-bold">${offer.offerPrice}</p>
                        <Button size="sm">Accept</Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {offer.comment}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="questions" className="mt-4">
            <div className="space-y-6">
              {questions.map(q => (
                <Card key={q.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={q.avatar}
                          data-ai-hint="person face"
                        />
                        <AvatarFallback>{q.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <p className="font-semibold text-sm">{q.name}</p>
                    </div>
                    <p className="text-sm pl-10">{q.question}</p>
                    {q.answer && (
                      <div className="pl-10 pt-2">
                        <div className="bg-muted p-3 rounded-lg text-sm">
                          <p className="font-semibold">
                            {task.postedBy}'s reply:
                          </p>
                          <p>{q.answer}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="p-4 border rounded-lg text-center text-sm bg-muted/50">
          <h4 className="font-semibold mb-2">Cancellation policy</h4>
          <p className="text-muted-foreground">
            If you are responsible for cancelling this task, a Cancellation Fee
            will be deducted from your next payment payout(s).
          </p>
          <Button variant="link" className="p-0 h-auto mt-1">
            Learn more
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
