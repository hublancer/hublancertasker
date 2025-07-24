
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Report {
    id: string;
    taskId: string;
    reporterId: string;
    reporterName: string;
    reason: string;
    status: 'pending' | 'resolved';
    createdAt: any;
}

export default function AdminSupportPage() {
    const { toast } = useToast();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reportsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
            setReports(reportsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching reports:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    
    const handleResolve = async (reportId: string) => {
        try {
            const reportRef = doc(db, 'reports', reportId);
            await updateDoc(reportRef, { status: 'resolved', resolvedAt: serverTimestamp() });
            toast({ title: 'Report Resolved' });
        } catch (error: any) {
            console.error("Error resolving report:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to resolve report.' });
        }
    }

    if (loading) return <p>Loading reports...</p>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Support & Reports</CardTitle>
                <CardDescription>Review and manage user-reported tasks.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Task ID</TableHead>
                            <TableHead>Reported By</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reports.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">No reports found.</TableCell>
                            </TableRow>
                        ) : (
                            reports.map(r => (
                                <TableRow key={r.id}>
                                    <TableCell>
                                        <Link href={`/task/${r.taskId}`} className="font-medium hover:underline" target="_blank">
                                            <p className="font-mono text-xs">{r.taskId}</p>
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/profile/${r.reporterId}`} className="hover:underline" target="_blank">
                                            {r.reporterName}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">{r.reason}</TableCell>
                                    <TableCell>
                                        <Badge variant={r.status === 'pending' ? 'destructive' : 'secondary'}>{r.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                       <Button asChild size="sm" variant="outline">
                                           <Link href={`/task/${r.taskId}`} target="_blank">View Task</Link>
                                       </Button>
                                       {r.status === 'pending' && (
                                            <Button size="sm" onClick={() => handleResolve(r.id)}>
                                                Mark as Resolved
                                            </Button>
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
