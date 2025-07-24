'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Trash2, Check } from 'lucide-react';

interface Report {
    id: string;
    taskId: string;
    reason: string;
    reporterName: string;
    reporterId: string;
    status: 'pending' | 'resolved';
    createdAt: Timestamp;
}

export default function AdminDisputesPage() {
    const { toast } = useToast();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reportsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
            setReports(reportsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleDismissReport = async (reportId: string) => {
        const reportRef = doc(db, 'reports', reportId);
        await updateDoc(reportRef, { status: 'resolved' });
        toast({ title: 'Report Dismissed' });
    };

    const handleDeleteTask = async (report: Report) => {
        try {
            // Delete the task
            await deleteDoc(doc(db, 'tasks', report.taskId));
            // Mark the report as resolved
            await updateDoc(doc(db, 'reports', report.id), { status: 'resolved' });
            toast({ title: 'Task Deleted', description: 'The reported task has been removed.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete task.' });
        }
    };

    if (loading) return <p>Loading reports...</p>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Task Reports</CardTitle>
                <CardDescription>Review and manage user-submitted reports on tasks.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Task ID</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Reported By</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reports.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">No reports found.</TableCell>
                            </TableRow>
                        ) : (
                            reports.map(report => (
                                <TableRow key={report.id}>
                                    <TableCell>{report.createdAt.toDate().toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Link href={`/task/${report.taskId}`} className="font-mono text-xs hover:underline" target="_blank">
                                            {report.taskId}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">{report.reason}</TableCell>
                                    <TableCell>
                                        <Link href={`/profile/${report.reporterId}`} className="hover:underline">
                                            {report.reporterName}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={report.status === 'pending' ? 'destructive' : 'secondary'}>{report.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                       {report.status === 'pending' && (
                                        <>
                                            <Button size="icon" variant="outline" onClick={() => handleDismissReport(report.id)}>
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button size="icon" variant="destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently delete the task. This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteTask(report)}>Delete Task</AlertDialogAction>
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
            </CardContent>
        </Card>
    );
}
