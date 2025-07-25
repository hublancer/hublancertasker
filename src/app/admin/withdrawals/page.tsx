
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, Timestamp, orderBy, doc, getDoc, writeBatch, serverTimestamp, updateDoc, increment, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface WithdrawalRequest {
    id: string;
    userId: string;
    userName: string;
    amount: number;
    method: string;
    details: string;
    status: 'pending' | 'completed' | 'rejected';
    createdAt: Timestamp;
    rejectionReason?: string;
}

export default function AdminWithdrawalsPage() {
    const { settings } = useAuth();
    const { toast } = useToast();
    const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'withdrawals'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawalRequest));
            setRequests(reqs);
        } catch (error) {
            console.error("Error fetching withdrawal requests:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch withdrawal requests.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleApprove = async (req: WithdrawalRequest) => {
        if (!req || !req.id || !req.userId) return;
        setProcessingId(req.id);
        
        try {
            const userRef = doc(db, 'users', req.userId);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists() || (userDoc.data()?.wallet?.balance ?? 0) < req.amount) {
                await updateDoc(doc(db, 'withdrawals', req.id), { 
                    status: 'rejected', 
                    processedAt: serverTimestamp(),
                    rejectionReason: 'Insufficient funds'
                });
                toast({ variant: 'destructive', title: 'Error', description: 'Insufficient funds. Withdrawal rejected.' });
                setProcessingId(null);
                fetchRequests();
                return;
            }

            const batch = writeBatch(db);
            
            // 1. Update the withdrawal request
            const withdrawalRef = doc(db, 'withdrawals', req.id);
            batch.update(withdrawalRef, { status: 'completed', processedAt: serverTimestamp() });
            
            // 2. Deduct funds from user's wallet
            batch.update(userRef, { 'wallet.balance': increment(-req.amount) });
            
            // 3. Create a transaction record for the user
            const transactionRef = doc(collection(db, 'users', req.userId, 'transactions'));
            batch.set(transactionRef, {
                amount: -req.amount,
                type: 'withdrawal',
                description: `Funds withdrawn to ${req.method}`,
                timestamp: serverTimestamp(),
            });
            
            await batch.commit();

            toast({ title: 'Success', description: 'Withdrawal has been processed.' });
            fetchRequests();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to approve withdrawal.' });
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string) => {
        if (!id) return;
        setProcessingId(id);
        try {
            const withdrawalRef = doc(db, 'withdrawals', id);
            await updateDoc(withdrawalRef, { status: 'rejected', processedAt: serverTimestamp() });
            toast({ title: 'Success', description: 'Withdrawal has been rejected.' });
            fetchRequests();
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to reject withdrawal.' });
        } finally {
            setProcessingId(null);
        }
    };

     if (loading) return <p>Loading withdrawal requests...</p>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Pending Withdrawal Requests</CardTitle>
                <CardDescription>Review and process withdrawal requests from users.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.length === 0 ? (
                             <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">No pending requests.</TableCell>
                            </TableRow>
                        ) : (
                            requests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell>{req.userName || req.userId}</TableCell>
                                    <TableCell>{settings?.currencySymbol}{req.amount.toFixed(2)}</TableCell>
                                    <TableCell>{req.method}</TableCell>
                                    <TableCell><pre className="text-xs whitespace-pre-wrap font-sans">{req.details}</pre></TableCell>
                                    <TableCell>{req.createdAt.toDate().toLocaleString()}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="sm" disabled={!!processingId} variant="default">
                                                     {processingId === req.id ? 'Processing...' : 'Approve'}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Confirm Withdrawal Approval</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to approve this withdrawal? This will send funds to the user.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <div className="my-4 space-y-2 text-sm text-foreground text-left p-2 bg-muted rounded-md">
                                                    <p><strong>User:</strong> {req.userName}</p>
                                                    <p><strong>Amount:</strong> {settings?.currencySymbol}{req.amount.toFixed(2)}</p>
                                                    <p><strong>Method:</strong> {req.method}</p>
                                                </div>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleApprove(req)}>Approve</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="sm" variant="destructive" disabled={!!processingId}>
                                                    {processingId === req.id ? 'Processing...' : 'Reject'}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Confirm Withdrawal Rejection</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to reject this withdrawal request? This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleReject(req.id)}>Reject</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
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
