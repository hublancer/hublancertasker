'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  accountType: z.enum(['client', 'tasker']),
});

export type SignUpFormValues = z.infer<typeof signUpSchema>;

interface SignUpFormProps {
  onSignUp: (data: SignUpFormValues) => void;
  submitButtonText?: string;
  loading?: boolean;
}

export function SignUpForm({ onSignUp, submitButtonText = "Sign Up", loading = false }: SignUpFormProps) {
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      accountType: 'client',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSignUp)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="m@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="accountType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>I am a...</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-2 gap-4 max-w-sm"
                >
                  <FormItem>
                    <RadioGroupItem
                      value="client"
                      id="client-signup"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="client-signup"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      Client
                    </Label>
                  </FormItem>
                  <FormItem>
                    <RadioGroupItem
                      value="tasker"
                      id="tasker-signup"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="tasker-signup"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      Tasker
                    </Label>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? "Processing..." : submitButtonText}
        </Button>
      </form>
    </Form>
  );
}
