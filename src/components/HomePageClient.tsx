'use client';

import { useState, useMemo } from 'react';
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
import { Search, Map as MapIcon, List, ChevronDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import 'leaflet/dist/leaflet.css';
import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';
import TaskDetails from './TaskDetails';

interface HomePageClientProps {
  tasks: (Task & {
    coordinates: [number, number];
    description: string;
    postedBy: string;
  })[];
}

export default function HomePageClient({ tasks }: HomePageClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [taskType, setTaskType] = useState('all');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('any');
  const [category, setCategory] = useState('all');
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [selectedTask, setSelectedTask] = useState<(typeof tasks)[0] | null>(
    tasks.length > 0 ? tasks[0] : null
  );

  const Map = useMemo(
    () =>
      dynamic(() => import('@/components/Map'), {
        loading: () => <Skeleton className="h-full w-full" />,
        ssr: false,
      }),
    []
  );
  const handleTaskSelect = (task: (typeof tasks)[0]) => {
    setSelectedTask(task);
  };

  const handleReturnToMap = () => {
    setSelectedTask(null);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search term filter
      if (
        searchTerm &&
        !task.title.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Task type filter
      if (taskType !== 'all' && task.type !== taskType) {
        return false;
      }

      // Location filter
      if (
        location &&
        !task.location.toLowerCase().includes(location.toLowerCase())
      ) {
        return false;
      }

      // Price filter
      if (price !== 'any') {
        const priceValue = task.price;
        if (price === '<100' && priceValue >= 100) return false;
        if (price === '100-500' && (priceValue < 100 || priceValue > 500))
          return false;
        if (price === '>500' && priceValue <= 500) return false;
      }

      // Category filter is not implemented as there's no category data in tasks

      return true;
    });
  }, [tasks, searchTerm, taskType, location, price]);

  const rightPanelContent = () => {
    if (selectedTask) {
      return (
        <TaskDetails
          task={selectedTask as any}
          onBack={() => setSelectedTask(null)}
        />
      );
    }
    return <Map tasks={filteredTasks} onTaskSelect={handleTaskSelect} />;
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <AppHeader />
      <div className="border-b">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-wrap items-center gap-2 md:gap-4 py-4">
            <div className="relative flex-grow min-w-[150px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for a task"
                className="pl-9 w-full"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={category} onValueChange={setCategory} disabled>
              <SelectTrigger className="w-full sm:w-auto flex-grow sm:flex-grow-0 min-w-[120px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Location"
              className="flex-grow sm:flex-grow-0 sm:w-auto min-w-[150px]"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
            <Select value={price} onValueChange={setPrice}>
              <SelectTrigger className="w-full sm:w-auto flex-grow sm:flex-grow-0 min-w-[120px]">
                <SelectValue placeholder="Any price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Price</SelectItem>
                <SelectItem value="<100">&lt; $100</SelectItem>
                <SelectItem value="100-500">$100 - $500</SelectItem>
                <SelectItem value=">500">&gt; $500</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" className="hidden md:inline-flex">
              Other filters <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            <Select defaultValue="newest">
              <SelectTrigger className="w-full sm:w-auto flex-grow sm:flex-grow-0 min-w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Sort: Newest</SelectItem>
                <SelectItem value="price-asc">Price low-high</SelectItem>
                <SelectItem value="price-desc">Price high-low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[40%_60%] overflow-hidden">
        {/* Mobile view toggle */}
        <div className="md:hidden p-2 bg-card border-b flex justify-center">
          <div className="inline-flex rounded-md shadow-sm">
            <Button
              onClick={() => setMobileView('list')}
              variant={mobileView === 'list' ? 'secondary' : 'ghost'}
              className="rounded-r-none"
            >
              <List className="mr-2 h-4 w-4" />
              List
            </Button>
            <Button
              onClick={() => {
                setMobileView('map');
                setSelectedTask(null);
              }}
              variant={mobileView === 'map' ? 'secondary' : 'ghost'}
              className="rounded-l-none"
            >
              <MapIcon className="mr-2 h-4 w-4" />
              Map
            </Button>
          </div>
        </div>

        {/* Task List */}
        <ScrollArea
          className={`h-[calc(100vh-185px)] md:h-[calc(100vh-129px)] ${
            mobileView !== 'list' && 'hidden'
          } md:block`}
        >
          <div className="p-4 md:p-6 space-y-4">
            {filteredTasks.length > 0 ? (
              filteredTasks.map(task => (
                <TaskListItem
                  key={task.id}
                  task={task}
                  onSelect={handleTaskSelect}
                  isSelected={selectedTask?.id === task.id}
                />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-10">
                No tasks found matching your criteria.
              </p>
            )}
          </div>
        </ScrollArea>
        {/* Map or Task Details */}
        <div
          className={`relative h-[calc(100vh-185px)] md:h-[calc(100vh-129px)] ${
            mobileView !== 'map' && 'hidden'
          } md:block`}
        >
          {rightPanelContent()}
        </div>
      </main>
    </div>
  );
}
