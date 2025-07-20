'use client';

import { type Task } from './TaskCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Calendar, CircleDollarSign, ArrowLeft } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface TaskDetailsProps {
  task: Task & { description: string; postedBy: string };
  onBack: () => void;
}

export default function TaskDetails({ task, onBack }: TaskDetailsProps) {
  const userRole = 'tasker'; // This would come from auth context

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 bg-card text-card-foreground h-full">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to map
        </Button>

        <div className="space-y-2">
            <div className="flex items-center gap-4">
                 <span className="inline-flex items-center rounded-md bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800 ring-1 ring-inset ring-green-600/20">
                    OPEN
                </span>
                <span className="text-sm text-muted-foreground">ASSIGNED</span>
                <span className="text-sm text-muted-foreground">COMPLETED</span>
            </div>
             <h1 className="text-3xl font-bold font-headline">{task.title}</h1>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                 <div className="space-y-4 text-sm text-foreground">
                    <div className="flex items-start">
                        <Avatar className="h-10 w-10 mr-4">
                          <AvatarImage src="https://placehold.co/40x40.png" data-ai-hint="person face" />
                          <AvatarFallback>{task.postedBy.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">POSTED BY</p>
                            <p className="text-muted-foreground">{task.postedBy}</p>
                        </div>
                    </div>
                     <div className="flex items-start">
                         <MapPin className="h-5 w-5 mr-4 mt-1 text-muted-foreground" />
                        <div>
                            <p className="font-semibold">LOCATION</p>
                            <p className="text-muted-foreground">{task.location}</p>
                        </div>
                    </div>
                     <div className="flex items-start">
                         <Calendar className="h-5 w-5 mr-4 mt-1 text-muted-foreground" />
                        <div>
                            <p className="font-semibold">TO BE DONE ON</p>
                            <p className="text-muted-foreground">{task.date}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-6">
                    <h3 className="font-bold mb-2">Details</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {task.description}
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                 <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground mb-2">TASK BUDGET</p>
                        <p className="text-3xl font-bold">${task.price}</p>
                        {userRole === 'tasker' && (
                            <Button className="w-full mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
                                Make an offer
                            </Button>
                        )}
                        {!userRole && (
                             <Button className="w-full mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
                                Login to Apply
                            </Button>
                        )}
                    </CardContent>
                </Card>
                <Button variant="outline" className="w-full">Report this task</Button>
            </div>
        </div>

      </div>
    </ScrollArea>
  );
}
