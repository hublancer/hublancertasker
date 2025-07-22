
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, runTransaction, doc } from 'firebase/firestore';
import AppHeader from '@/components/AppHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowDownLeft, ArrowUpRight, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';

interface Transaction {
    id: string;
    amount: number;
    type: 'deposit' | 'withdrawal' | 'payment' | 'earning' | 'commission';
    description: string;
    timestamp: Timestamp;
}

export default function WalletPage() {
    const { user, userProfile, settings } = useAuth();
    const { toast } = useToast();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const [depositAmount, setDepositAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [isDepositing, setIsDepositing] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'users', user.uid, 'transactions'),
            orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const trans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
            setTransactions(trans);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleDeposit = async () => {
        if (!user || !depositAmount || Number(depositAmount) <= 0) {
            toast({ variant: 'destructive', title: 'Invalid amount' });
            return;
        }
        setIsDepositing(true);

        try {
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, 'users', user.uid);
                const userDoc = await transaction.get(userRef);

                if (!userDoc.exists()) throw "User not found";
                
                const currentBalance = userDoc.data().wallet?.balance ?? 0;
                const newBalance = currentBalance + Number(depositAmount);

                transaction.update(userRef, { 'wallet.balance': newBalance });
                
                const newTransactionRef = doc(collection(db, 'users', user.uid, 'transactions'));
                transaction.set(newTransactionRef, {
                    amount: Number(depositAmount),
                    type: 'deposit',
                    description: 'Funds deposited to wallet',
                    timestamp: serverTimestamp(),
                });
            });

            toast({ title: 'Deposit Successful', description: `${settings?.currencySymbol ?? 'Rs'}${depositAmount} has been added to your wallet.` });
            setDepositAmount('');
        } catch (error) {
            console.error('Deposit error: ', error);
            toast({ variant: 'destructive', title: 'Deposit Failed' });
        } finally {
            setIsDepositing(false);
        }
    };
    
    const handleWithdraw = async () => {
        if (!user || !userProfile || !withdrawAmount || Number(withdrawAmount) <= 0) {
            toast({ variant: 'destructive', title: 'Invalid amount' });
            return;
        }

        if (Number(withdrawAmount) > (userProfile.wallet?.balance ?? 0)) {
            toast({ variant: 'destructive', title: 'Insufficient balance' });
            return;
        }
        setIsWithdrawing(true);

        try {
             await runTransaction(db, async (transaction) => {
                const userRef = doc(db, 'users', user.uid);
                const userDoc = await transaction.get(userRef);

                if (!userDoc.exists()) throw "User not found";
                
                const currentBalance = userDoc.data().wallet?.balance ?? 0;
                const newBalance = currentBalance - Number(withdrawAmount);

                transaction.update(userRef, { 'wallet.balance': newBalance });
                
                const newTransactionRef = doc(collection(db, 'users', user.uid, 'transactions'));
                transaction.set(newTransactionRef, {
                    amount: -Number(withdrawAmount),
                    type: 'withdrawal',
                    description: 'Funds withdrawn from wallet',
                    timestamp: serverTimestamp(),
                });
            });
            toast({ title: 'Withdrawal Successful', description: `${settings?.currencySymbol ?? 'Rs'}${withdrawAmount} has been withdrawn from your wallet.` });
            setWithdrawAmount('');
        } catch (error) {
            console.error('Withdrawal error: ', error);
            toast({ variant: 'destructive', title: 'Withdrawal Failed' });
        } finally {
            setIsWithdrawing(false);
        }
    };


    if (loading) {
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
                <div className="text-center p-8">Please log in to view your wallet.</div>
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
                return <ArrowUpRight className="h-5 w-5 text-red-500" />;
            case 'commission':
                 return <ArrowUpRight className="h-5 w-5 text-red-500" />;
            default:
                return <DollarSign className="h-5 w-5 text-muted-foreground" />;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader />
            <main className="flex-1 container mx-auto py-12 px-4 md:px-6">
                <div className="space-y-4 mb-8">
                    <h1 className="text-3xl font-bold font-headline">My Wallet</h1>
                    <p className="text-muted-foreground">Manage your funds and view your transaction history.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        <Card>
                             <CardHeader>
                                <CardTitle>Current Balance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-bold">{currencySymbol}{userProfile?.wallet?.balance.toFixed(2) ?? '0.00'}</p>
                            </CardContent>
                        </Card>
                        <Card>
                             <CardHeader>
                                <CardTitle>Transaction History</CardTitle>
                                <CardDescription>A record of your recent wallet activity.</CardDescription>
                            </CardHeader>
                            <CardContent>
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
                                                    {t.amount > 0 ? `+${currencySymbol}${t.amount.toFixed(2)}` : `-${currencySymbol}${Math.abs(t.amount).toFixed(2)}`}
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center h-24">No transactions yet.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="space-y-8">
                         <Card>
                            <CardHeader>
                                <CardTitle>Deposit Funds</CardTitle>
                                <CardDescription>Add money to your wallet.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Input 
                                    type="number" 
                                    placeholder={`Amount in ${currencySymbol}`} 
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    disabled={isDepositing}
                                />
                                <Button className="w-full" onClick={handleDeposit} disabled={isDepositing}>
                                    {isDepositing ? 'Processing...' : 'Deposit'}
                                </Button>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Withdraw Funds</CardTitle>
                                <CardDescription>Transfer money to your bank account.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Input 
                                    type="number" 
                                    placeholder={`Amount in ${currencySymbol}`}
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    disabled={isWithdrawing}
                                />
                                <Button variant="outline" className="w-full" onClick={handleWithdraw} disabled={isWithdrawing}>
                                     {isWithdrawing ? 'Processing...' : 'Withdraw'}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
