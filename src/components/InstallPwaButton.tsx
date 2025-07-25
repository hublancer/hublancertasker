'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ArrowDownToLine } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';

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
  const isMobile = useMediaQuery('(max-width: 767px)');

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    
    const handleAppInstalled = () => {
        setDeferredPrompt(null);
        setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

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
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if(outcome === 'accepted') {
        setDeferredPrompt(null);
    }
  };

  if (!deferredPrompt || isInstalled) {
    return null;
  }

  if (isMobile) {
      return (
        <button onClick={handleInstallClick} className="text-sm font-semibold underline">
            Install Hublancer for a better experience!
        </button>
      )
  }

  return (
    <Button variant="outline" onClick={handleInstallClick}>
      <ArrowDownToLine className="mr-2 h-4 w-4" />
      Install App
    </Button>
  );
};
