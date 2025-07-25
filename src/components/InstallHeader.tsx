'use client';

import { InstallPwaButton } from './InstallPwaButton';
import { useMediaQuery } from '@/hooks/use-media-query';

export default function InstallHeader() {
    const isMobile = useMediaQuery('(max-width: 767px)');

    if (!isMobile) {
        return null;
    }

    return (
        <div className="bg-primary text-primary-foreground text-center p-2">
           <InstallPwaButton />
        </div>
    )
}
