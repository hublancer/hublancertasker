import AppHeader from '@/components/AppHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Calendar, CircleDollarSign } from 'lucide-react';

// Mock data, in a real app this would be fetched based on params.id
const task = {
  id: '1',
  title: 'Garden Cleanup and Mowing',
  location: 'Greenwich, London',
  date: 'July 28, 2024',
  price: 75,
  offers: 3,
  type: 'physical' as 'physical' | 'online',
  description:
    "I need help getting my garden ready for a summer party. The main tasks include mowing the front and back lawn (approx 100 sq meters total), weeding the flower beds, trimming the hedges, and taking away all the garden waste. All tools will be provided, but you're welcome to bring your own if you prefer. This should take about 3-4 hours.",
};

const applicants = [
  { name: 'John D.', avatar: 'https://placehold.co/40x40.png' },
  { name: 'Sarah P.', avatar: 'https://placehold.co/40x40.png' },
  { name: 'Mike W.', avatar: 'https://placehold.co/40x40.png' },
];

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  // Mocking role, this would come from auth context
  const userRole = 'client'; // 'client', 'tasker', or null

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1">
        <div className="container mx-auto py-12 px-4 md:px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <Badge
                    variant={task.type === 'physical' ? 'secondary' : 'outline'}
                    className="w-fit mb-2"
                  >
                    {task.type}
                  </Badge>
                  <CardTitle className="font-headline text-3xl">
                    {task.title}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-muted-foreground">
                    <div className="flex items-center text-sm">
                      <MapPin className="mr-1.5 h-4 w-4" />
                      <span>{task.location}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-1.5 h-4 w-4" />
                      <span>{task.date}</span>
                    </div>
                    <div className="flex items-center text-sm font-semibold text-primary">
                      <CircleDollarSign className="mr-1.5 h-4 w-4" />
                      <span>${task.price} Budget</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold mb-2 text-lg">Task Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {task.description}
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-2xl">
                    {userRole === 'client'
                      ? 'Applicants'
                      : 'Apply for this task'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userRole === 'client' && (
                    <div className="space-y-4">
                      {applicants.map(applicant => (
                        <div
                          key={applicant.name}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={applicant.avatar} data-ai-hint="person face" />
                              <AvatarFallback>
                                {applicant.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{applicant.name}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              Profile
                            </Button>
                            <Button size="sm">Accept</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {userRole === 'tasker' && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Ready to take on this task? Submit your application now.
                      </p>
                      <Button className="w-full">Apply Now</Button>
                    </div>
                  )}
                  {!userRole && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        You must be logged in as a tasker to apply.
                      </p>
                      <Button className="w-full">Login to Apply</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
