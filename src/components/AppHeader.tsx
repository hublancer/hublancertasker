'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu, Briefcase, User, LogIn, LogOut, Wallet, Bell, Shield, Settings } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { LoginDialog } from './LoginDialog';
import { useAuth } from '@/hooks/use-auth';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { collection, onSnapshot, query, where, orderBy, updateDoc, doc } from 'firebase/firestore';

interface Notification {
  id: string;
  message: string;
  read: boolean;
  link: string;
  createdAt: any;
}


const AppHeader = () => {
  const { user, userProfile, settings, loading } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const pathname = usePathname();

  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'users', user.uid, 'notifications'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleMarkAsRead = async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'notifications', id), { read: true });
  }

  const unreadCount = notifications.filter(n => !n.read).length;


  const navLinks = [
    { href: '/', label: 'Browse Tasks' },
    { href: '/my-tasks', label: 'My Tasks' },
    { href: '/messages', label: 'Messages' },
  ];
  
  const renderProfileButton = () => {
    if (loading) {
      return (
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5 animate-pulse" />
        </Button>
      );
    }

    if (user) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.photoURL || 'https://placehold.co/40x40.png'} alt="User avatar" data-ai-hint="person face" />
                <AvatarFallback>{userProfile?.email?.[0].toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userProfile?.name || user.email}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
             <DropdownMenuItem asChild>
              <Link href={`/profile/${user.uid}`}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
              </Link>
            </DropdownMenuItem>
             <DropdownMenuItem asChild>
                <Link href="/wallet">
                    <Wallet className="mr-2 h-4 w-4" />
                    <span>Wallet</span>
                </Link>
            </DropdownMenuItem>
            {userProfile?.role === 'admin' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/dashboard">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin Panel</span>
                  </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                  <Link href="/admin/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
       <Button variant="default" size="icon" className="bg-accent hover:bg-accent/90" onClick={() => setIsLoginOpen(true)}>
          <User className="h-5 w-5" />
          <span className="sr-only">Profile</span>
        </Button>
    )
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          {/* Desktop Header */}
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <Briefcase className="h-6 w-6 text-primary" />
              <span className="font-bold font-headline text-lg">Hublancer</span>
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'transition-colors hover:text-foreground/80',
                    pathname === link.href
                      ? 'text-foreground'
                      : 'text-foreground/60'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Mobile Header */}
          <div className="flex w-full items-center justify-between md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="pr-0">
                <SheetHeader className="p-6 pt-0 pb-2">
                  <SheetTitle>Menu</SheetTitle>
                  <SheetDescription className="sr-only">
                    Main navigation menu
                  </SheetDescription>
                </SheetHeader>
                <Link
                  href="/"
                  className="flex items-center space-x-2 px-6"
                >
                  <Briefcase className="h-6 w-6 text-primary" />
                  <span className="font-bold font-headline text-lg">
                    Hublancer
                  </span>
                </Link>
                <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
                  <div className="flex flex-col gap-4">
                    {navLinks.map(link => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          'text-lg font-medium transition-colors hover:text-foreground/80',
                          pathname === link.href
                            ? 'text-foreground'
                            : 'text-foreground/60'
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Link href="/" className="flex items-center space-x-2">
              <Briefcase className="h-6 w-6 text-primary" />
              <span className="font-bold font-headline text-lg">Hublancer</span>
            </Link>
            <div className="flex items-center space-x-2">
              <Button asChild size="sm">
                <Link href="/post-task">Post Task</Link>
              </Button>
               {renderProfileButton()}
            </div>
          </div>

          {/* Right side buttons for Desktop */}
          <div className="hidden flex-1 items-center justify-end space-x-2 md:flex">
             {user && (
                  <Button variant="outline" asChild>
                    <Link href="/wallet" className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        <span>{settings?.currencySymbol ?? 'Rs'}{userProfile?.wallet?.balance.toFixed(2) ?? '0.00'}</span>
                    </Link>
                  </Button>
              )}
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                                {unreadCount}
                            </span>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="end">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications.length === 0 ? (
                        <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
                    ) : (
                        notifications.map(n => (
                            <DropdownMenuItem key={n.id} className={cn(!n.read && 'font-bold')} onSelect={() => handleMarkAsRead(n.id)} asChild>
                                <Link href={n.link}>{n.message}</Link>
                            </DropdownMenuItem>
                        ))
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
              <Button
                asChild
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Link href="/post-task">Post a Task</Link>
              </Button>
            {renderProfileButton()}
          </div>
        </div>
      </header>
      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </>
  );
};

export default AppHeader;
