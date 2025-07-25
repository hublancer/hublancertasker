
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Home, Users, Briefcase, CreditCard, Shield, LifeBuoy, Settings, Landmark, ArrowDownToDot, ArrowUpFromDot, FileKey } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/AppHeader';
import { useEffect } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userProfile, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return; // Wait until loading is finished
    }

    // If not on the login page...
    if (pathname !== '/admin/login') {
      // and is not authenticated OR is not an admin, redirect to login
      if (!user || userProfile?.role !== 'admin') {
        router.replace('/admin/login');
      }
    } else {
      // If on the login page...
      // and is an authenticated admin, redirect to dashboard
      if (user && userProfile?.role === 'admin') {
        router.replace('/admin/dashboard');
      }
    }
  }, [user, userProfile, loading, pathname, router]);

  if (loading || (!user && pathname !== '/admin/login') || (user && userProfile?.role !== 'admin' && pathname !== '/admin/login')) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  // Don't render layout for login page
  if (pathname === '/admin/login') {
      return <>{children}</>;
  }

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: Home },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/tasks', label: 'Tasks', icon: Briefcase },
    { href: '/admin/transactions', label: 'Transactions', icon: CreditCard },
    { href: '/admin/deposits', label: 'Deposits', icon: ArrowDownToDot },
    { href: '/admin/withdrawals', label: 'Withdrawals', icon: ArrowUpFromDot },
    { href: '/admin/kyc', label: 'KYC', icon: FileKey },
    { href: '/admin/disputes', label: 'Disputes', icon: Shield },
    { href: '/admin/support', label: 'Support & Reports', icon: LifeBuoy },
    { href: '/admin/gateways', label: 'Gateways', icon: Landmark },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
       <AppHeader />
       <div className="flex flex-1">
        <aside className="hidden w-64 flex-col border-r bg-background sm:flex">
            <nav className="flex flex-col gap-2 p-4">
            {navItems.map(item => (
                <Link
                key={item.href}
                href={item.href}
                className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                    pathname === item.href && 'bg-muted text-primary'
                )}
                >
                <item.icon className="h-4 w-4" />
                {item.label}
                </Link>
            ))}
            </nav>
        </aside>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
