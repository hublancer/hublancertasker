'use client';

import { InstallPwaButton } from './InstallPwaButton';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useEffect, useState } from 'react';

export default function InstallHeader() {
    const isMobile = useMediaQuery('(max-width: 767px)');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient || !isMobile) {
        return null;
    }

    return (
        <div className="bg-primary text-primary-foreground text-center p-2">
           <InstallPwaButton />
        </div>
    )
}
