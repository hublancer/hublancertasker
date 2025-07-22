'use client';

import type { Task } from './TaskCard';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MapPin, Calendar, Tag, Users } from 'lucide-react';
import { Badge } from './ui/badge';

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
              <div className="flex items-center">
                <Tag className="mr-1.5 h-4 w-4" />
                <span>{task.category}</span>
              </div>
            </div>
            <div className="mt-2 text-sm">
                <Badge variant="outline" className="capitalize">{task.status}</Badge>
                <span className="text-muted-foreground mx-2">&middot;</span>
                <span className="inline-flex items-center">
                    <Users className="mr-1.5 h-4 w-4 text-muted-foreground"/>
                    <span className="text-muted-foreground">
                        {task.offers} {task.offers === 1 ? 'offer' : 'offers'}
                    </span>
                </span>
            </div>
          </div>

          <div className="text-right flex flex-col items-end justify-between h-full">
            <p className="text-xl font-bold text-primary">Rs{task.price}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
