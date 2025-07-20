'use client';

import type { Task } from './TaskCard';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MapPin, Calendar } from 'lucide-react';

interface TaskListItemProps {
  task: Task;
  onSelect: (task: Task) => void;
  isSelected: boolean;
}

export default function TaskListItem({
  task,
  onSelect,
  isSelected,
}: TaskListItemProps) {
  const isRemote = task.type === 'online';

  return (
    <Card
      className={cn(
        'hover:shadow-md transition-shadow duration-200 cursor-pointer',
        isSelected ? 'border-primary' : ''
      )}
      onClick={() => onSelect(task)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <h3 className="font-bold text-lg">{task.title}</h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
              <div className="flex items-center">
                <MapPin className="mr-1.5 h-4 w-4" />
                <span>{isRemote ? 'Remote' : task.location}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="mr-1.5 h-4 w-4" />
                <span>{task.date}</span>
              </div>
            </div>
            <div className="mt-2 text-sm">
              <span className="text-primary font-semibold">Open</span>
              <span className="text-muted-foreground">
                {' '}
                &middot; {task.offers} {task.offers === 1 ? 'offer' : 'offers'}
              </span>
            </div>
          </div>

          <div className="text-right flex flex-col items-end justify-between h-full">
            <p className="text-xl font-bold text-primary">${task.price}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
