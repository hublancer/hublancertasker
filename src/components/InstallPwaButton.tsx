'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ArrowDownToLine } from 'lucide-react';

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

export const InstallPwaButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };
    
    const handleAppInstalled = () => {
        // Hide the app-provided install promotion
        setDeferredPrompt(null);
        setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }
    // Show the install prompt.
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt.
    const { outcome } = await deferredPrompt.userChoice;
    // We've used the prompt, and can't use it again, but we can listen for the appinstalled event.
    if(outcome === 'accepted') {
        setDeferredPrompt(null);
    }
  };

  if (!deferredPrompt || isInstalled) {
    return null;
  }

  return (
    <Button variant="outline" onClick={handleInstallClick}>
      <ArrowDownToLine className="mr-2 h-4 w-4" />
      Install App
    </Button>
  );
};
