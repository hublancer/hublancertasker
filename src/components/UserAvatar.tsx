
'use client';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserAvatarProps {
  name?: string;
  imageUrl?: string;
  className?: string;
}


export default function UserAvatar({ name, imageUrl, className }: UserAvatarProps) {
  
  return (
    <Avatar className={cn("relative", className)}>
        <AvatarImage src={imageUrl} alt={name} data-ai-hint="person face" />
        <AvatarFallback>{name?.slice(0, 2).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}
