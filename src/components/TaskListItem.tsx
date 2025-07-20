'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Task } from './TaskCard';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Calendar, CircleUserRound, Badge } from 'lucide-react';
import { Button } from './ui/button';

interface TaskListItemProps {
  task: Task;
}

export default function TaskListItem({ task }: TaskListItemProps) {
  const isRemote = task.type === 'online';

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <Link href={`/tasks/${task.id}`}>
              <h3 className="font-bold text-lg hover:underline">{task.title}</h3>
            </Link>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
              <div className="flex items-center">
                {isRemote ? (
                  <Badge variant="outline">Remote</Badge>
                ) : (
                  <>
                    <MapPin className="mr-1.5 h-4 w-4" />
                    <span>{task.location}</span>
                  </>
                )}
              </div>
              <div className="flex items-center">
                <Calendar className="mr-1.5 h-4 w-4" />
                <span>{task.date}</span>
              </div>
            </div>
            <div className="mt-2 text-sm">
              <span className="text-primary font-semibold">Open</span>
              <span className="text-muted-foreground"> &middot; {task.offers} {task.offers === 1 ? 'offer' : 'offers'}</span>
            </div>
          </div>

          <div className="text-right flex flex-col items-end justify-between h-full">
            <p className="text-xl font-bold text-primary">${task.price}</p>
            <Avatar className="mt-2">
              <AvatarImage src="https://placehold.co/40x40.png" data-ai-hint="person face" />
              <AvatarFallback>
                <CircleUserRound className="h-6 w-6 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}