
'use client';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Timestamp } from 'firebase/firestore';

interface UserAvatarProps {
  name?: string;
  imageUrl?: string;
  isOnline?: boolean;
  lastSeen?: Timestamp;
  className?: string;
}

export default function UserAvatar({ name, imageUrl, isOnline, lastSeen, className }: UserAvatarProps) {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  // User is considered online if isOnline is true OR if they were last seen within the hour.
  const recentlyActive = lastSeen && lastSeen.toMillis() > oneHourAgo;
  const showOnline = isOnline || recentlyActive;
  
  return (
    <div className={cn("relative", className)}>
      <Avatar className="h-full w-full">
        <AvatarImage src={imageUrl} alt={name} data-ai-hint="person face" />
        <AvatarFallback>{name?.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div
        className={cn(
          'absolute bottom-0 right-0 rounded-full h-3 w-3 border-2 border-background',
          showOnline ? 'bg-green-500' : 'bg-gray-400'
        )}
      />
    </div>
  );
}
