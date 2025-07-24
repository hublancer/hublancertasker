
'use client';

import { type Task } from './TaskCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, MapPin, Calendar, MessageSquare, Edit, Trash2, CheckCircle, XCircle, Star, Hourglass, ShieldAlert } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, doc, writeBatch, updateDoc, where, getDocs, deleteDoc, runTransaction, Timestamp, GeoPoint, getDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { LoginDialog } from './LoginDialog';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import Link from 'next/link';

interface TaskDetailsProps {
  task: Task & {
    description: string;
    postedBy: string;
  };
  onBack?: () => void;
  onTaskUpdate?: () => void;
  isPage?: boolean;
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

const StarRating = ({ rating, setRating }: { rating: number; setRating?: (rating: number) => void }) => {
    const isInteractive = !!setRating;
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`h-5 w-5 ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'
                        } ${isInteractive ? 'cursor-pointer' : ''}`}
                    onClick={() => setRating?.(star)}
                />
            ))}
        </div>
    );
};


export default function TaskDetails({ task, onBack, onTaskUpdate, isPage = false }: TaskDetailsProps) {
  const { user, userProfile, settings, addNotification } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const isOwner = user?.uid === task.postedById;
  
  const [offers, setOffers] = useState<Offer[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  const [offerComment, setOfferComment] = useState('');
  const [offerPrice, setOfferPrice] = useState<number | ''>(task.price);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

  const [questionText, setQuestionText] = useState('');
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [isAccepting, setIsAccepting] = useState<string | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [hasAlreadyReviewed, setHasAlreadyReviewed] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);

  const [reportReason, setReportReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  const [disputeReason, setDisputeReason] = useState("");
  const [isDisputing, setIsDisputing] = useState(false);

  useEffect(() => {
    if (!task?.id) return;
    setOffers([]);
    setQuestions([]);
    setShowReviewForm(false);
    setHasAlreadyReviewed(false);
    setLoadingOffers(true);
    setLoadingQuestions(true);

    const offersQuery = query(collection(db, 'tasks', task.id, 'offers'));
    const unsubscribeOffers = onSnapshot(offersQuery, (snapshot) => {
        const offersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
        setOffers(offersData);
        setLoadingOffers(false);
    }, (error) => {
        console.error("Error fetching offers:", error);
        setLoadingOffers(false);
    });

    const questionsQuery = query(collection(db, 'tasks', task.id, 'questions'));
    const unsubscribeQuestions = onSnapshot(questionsQuery, (snapshot) => {
        const questionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
        setQuestions(questionsData);
        setLoadingQuestions(false);
    }, (error) => {
        console.error("Error fetching questions:", error);
        setLoadingQuestions(false);
    });

    // Check if review exists
    if (user && task.status === 'completed' && task.assignedToId) {
        const reviewQuery = query(collection(db, 'reviews'), where('taskId', '==', task.id), where('clientId', '==', user.uid));
        getDocs(reviewQuery).then(snapshot => {
            if (!snapshot.empty) {
                setHasAlreadyReviewed(true);
            }
        });
    }


    return () => {
        unsubscribeOffers();
        unsubscribeQuestions();
    }
  }, [task.id, user, task.status, task.assignedToId]);

  const handleMakeOffer = async () => {
    if (!user || !userProfile) {
      setIsLoginOpen(true);
      return;
    }
    if (offerPrice === '' || !offerComment) {
      toast({ variant: 'destructive', title: 'Please fill all offer fields.' });
      return;
    }
    setIsSubmittingOffer(true);
    try {
      if (editingOffer) {
        // Update existing offer
        const offerRef = doc(db, 'tasks', task.id, 'offers', editingOffer.id);
        await updateDoc(offerRef, {
          offerPrice: Number(offerPrice),
          comment: offerComment,
        });
        setEditingOffer(null);
        toast({ title: 'Offer updated successfully!' });
      } else {
        // Create new offer
        await addDoc(collection(db, 'tasks', task.id, 'offers'), {
            taskerId: user.uid,
            taskerName: userProfile.name || 'Anonymous Tasker',
            taskerAvatar: user.photoURL || '',
            offerPrice: Number(offerPrice),
            comment: offerComment,
            createdAt: serverTimestamp(),
        });
        await addNotification(task.postedById, `${userProfile.name} made an offer on your task "${task.title}"`, `/task/${task.id}`);
        toast({ title: "Offer submitted successfully!" });
      }
      setOfferComment('');
      setOfferPrice(task.price);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to submit offer.',
        description: error.message,
      });
      console.error('Error submitting offer:', error);
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  const handleAskQuestion = async () => {
     if (!user || !userProfile || !questionText) {
        if (!user) {
            setIsLoginOpen(true);
        } else {
            toast({ variant: 'destructive', title: "Please write a question." });
        }
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
    if (!isOwner || task.status !== 'open' || !userProfile) return;
    setIsAccepting(offer.id);
    
    // Check if client has enough balance
    if ((userProfile.wallet?.balance ?? 0) < offer.offerPrice) {
        toast({ variant: 'destructive', title: 'Insufficient balance', description: 'Please deposit funds to your wallet to accept this offer.' });
        setIsAccepting(null);
        return;
    }

    try {
      const batch = writeBatch(db);
      const taskRef = doc(db, 'tasks', task.id);

      batch.update(taskRef, {
        status: 'assigned',
        assignedToId: offer.taskerId,
        assignedToName: offer.taskerName,
        price: offer.offerPrice, // Use the offer price as the final price
      });
      
      const conversationRef = doc(collection(db, 'conversations'));
      batch.set(conversationRef, {
        id: conversationRef.id,
        taskId: task.id,
        taskTitle: task.title,
        participants: [task.postedById, offer.taskerId],
        clientName: userProfile.name,
        taskerName: offer.taskerName,
        lastMessage: 'Task assigned. Start conversation!',
        lastMessageAt: serverTimestamp(),
        clientAvatar: user?.photoURL || '',
        taskerAvatar: offer.taskerAvatar || ''
      });

      // Deduct funds from client's wallet
      const clientRef = doc(db, 'users', task.postedById);
      batch.update(clientRef, { 'wallet.balance': increment(-offer.offerPrice) });

      // Add transaction record for client
      const clientTransactionRef = doc(collection(db, 'users', task.postedById, 'transactions'));
      batch.set(clientTransactionRef, {
        amount: -offer.offerPrice,
        type: 'payment',
        description: `Payment for task: ${task.title}`,
        taskId: task.id,
        timestamp: serverTimestamp(),
      });

      await batch.commit();

      await addNotification(offer.taskerId, `Your offer for "${task.title}" was accepted!`, `/messages/${conversationRef.id}`);

      onTaskUpdate?.();

      toast({ title: `Task assigned to ${offer.taskerName}!` });
      router.push(`/messages/${conversationRef.id}`);

    } catch (error: any) {
       toast({ variant: 'destructive', title: "Failed to assign task.", description: error.message });
       console.error("Error accepting offer:", error);
    } finally {
      setIsAccepting(null);
    }
  }

  const handleMessage = async () => {
      if (!user) return;
      
      const q = query(
        collection(db, 'conversations'),
        where('taskId', '==', task.id),
        where('participants', 'array-contains', user.uid)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const conversationId = querySnapshot.docs[0].id;
        router.push(`/messages/${conversationId}`);
      } else {
        toast({ variant: 'destructive', title: 'Conversation not found.' });
      }
  };

  const handleCancelOffer = async (offerId: string) => {
    try {
        // The cloud function will handle decrementing the offer count
        await deleteDoc(doc(db, 'tasks', task.id, 'offers', offerId));
        onTaskUpdate?.();
        toast({ title: 'Offer cancelled.' });
    } catch (error) {
        console.error("Error cancelling offer: ", error);
        toast({ variant: 'destructive', title: 'Could not cancel offer.' });
    }
  };

    const handleCancelTask = async () => {
        if (!isOwner) return;
        try {
            await deleteDoc(doc(db, 'tasks', task.id));
            toast({title: 'Task Cancelled', description: 'Your task has been successfully removed.'});
            onTaskUpdate?.();
            if(onBack) onBack();
            else router.push('/my-tasks');
        } catch (error) {
            console.error("Error cancelling task: ", error);
            toast({ variant: 'destructive', title: 'Could not cancel task.' });
        }
    }

    const handleMarkAsDone = async () => {
      if (user?.uid !== task.assignedToId || task.status !== 'assigned') return;
      setIsProcessing(true);
    
      const markTaskAsDone = async (completionDetails: any) => {
        try {
          const taskRef = doc(db, 'tasks', task.id);
          await updateDoc(taskRef, {
            status: 'pending-completion',
            completionDetails,
          });
          await addNotification(task.postedById, `${task.assignedToName} marked "${task.title}" as done.`, `/task/${task.id}`);
          toast({ title: 'Task Marked as Done', description: 'The client has been notified to review your work.' });
          onTaskUpdate?.();
        } catch (error: any) {
          console.error("Error marking task as done: ", error);
          toast({ variant: 'destructive', title: 'Could not mark task as done.', description: error.message });
        } finally {
          setIsProcessing(false);
        }
      };
    
      const completionDetails: any = { timestamp: serverTimestamp() };
    
      if (task.type === 'physical') {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            completionDetails.location = new GeoPoint(latitude, longitude);
            markTaskAsDone(completionDetails);
          },
          (error) => {
            console.error("Geolocation error:", error);
            toast({
              variant: 'destructive',
              title: 'Location Error',
              description: 'Could not get your location. Please try again.',
            });
            setIsProcessing(false);
          }
        );
      } else {
        markTaskAsDone(completionDetails);
      }
    };
    

    const handleCompleteTask = async () => {
        if (!isOwner || (task.status !== 'assigned' && task.status !== 'pending-completion') || !task.assignedToId) return;
        setIsProcessing(true);
        try {
            const settingsDoc = await getDoc(doc(db, 'settings', 'platform'));
            const commissionRate = settingsDoc.data()?.commissionRate ?? 0.1;

            const taskerRef = doc(db, 'users', task.assignedToId);
            const batch = writeBatch(db);

            // 1. Calculate earnings and commission
            const commission = task.price * commissionRate;
            const taskerEarnings = task.price - commission;

            // 2. Pay the tasker
            batch.update(taskerRef, { 'wallet.balance': increment(taskerEarnings) });
            
            // 3. Create earning transaction for tasker
            const taskerTransactionRef = doc(collection(db, 'users', task.assignedToId, 'transactions'));
            batch.set(taskerTransactionRef, {
                amount: taskerEarnings,
                type: 'earning',
                description: `Earning from task: ${task.title}`,
                taskId: task.id,
                timestamp: serverTimestamp(),
            });

            // 4. Create commission transaction for platform
            const platformTransactionRef = doc(collection(db, 'platform_transactions'));
            batch.set(platformTransactionRef, {
                amount: commission,
                type: 'commission',
                description: `Commission from task: ${task.title}`,
                taskId: task.id,
                taskPrice: task.price,
                commissionRate: commissionRate,
                timestamp: serverTimestamp(),
            });

            // 5. Update task status to 'completed'
            const taskRef = doc(db, 'tasks', task.id);
            batch.update(taskRef, { status: 'completed' });

            await batch.commit();

            toast({ title: 'Task Completed!', description: 'This task has been marked as completed.' });
            await addNotification(task.assignedToId, `The task "${task.title}" has been marked as complete!`, `/my-tasks`);
            onTaskUpdate?.();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Completion Failed',
                description: error.message,
            });
        } finally {
            setIsProcessing(false);
        }
    }

    const handleSubmitReview = async () => {
        if (!user || !task.assignedToId || !userProfile) return;
        if (reviewRating === 0 || !reviewComment) {
            toast({ variant: 'destructive', title: 'Please provide a rating and a comment.' });
            return;
        }

        setIsSubmittingReview(true);
        try {
            await runTransaction(db, async (transaction) => {
                const taskerRef = doc(db, 'users', task.assignedToId!);
                const taskerDoc = await transaction.get(taskerRef);

                if (!taskerDoc.exists()) {
                    throw new Error("Tasker not found!");
                }

                const newReviewRef = doc(collection(db, 'reviews'));
                transaction.set(newReviewRef, {
                    taskId: task.id,
                    taskerId: task.assignedToId,
                    clientId: user.uid,
                    clientName: userProfile.name,
                    clientAvatar: user.photoURL || '',
                    rating: reviewRating,
                    comment: reviewComment,
                    createdAt: serverTimestamp(),
                });

                const taskerData = taskerDoc.data();
                const oldReviewCount = taskerData.reviewCount || 0;
                const oldAverageRating = taskerData.averageRating || 0;
                
                const newReviewCount = oldReviewCount + 1;
                const newAverageRating = ((oldAverageRating * oldReviewCount) + reviewRating) / newReviewCount;

                transaction.update(taskerRef, {
                    reviewCount: newReviewCount,
                    averageRating: newAverageRating
                });
            });

            setHasAlreadyReviewed(true);
            setShowReviewForm(false);
            toast({ title: 'Thank you for your review!' });

        } catch (error: any) {
            console.error("Error submitting review:", error);
            toast({ variant: 'destructive', title: 'Failed to submit review.', description: error.message });
        } finally {
            setIsSubmittingReview(false);
        }
    }

    const handleReportTask = async () => {
        if (!user || !userProfile) {
            setIsLoginOpen(true);
            return;
        }
        if (!reportReason) {
            toast({ variant: 'destructive', title: 'Please provide a reason for the report.' });
            return;
        }
        setIsReporting(true);
        try {
            await addDoc(collection(db, 'reports'), {
                taskId: task.id,
                reporterId: user.uid,
                reporterName: userProfile.name,
                reason: reportReason,
                status: 'pending',
                createdAt: serverTimestamp(),
            });

            // Find an admin to notify
            const adminsQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
            const adminSnapshot = await getDocs(adminsQuery);
            if (!adminSnapshot.empty) {
                const adminId = adminSnapshot.docs[0].id;
                await addNotification(adminId, `Task "${task.title}" has been reported.`, `/admin/disputes`);
            }
            
            toast({ title: 'Task Reported', description: 'Thank you, an admin will review this task shortly.' });
            setReportReason(''); // Clear reason after submit
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to report task.', description: error.message });
        } finally {
            setIsReporting(false);
        }
    };

    const handleRaiseDispute = async () => {
        if (!user || !userProfile || !task.assignedToId) { return; }
        if (!disputeReason) {
            toast({ variant: 'destructive', title: 'Please provide a reason for the dispute.' });
            return;
        }
        setIsDisputing(true);
        try {
            const clientDoc = await getDoc(doc(db, 'users', task.postedById));
            const taskerDoc = await getDoc(doc(db, 'users', task.assignedToId));

            if (!clientDoc.exists() || !taskerDoc.exists()) throw new Error('User not found');

            const clientProfile = clientDoc.data();
            const taskerProfile = taskerDoc.data();

            const newDisputeRef = doc(collection(db, 'disputes'));
            await setDoc(newDisputeRef, {
                taskId: task.id,
                taskTitle: task.title,
                taskPrice: task.price,
                reason: disputeReason,
                raisedBy: { id: user.uid, name: userProfile.name, role: userProfile.accountType },
                participants: {
                    client: { id: task.postedById, name: clientProfile.name, phone: clientProfile.phone },
                    tasker: { id: task.assignedToId, name: taskerProfile.name, phone: taskerProfile.phone },
                },
                status: 'open',
                createdAt: serverTimestamp(),
            });

            await updateDoc(doc(db, 'tasks', task.id), { status: 'disputed' });
            
            toast({ title: 'Dispute Raised', description: 'An admin will review your case shortly.' });
            setDisputeReason('');
            onTaskUpdate?.();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to raise dispute.', description: error.message });
        } finally {
            setIsDisputing(false);
        }
    };


  const handleEditOffer = (offer: Offer) => {
    setEditingOffer(offer);
    setOfferPrice(offer.offerPrice);
    setOfferComment(offer.comment);
  };


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
            IN PROGRESS
          </span>
        );
      case 'pending-completion':
        return (
            <span className="inline-flex items-center rounded-md bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
              PENDING COMPLETION
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
         <Button className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setIsLoginOpen(true)}>
            Login to Apply
        </Button>
      )
    }
    
    const isParticipant = task.postedById === user.uid || task.assignedToId === user.uid;

    if (task.status === 'assigned' || task.status === 'pending-completion') {
        if (isParticipant) {
             return (
                <div className="space-y-2 mt-4">
                    <Button onClick={handleMessage} className="w-full">
                        <MessageSquare className="mr-2 h-4 w-4" /> Message
                    </Button>
                     {user.uid === task.assignedToId && task.status === 'assigned' && (
                        <Button onClick={handleMarkAsDone} variant="outline" className="w-full" disabled={isProcessing}>
                            <Hourglass className="mr-2 h-4 w-4" /> 
                            {isProcessing ? 'Processing...' : 'Mark as Done'}
                        </Button>
                     )}
                     {isOwner && task.status === 'pending-completion' && (
                        <Button onClick={handleCompleteTask} disabled={isProcessing} className="w-full">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {isProcessing ? 'Processing...' : 'Accept & Release Payment'}
                        </Button>
                     )}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full">
                                <ShieldAlert className="mr-2 h-4 w-4" /> Raise a Dispute
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Raise a Dispute</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Please explain why you are raising a dispute. An admin will review the case. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                             <Textarea
                                placeholder="Explain the issue..."
                                value={disputeReason}
                                onChange={(e) => setDisputeReason(e.target.value)}
                                className="my-4"
                            />
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleRaiseDispute} disabled={isDisputing || !disputeReason}>
                                    {isDisputing ? 'Submitting...' : 'Submit Dispute'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            );
        }
    }

    if (task.status === 'disputed') {
      return <Button className="w-full mt-4" disabled>Dispute in Progress</Button>;
    }

    
    if (task.status === 'completed') {
        if (isOwner && !hasAlreadyReviewed && !showReviewForm) {
            return (
                <Button className="w-full mt-4" onClick={() => setShowReviewForm(true)}>
                    <Star className="mr-2 h-4 w-4" /> Leave a Review
                </Button>
            );
        }
         if (isOwner && hasAlreadyReviewed) {
            return <Button className="w-full mt-4" disabled>Review Submitted</Button>;
        }
        return <Button className="w-full mt-4" disabled>Task Completed</Button>
    }


    if (isOwner) { // Client view on 'open' task
       if (offers.length > 0) {
         return <Button className="w-full mt-4" disabled>Review Offers Below</Button>
       }
       return (
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full mt-4">
                        <XCircle className="mr-2 h-4 w-4" /> Cancel Task
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete your task and cannot be undone.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Back</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancelTask}>Yes, Cancel Task</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
       );
    }

    // Tasker view on 'open' task
    if (userProfile?.accountType === 'tasker') {
        const hasMadeOffer = offers.some(o => o.taskerId === user.uid) && !editingOffer;
        if (hasMadeOffer) {
            return <Button className="w-full mt-4" disabled>Offer Already Made</Button>
        }
        return (
            <Card className="mt-4">
                <CardContent className="p-4 space-y-2">
                    <p className="font-semibold text-center">{editingOffer ? "Edit Your Offer" : "Make an Offer"}</p>
                    <Input 
                        type="number" 
                        placeholder={`Your price (${settings?.currencySymbol})`}
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
                        {isSubmittingOffer ? "Submitting..." : (editingOffer ? "Update Offer" : "Submit Offer")}
                    </Button>
                    {editingOffer && (
                        <Button variant="ghost" onClick={() => setEditingOffer(null)} className="w-full">
                            Cancel Edit
                        </Button>
                    )}
                </CardContent>
            </Card>
        )
    }
    
    return null;
  }

  const renderReviewForm = () => {
        if (!showReviewForm || hasAlreadyReviewed) return null;

        return (
            <Card className="mt-4">
                <CardContent className="p-4 space-y-4">
                    <h3 className="font-bold text-center">Leave a Review for {task.assignedToName}</h3>
                    <div className="flex justify-center">
                        <StarRating rating={reviewRating} setRating={setReviewRating} />
                    </div>
                    <Textarea
                        placeholder="Share your experience..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        disabled={isSubmittingReview}
                    />
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowReviewForm(false)}
                            disabled={isSubmittingReview}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSubmitReview} disabled={isSubmittingReview} className="flex-1">
                            {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    };


  return (
    <>
    <ScrollArea className="h-full">
      <div className="p-4 md:p-6 space-y-6 bg-card text-card-foreground h-full">
        {!isPage && onBack && (
          <div className="flex justify-between items-center mb-4">
              <Button
                variant="ghost"
                onClick={onBack}
                className="pl-0"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to tasks
              </Button>
              {getStatusPill(task.status)}
          </div>
        )}

        {isPage && (
          <div className="flex justify-between items-center mb-4">
            <span /> 
            {getStatusPill(task.status)}
          </div>
        )}

        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold font-headline">{task.title}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 gap-4 text-sm text-foreground mb-6">
                <div className="flex items-start p-3 rounded-lg bg-muted/50">
                    <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage
                        src=""
                        data-ai-hint="person face"
                    />
                    <AvatarFallback>{task.postedBy.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                    <p className="font-semibold uppercase text-xs text-muted-foreground">POSTED BY</p>
                    <p className="truncate">{task.postedBy}</p>
                    </div>
                </div>
                <div className="flex items-start p-3 rounded-lg bg-muted/50">
                    <MapPin className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div>
                    <p className="font-semibold uppercase text-xs text-muted-foreground">LOCATION</p>
                    <p className="truncate">{task.location}</p>
                     {task.type === 'physical' && task.coordinates && (
                        <a href={`https://www.google.com/maps/search/?api=1&query=${task.coordinates[0]},${task.coordinates[1]}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="link" size="sm" className="p-0 h-auto -ml-1">
                            View on map
                        </Button>
                        </a>
                    )}
                    </div>
                </div>
                 <div className="flex items-start p-3 rounded-lg bg-muted/50">
                    <Calendar className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div>
                    <p className="font-semibold uppercase text-xs text-muted-foreground">TO BE DONE ON</p>
                    <p>{task.date instanceof Timestamp ? task.date.toDate().toLocaleDateString() : task.date}</p>
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
                <p className="text-3xl font-bold">{settings?.currencySymbol ?? 'Rs'}{task.price}</p>
                {renderActionButtons()}
                {renderReviewForm()}
              </CardContent>
            </Card>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                        Report this task
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Report Task</AlertDialogTitle>
                        <AlertDialogDescription>
                            Please provide a reason for reporting this task. An admin will review it shortly.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea
                        placeholder="Enter reason here..."
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="my-4"
                    />
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReportTask} disabled={isReporting || !reportReason}>
                            {isReporting ? 'Submitting...' : 'Submit Report'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        <div className="space-y-8">
            <div>
                <h3 className="text-xl font-bold font-headline mb-4">Offers ({offers.length})</h3>
                 <div className="space-y-6">
                  {loadingOffers ? <p>Loading offers...</p> : offers.map(offer => (
                    <Card key={offer.id}>
                      <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
                        <div className="flex-shrink-0 flex flex-col items-center text-center sm:border-r sm:pr-4 sm:w-32">
                            <Link href={`/profile/${offer.taskerId}`}>
                              <Avatar className="h-12 w-12 cursor-pointer">
                                <AvatarImage
                                  src={offer.taskerAvatar || ''}
                                  data-ai-hint="person face"
                                />
                                <AvatarFallback>
                                  {offer.taskerName.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </Link>
                          <Link href={`/profile/${offer.taskerId}`}><p className="font-semibold mt-2 hover:underline">{offer.taskerName}</p></Link>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                             <div>
                                {isOwner ? (
                                  <p className="text-lg font-bold">{settings?.currencySymbol ?? 'Rs'}{offer.offerPrice}</p>
                                ) : (
                                  <p className="text-sm font-semibold">Made an offer</p>
                                )}
                              </div>
                            {isOwner && task.status === 'open' && (
                              <Button size="sm" onClick={() => handleAcceptOffer(offer)} disabled={isAccepting !== null}>
                                {isAccepting === offer.id ? "Accepting..." : "Accept"}
                              </Button>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            {offer.comment}
                          </p>
                           {user?.uid === offer.taskerId && task.status === 'open' && (
                                <div className="flex gap-2 mt-2">
                                    <Button size="sm" variant="outline" onClick={() => handleEditOffer(offer)}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="sm" variant="destructive">
                                                <Trash2 className="mr-2 h-4 w-4" /> Cancel
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently cancel your offer.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Back</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleCancelOffer(offer.id)}>Yes, Cancel</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>

                                </div>
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {offers.length === 0 && !loadingOffers && <p className="text-muted-foreground text-sm text-center py-4">There are no offers yet.</p>}
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold font-headline mb-4">Questions ({questions.length})</h3>
                <div className="space-y-6">
                  {loadingQuestions ? <p>Loading questions...</p> : questions.map(q => (
                    <Card key={q.id}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={q.userAvatar || ''}
                              data-ai-hint="person face"
                            />
                            <AvatarFallback>{q.userName.slice(0, 2).toUpperCase()}</AvatarFallback>
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
                    
                    <Card className="mt-6">
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
                </div>
            </div>
        </div>

        <Separator className="my-6" />

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
    <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </>
  );
}
