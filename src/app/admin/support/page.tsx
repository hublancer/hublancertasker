
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, serverTimestamp, deleteDoc, getDocs, limit, startAfter, DocumentSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Report {
    id: string;
    taskId: string;
    reporterId: string;
    reporterName: string;
    reason: string;
    status: 'pending' | 'resolved';
    createdAt: any;
}

const PAGE_SIZE = 15;

export default function AdminSupportPage() {
    const { toast } = useToast();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
    const [hasMore, setHasMore] = useState(true);

     const fetchReports = useCallback(async (loadMore = false) => {
        if (!loadMore) {
            setLoading(true);
            setReports([]);
            setLastVisible(null);
            setHasMore(true);
        } else {
            setLoadingMore(true);
        }

        try {
            let q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
            if (loadMore && lastVisible) {
                q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), startAfter(lastVisible), limit(PAGE_SIZE));
            }
            const querySnapshot = await getDocs(q);
            const reportsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
            setReports(prev => loadMore ? [...prev, ...reportsData] : reportsData);
            setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
            setHasMore(querySnapshot.docs.length === PAGE_SIZE);
        } catch (error) {
            console.error("Error fetching reports:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch reports.' });
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);
    
    const handleResolve = async (reportId: string) => {
        try {
            const reportRef = doc(db, 'reports', reportId);
            await updateDoc(reportRef, { status: 'resolved', resolvedAt: serverTimestamp() });
            toast({ title: 'Report Resolved' });
            fetchReports(); // Re-fetch to update the list
        } catch (error: any) {
            console.error("Error resolving report:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to resolve report.' });
        }
    }

    const handleDeleteTask = async (report: Report) => {
        try {
            // First, delete the task
            await deleteDoc(doc(db, 'tasks', report.taskId));
            
            // Then, update the report status
            const reportRef = doc(db, 'reports', report.id);
            await updateDoc(reportRef, { status: 'resolved', resolvedAt: serverTimestamp(), resolution: 'Task deleted' });
            
            toast({ title: 'Task Deleted', description: 'The reported task has been removed.' });
            fetchReports(); // Re-fetch to update the list
        } catch (error: any) {
             console.error("Error deleting task:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete task.' });
        }
    };

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
                                        <>
                                            <Button size="sm" onClick={() => handleResolve(r.id)}>
                                                Mark as Resolved
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button size="sm" variant="destructive">Delete Task</Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the task.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteTask(r)}>Delete Task</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </>
                                       )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                {hasMore && (
                    <div className="mt-4 text-center">
                        <Button onClick={() => fetchReports(true)} disabled={loadingMore}>
                            {loadingMore ? 'Loading...' : 'Load More'}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
