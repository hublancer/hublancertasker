'use client';

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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import 'leaflet/dist/leaflet.css';
import { useMemo } from 'react';
import dynamic from 'next/dynamic';


interface HomePageClientProps {
  tasks: (Task & { coordinates: [number, number] })[];
}

export default function HomePageClient({ tasks }: HomePageClientProps) {
    const Map = useMemo(
    () =>
      dynamic(() => import('@/components/Map'), {
        loading: () => <Skeleton className="h-full w-full" />,
        ssr: false,
      }),
    []
  );

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
            {tasks.map(task => (
              <TaskListItem key={task.id} task={task} />
            ))}
          </div>
        </ScrollArea>
        <div className="hidden lg:block relative h-[calc(100vh-129px)]">
           <Map tasks={tasks} />
        </div>
      </main>
    </div>
  );
}
