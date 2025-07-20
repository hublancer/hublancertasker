import Link from 'next/link';
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/AppHeader';
import { ArrowRight, Search } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1">
        <section className="w-full py-20 md:py-32 lg:py-40">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                    Find help. Get it done.
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Hublancer connects you with talented taskers to handle your
                    to-do list, or with clients who need your skills.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    <Link href="/post-task">
                      Post a Task
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/tasks">
                      Browse Tasks
                      <Search className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <Image
                src="https://placehold.co/600x600.png"
                width="600"
                height="600"
                alt="Hero"
                data-ai-hint="collaboration team work"
                className="mx-auto aspect-square overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
              />
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-card">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                  How Hublancer Works
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  A simple, streamlined process for clients and taskers.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-12 py-12 lg:grid-cols-3 lg:gap-8">
              <div className="grid gap-1 text-center">
                <h3 className="text-lg font-bold font-headline">
                  1. Post Your Task
                </h3>
                <p className="text-sm text-muted-foreground">
                  Clients describe what they need, set a budget, and post it for
                  our community of taskers.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <h3 className="text-lg font-bold font-headline">
                  2. Find Your Match
                </h3>
                <p className="text-sm text-muted-foreground">
                  Taskers browse and apply for tasks that fit their skills.
                  Clients review offers and choose the best fit.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <h3 className="text-lg font-bold font-headline">
                  3. Get It Done
                </h3>
                <p className="text-sm text-muted-foreground">
                  Collaborate through in-app messaging, complete the task, and
                  handle payments securely.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          &copy; 2024 Hublancer. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link
            href="#"
            className="text-xs hover:underline underline-offset-4"
          >
            Terms of Service
          </Link>
          <Link
            href="#"
            className="text-xs hover:underline underline-offset-4"
          >
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
