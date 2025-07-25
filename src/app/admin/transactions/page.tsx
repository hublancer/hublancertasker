
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, Timestamp, limit, startAfter, DocumentSnapshot } from 'firebase/firestore';
import { useEffect, useState, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface PlatformTransaction {
    id: string;
    amount: number;
    type: 'commission';
    description: string;
    taskId: string;
    taskPrice: number;
    commissionRate: number;
    timestamp: Timestamp;
}

const PAGE_SIZE = 20;

export default function AdminTransactionsPage() {
    const { settings } = useAuth();
    const [transactions, setTransactions] = useState<PlatformTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [totalRevenue, setTotalRevenue] = useState(0);

    const fetchTransactions = useCallback(async (loadMore = false) => {
        if (loadMore) {
            setLoadingMore(true);
        } else {
            setLoading(true);
            const allTransactionsSnapshot = await getDocs(collection(db, 'platform_transactions'));
            const total = allTransactionsSnapshot.docs.reduce((acc, t) => acc + t.data().amount, 0);
            setTotalRevenue(total);
        }

        try {
            let q = query(collection(db, 'platform_transactions'), orderBy('timestamp', 'desc'), limit(PAGE_SIZE));

            if (loadMore && lastVisible) {
                q = query(collection(db, 'platform_transactions'), orderBy('timestamp', 'desc'), startAfter(lastVisible), limit(PAGE_SIZE));
            }

            const querySnapshot = await getDocs(q);
            const transactionsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlatformTransaction));

            setTransactions(prev => loadMore ? [...prev, ...transactionsData] : transactionsData);
            setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
            setHasMore(querySnapshot.docs.length === PAGE_SIZE);

        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [lastVisible]);


    useEffect(() => {
        fetchTransactions();
    }, []);

    if (loading) {
        return <div>Loading transactions...</div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{settings?.currencySymbol ?? 'Rs'}{totalRevenue.toFixed(2)}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Platform Transactions</CardTitle>
                    <CardDescription>A list of all commissions earned by the platform.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Task ID</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Task Price</TableHead>
                                <TableHead>Rate</TableHead>
                                <TableHead className="text-right">Commission</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map(t => (
                                <TableRow key={t.id}>
                                    <TableCell>{t.timestamp?.toDate().toLocaleDateString()}</TableCell>
                                    <TableCell className="font-mono text-xs">{t.taskId}</TableCell>
                                    <TableCell>{t.description}</TableCell>
                                    <TableCell>{settings?.currencySymbol ?? 'Rs'}{t.taskPrice.toFixed(2)}</TableCell>
                                    <TableCell>{(t.commissionRate * 100).toFixed(0)}%</TableCell>
                                    <TableCell className="text-right font-mono text-green-600">
                                       +{settings?.currencySymbol ?? 'Rs'}{t.amount.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                     {hasMore && (
                        <div className="mt-4 text-center">
                            <Button onClick={() => fetchTransactions(true)} disabled={loadingMore}>
                                {loadingMore ? 'Loading...' : 'Load More'}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
