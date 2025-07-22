
'use client';

import { type Task } from './TaskCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, MapPin, Calendar } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from './ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, doc, writeBatch, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';


interface TaskDetailsProps {
  task: Task & {
    description: string;
    postedBy: string;
  };
  onBack: () => void;
}

interface Offer {
    id: string;
    taskerId: string;
    taskerName: string;
    taskerAvatar: string;
    offerPrice: number;
    comment: string;
    createdAt: any;
}

interface Question {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    question: string;
    answer?: string;
    createdAt: any;
}


export default function TaskDetails({ task, onBack }: TaskDetailsProps) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const isOwner = user?.uid === task.postedById;
  
  const [offers, setOffers] = useState<Offer[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  const [offerComment, setOfferComment] = useState('');
  const [offerPrice, setOfferPrice] = useState<number | ''>('');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

  const [questionText, setQuestionText] = useState('');
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [isAccepting, setIsAccepting] = useState<string | null>(null);

  useEffect(() => {
    if (!task?.id) return;
    const offersQuery = query(collection(db, 'tasks', task.id, 'offers'));
    const unsubscribeOffers = onSnapshot(offersQuery, (snapshot) => {
        const offersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
        setOffers(offersData);
        setLoadingOffers(false);
    });

    const questionsQuery = query(collection(db, 'tasks', task.id, 'questions'));
    const unsubscribeQuestions = onSnapshot(questionsQuery, (snapshot) => {
        const questionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
        setQuestions(questionsData);
        setLoadingQuestions(false);
    });

    return () => {
        unsubscribeOffers();
        unsubscribeQuestions();
    }
  }, [task.id]);

  const handleMakeOffer = async () => {
    if (!user || !userProfile || offerPrice === '' || !offerComment) {
        toast({ variant: 'destructive', title: "Please fill all offer fields." });
        return;
    }
    setIsSubmittingOffer(true);
    try {
        await addDoc(collection(db, 'tasks', task.id, 'offers'), {
            taskerId: user.uid,
            taskerName: userProfile.name,
            taskerAvatar: user.photoURL || '',
            offerPrice: Number(offerPrice),
            comment: offerComment,
            createdAt: serverTimestamp(),
        });

        // This seems incorrect as it would create a new task. The offer count should be updated on the existing task.
        // I'll comment it out to prevent bugs, a proper implementation would use a transaction or cloud function to update the count.
        /*
        const taskRef = doc(db, 'tasks', task.id);
        await addDoc(collection(db, 'tasks'), {
            ...task,
            offerCount: (task.offers || 0) + 1,
        });
        */
        
        setOfferComment('');
        setOfferPrice('');
        toast({ title: "Offer submitted successfully!" });
    } catch (error) {
        toast({ variant: 'destructive', title: "Failed to submit offer." });
        console.error("Error submitting offer:", error);
    } finally {
        setIsSubmittingOffer(false);
    }
  };

  const handleAskQuestion = async () => {
     if (!user || !userProfile || !questionText) {
        toast({ variant: 'destructive', title: "Please write a question." });
        return;
    }
    setIsSubmittingQuestion(true);
    try {
        await addDoc(collection(db, 'tasks', task.id, 'questions'), {
            userId: user.uid,
            userName: userProfile.name,
            userAvatar: user.photoURL || '',
            question: questionText,
            createdAt: serverTimestamp(),
        });
        setQuestionText('');
        toast({ title: "Question submitted successfully!" });
    } catch (error) {
        toast({ variant: 'destructive', title: "Failed to submit question." });
        console.error("Error submitting question:", error);
    } finally {
        setIsSubmittingQuestion(false);
    }
  }
  
  const handleAcceptOffer = async (offer: Offer) => {
    if (!isOwner || task.status !== 'open') return;
    setIsAccepting(offer.id);
    try {
      const batch = writeBatch(db);
      const taskRef = doc(db, 'tasks', task.id);

      batch.update(taskRef, {
        status: 'assigned',
        assignedToId: offer.taskerId,
        assignedToName: offer.taskerName,
      });

      await batch.commit();

      toast({ title: `Task assigned to ${offer.taskerName}!` });
      onBack();

    } catch (error) {
       toast({ variant: 'destructive', title: "Failed to assign task." });
       console.error("Error accepting offer:", error);
    } finally {
      setIsAccepting(null);
    }
  }


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

  const renderActionButtons = () => {
    if (!user) {
      return (
         <Button className="w-full mt-4 bg-accent text-accent-foreground hover:bg-accent/90" disabled>
            Login to Apply
        </Button>
      )
    }

    if (isOwner) {
       if (task.status === 'open' && offers.length > 0) {
         return <Button className="w-full mt-4" disabled>Review Offers Below</Button>
       }
       if (task.status === 'assigned') {
         return <Button className="w-full mt-4">Mark as Complete</Button>
       }
       return null;
    }

    // Tasker view
    if (userProfile?.accountType === 'tasker' && task.status === 'open') {
        const hasMadeOffer = offers.some(o => o.taskerId === user.uid);
        if (hasMadeOffer) {
            return <Button className="w-full mt-4" disabled>Offer Already Made</Button>
        }
        return (
            <Card className="mt-4">
                <CardContent className="p-4 space-y-2">
                    <p className="font-semibold text-center">Make an Offer</p>
                    <Input 
                        type="number" 
                        placeholder="Your price ($)" 
                        value={offerPrice}
                        onChange={(e) => setOfferPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        disabled={isSubmittingOffer}
                    />
                    <Textarea 
                        placeholder="Your comment..." 
                        value={offerComment}
                        onChange={(e) => setOfferComment(e.target.value)}
                        disabled={isSubmittingOffer}
                    />
                    <Button onClick={handleMakeOffer} disabled={isSubmittingOffer} className="w-full">
                        {isSubmittingOffer ? "Submitting..." : "Submit Offer"}
                    </Button>
                </CardContent>
            </Card>
        )
    }
    
    return null;
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 md:p-6 space-y-6 bg-card text-card-foreground h-full">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 flex"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to tasks
        </Button>

        <div className="space-y-2">
          <div className="flex items-center gap-4">
            {getStatusPill(task.status)}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline">{task.title}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
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
                  <p className="font-semibold uppercase text-xs text-muted-foreground">POSTED BY</p>
                  <p>{task.postedBy}</p>
                </div>
              </div>
              <div className="flex items-start">
                <MapPin className="h-5 w-5 mr-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-semibold uppercase text-xs text-muted-foreground">LOCATION</p>
                  <p>{task.location}</p>
                  {task.type === 'physical' && task.coordinates && (
                    <a href={`https://www.google.com/maps/search/?api=1&query=${task.coordinates[0]},${task.coordinates[1]}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="link" size="sm" className="p-0 h-auto">
                        View on map
                      </Button>
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-start">
                <Calendar className="h-5 w-5 mr-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-semibold uppercase text-xs text-muted-foreground">TO BE DONE ON</p>
                  <p>{task.date}</p>
                </div>
              </div>
            </div>
            <Separator className="my-6" />
            <div>
              <h3 className="font-bold mb-2">Details</h3>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {task.description}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">
                  TASK BUDGET
                </p>
                <p className="text-3xl font-bold">${task.price}</p>
                {renderActionButtons()}
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
              {loadingOffers ? <p>Loading offers...</p> : offers.map(offer => (
                <Card key={offer.id}>
                  <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
                    <div className="flex-shrink-0 flex flex-col items-center text-center sm:border-r sm:pr-4 sm:w-32">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={offer.taskerAvatar || 'https://placehold.co/40x40.png'}
                          data-ai-hint="person face"
                        />
                        <AvatarFallback>
                          {offer.taskerName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-semibold mt-2">{offer.taskerName}</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="text-lg font-bold">${offer.offerPrice}</p>
                        {isOwner && task.status === 'open' && (
                          <Button size="sm" onClick={() => handleAcceptOffer(offer)} disabled={isAccepting !== null}>
                            {isAccepting === offer.id ? "Accepting..." : "Accept"}
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {offer.comment}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {offers.length === 0 && !loadingOffers && <p className="text-muted-foreground text-sm text-center py-4">There are no offers yet.</p>}
            </div>
          </TabsContent>
          <TabsContent value="questions" className="mt-4">
            <div className="space-y-6">
               {user && (
                    <Card>
                        <CardContent className="p-4 space-y-2">
                            <p className="font-semibold">Ask a Question</p>
                            <Textarea 
                                placeholder="Type your question here..."
                                value={questionText}
                                onChange={(e) => setQuestionText(e.target.value)}
                                disabled={isSubmittingQuestion}
                            />
                            <Button onClick={handleAskQuestion} disabled={isSubmittingQuestion}>
                                {isSubmittingQuestion ? 'Submitting...' : 'Ask Question'}
                            </Button>
                        </CardContent>
                    </Card>
               )}
              {loadingQuestions ? <p>Loading questions...</p> : questions.map(q => (
                <Card key={q.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={q.userAvatar || 'https://placehold.co/40x40.png'}
                          data-ai-hint="person face"
                        />
                        <AvatarFallback>{q.userName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <p className="font-semibold text-sm">{q.userName}</p>
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
               {questions.length === 0 && !loadingQuestions && <p className="text-muted-foreground text-sm text-center py-4">There are no questions yet.</p>}
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
