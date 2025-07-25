import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Users, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

export type Task = {
  id: string;
  title: string;
  location: string;
  date: string;
  price: number;
  offers: number;
  type: 'physical' | 'online';
  status: 'open' | 'assigned' | 'completed' | 'pending-completion' | 'disputed';
  category: string;
  description: string;
  postedBy: string;
  postedById: string;
  assignedToId?: string;
  assignedToName?: string;
  coordinates?: [number, number] | null;
  createdAt: string;
};

interface TaskCardProps {
  task: Task;
  onSelect?: () => void;
  onChat?: (taskId: string) => void;
}

export default function TaskCard({ task, onSelect, onChat }: TaskCardProps) {
  const { settings, user } = useAuth();
  const router = useRouter();

  const handleViewTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect();
    }
  };
  
  const handleChatClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if(onChat) {
          onChat(task.id);
      }
  }

  const isMyTask = user?.uid === task.postedById || user?.uid === task.assignedToId;

  return (
    <Card
      className="flex flex-col hover:shadow-md transition-shadow duration-300 cursor-pointer"
      onClick={handleViewTask}
    >
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
      </CardContent>
      <CardFooter className="flex justify-between items-center mt-auto pt-4">
        <div className="text-xl font-bold text-primary">
          {settings?.currencySymbol ?? 'Rs'}
          {task.price}
        </div>
        <div className="flex items-center gap-2">
            {isMyTask && (task.status === 'assigned' || task.status === 'pending-completion') && (
                 <Button variant="outline" size="icon" onClick={handleChatClick}>
                    <MessageSquare className="h-4 w-4" />
                </Button>
            )}
            <Button onClick={handleViewTask}>View Task</Button>
        </div>
      </CardFooter>
    </Card>
  );
}
