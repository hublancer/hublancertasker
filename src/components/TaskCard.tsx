import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MapPin, Calendar, Users } from 'lucide-react';

export type Task = {
  id: string;
  title: string;
  location: string;
  date: string;
  price: number;
  offers: number;
  type: 'physical' | 'online';
  status: 'open' | 'assigned' | 'completed';
  category: string;
  description: string;
  postedBy: string;
  postedById: string;
};

interface TaskCardProps {
  task: Task;
  onSelect?: (task: Task) => void;
}

export default function TaskCard({ task, onSelect }: TaskCardProps) {
  const handleViewTask = () => {
    if (onSelect) {
      onSelect(task);
    }
  };

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="font-headline text-lg leading-snug h-12">
          {task.title}
        </CardTitle>
        <div className="flex items-center pt-2">
          <Badge variant={task.type === 'physical' ? 'secondary' : 'outline'}>
            {task.type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow grid gap-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="truncate">{task.location}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
          <span>{task.date}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="mr-2 h-4 w-4 flex-shrink-0" />
          <span>
            {task.offers} {task.offers === 1 ? 'offer' : 'offers'}
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center mt-auto pt-4">
        <div className="text-xl font-bold text-primary">${task.price}</div>
        <Button onClick={handleViewTask}>View Task</Button>
      </CardFooter>
    </Card>
  );
}
