
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, MessageSquare, PlusSquare, Wallet, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useEffect, useState } from 'react';

export function MobileNav() {
    const pathname = usePathname();
    const isMobile = useMediaQuery('(max-width: 767px)');
    const isAdminPage = pathname.startsWith('/admin');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const navItems = [
        { href: '/', label: 'Browse', icon: Compass },
        { href: '/messages', label: 'Messages', icon: MessageSquare },
        { href: '/post-task', label: 'Post Task', icon: PlusSquare, isCentral: true },
        { href: '/wallet', label: 'Wallet', icon: Wallet },
        { href: '/my-tasks', label: 'My Tasks', icon: Briefcase },
    ];

    if (!isClient || !isMobile || isAdminPage) {
        return null;
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const isActive = (item.href === '/' && pathname === '/') || (item.href !== '/' && pathname.startsWith(item.href));
                    if (item.isCentral) {
                        return (
                            <Link key={item.href} href={item.href} className="-mt-6">
                                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-lg">
                                    <item.icon className="h-8 w-8" />
                                </div>
                            </Link>
                        );
                    }
                    return (
                        <Link key={item.href} href={item.href} className={cn(
                            "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                            isActive ? 'text-primary' : 'text-muted-foreground'
                        )}>
                            <item.icon className="h-6 w-6" />
                            <span className="text-xs">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
