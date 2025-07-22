'use client';

import { useState } from 'react';
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
import { CalendarIcon, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { SignUpDialog } from './SignUpDialog';

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.').max(100),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters.'),
  budget: z.coerce.number().positive('Budget must be a positive number.'),
  taskType: z.enum(['physical', 'online']),
  preferredDateTime: z.date({ required_error: 'A date is required.' }),
});

type PostTaskFormValues = z.infer<typeof formSchema>;

export default function PostTaskForm() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Mock auth state
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [taskData, setTaskData] = useState<PostTaskFormValues | null>(null);

  const form = useForm<PostTaskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      budget: undefined,
      taskType: 'physical',
      preferredDateTime: undefined,
    },
  });

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

  function onSubmit(values: PostTaskFormValues) {
    if (isAuthenticated) {
      console.log('Submitting task for authenticated user:', values);
      // Handle form submission for logged-in user
    } else {
      setTaskData(values);
      setIsSignUpOpen(true);
    }
  }

  function handleSignUp(signUpData: any) {
    console.log('Signing up user:', signUpData);
    console.log('Submitting task with user data:', taskData);
    // Handle user registration and then task submission
    setIsSignUpOpen(false);
    // In a real app, you'd probably get back a user session here
    // and then programmatically submit the task.
  }


  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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

          <div className="grid md:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="100" {...field} value={field.value ?? ''} />
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
          <Button type="submit" size="lg">
            Post Task
          </Button>
        </form>
      </Form>
      <SignUpDialog
        open={isSignUpOpen}
        onOpenChange={setIsSignUpOpen}
        onSignUp={handleSignUp}
      />
    </>
  );
}
