'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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


export default function AdminTransactionsPage() {
    const { settings } = useAuth();
    const [transactions, setTransactions] = useState<PlatformTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            setLoading(true);
            const q = query(collection(db, 'platform_transactions'), orderBy('timestamp', 'desc'));
            const querySnapshot = await getDocs(q);
            const transactionsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlatformTransaction));
            setTransactions(transactionsData);
            setLoading(false);
        };
        fetchTransactions();
    }, []);

    if (loading) {
        return <div>Loading transactions...</div>;
    }

    const totalRevenue = transactions.reduce((acc, t) => acc + t.amount, 0);

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
                </CardContent>
            </Card>
        </div>
    )
}
