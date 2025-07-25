
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, where, Timestamp, getDocs, limit, startAfter, DocumentSnapshot } from 'firebase/firestore';
import AppHeader from '@/components/AppHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowDownLeft, ArrowUpRight, DollarSign, Hourglass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DepositModal } from '@/components/wallet/DepositModal';
import { WithdrawModal } from '@/components/wallet/WithdrawModal';
import { LoginDialog } from '@/components/LoginDialog';


interface Transaction {
    id: string;
    amount: number;
    type: 'deposit' | 'withdrawal' | 'payment' | 'earning' | 'commission';
    description: string;
    timestamp: Timestamp;
}

interface PendingRequest {
    id: string;
    amount: number;
    status: 'pending';
    createdAt: Timestamp;
    gatewayName?: string; // For deposits
    method?: string; // For withdrawals
}

const PAGE_SIZE = 15;

export default function WalletPage() {
    const { user, userProfile, settings, loading: authLoading, revalidateProfile } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [pendingDeposits, setPendingDeposits] = useState<PendingRequest[]>([]);
    const [pendingWithdrawals, setPendingWithdrawals] = useState<PendingRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    const fetchTransactions = useCallback(async (loadMore = false) => {
      if (!user) return;
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        let q = query(
          collection(db, 'users', user.uid, 'transactions'),
          orderBy('timestamp', 'desc'),
          limit(PAGE_SIZE)
        );

        if (loadMore && lastVisible) {
          q = query(q, startAfter(lastVisible));
        }

        const snapshot = await getDocs(q);
        const newTransactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));

        setTransactions(prev => loadMore ? [...prev, ...newTransactions] : newTransactions);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(newTransactions.length === PAGE_SIZE);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    }, [user, lastVisible]);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        fetchTransactions();

        let unsubscribers: (() => void)[] = [];
        
        const depositsQuery = query(collection(db, 'deposits'), where('userId', '==', user.uid), where('status', '==', 'pending'));
        unsubscribers.push(onSnapshot(depositsQuery, (snapshot) => {
            const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PendingRequest));
            setPendingDeposits(reqs);
        }));
        
        const withdrawalsQuery = query(collection(db, 'withdrawals'), where('userId', '==', user.uid), where('status', '==', 'pending'));
        unsubscribers.push(onSnapshot(withdrawalsQuery, (snapshot) => {
            const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PendingRequest));
            setPendingWithdrawals(reqs);
        }));

        return () => unsubscribers.forEach(unsub => unsub());
    }, [user, fetchTransactions]);
    
    if (authLoading || loading) {
        return (
            <div className="flex flex-col min-h-screen bg-background">
                <AppHeader />
                <div className="text-center p-8">Loading wallet...</div>
            </div>
        );
    }
    
    if (!user) {
        return (
             <div className="flex flex-col min-h-screen bg-background">
                <AppHeader />
                 <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
                    <h2 className="text-2xl font-bold mb-2">View Your Wallet</h2>
                    <p className="text-muted-foreground mb-4">
                        You need to be logged in to view your wallet.
                    </p>
                    <Button onClick={() => setIsLoginOpen(true)}>Login</Button>
                </main>
                <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
            </div>
        )
    }

    const currencySymbol = settings?.currencySymbol ?? 'Rs';

    const getTransactionIcon = (type: Transaction['type']) => {
        switch (type) {
            case 'deposit':
            case 'earning':
                return <ArrowDownLeft className="h-5 w-5 text-green-500" />;
            case 'withdrawal':
            case 'payment':
            case 'commission':
                 return <ArrowUpRight className="h-5 w-5 text-red-500" />;
            default:
                return <DollarSign className="h-5 w-5 text-muted-foreground" />;
        }
    };
    
    const handleActionSuccess = () => {
        revalidateProfile();
        // Reset and refetch transactions after a deposit or withdrawal request
        setLastVisible(null);
        setTransactions([]);
        fetchTransactions();
    }

    const hasPendingRequests = pendingDeposits.length > 0 || pendingWithdrawals.length > 0;

    return (
        <>
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader />
            <main className="flex-1 container mx-auto py-8 px-4 md:px-6 space-y-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold font-headline">My Wallet</h1>
                    <p className="text-muted-foreground">Manage your funds and view your transaction history.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Current Balance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-4xl font-bold">{currencySymbol}{userProfile?.wallet?.balance.toFixed(2) ?? '0.00'}</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                             <Button className="w-full sm:w-auto" onClick={() => setIsDepositModalOpen(true)}>
                                Deposit
                            </Button>
                            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsWithdrawModalOpen(true)}>
                                Withdraw
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {hasPendingRequests && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Requests</CardTitle>
                            <CardDescription>These requests are awaiting admin approval.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {pendingDeposits.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="font-semibold">Deposits</h4>
                                    {pendingDeposits.map(req => (
                                            <div key={req.id} className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50">
                                            <div className="flex items-center gap-2">
                                                <Hourglass className="h-4 w-4 text-muted-foreground" />
                                                <span>Deposit via {req.gatewayName}</span>
                                            </div>
                                            <span className="font-mono">{currencySymbol}{req.amount.toFixed(2)}</span>
                                            </div>
                                    ))}
                                </div>
                            )}
                                {pendingWithdrawals.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <h4 className="font-semibold">Withdrawals</h4>
                                    {pendingWithdrawals.map(req => (
                                            <div key={req.id} className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50">
                                            <div className="flex items-center gap-2">
                                                <Hourglass className="h-4 w-4 text-muted-foreground" />
                                                <span>Withdrawal to {req.method}</span>
                                            </div>
                                                <span className="font-mono">{currencySymbol}{req.amount.toFixed(2)}</span>
                                            </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}


                <Card>
                        <CardHeader>
                        <CardTitle>Transaction History</CardTitle>
                        <CardDescription>A record of your completed wallet activity.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.length > 0 ? transactions.map(t => (
                                        <TableRow key={t.id}>
                                            <TableCell className="w-12">{getTransactionIcon(t.type)}</TableCell>
                                            <TableCell>
                                                <p className="font-medium">{t.description}</p>
                                                <Badge variant="outline" className="capitalize mt-1">{t.type}</Badge>
                                            </TableCell>
                                            <TableCell>{t.timestamp?.toDate().toLocaleDateString()}</TableCell>
                                            <TableCell className={cn("text-right font-mono", t.amount > 0 ? 'text-green-600' : 'text-red-600')}>
                                                {t.amount > 0 ? `+${currencySymbol}${t.amount.toFixed(2)}` : `${currencySymbol}${t.amount.toFixed(2)}`}
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24">No transactions yet.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="md:hidden space-y-4">
                             {transactions.length > 0 ? transactions.map(t => (
                                <Card key={t.id} className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-start gap-3">
                                            {getTransactionIcon(t.type)}
                                            <div>
                                                 <p className="font-medium">{t.description}</p>
                                                 <Badge variant="outline" className="capitalize mt-1">{t.type}</Badge>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={cn("font-mono font-semibold", t.amount > 0 ? 'text-green-600' : 'text-red-600')}>
                                                {t.amount > 0 ? `+${currencySymbol}${t.amount.toFixed(2)}` : `${currencySymbol}${t.amount.toFixed(2)}`}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">{t.timestamp?.toDate().toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </Card>
                            )) : (
                                <p className="text-center text-muted-foreground py-10">No transactions yet.</p>
                            )}
                        </div>
                        {hasMore && (
                            <div className="mt-4 text-center">
                                <Button onClick={() => fetchTransactions(true)} disabled={loadingMore}>
                                    {loadingMore ? 'Loading...' : 'Load More'}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
        <DepositModal open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen} onSuccess={handleActionSuccess} />
        <WithdrawModal open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen} onSuccess={handleActionSuccess} />

        </>
    );
}
