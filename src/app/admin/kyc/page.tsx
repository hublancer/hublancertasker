
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';

interface KycRequest {
    userId: string;
    userName: string;
    fullName: string;
    cnic: string;
    cnicPhotoUrl: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: any;
}

export default function AdminKycPage() {
    const { toast } = useToast();
    const [requests, setRequests] = useState<KycRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'kycSubmissions'), where('status', '==', 'pending'), orderBy('submittedAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqs = snapshot.docs.map(doc => ({ ...doc.data() } as KycRequest));
            setRequests(reqs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching KYC requests:", error);
            setLoading(false);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch KYC requests.' });
        });
        return () => unsubscribe();
    }, [toast]);

    const handleApprove = async (req: KycRequest) => {
        setProcessingId(req.userId);
        try {
            const batch = writeBatch(db);
            const kycRef = doc(db, 'kycSubmissions', req.userId);
            const userRef = doc(db, 'users', req.userId);

            batch.update(kycRef, { status: 'approved' });
            batch.update(userRef, { kycStatus: 'approved', isVerified: true });

            await batch.commit();
            toast({ title: 'Success', description: 'KYC has been approved.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (userId: string) => {
        setProcessingId(userId);
        try {
            const batch = writeBatch(db);
            const kycRef = doc(db, 'kycSubmissions', userId);
            const userRef = doc(db, 'users', userId);

            // In a real app, you'd probably want a reason for rejection.
            batch.update(kycRef, { status: 'rejected' });
            batch.update(userRef, { kycStatus: 'rejected', isVerified: false });
            
            await batch.commit();

            toast({ title: 'Success', description: 'KYC has been rejected.' });
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setProcessingId(null);
        }
    };
    
    if (loading) return <p>Loading KYC requests...</p>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Pending KYC Requests</CardTitle>
                <CardDescription>Review and process identity verification requests from taskers.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Full Name</TableHead>
                            <TableHead>CNIC</TableHead>
                             <TableHead>CNIC Photo</TableHead>
                            <TableHead>Submitted At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">No pending KYC requests.</TableCell>
                            </TableRow>
                        ) : (
                            requests.map(req => (
                                <TableRow key={req.userId}>
                                    <TableCell>
                                        <Link href={`/profile/${req.userId}`} className="hover:underline text-primary font-medium">
                                            {req.userName}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{req.fullName}</TableCell>
                                    <TableCell className="font-mono">{req.cnic}</TableCell>
                                    <TableCell>
                                        <a href={req.cnicPhotoUrl} target="_blank" rel="noopener noreferrer">
                                            <Button variant="link">View Photo</Button>
                                        </a>
                                    </TableCell>
                                    <TableCell>{req.submittedAt.toDate().toLocaleString()}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button size="sm" onClick={() => handleApprove(req)} disabled={!!processingId}>
                                            {processingId === req.userId ? '...' : 'Approve'}
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleReject(req.userId)} disabled={!!processingId}>
                                            {processingId === req.userId ? '...' : 'Reject'}
                                        </Button>
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
