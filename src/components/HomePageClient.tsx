
'use client';

import { useState, useMemo, useEffect } from 'react';
import AppHeader from '@/components/AppHeader';
import { type Task } from '@/components/TaskCard';
import TaskListItem from '@/components/TaskListItem';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Map as MapIcon,
  List,
  SlidersHorizontal,
  LocateFixed,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import 'leaflet/dist/leaflet.css';
import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';
import TaskDetails from './TaskDetails';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { cn } from '@/lib/utils';
import { Switch } from './ui/switch';
import { CategoryFilter } from './CategoryFilter';
import { Combobox } from './ui/combobox';
import { pakistaniCities } from '@/lib/locations';
import { Input } from './ui/input';

interface HomePageClientProps {
  tasks: (Task & {
    coordinates: [number, number];
    description: string;
    postedBy: string;
  })[];
}

type TaskTypeFilter = 'all' | 'physical' | 'online';
type SortByType = 'newest' | 'price-asc' | 'price-desc';

const MOCK_MAX_DISTANCE = 100; // km

const getZoomFromDistance = (distance: number) => {
  if (distance <= 1) return 14;
  if (distance <= 5) return 12;
  if (distance <= 15) return 11;
  if (distance <= 35) return 10;
  if (distance <= 70) return 9;
  return 8;
};

export default function HomePageClient({ tasks }: HomePageClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [selectedTask, setSelectedTask] = useState<(typeof tasks)[0] | null>(
    null
  );
  const [currentMapCenter, setCurrentMapCenter] = useState<
    [number, number] | null
  >(null);
  
  // Applied filters
  const [appliedCategories, setAppliedCategories] = useState<string[]>([]);
  const [appliedTaskType, setAppliedTaskType] =
    useState<TaskTypeFilter>('all');
  const [appliedLocation, setAppliedLocation] = useState<{
    name: string;
    coordinates: [number, number];
  } | null>(null);
  const [appliedDistance, setAppliedDistance] = useState(25);
  const [appliedAvailableOnly, setAppliedAvailableOnly] = useState(false);
  const [appliedNoOffersOnly, setAppliedNoOffersOnly] = useState(false);
  const [appliedPrice, setAppliedPrice] = useState('any');
  const [appliedSortBy, setAppliedSortBy] = useState<SortByType>('newest');
  const [mapZoom, setMapZoom] = useState(6);

  // Temporary state for the popovers
  const [popoverTaskType, setPopoverTaskType] =
    useState<TaskTypeFilter>(appliedTaskType);
  const [popoverLocation, setPopoverLocation] =
    useState<typeof appliedLocation>(appliedLocation);
  const [popoverDistance, setPopoverDistance] = useState(appliedDistance);
  const [popoverAvailableOnly, setPopoverAvailableOnly] =
    useState(appliedAvailableOnly);
  const [popoverNoOffersOnly, setPopoverNoOffersOnly] =
    useState(appliedNoOffersOnly);

  const [isLocationPopoverOpen, setIsLocationPopoverOpen] = useState(false);
  const [isOtherFiltersPopoverOpen, setIsOtherFiltersPopoverOpen] =
    useState(false);

  const Map = useMemo(
    () =>
      dynamic(() => import('@/components/Map'), {
        loading: () => <Skeleton className="h-full w-full" />,
        ssr: false,
      }),
    []
  );

  useEffect(() => {
    // Auto-detect user location on initial load
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        const userLocation = { name: 'Your Location', coordinates: [latitude, longitude] as [number, number] };
        setAppliedLocation(userLocation);
        setPopoverLocation(userLocation);
        setCurrentMapCenter(userLocation.coordinates);
        setMapZoom(getZoomFromDistance(appliedDistance));
      },
      () => {
        // Fallback to a default location if user denies permission
        setCurrentMapCenter(pakistaniCities[0].coordinates);
        setMapZoom(6);
      }
    );
  }, []);

  const handleTaskSelect = (task: (typeof tasks)[0]) => {
    setSelectedTask(task);
    setCurrentMapCenter(task.coordinates);
    setMapZoom(14);
  };

  const handleLocationFilterApply = () => {
    setAppliedTaskType(popoverTaskType);
    setAppliedLocation(popoverLocation);
    setAppliedDistance(popoverDistance);
    if (popoverLocation) {
      setCurrentMapCenter(popoverLocation.coordinates);
      setMapZoom(getZoomFromDistance(popoverDistance));
    } else {
      setCurrentMapCenter(pakistaniCities[0].coordinates);
      setMapZoom(6);
    }
    setIsLocationPopoverOpen(false);
  };

  const handleLocationFilterCancel = () => {
    setPopoverTaskType(appliedTaskType);
    setPopoverLocation(appliedLocation);
    setPopoverDistance(appliedDistance);
    setIsLocationPopoverOpen(false);
  };

  const handleUseCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;
      const myLocation = {
        name: 'Your Location',
        coordinates: [latitude, longitude] as [number, number],
      };
      setPopoverLocation(myLocation);
    });
  };

  const handleOtherFiltersApply = () => {
    setAppliedAvailableOnly(popoverAvailableOnly);
    setAppliedNoOffersOnly(popoverNoOffersOnly);
    setIsOtherFiltersPopoverOpen(false);
  };

  const handleOtherFiltersCancel = () => {
    setPopoverAvailableOnly(appliedAvailableOnly);
    setPopoverNoOffersOnly(appliedNoOffersOnly);
    setIsOtherFiltersPopoverOpen(false);
  };

  const getLocationButtonLabel = () => {
    if (appliedLocation) {
      if (appliedTaskType === 'physical') {
        return `Within ${appliedDistance}km of ${appliedLocation.name}`;
      }
      return appliedLocation.name;
    }
    if (appliedTaskType === 'physical') return 'In-person';
    if (appliedTaskType === 'online') return 'Remotely';
    return 'Any location';
  };

  const filteredTasks = useMemo(() => {
    let tasksToFilter = [...tasks];

    // Sorting
    if (appliedSortBy === 'price-asc') {
      tasksToFilter.sort((a, b) => a.price - b.price);
    } else if (appliedSortBy === 'price-desc') {
      tasksToFilter.sort((a, b) => b.price - a.price);
    } else {
      tasksToFilter.sort((a, b) => parseInt(b.id) - parseInt(a.id));
    }

    return tasksToFilter.filter(task => {
      if (
        searchTerm &&
        !task.title.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      if (
        appliedCategories.length > 0 &&
        task.category &&
        !appliedCategories.includes(task.category)
      ) {
        return false;
      }
      if (appliedTaskType !== 'all') {
        if (task.type !== appliedTaskType) return false;
      }

      if (
        appliedLocation &&
        task.type === 'physical'
      ) {
        // A real app would use a proper library for geo calculations (e.g., Haversine distance)
        // This is a simplified approximation.
        const [lat1, lon1] = appliedLocation.coordinates;
        const [lat2, lon2] = task.coordinates;
        const latDiff = Math.abs(lat1 - lat2);
        const lonDiff = Math.abs(lon1 - lon2);
        const distanceApproximation = Math.sqrt(latDiff*latDiff + lonDiff*lonDiff) * 111; // Very rough approximation
        if (distanceApproximation > appliedDistance) return false;
      }
      
      if (appliedPrice !== 'any') {
        const priceValue = task.price;
        if (appliedPrice === '<100' && priceValue >= 100) return false;
        if (appliedPrice === '100-500' && (priceValue < 100 || priceValue > 500))
          return false;
        if (appliedPrice === '>500' && priceValue <= 500) return false;
      }
      if (appliedAvailableOnly && task.status !== 'open') {
        return false;
      }
      if (appliedNoOffersOnly && task.offers > 0) {
        return false;
      }
      return true;
    });
  }, [
    tasks,
    searchTerm,
    appliedCategories,
    appliedTaskType,
    appliedLocation,
    appliedDistance,
    appliedPrice,
    appliedAvailableOnly,
    appliedNoOffersOnly,
    appliedSortBy,
  ]);
  
  const rightPanelContent = () => {
    if (selectedTask) {
      return (
        <TaskDetails
          task={selectedTask as any}
          onBack={() => setSelectedTask(null)}
        />
      );
    }
    return (
      <Map
        tasks={filteredTasks}
        onTaskSelect={handleTaskSelect}
        center={currentMapCenter}
        zoom={mapZoom}
      />
    );
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <AppHeader />
      <div className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 py-4">
            <div className="relative w-full sm:flex-grow-[2]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for a task"
                className="pl-9 w-full"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex w-full sm:w-auto items-center gap-2">
              <CategoryFilter
                selectedCategories={appliedCategories}
                onApply={setAppliedCategories}
              />

              <Popover
                open={isLocationPopoverOpen}
                onOpenChange={setIsLocationPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto justify-start text-left font-normal flex-grow"
                  >
                    <MapIcon className="sm:hidden h-4 w-4" />
                    <span className="truncate hidden sm:inline">
                      {getLocationButtonLabel()}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Location</h4>
                      <p className="text-sm text-muted-foreground">
                        Filter tasks by location and type.
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <Label>Task Type</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={
                            popoverTaskType === 'physical'
                              ? 'default'
                              : 'outline'
                          }
                          onClick={() => setPopoverTaskType('physical')}
                          className="flex-1"
                        >
                          In-person
                        </Button>
                        <Button
                          variant={
                            popoverTaskType === 'online'
                              ? 'default'
                              : 'outline'
                          }
                          onClick={() => setPopoverTaskType('online')}
                          className="flex-1"
                        >
                          Remotely
                        </Button>
                        <Button
                          variant={
                            popoverTaskType === 'all' ? 'default' : 'outline'
                          }
                          onClick={() => setPopoverTaskType('all')}
                          className="flex-1"
                        >
                          All
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="suburb">Location</Label>
                      <Combobox
                        items={pakistaniCities.map(c => ({
                          value: c.name.toLowerCase(),
                          label: c.name,
                        }))}
                        value={popoverLocation?.name.toLowerCase() || ''}
                        onChange={value => {
                          const city = pakistaniCities.find(
                            c => c.name.toLowerCase() === value
                          );
                          setPopoverLocation(city || null);
                        }}
                        placeholder="Search city..."
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleUseCurrentLocation}
                      >
                        <LocateFixed className="mr-2 h-4 w-4" />
                        Use current location
                      </Button>
                    </div>
                    <div className="grid gap-2">
                      <Label>
                        Distance -{' '}
                        <span className="font-bold text-primary">
                          {popoverDistance}km
                        </span>
                      </Label>
                      <Slider
                        value={[popoverDistance]}
                        onValueChange={value => setPopoverDistance(value[0])}
                        max={MOCK_MAX_DISTANCE}
                        step={1}
                        disabled={popoverTaskType !== 'physical' || !popoverLocation}
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <Button
                        variant="ghost"
                        onClick={handleLocationFilterCancel}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleLocationFilterApply}>Apply</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <div className="hidden md:flex items-center gap-2">
                <Select value={appliedPrice} onValueChange={setAppliedPrice}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Price</SelectItem>
                    <SelectItem value="<100">Under $100</SelectItem>
                    <SelectItem value="100-500">$100 - $500</SelectItem>
                    <SelectItem value=">500">Over $500</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={appliedSortBy}
                  onValueChange={value => setAppliedSortBy(value as SortByType)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-asc">
                      Price: Low to High
                    </SelectItem>
                    <SelectItem value="price-desc">
                      Price: High to Low
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Popover
                open={isOtherFiltersPopoverOpen}
                onOpenChange={setIsOtherFiltersPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-shrink-0">
                    <span className="sm:hidden">
                      <SlidersHorizontal className="h-4 w-4" />
                    </span>
                    <span className="hidden sm:inline">Other filters</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">
                        Other Filters
                      </h4>
                    </div>
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="available-only">
                            Available tasks only
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Hide tasks that are already assigned
                          </p>
                        </div>
                        <Switch
                          id="available-only"
                          checked={popoverAvailableOnly}
                          onCheckedChange={setPopoverAvailableOnly}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="no-offers-only">
                            Tasks with no offers only
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Hide tasks that have offers
                          </p>
                        </div>
                        <Switch
                          id="no-offers-only"
                          checked={popoverNoOffersOnly}
                          onCheckedChange={setPopoverNoOffersOnly}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <Button
                        variant="ghost"
                        onClick={handleOtherFiltersCancel}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleOtherFiltersApply}>Apply</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
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
          className={cn(
            'h-[calc(100vh-200px)] md:h-[calc(100vh-129px)]',
            mobileView === 'map' && 'hidden',
            'md:block'
          )}
        >
          <div className="p-4 md:p-6 space-y-4">
            {filteredTasks.length > 0 ? (
              filteredTasks.map(task => (
                <TaskListItem
                  key={task.id}
                  task={task}
                  onSelect={() => handleTaskSelect(task)}
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
          className={cn(
            'relative h-[calc(100vh-200px)] md:h-[calc(100vh-129px)] z-10', // Added z-10
            mobileView === 'list' && 'hidden',
            'md:block'
          )}
        >
          {rightPanelContent()}
        </div>
      </main>
    </div>
  );
}
