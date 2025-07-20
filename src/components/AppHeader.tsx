'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Briefcase, MessageSquare, User, LogIn } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const AppHeader = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isClient, setIsClient] = useState(true);

  // In a real app, this would come from an auth context/hook
  useEffect(() => {
    // This is a mock authentication check
    setIsAuthenticated(true); 
    setIsClient(true); 
  }, []);

  const pathname = usePathname();

  const navLinks = [
    { href: "/tasks", label: "Browse Tasks" },
    { href: "/my-tasks", label: "My Tasks", auth: true },
    { href: "/messages", label: "Messages", auth: true },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline text-lg">Hublancer</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            {navLinks.map(link => (
                (!link.auth || isAuthenticated) &&
                <Link
                    key={link.href}
                    href={link.href}
                    className={cn("transition-colors hover:text-foreground/80", pathname === link.href ? "text-foreground" : "text-foreground/60")}
                >
                    {link.label}
                </Link>
            ))}
          </nav>
        </div>

        <div className="md:hidden">
           <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <Link href="/" className="flex items-center space-x-2 px-6">
                <Briefcase className="h-6 w-6 text-primary" />
                <span className="font-bold font-headline text-lg">Hublancer</span>
              </Link>
              <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
                <div className="flex flex-col gap-4">
                 {navLinks.map(link => (
                    (!link.auth || isAuthenticated) &&
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn("text-lg font-medium transition-colors hover:text-foreground/80", pathname === link.href ? "text-foreground" : "text-foreground/60")}
                    >
                        {link.label}
                    </Link>
                  ))}
                  {isAuthenticated && isClient &&
                    <Link href="/post-task" className="text-lg font-medium transition-colors text-accent hover:text-accent/80">Post a Task</Link>
                  }
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          {isAuthenticated ? (
            <>
              {isClient && (
                 <Button asChild className="hidden sm:inline-flex bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Link href="/post-task">Post a Task</Link>
                </Button>
              )}
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
                <span className="sr-only">Profile</span>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
