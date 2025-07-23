
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp, orderBy, doc, updateDoc, writeBatch, FieldValue, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface DepositRequest {
    id: string;
    userId: string;
    userName: string;
    amount: number;
    gatewayName: string;
    trxId?: string;
    status: 'pending' | 'completed' | 'rejected';
    createdAt: Timestamp;
}

export default function AdminDepositsPage() {
    const { settings } = useAuth();
    const { toast } = useToast();
    const [requests, setRequests] = useState<DepositRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'deposits'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DepositRequest));
            setRequests(reqs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching deposit requests:", error);
            setLoading(false);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch deposit requests.' });
        });
        return () => unsubscribe();
    }, [toast]);

    const handleApprove = async (req: DepositRequest) => {
        if (!req || !req.id || !req.userId) return;
        setProcessingId(req.id);
        try {
            const batch = writeBatch(db);

            // 1. Update the deposit document
            const depositRef = doc(db, 'deposits', req.id);
            batch.update(depositRef, { status: 'completed', processedAt: serverTimestamp() });

            // 2. Update the user's wallet balance
            const userRef = doc(db, 'users', req.userId);
            batch.update(userRef, { 'wallet.balance': FieldValue.increment(req.amount) });

            // 3. Create a transaction record for the user
            const transactionRef = doc(collection(db, 'users', req.userId, 'transactions'));
            batch.set(transactionRef, {
                amount: req.amount,
                type: 'deposit',
                description: `Funds deposited via ${req.gatewayName}`,
                timestamp: serverTimestamp(),
            });

            await batch.commit();

            toast({ title: 'Success', description: 'Deposit has been approved.' });
        } catch (error: any) {
            console.error('Error approving deposit:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to approve deposit.' });
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string) => {
        if (!id) return;
        setProcessingId(id);
        try {
            const depositRef = doc(db, 'deposits', id);
            await updateDoc(depositRef, { status: 'rejected', processedAt: serverTimestamp() });
            toast({ title: 'Success', description: 'Deposit has been rejected.' });
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to reject deposit.' });
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <p>Loading deposit requests...</p>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Pending Deposit Requests</CardTitle>
                <CardDescription>Review and process manual deposit requests from users.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Gateway</TableHead>
                            <TableHead>Transaction ID</TableHead>
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
                                    <TableCell>{req.gatewayName}</TableCell>
                                    <TableCell className="font-mono">{req.trxId}</TableCell>
                                    <TableCell>{req.createdAt.toDate().toLocaleString()}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="sm" disabled={!!processingId}>
                                                    {processingId === req.id ? 'Processing...' : 'Approve'}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Confirm Deposit Approval</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to approve this deposit? This will add funds to the user's wallet.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <div className="my-4 space-y-2 text-sm text-foreground text-left p-2 bg-muted rounded-md">
                                                    <p><strong>User:</strong> {req.userName}</p>
                                                    <p><strong>Amount:</strong> {settings?.currencySymbol}{req.amount.toFixed(2)}</p>
                                                    <p><strong>Gateway:</strong> {req.gatewayName}</p>
                                                    <p><strong>TRX ID:</strong> {req.trxId}</p>
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
                                                    <AlertDialogTitle>Confirm Deposit Rejection</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to reject this deposit? This action cannot be undone.
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
