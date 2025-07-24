
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, getDocs, sum } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase, CreditCard, Shield, FileKey, ArrowDownToDot, ArrowUpFromDot, UserCheck, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

interface DashboardStats {
    totalUsers: number;
    totalClients: number;
    totalTaskers: number;
    activeTasks: number;
    openDisputes: number;
    totalRevenue: number;
    pendingDeposits: number;
    pendingWithdrawals: number;
    pendingKyc: number;
}

export default function AdminDashboard() {
  const { settings } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalClients: 0,
    totalTaskers: 0,
    activeTasks: 0,
    openDisputes: 0,
    totalRevenue: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    pendingKyc: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    const collectionsToWatch = {
      users: collection(db, 'users'),
      tasks: collection(db, 'tasks'),
      platform_transactions: collection(db, 'platform_transactions'),
      deposits: collection(db, 'deposits'),
      withdrawals: collection(db, 'withdrawals'),
      kycSubmissions: collection(db, 'kycSubmissions'),
      disputes: collection(db, 'disputes'),
    };
    
    // Users
    const usersQuery = query(collectionsToWatch.users);
    unsubscribes.push(onSnapshot(usersQuery, (snapshot) => {
        let clients = 0;
        let taskers = 0;
        snapshot.forEach(doc => {
            if(doc.data().accountType === 'client') clients++;
            if(doc.data().accountType === 'tasker') taskers++;
        });
        setStats(prev => ({ ...prev, totalUsers: snapshot.size, totalClients: clients, totalTaskers: taskers }));
    }));

    // Tasks
    const activeTasksQuery = query(collectionsToWatch.tasks, where('status', 'in', ['open', 'assigned']));
     unsubscribes.push(onSnapshot(activeTasksQuery, (snapshot) => {
        setStats(prev => ({ ...prev, activeTasks: snapshot.size }));
    }));
    
    // Revenue
    const revenueQuery = query(collectionsToWatch.platform_transactions);
    unsubscribes.push(onSnapshot(revenueQuery, async (snapshot) => {
        const total = snapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
        setStats(prev => ({ ...prev, totalRevenue: total }));
    }));

    // Pending Requests
    const pendingDepositsQuery = query(collectionsToWatch.deposits, where('status', '==', 'pending'));
    unsubscribes.push(onSnapshot(pendingDepositsQuery, snapshot => setStats(prev => ({ ...prev, pendingDeposits: snapshot.size }))));

    const pendingWithdrawalsQuery = query(collectionsToWatch.withdrawals, where('status', '==', 'pending'));
    unsubscribes.push(onSnapshot(pendingWithdrawalsQuery, snapshot => setStats(prev => ({ ...prev, pendingWithdrawals: snapshot.size }))));

    const pendingKycQuery = query(collectionsToWatch.kycSubmissions, where('status', '==', 'pending'));
    unsubscribes.push(onSnapshot(pendingKycQuery, snapshot => setStats(prev => ({ ...prev, pendingKyc: snapshot.size }))));

    const openDisputesQuery = query(collectionsToWatch.disputes, where('status', '==', 'open'));
    unsubscribes.push(onSnapshot(openDisputesQuery, snapshot => setStats(prev => ({ ...prev, openDisputes: snapshot.size }))));


    setLoading(false);

    return () => unsubscribes.forEach(unsub => unsub());

  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">{stats.totalClients} Clients, {stats.totalTaskers} Taskers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTasks}</div>
             <p className="text-xs text-muted-foreground">Open or assigned tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settings?.currencySymbol ?? 'Rs'}{stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Platform commission earned</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Disputes</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openDisputes}</div>
             <p className="text-xs text-muted-foreground">Awaiting resolution</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Pending Approvals</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             <Link href="/admin/kyc">
                 <Card className="hover:bg-muted/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">KYC Requests</CardTitle>
                        <FileKey className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingKyc}</div>
                        <p className="text-xs text-muted-foreground">Awaiting verification</p>
                    </CardContent>
                </Card>
            </Link>
             <Link href="/admin/deposits">
                <Card className="hover:bg-muted/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Deposit Requests</CardTitle>
                        <ArrowDownToDot className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingDeposits}</div>
                        <p className="text-xs text-muted-foreground">Awaiting approval</p>
                    </CardContent>
                </Card>
            </Link>
             <Link href="/admin/withdrawals">
                <Card className="hover:bg-muted/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Withdrawal Requests</CardTitle>
                        <ArrowUpFromDot className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingWithdrawals}</div>
                        <p className="text-xs text-muted-foreground">Awaiting processing</p>
                    </CardContent>
                </Card>
            </Link>
        </div>
      </div>
    </div>
  );
}
