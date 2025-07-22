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
import { Menu, Briefcase, User, LogIn } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { LoginDialog } from './LoginDialog';

const AppHeader = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isClient, setIsClient] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // In a real app, this would come from an auth context/hook
  // For now, we'll keep it simple
  // useEffect(() => {
  //   // This is a mock authentication check
  //   setIsAuthenticated(false);
  //   setIsClient(true);
  // }, []);

  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Browse Tasks' },
    { href: '/my-tasks', label: 'My Tasks' },
    { href: '/messages', label: 'Messages' },
  ];

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
              {isAuthenticated && isClient && (
                <Button asChild size="sm">
                  <Link href="/post-task">Post Task</Link>
                </Button>
              )}
               <Button variant="default" size="icon" className="bg-accent hover:bg-accent/90" onClick={() => !isAuthenticated && setIsLoginOpen(true)}>
                  <User className="h-5 w-5" />
                  <span className="sr-only">Profile</span>
                </Button>
            </div>
          </div>

          {/* Right side buttons for Desktop */}
          <div className="hidden flex-1 items-center justify-end space-x-2 md:flex">
            {isAuthenticated && isClient && (
              <Button
                asChild
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Link href="/post-task">Post a Task</Link>
              </Button>
            )}
            <Button variant="default" size="icon" className="bg-accent hover:bg-accent/90" onClick={() => !isAuthenticated && setIsLoginOpen(true)}>
              <User className="h-5 w-5" />
              <span className="sr-only">Profile</span>
            </Button>
          </div>
        </div>
      </header>
      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </>
  );
};

export default AppHeader;
