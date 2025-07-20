
import AppHeader from '@/components/AppHeader';
import { type Task } from '@/components/TaskCard';
import TaskListItem from '@/components/TaskListItem';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Garden Cleanup and Mowing',
    location: 'Greenwich, London',
    date: 'Today',
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

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <div className="border-b">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-wrap items-center gap-4 py-4">
            <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search for a task" className="pl-9" />
            </div>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="gardening">Gardening</SelectItem>
                <SelectItem value="web-dev">Web Development</SelectItem>
                <SelectItem value="moving">Moving</SelectItem>
                <SelectItem value="design">Design</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Location"
              className="flex-grow sm:flex-grow-0 sm:w-64"
            />
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Any price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Price</SelectItem>
                <SelectItem value="<100">&lt; $100</SelectItem>
                <SelectItem value="100-500">$100 - $500</SelectItem>
                <SelectItem value=">500">&gt; $500</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost">
              Other filters <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort</span>
              <Select defaultValue="newest">
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-asc">Price low-high</SelectItem>
                  <SelectItem value="price-desc">Price high-low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        <ScrollArea className="h-[calc(100vh-129px)]">
          <div className="p-4 md:p-6 space-y-4">
            {mockTasks.map(task => (
              <TaskListItem key={task.id} task={task} />
            ))}
          </div>
        </ScrollArea>
        <div className="hidden lg:block relative h-[calc(100vh-129px)]">
          <Image
            src="https://placehold.co/1200x1200.png"
            alt="Map of task locations"
            layout="fill"
            data-ai-hint="world map"
            className="object-cover"
          />
        </div>
      </main>
    </div>
  );
}
