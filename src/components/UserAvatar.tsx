
'use client';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { TooltipContent } from '@radix-ui/react-tooltip';
import { Timestamp } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';

interface UserAvatarProps {
  name?: string;
  imageUrl?: string;
  className?: string;
  isOnline?: boolean;
  lastSeen?: Timestamp;
}


const PresenceTooltip = ({ isOnline, lastSeen }: { isOnline?: boolean, lastSeen?: Timestamp }) => {
    if (isOnline) {
        return <TooltipContent><p>Online</p></TooltipContent>;
    }
    if (lastSeen) {
        return <TooltipContent><p>Last seen {formatDistanceToNow(lastSeen.toDate(), { addSuffix: true })}</p></TooltipContent>;
    }
    return null;
}


export default function UserAvatar({ name, imageUrl, className, isOnline, lastSeen }: UserAvatarProps) {
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("relative", className)}>
            <Avatar className="h-full w-full">
              <AvatarImage src={imageUrl} alt={name} data-ai-hint="person face" />
              <AvatarFallback>{name?.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            {isOnline && (
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
            )}
          </div>
        </TooltipTrigger>
        <PresenceTooltip isOnline={isOnline} lastSeen={lastSeen} />
      </Tooltip>
    </TooltipProvider>
  );
}

    