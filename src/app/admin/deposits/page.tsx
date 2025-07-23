
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { approveDeposit, rejectDeposit } from '@/app/actions';
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

    const handleApprove = async (id: string) => {
        setProcessingId(id);
        const result = await approveDeposit(id);
        if (result.success) {
            toast({ title: 'Success', description: 'Deposit has been approved.' });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error ?? 'Failed to approve deposit.' });
        }
        setProcessingId(null);
    };

    const handleReject = async (id: string) => {
        setProcessingId(id);
        const result = await rejectDeposit(id);
        if (result.success) {
            toast({ title: 'Success', description: 'Deposit has been rejected.' });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error ?? 'Failed to reject deposit.' });
        }
        setProcessingId(null);
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
                                                <Button size="sm" disabled={processingId !== null}>
                                                    {processingId === req.id ? '...' : 'Approve'}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Confirm Deposit Approval</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to approve this deposit?
                                                        <ul className="mt-4 space-y-1 text-sm text-foreground">
                                                            <li><strong>User:</strong> {req.userName}</li>
                                                            <li><strong>Amount:</strong> {settings?.currencySymbol}{req.amount.toFixed(2)}</li>
                                                            <li><strong>Gateway:</strong> {req.gatewayName}</li>
                                                            <li><strong>TRX ID:</strong> {req.trxId}</li>
                                                        </ul>
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleApprove(req.id)}>Approve</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="sm" variant="destructive" disabled={processingId !== null}>
                                                    {processingId === req.id ? '...' : 'Reject'}
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
