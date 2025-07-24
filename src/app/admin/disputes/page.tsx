'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, writeBatch, serverTimestamp, increment, getDoc, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { MessageSquare, BadgeCent, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface Dispute {
    id: string;
    taskId: string;
    taskTitle: string;
    reason: string;
    raisedBy: { id: string, name: string, role: string };
    participants: { client: { id: string, name: string, phone?: string }, tasker: { id: string, name: string, phone?: string } };
    taskPrice: number;
    status: 'open' | 'resolved';
    createdAt: any;
}

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
)

export default function AdminDisputesPage() {
    const { toast } = useToast();
    const { settings, addNotification } = useAuth();
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'disputes'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const disputesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Dispute));
            setDisputes(disputesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching disputes:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    
    const handleResolve = async (dispute: Dispute, favor: 'client' | 'tasker') => {
        if (!dispute || !dispute.id) return;
        setProcessingId(dispute.id);

        try {
            const batch = writeBatch(db);
            
            // 1. Mark dispute as resolved
            const disputeRef = doc(db, 'disputes', dispute.id);
            batch.update(disputeRef, { status: 'resolved', resolvedAt: serverTimestamp(), resolution: `Admin favored ${favor}` });
            
            // 2. Mark task as completed (to prevent further actions)
            const taskRef = doc(db, 'tasks', dispute.taskId);
            batch.update(taskRef, { status: 'completed' });

            if (favor === 'client') {
                // Refund client
                const clientRef = doc(db, 'users', dispute.participants.client.id);
                batch.update(clientRef, { 'wallet.balance': increment(dispute.taskPrice) });

                const clientTransactionRef = doc(collection(db, 'users', dispute.participants.client.id, 'transactions'));
                batch.set(clientTransactionRef, {
                    amount: dispute.taskPrice,
                    type: 'refund',
                    description: `Refund for disputed task: ${dispute.taskTitle}`,
                    taskId: dispute.taskId,
                    timestamp: serverTimestamp(),
                });
                await addNotification(dispute.participants.client.id, `Your dispute for "${dispute.taskTitle}" was resolved in your favor.`, `/my-tasks`);
                await addNotification(dispute.participants.tasker.id, `Your dispute for "${dispute.taskTitle}" was resolved in the client's favor.`, `/my-tasks`);

            } else { // Favor tasker
                const settingsDoc = await getDoc(doc(db, 'settings', 'platform'));
                const commissionRate = settingsDoc.data()?.commissionRate ?? 0.1;
                const commission = dispute.taskPrice * commissionRate;
                const taskerEarnings = dispute.taskPrice - commission;

                // Pay tasker
                const taskerRef = doc(db, 'users', dispute.participants.tasker.id);
                batch.update(taskerRef, { 'wallet.balance': increment(taskerEarnings) });
                
                // Create earning transaction for tasker
                const taskerTransactionRef = doc(collection(db, 'users', dispute.participants.tasker.id, 'transactions'));
                batch.set(taskerTransactionRef, {
                    amount: taskerEarnings,
                    type: 'earning',
                    description: `Payment for disputed task: ${dispute.taskTitle}`,
                    taskId: dispute.taskId,
                    timestamp: serverTimestamp(),
                });

                 // Create commission transaction for platform
                const platformTransactionRef = doc(collection(db, 'platform_transactions'));
                batch.set(platformTransactionRef, {
                    amount: commission, type: 'commission', description: `Commission from disputed task: ${dispute.taskTitle}`,
                    taskId: dispute.taskId, taskPrice: dispute.taskPrice, commissionRate: commissionRate, timestamp: serverTimestamp(),
                });

                await addNotification(dispute.participants.tasker.id, `Your dispute for "${dispute.taskTitle}" was resolved in your favor.`, `/my-tasks`);
                await addNotification(dispute.participants.client.id, `Your dispute for "${dispute.taskTitle}" was resolved in the tasker's favor.`, `/my-tasks`);
            }

            await batch.commit();
            toast({ title: 'Dispute Resolved', description: `Funds have been released to the ${favor}.` });
        } catch (error: any) {
            console.error("Error resolving dispute:", error);
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to resolve dispute.' });
        } finally {
            setProcessingId(null);
        }
    }

    if (loading) return <p>Loading disputes...</p>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Dispute Management</CardTitle>
                <CardDescription>Review and resolve disputes between clients and taskers.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Task</TableHead>
                            <TableHead>Raised By</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {disputes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">No disputes found.</TableCell>
                            </TableRow>
                        ) : (
                            disputes.map(d => (
                                <TableRow key={d.id}>
                                    <TableCell>
                                        <Link href={`/task/${d.taskId}`} className="font-medium hover:underline" target="_blank">
                                            {d.taskTitle}
                                        </Link>
                                         <p className="text-xs text-muted-foreground font-mono">{d.taskId}</p>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/profile/${d.raisedBy.id}`} className="hover:underline" target="_blank">
                                            {d.raisedBy.name}
                                        </Link>
                                         <p className="text-xs text-muted-foreground capitalize">{d.raisedBy.role}</p>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">{d.reason}</TableCell>
                                    <TableCell>
                                        <Badge variant={d.status === 'open' ? 'destructive' : 'secondary'}>{d.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                       {d.status === 'open' && (
                                        <>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button size="sm" variant="outline" disabled={!!processingId}>Resolve</Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Resolve Dispute</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Review the conversation and user details before making a decision. This action is final and will transfer funds.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <div className="my-4 space-y-2 text-sm">
                                                        <p><strong>Client:</strong> {d.participants.client.name}</p>
                                                        <p><strong>Tasker:</strong> {d.participants.tasker.name}</p>
                                                        <p><strong>Task Price:</strong> {settings?.currencySymbol}{d.taskPrice.toFixed(2)}</p>
                                                        <div className="flex gap-2 mt-2">
                                                            {d.participants.client.phone && (
                                                                <Button asChild size="sm" variant="outline">
                                                                    <Link href={`https://wa.me/${d.participants.client.phone.replace(/\D/g, '')}`} target="_blank"><WhatsAppIcon /> Client</Link>
                                                                </Button>
                                                            )}
                                                            {d.participants.tasker.phone && (
                                                                <Button asChild size="sm" variant="outline">
                                                                     <Link href={`https://wa.me/${d.participants.tasker.phone.replace(/\D/g, '')}`} target="_blank"><WhatsAppIcon /> Tasker</Link>
                                                                </Button>
                                                            )}
                                                            <Button asChild size="sm" variant="outline">
                                                                <Link href={`/messages?taskId=${d.taskId}`} target="_blank"><MessageSquare className="h-4 w-4 mr-1"/> Conversation</Link>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel disabled={!!processingId}>Cancel</AlertDialogCancel>
                                                        <Button variant="secondary" onClick={() => handleResolve(d, 'client')} disabled={!!processingId}>
                                                            <User className="mr-2 h-4 w-4"/>
                                                            {processingId === d.id ? "Processing..." : "Refund Client"}
                                                        </Button>
                                                        <Button onClick={() => handleResolve(d, 'tasker')} disabled={!!processingId}>
                                                            <BadgeCent className="mr-2 h-4 w-4"/>
                                                            {processingId === d.id ? "Processing..." : "Pay Tasker"}
                                                        </Button>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </>
                                       )}
                                       {d.status === 'resolved' && (
                                          <ShieldCheck className="h-5 w-5 text-green-500 inline-block" />
                                       )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
