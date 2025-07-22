'use client';

import { useState }from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { generateTaskDescription } from '@/app/actions';

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Sparkles, LocateFixed } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { SignUpForm, SignUpFormValues } from './SignUpForm';
import { Separator } from './ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, addDoc, GeoPoint } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { categories } from '@/lib/categories';
import { Combobox } from './ui/combobox';
import { pakistaniCities } from '@/lib/locations';

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.').max(100),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters.'),
  budget: z.coerce.number().positive('Budget must be a positive number.'),
  taskType: z.enum(['physical', 'online']),
  preferredDateTime: z.date({ required_error: 'A date is required.' }),
  category: z.string().min(1, { message: 'Please select a category.'}),
  location: z.string().optional(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
});

type PostTaskFormValues = z.infer<typeof formSchema>;

export default function PostTaskForm() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [taskData, setTaskData] = useState<PostTaskFormValues | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, userProfile, settings } = useAuth();
  const { toast } = useToast();
  const router = useRouter();


  const form = useForm<PostTaskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      budget: undefined,
      taskType: 'physical',
      preferredDateTime: undefined,
      category: 'General',
      location: '',
      coordinates: undefined,
    },
  });

  const taskType = form.watch('taskType');

  async function handleGenerateDescription() {
    setIsGenerating(true);
    const { title, taskType, budget, preferredDateTime } = form.getValues();
    if (title && budget && preferredDateTime) {
      const description = await generateTaskDescription({
        taskTitle: title,
        taskType: taskType,
        budget: budget,
        preferredDateTime: format(preferredDateTime, 'PPP'),
        additionalInfo: 'Generate a friendly and encouraging description.',
      });
      form.setValue('description', description);
    }
    setIsGenerating(false);
  }

  async function submitTask(taskDetails: PostTaskFormValues, userId: string, userName: string) {
    try {
        const { coordinates, ...restOfTaskDetails } = taskDetails;
        const dataToSave: any = {
            ...restOfTaskDetails,
            postedById: userId,
            postedByName: userName,
            createdAt: serverTimestamp(),
            status: 'open',
            offerCount: 0
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
        form.setValue('coordinates', { lat: latitude, lng: longitude });
        // You might need a reverse geocoding service to get a location name from coords
        form.setValue('location', 'Current Location'); 
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
                  <div className="flex items-center justify-between">
                    <FormLabel>Task Description</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateDescription}
                      disabled={isGenerating}
                      className="shrink-0"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {isGenerating ? 'Generating...' : 'Generate with AI'}
                    </Button>
                  </div>
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
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category for your task" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.name} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget ({settings?.currencySymbol ?? 'Rs'})</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="5000" {...field} value={field.value ?? ''} />
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={date =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
                      onValueChange={field.onChange}
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
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                     <FormControl>
                        <div className="flex gap-2">
                           <Combobox
                                items={pakistaniCities.map(c => ({ value: c.name.toLowerCase(), label: c.name }))}
                                value={field.value || ''}
                                onChange={(value) => {
                                    const city = pakistaniCities.find(c => c.name.toLowerCase() === value);
                                    if (city) {
                                        field.onChange(city.name);
                                        form.setValue('coordinates', { lat: city.coordinates[0], lng: city.coordinates[1] });
                                    } else {
                                        field.onChange('');
                                        form.setValue('coordinates', undefined);
                                    }
                                }}
                                placeholder="Select a city..."
                                searchPlaceholder="Search city..."
                                notFoundText="City not found."
                            />
                            <Button type="button" variant="outline" onClick={handleUseCurrentLocation}>
                                <LocateFixed className="mr-2 h-4 w-4" />
                                Use current location
                            </Button>
                        </div>
                     </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                  // In a real app, this would open a login form/dialog
                  router.push('/login');
              }}>
                Login
              </Button>
            </p>
            <SignUpForm onSignUp={handleSignUp} submitButtonText='Sign Up & Post Task' loading={loading} />
          </div>
        </div>
      )}
    </>
  );
}
