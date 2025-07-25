
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
import { Menu, User, LogOut, Wallet, Bell, Shield, Settings, MessageSquare, FileKey, Briefcase } from 'lucide-react';
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
import { collection, onSnapshot, query, where, orderBy, updateDoc, doc, Timestamp, getDoc } from 'firebase/firestore';
import { useMediaQuery } from '@/hooks/use-media-query';
import UserAvatar from './UserAvatar';
import Image from 'next/image';


interface Notification {
  id: string;
  message: string;
  read: boolean;
  link: string;
  createdAt: any;
}


const AppHeader = () => {
  const { user, userProfile, settings, loading, playNotificationSound, addNotification } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const pathname = usePathname();
  const isMobile = useMediaQuery('(max-width: 767px)');

  useEffect(() => {
    if (!user) return;
    
    // Notifications listener
    const notificationsQuery = query(collection(db, 'users', user.uid, 'notifications'), orderBy('createdAt', 'desc'));
    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
        const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        
        // Check if there are new, unread notifications to trigger the sound
        const newUnread = snapshot.docChanges().some(change => 
            change.type === 'added' && !change.doc.data().read
        );
        
        if (newUnread && notifications.length > 0) { // Avoid sound on initial load
            playNotificationSound();
        }
        
        setNotifications(notifs);
    });

    return () => {
        unsubscribeNotifications();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, playNotificationSound]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleMarkAsRead = async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'notifications', id), { read: true });
  }

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const navLinks = [
    { href: '/', label: 'Browse Tasks' },
    { href: '/my-tasks', label: 'My Tasks' },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
  ];

  const renderProfileButton = () => {
    if (loading) {
      return (
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5 animate-pulse" />
        </Button>
      );
    }

    if (user && userProfile) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <UserAvatar 
                name={userProfile.name} 
                imageUrl={userProfile.photoURL}
                className="h-8 w-8"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userProfile.name || user.email}</p>
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
       <Button variant="default" size="sm" onClick={() => setIsLoginOpen(true)}>
          Login
        </Button>
    )
  }

  const renderNotificationBell = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                      {unreadNotificationsCount}
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
  );

  const desktopHeader = (
    <div className="mr-4 hidden md:flex">
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <Image src="https://i.postimg.cc/hGrRDPFS/Untitled-design-11-png.png" alt="Hublancer Logo" width={24} height={24} />
        <span className="font-bold font-headline text-lg">Hublancer</span>
      </Link>
      <nav className="flex items-center gap-6 text-sm">
        {navLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'transition-colors hover:text-foreground/80 flex items-center gap-2',
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
  );

  const mobileHeader = (
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
              <Image src="https://i.postimg.cc/hGrRDPFS/Untitled-design-11-png.png" alt="Hublancer Logo" width={24} height={24} />
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
                      'text-lg font-medium transition-colors hover:text-foreground/80 flex items-center gap-2',
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
          <Image src="https://i.postimg.cc/hGrRDPFS/Untitled-design-11-png.png" alt="Hublancer Logo" width={24} height={24} />
          <span className="font-bold font-headline text-lg">Hublancer</span>
        </Link>
        <div className="flex items-center space-x-2">
           {user && renderNotificationBell()}
           {renderProfileButton()}
        </div>
      </div>
  );

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          
          {isMobile ? mobileHeader : desktopHeader}

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
             {renderNotificationBell()}
            
            {!isMobile && (
              <Button
                asChild
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Link href="/post-task">Post a Task</Link>
              </Button>
            )}
            {renderProfileButton()}
          </div>
        </div>
      </header>
      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </>
  );
};

export default AppHeader;
