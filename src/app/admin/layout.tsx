'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Home, Users, Briefcase, CreditCard, Shield, LifeBuoy, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/AppHeader';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (userProfile?.role !== 'admin') {
    router.replace('/');
    return null;
  }

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: Home },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/tasks', label: 'Tasks', icon: Briefcase },
    { href: '/admin/transactions', label: 'Transactions', icon: CreditCard },
    { href: '/admin/disputes', label: 'Disputes', icon: Shield },
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
            <div className="mt-auto p-4">
                <Button size="sm" variant="outline" className="w-full">
                    <LifeBuoy className="mr-2 h-4 w-4" />
                    Support
                </Button>
            </div>
        </aside>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
