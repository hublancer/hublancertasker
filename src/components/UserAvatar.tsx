
'use client';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserAvatarProps {
  name?: string;
  imageUrl?: string;
  isOnline?: boolean;
  className?: string;
}

export default function UserAvatar({ name, imageUrl, isOnline, className }: UserAvatarProps) {
  return (
    <div className={cn("relative", className)}>
      <Avatar className="h-full w-full">
        <AvatarImage src={imageUrl} alt={name} data-ai-hint="person face" />
        <AvatarFallback>{name?.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div
        className={cn(
          'absolute bottom-0 right-0 rounded-full h-3 w-3 border-2 border-background',
          isOnline ? 'bg-green-500' : 'bg-gray-400'
        )}
      />
    </div>
  );
}
