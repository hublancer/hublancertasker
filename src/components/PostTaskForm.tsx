
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import dynamic from 'next/dynamic';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { LocateFixed } from 'lucide-react';
import { SignUpForm, SignUpFormValues } from './SignUpForm';
import { Separator } from './ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, addDoc, GeoPoint } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { categories } from '@/lib/categories';
import { pakistaniCities } from '@/lib/locations';
import { LoginDialog } from './LoginDialog';
import { Skeleton } from './ui/skeleton';
import { type Task } from './TaskCard';
import { cn } from '@/lib/utils';


const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.').max(100),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters.'),
  budget: z.coerce.number().min(1000, 'Budget must be at least 1000.'),
  taskType: z.enum(['physical', 'online']),
  preferredDateTime: z.string().refine((val) => val, { message: "A date is required." }),
  category: z.string().min(1, { message: 'Please select a category.'}),
  location: z.string().optional(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
}).refine(data => {
    if (data.taskType === 'physical') {
        return !!data.coordinates;
    }
    return true;
}, {
    message: 'Location is required for physical tasks. Please use the button to set a location.',
    path: ['location'],
});


type PostTaskFormValues = z.infer<typeof formSchema>;

export default function PostTaskForm() {
  const [showSignUp, setShowSignUp] = useState(false);
  const [taskData, setTaskData] = useState<PostTaskFormValues | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, userProfile, settings } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  
  const [mapCenter, setMapCenter] = useState<[number, number]>([30.3753, 69.3451]);
  const [mapZoom, setMapZoom] = useState(5);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);

  const Map = useMemo(() => dynamic(() => import('@/components/Map'), { 
      loading: () => <Skeleton className="h-full w-full" />,
      ssr: false 
  }), []);


  const form = useForm<PostTaskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      budget: '' as any, // Initialize as empty string to be a controlled component
      taskType: 'physical',
      preferredDateTime: '', // Initialize as empty string
      category: 'General',
      location: '',
      coordinates: undefined,
    },
  });

  const taskType = form.watch('taskType');

  async function submitTask(taskDetails: PostTaskFormValues, userId: string, userName: string) {
    try {
        const { coordinates, ...restOfTaskDetails } = taskDetails;
        const dataToSave: any = {
            ...restOfTaskDetails,
            postedById: userId,
            postedByName: userName,
            createdAt: serverTimestamp(),
            status: 'open',
            offerCount: 0,
            preferredDateTime: new Date(taskDetails.preferredDateTime)
        };

        if (taskDetails.taskType === 'physical' && coordinates) {
            dataToSave.coordinates = new GeoPoint(coordinates.lat, coordinates.lng);
            dataToSave.location = taskDetails.location;
        } else {
            dataToSave.location = 'Online';
        }

        await addDoc(collection(db, 'tasks'), dataToSave);
        toast({
            title: "Task Posted!",
            description: "Your task is now live for others to see.",
        });
        router.push('/my-tasks');
    } catch (error: any) {
        console.error("Error posting task:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to post task. " + error.message,
        });
    } finally {
        setLoading(false);
    }
  }

  function onSubmit(values: PostTaskFormValues) {
    if (user) {
      setLoading(true);
      submitTask(values, user.uid, userProfile?.name || user.email!);
    } else {
      setTaskData(values);
      setShowSignUp(true);
    }
  }

  async function handleSignUp(signUpData: SignUpFormValues) {
    if (!taskData) return;
    setLoading(true);

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, signUpData.email, signUpData.password);
        const newUser = userCredential.user;
        
        await updateProfile(newUser, {
          displayName: signUpData.name
        });

        await setDoc(doc(db, "users", newUser.uid), {
            uid: newUser.uid,
            email: signUpData.email,
            accountType: signUpData.accountType,
            role: signUpData.accountType,
            name: signUpData.name,
            wallet: {
                balance: 0,
            }
        });

        await submitTask(taskData, newUser.uid, signUpData.name);

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: error.message,
        });
    } finally {
        setLoading(false);
    }
  }
  
  const handleUseCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coords: [number, number] = [latitude, longitude];
        form.setValue('coordinates', { lat: latitude, lng: longitude });
        form.setValue('location', 'Current Location');
        form.clearErrors('location');
        setMapCenter(coords);
        setMarkerPosition(coords);
        setMapZoom(13);
        toast({
            title: "Location set!",
            description: "Your current location has been set for this task.",
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast({
            variant: "destructive",
            title: "Location Error",
            description: "Could not get your location. Please select one manually.",
        });
      }
    );
  };
  
  const handleMarkerDragEnd = (newPosition: [number, number]) => {
    form.setValue('coordinates', { lat: newPosition[0], lng: newPosition[1] });
    form.setValue('location', 'Custom Location');
    form.clearErrors('location');
    setMarkerPosition(newPosition);
    setMapCenter(newPosition);
  };


  const isAuthenticated = !!user;


  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <fieldset disabled={showSignUp || loading} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Assemble IKEA furniture" {...field} />
                  </FormControl>
                  <FormDescription>
                    A short, clear title for your task.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the task in detail..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                   <FormControl>
                     <select
                        {...field}
                        className={cn(
                          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        )}
                      >
                         <option value="" disabled>Select a category</option>
                        {categories.map((category) => (
                          <option key={category.name} value={category.name}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                   </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget ({settings?.currencySymbol ?? 'Rs'})</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="preferredDateTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Preferred Date</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="taskType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Task Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                          field.onChange(value);
                          if (value === 'online') {
                            setMarkerPosition(null);
                          }
                      }}
                      defaultValue={field.value}
                      className="flex gap-4"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="physical" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Physical (in-person)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="online" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Online (can be done remotely)
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {taskType === 'physical' && (
              <div className="space-y-4">
                <FormLabel>Location</FormLabel>
                <div className="h-64 w-full rounded-md overflow-hidden border z-0">
                    <Map
                        tasks={markerPosition ? [{id: 'current', coordinates: markerPosition} as Task] : []}
                        center={mapCenter}
                        zoom={mapZoom}
                        onTaskSelect={() => {}}
                        isDraggable={true}
                        onMarkerDragEnd={handleMarkerDragEnd}
                    />
                </div>
                 <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                     <FormControl>
                        <div className="flex flex-col sm:flex-row gap-2">
                           <select
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === 'Current Location') {
                                        handleUseCurrentLocation();
                                        field.onChange('Current Location');
                                        return;
                                    }
                                    const city = pakistaniCities.find(c => c.name === value);
                                    if (city) {
                                        field.onChange(city.name);
                                        form.setValue('coordinates', { lat: city.coordinates[0], lng: city.coordinates[1] });
                                        setMapCenter(city.coordinates);
                                        setMarkerPosition(city.coordinates);
                                        setMapZoom(11);
                                    } else {
                                        field.onChange('');
                                        form.setValue('coordinates', undefined);
                                    }
                                }}
                                className={cn(
                                "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                )}
                            >
                                <option value="" disabled>Select a location</option>
                                <option value="Current Location">Current Location</option>
                                {pakistaniCities.map(c => (
                                    <option key={c.name} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                            <Button type="button" variant="outline" onClick={handleUseCurrentLocation} className="flex-shrink-0">
                                <LocateFixed className="mr-2 h-4 w-4" />
                                Use current location
                            </Button>
                        </div>
                     </FormControl>
                     <FormDescription>Select a city or use the button to set your location, then drag the pin on the map to refine it.</FormDescription>
                    <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </fieldset>

          {!showSignUp && (
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? "Processing..." : isAuthenticated ? "Post Task" : "Continue"}
            </Button>
          )}
        </form>
      </Form>

      {showSignUp && (
        <div className="mt-12">
          <Separator />
          <div className="py-8">
            <h3 className="text-2xl font-headline mb-2">One more step</h3>
            <p className="text-muted-foreground mb-6">
              Create an account to post your task. Already have an account?{' '}
              <Button variant="link" className="p-0 h-auto" onClick={() => {
                  setShowSignUp(false);
                  setIsLoginOpen(true);
              }}>
                Login
              </Button>
            </p>
            <SignUpForm onSignUp={handleSignUp} submitButtonText='Sign Up & Post Task' loading={loading} />
          </div>
        </div>
      )}
      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </>
  );
}

