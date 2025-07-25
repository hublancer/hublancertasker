
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
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
    const fetchStats = async () => {
        try {
            const usersQuery = query(collection(db, 'users'));
            const usersSnapshot = await getDocs(usersQuery);
            let clients = 0;
            let taskers = 0;
            usersSnapshot.forEach(doc => {
                if(doc.data().accountType === 'client') clients++;
                if(doc.data().accountType === 'tasker') taskers++;
            });

            const activeTasksQuery = query(collection(db, 'tasks'), where('status', 'in', ['open', 'assigned']));
            const activeTasksSnapshot = await getDocs(activeTasksQuery);

            const revenueQuery = query(collection(db, 'platform_transactions'));
            const revenueSnapshot = await getDocs(revenueQuery);
            const total = revenueSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
            
            const pendingDepositsQuery = query(collection(db, 'deposits'), where('status', '==', 'pending'));
            const pendingDepositsSnapshot = await getDocs(pendingDepositsQuery);
            
            const pendingWithdrawalsQuery = query(collection(db, 'withdrawals'), where('status', '==', 'pending'));
            const pendingWithdrawalsSnapshot = await getDocs(pendingWithdrawalsQuery);

            const pendingKycQuery = query(collection(db, 'kycSubmissions'), where('status', '==', 'pending'));
            const pendingKycSnapshot = await getDocs(pendingKycQuery);
            
            const openDisputesQuery = query(collection(db, 'disputes'), where('status', '==', 'open'));
            const openDisputesSnapshot = await getDocs(openDisputesQuery);

            setStats({
                totalUsers: usersSnapshot.size,
                totalClients: clients,
                totalTaskers: taskers,
                activeTasks: activeTasksSnapshot.size,
                openDisputes: openDisputesSnapshot.size,
                totalRevenue: total,
                pendingDeposits: pendingDepositsSnapshot.size,
                pendingWithdrawals: pendingWithdrawalsSnapshot.size,
                pendingKyc: pendingKycSnapshot.size,
            });

        } catch (error) {
            console.error("Error fetching admin dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    }
    
    fetchStats();
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
