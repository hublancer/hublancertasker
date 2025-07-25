
'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowDownToLine, X } from 'lucide-react';
import Image from 'next/image';

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const InstallPwaDialog = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Check if the app is already installed
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
          // Already in standalone mode, do not show the prompt.
          return;
      }
      // Show the install dialog after a short delay
      setTimeout(() => setIsDialogOpen(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    await deferredPrompt.userChoice;
    // We've used the prompt, and can't use it again, so clear it
    setDeferredPrompt(null);
    setIsDialogOpen(false);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };
  
  // Don't render anything if the prompt isn't available
  if (!deferredPrompt) {
      return null;
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center">
             <Image src="https://i.ibb.co/Y7KxFDRT/Untitled-design-11-png.png" alt="Hublancer Logo" width={64} height={64} className="mb-4 rounded-lg" />
          </div>
          <DialogTitle className="text-center text-2xl font-headline">Install Hublancer</DialogTitle>
          <DialogDescription className="text-center">
            Get the full app experience. It's fast, free, and works offline!
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center pt-4">
          <Button type="button" variant="ghost" onClick={handleDialogClose}>
             <X className="mr-2 h-4 w-4" />
             Not now
          </Button>
          <Button type="button" onClick={handleInstallClick}>
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            Install App
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
