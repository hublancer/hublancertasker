
'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import AppHeader from '@/components/AppHeader';
import { type Task } from '@/components/TaskCard';
import {
  collection,
  Timestamp,
  GeoPoint,
  query,
  orderBy,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
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
  MapPin,
  Calendar,
  Tag,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import 'leaflet/dist/leaflet.css';
import dynamic from 'next/dynamic';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { categories } from '@/lib/categories';
import { pakistaniCities } from '@/lib/locations';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

// Dynamically import L from leaflet only on the client side
const L = typeof window !== 'undefined' ? require('leaflet') : null;

// Re-defining TaskListItem to make page.tsx self-contained
const TaskListItem = ({
  task,
  onSelect,
  onViewDetails,
  isSelected,
}: {
  task: Task;
  onSelect: () => void;
  onViewDetails: () => void;
  isSelected: boolean;
}) => {
  const { settings } = useAuth();
  return (
    <Card
      className={cn(
        'hover:shadow-md transition-shadow duration-200 cursor-pointer',
        isSelected ? 'border-primary' : ''
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <h3 className="font-bold text-lg">{task.title}</h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
              <div className="flex items-center">
                 <MapPin className="mr-1.5 h-4 w-4" />
                 <span>{task.location}</span>
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
          </div>

          <div className="text-right flex flex-col items-center justify-between h-full gap-2">
            <p className="text-xl font-bold text-primary">{settings?.currencySymbol ?? 'Rs'}{task.price}</p>
            <Button size="sm" onClick={(e) => { e.stopPropagation(); onViewDetails(); }}>View</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Re-defining CategoryFilter to make page.tsx self-contained
const CategoryFilter = ({
  selectedCategories,
  onApply,
}: {
  selectedCategories: string[];
  onApply: (categories: string[]) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tempSelected, setTempSelected] = useState<string[]>(selectedCategories);

  const filteredCategories = useMemo(() => {
    return categories.filter(category =>
      category.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const handleApply = () => {
    onApply(tempSelected);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempSelected(selectedCategories);
    setIsOpen(false);
  };

  const handleClearAll = () => {
    setTempSelected([]);
  };

  const handleCheckboxChange = (categoryName: string, checked: boolean) => {
    setTempSelected(prev =>
      checked ? [...prev, categoryName] : prev.filter(c => c !== categoryName)
    );
  };

  const getButtonLabel = () => {
    if (selectedCategories.length === 0) return 'Category';
    if (selectedCategories.length === 1) return selectedCategories[0];
    return `${selectedCategories.length} cat.`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto flex-grow-0 justify-start text-left font-normal">
           <ListFilter className="sm:hidden h-4 w-4" />
          <span className="truncate hidden sm:inline">{getButtonLabel()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 md:w-[500px] p-0" align="start">
        <div className="p-4">
          <h4 className="font-medium leading-none mb-4">All Categories</h4>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Separator />
        <ScrollArea className="h-64">
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCategories.map(category => (
              <div key={category.name} className="flex items-center space-x-2">
                <Checkbox
                  id={category.name}
                  checked={tempSelected.includes(category.name)}
                  onCheckedChange={checked =>
                    handleCheckboxChange(category.name, !!checked)
                  }
                />
                <Label
                  htmlFor={category.name}
                  className="font-normal cursor-pointer flex-1"
                >
                  {category.name}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
        <Separator />
        <div className="flex justify-between items-center p-4">
          <Button variant="ghost" onClick={handleClearAll} className="p-0 h-auto">
            Clear all
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleApply}>Apply</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}


type TaskTypeFilter = 'all' | 'physical' | 'online';
type SortByType = 'newest' | 'price-asc' | 'price-desc';
type LocationFilterMode = 'city' | 'current';

const getZoomForDistance = (distance: number) => {
    if (distance <= 1) return 15;
    if (distance <= 5) return 14;
    if (distance <= 10) return 13;
    if (distance <= 25) return 12;
    if (distance <= 50) return 11;
    if (distance <= 100) return 10;
    return 9;
}

function HomePageContent() {
  const [tasks, setTasks] = useState<
    (Task & {
      coordinates: [number, number] | null;
      description: string;
      postedBy: string;
    })[]
  >([]);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      setInitialLoading(true);
      try {
        const tasksCollection = collection(db, 'tasks');
        const q = query(
          tasksCollection,
          where('status', '==', 'open'),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const taskList = snapshot.docs.map(doc => {
          const data = doc.data();

          let coordinates: [number, number] | null = null;
          if (data.coordinates instanceof GeoPoint) {
            coordinates = [data.coordinates.latitude, data.coordinates.longitude];
          }

          return {
            id: doc.id,
            title: data.title,
            location: data.location,
            date:
              data.preferredDateTime instanceof Timestamp
                ? data.preferredDateTime.toDate().toLocaleDateString()
                : data.preferredDateTime,
            price: data.budget,
            offers: data.offerCount || 0,
            type: data.taskType,
            category: data.category || 'General',
            coordinates: coordinates,
            description: data.description,
            postedBy: data.postedByName || 'Anonymous',
            status: data.status || 'open',
            postedById: data.postedById,
            createdAt:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate().toISOString()
                : new Date().toISOString(),
          } as Task & {
            coordinates: [number, number] | null;
            description: string;
            postedBy: string;
          };
        });
        setTasks(taskList);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [currentMapCenter, setCurrentMapCenter] = useState<
    [number, number] | null
  >(pakistaniCities[0].coordinates);
  const [mapZoom, setMapZoom] = useState(6);
  const isMobile = useMediaQuery('(max-width: 767px)');

  // Applied filters
  const [appliedCategories, setAppliedCategories] = useState<string[]>([]);
  const [appliedTaskType, setAppliedTaskType] =
    useState<TaskTypeFilter>('all');
  const [appliedLocationFilterMode, setAppliedLocationFilterMode] =
    useState<LocationFilterMode>('city');
  const [appliedCity, setAppliedCity] = useState<{
    name: string;
    coordinates: [number, number];
  } | null>(null);
  const [appliedCurrentLocation, setAppliedCurrentLocation] = useState<[
    number,
    number
  ] | null>(null);
  const [appliedDistance, setAppliedDistance] = useState(25); // Default 25km
  const [appliedAvailableOnly, setAppliedAvailableOnly] = useState(false);
  const [appliedNoOffersOnly, setAppliedNoOffersOnly] = useState(false);
  const [appliedPrice, setAppliedPrice] = useState('any');
  const [appliedSortBy, setAppliedSortBy] = useState<SortByType>('newest');

  // Temporary state for the popovers
  const [popoverTaskType, setPopoverTaskType] =
    useState<TaskTypeFilter>(appliedTaskType);
  const [popoverLocationFilterMode, setPopoverLocationFilterMode] =
    useState<LocationFilterMode>(appliedLocationFilterMode);
  const [popoverCity, setPopoverCity] = useState(appliedCity);
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

  const handleUseCurrentLocation = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setPopoverLocationFilterMode('current');
        setAppliedCurrentLocation([latitude, longitude]);
        setCurrentMapCenter([latitude, longitude]);
        setMapZoom(13); // Zoom to city level
      },
      () => {
        alert('Could not get your location.');
      }
    );
  }, []);

  useEffect(() => {
    handleUseCurrentLocation();
  }, [handleUseCurrentLocation]);

  const handleTaskSelect = (task: (typeof tasks)[0]) => {
    setSelectedTaskId(task.id);
    if (task.coordinates) {
      setCurrentMapCenter(task.coordinates);
      setMapZoom(14);
    }
  };

  const handleViewDetails = (taskId: string) => {
    router.push(`/task/${taskId}`);
  };

  const handleLocationFilterApply = () => {
    setAppliedTaskType(popoverTaskType);
    setAppliedLocationFilterMode(popoverLocationFilterMode);

    if (popoverLocationFilterMode === 'city' && popoverCity) {
      setAppliedCity(popoverCity);
      setCurrentMapCenter(popoverCity.coordinates);
      setMapZoom(11);
    } else if (
      popoverLocationFilterMode === 'current' &&
      appliedCurrentLocation
    ) {
      setAppliedCity(null);
      setCurrentMapCenter(appliedCurrentLocation);
      setMapZoom(13); // Keep city level zoom
    } else {
      setAppliedCity(null);
      setCurrentMapCenter(pakistaniCities[0].coordinates);
      setMapZoom(6);
    }
    setIsLocationPopoverOpen(false);
  };

  const handleLocationFilterCancel = () => {
    setPopoverTaskType(appliedTaskType);
    setPopoverLocationFilterMode(appliedLocationFilterMode);
    setPopoverCity(appliedCity);
    setIsLocationPopoverOpen(false);
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
    if (appliedLocationFilterMode === 'current') return 'Current Location';
    if (appliedCity) return appliedCity.name;
    if (appliedTaskType === 'physical') return 'In-person';
    if (appliedTaskType === 'online') return 'Remotely';
    return 'Location';
  };

  const filteredTasks = useMemo(() => {
    if (!L) return []; // Don't filter if Leaflet is not available
    let tasksToFilter = [...tasks];

    // Sorting
    if (appliedSortBy === 'price-asc') {
      tasksToFilter.sort((a, b) => a.price - b.price);
    } else if (appliedSortBy === 'price-desc') {
      tasksToFilter.sort((a, b) => b.price - a.price);
    } else {
      tasksToFilter.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
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
        appliedTaskType === 'physical' &&
        appliedLocationFilterMode === 'city' &&
        appliedCity
      ) {
        if (task.location !== appliedCity.name) return false;
      }

      if (
        appliedTaskType === 'physical' &&
        appliedLocationFilterMode === 'current' &&
        appliedCurrentLocation
      ) {
        if (!task.coordinates) return false;
        const taskLatLng = L.latLng(task.coordinates);
        const currentLatLng = L.latLng(appliedCurrentLocation);
        const distance = currentLatLng.distanceTo(taskLatLng) / 1000; // in km
        if (distance > appliedDistance) return false;
      }

      if (appliedPrice !== 'any') {
        const priceValue = task.price;
        if (appliedPrice === '<5000' && priceValue >= 5000) return false;
        if (
          appliedPrice === '5000-20000' &&
          (priceValue < 5000 || priceValue > 20000)
        )
          return false;
        if (appliedPrice === '>20000' && priceValue <= 20000) return false;
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
    appliedLocationFilterMode,
    appliedCity,
    appliedCurrentLocation,
    appliedDistance,
    appliedPrice,
    appliedAvailableOnly,
    appliedNoOffersOnly,
    appliedSortBy,
  ]);

  if (initialLoading) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <Skeleton className="h-14 w-full" />
        <div className="p-4">
          <Skeleton className="h-10 w-full mb-4" />
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[40%_60%] gap-4 flex-1">
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div>
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <AppHeader />
      <div className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex w-full items-center gap-2 py-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for a task"
                className="pl-9 w-full"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
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
                    className="w-full sm:w-auto justify-start text-left font-normal flex-grow-0"
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
                      </div>
                    </div>
                    {popoverTaskType === 'physical' && (
                      <>
                        <div className="grid gap-2">
                          <Button
                            variant="outline"
                            onClick={handleUseCurrentLocation}
                            className={cn(
                              popoverLocationFilterMode === 'current' &&
                                'border-primary'
                            )}
                          >
                            <LocateFixed className="mr-2 h-4 w-4" />
                            Use my current location
                          </Button>
                        </div>
                        <div className="relative my-2">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-popover px-2 text-muted-foreground">
                              Or
                            </span>
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label>Select a city</Label>
                          <Select
                            value={popoverCity?.name || ''}
                            onValueChange={value => {
                              const city = pakistaniCities.find(
                                c => c.name === value
                              );
                              setPopoverCity(
                                city
                                  ? {
                                      name: city.name,
                                      coordinates: city.coordinates,
                                    }
                                  : null
                              );
                              setPopoverLocationFilterMode('city');
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a city" />
                            </SelectTrigger>
                            <SelectContent>
                              {pakistaniCities.map(city => (
                                <SelectItem key={city.name} value={city.name}>
                                  {city.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

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
              <Popover
                open={isOtherFiltersPopoverOpen}
                onOpenChange={setIsOtherFiltersPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-shrink-0">
                    <span className="sm:hidden">
                      <SlidersHorizontal className="h-4 w-4" />
                    </span>
                    <span className="hidden sm:inline">Filters</span>
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
                      <Select
                        value={appliedPrice}
                        onValueChange={setAppliedPrice}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Price" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any Price</SelectItem>
                          <SelectItem value="<5000">Under Rs5000</SelectItem>
                          <SelectItem value="5000-20000">
                            Rs5000 - Rs20000
                          </SelectItem>
                          <SelectItem value=">20000">Over Rs20000</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={appliedSortBy}
                        onValueChange={value =>
                          setAppliedSortBy(value as SortByType)
                        }
                      >
                        <SelectTrigger className="w-full">
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
      <main className="flex-1 grid grid-cols-1 md:grid-cols-[40%_60%] overflow-hidden">
        {/* Mobile view toggle */}
        <div className="md:hidden p-2 bg-card border-b flex justify-center">
          <div className="inline-flex rounded-md shadow-sm">
            <Button
              onClick={() => {
                setMobileView('list');
              }}
              variant={mobileView === 'list' ? 'secondary' : 'ghost'}
              className="rounded-r-none"
            >
              <List className="mr-2 h-4 w-4" />
              List
            </Button>
            <Button
              onClick={() => {
                setMobileView('map');
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
            isMobile && mobileView !== 'list' && 'hidden',
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
                  onViewDetails={() => handleViewDetails(task.id)}
                  isSelected={selectedTaskId === task.id}
                />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-10">
                No tasks found matching your criteria.
              </p>
            )}
          </div>
        </ScrollArea>
        {/* Map */}
        <div
          className={cn(
            'relative h-[calc(100vh-200px)] md:h-[calc(100vh-129px)] z-10 rounded-lg overflow-hidden',
            isMobile && mobileView === 'list' && 'hidden',
            'md:block'
          )}
        >
          {
            <Map
              tasks={tasks}
              onTaskSelect={handleViewDetails}
              center={currentMapCenter}
              zoom={mapZoom}
            />
          }
        </div>
      </main>
    </div>
  );
}

export default function Home() {
    return (
        <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center">Loading...</div>}>
            <HomePageContent />
        </Suspense>
    )
}

    