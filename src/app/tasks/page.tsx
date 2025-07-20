import AppHeader from '@/components/AppHeader';
import TaskCard, { type Task } from '@/components/TaskCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import Image from 'next/image';

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Garden Cleanup and Mowing',
    location: 'Greenwich, London',
    date: 'July 28, 2024',
    price: 75,
    offers: 3,
    type: 'physical',
  },
  {
    id: '2',
    title: 'Build a responsive React website',
    location: 'Remote',
    date: 'Flexible',
    price: 500,
    offers: 8,
    type: 'online',
  },
  {
    id: '3',
    title: 'Help moving apartments',
    location: 'SoHo, New York',
    date: 'August 2, 2024',
    price: 150,
    offers: 1,
    type: 'physical',
  },
  {
    id: '4',
    title: 'Design a company logo',
    location: 'Remote',
    date: '1-week deadline',
    price: 250,
    offers: 12,
    type: 'online',
  },
  {
    id: '5',
    title: 'Assemble a new bookshelf',
    location: 'Paris, France',
    date: 'July 30, 2024',
    price: 60,
    offers: 5,
    type: 'physical',
  },
  {
    id: '6',
    title: 'Write 5 blog posts on tech',
    location: 'Remote',
    date: 'Flexible',
    price: 300,
    offers: 6,
    type: 'online',
  },
];

export default function TasksPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1">
        <div className="container mx-auto py-8 px-4 md:px-6">
          <div className="space-y-4 mb-8">
            <h1 className="text-3xl font-bold font-headline">
              Find Your Next Task
            </h1>
            <div className="flex gap-2">
              <Input
                placeholder="Search for tasks by keyword..."
                className="max-w-lg"
              />
              <Button>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold font-headline">Open Tasks</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {mockTasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="sticky top-24 space-y-4">
                <h2 className="text-2xl font-bold font-headline">
                  Task Locations
                </h2>
                <div className="aspect-video w-full overflow-hidden rounded-xl border">
                  <Image
                    src="https://placehold.co/800x600.png"
                    alt="Map of task locations"
                    width={800}
                    height={600}
                    data-ai-hint="world map"
                    className="object-cover w-full h-full"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Map view for physical tasks. Integration with Google Maps API
                  required.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
