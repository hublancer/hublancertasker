
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db, auth } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { categories } from '@/lib/categories';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

const profileSetupSchema = z.object({
  bio: z.string().max(300, 'Bio cannot exceed 300 characters.').optional(),
  phone: z.string().optional(),
  skills: z.array(z.string()).optional(),
});

type ProfileSetupFormValues = z.infer<typeof profileSetupSchema>;

export default function ProfileSetupPage() {
  const { user, userProfile, loading: authLoading, revalidateProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileSetupFormValues>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      bio: '',
      phone: '',
      skills: [],
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/register');
    }
    if (userProfile) {
        form.setValue('bio', userProfile.bio || '');
        form.setValue('phone', userProfile.phone || '');
        form.setValue('skills', userProfile.skills || []);
    }
  }, [user, userProfile, authLoading, router, form]);

  const onSubmit = async (data: ProfileSetupFormValues) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      // Update Firestore document
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        bio: data.bio,
        phone: data.phone,
        skills: data.skills,
        isVerified: userProfile?.isVerified || false,
        kycStatus: userProfile?.kycStatus || 'none',
      });

      await revalidateProfile();

      toast({
        title: 'Profile Updated!',
        description: 'Your profile has been successfully set up.',
      });

      router.push('/kyc');

    } catch (error: any) {
      console.error('Error setting up profile:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update profile.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (authLoading || !userProfile) {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader />
            <div className="flex-1 flex items-center justify-center">
                 <Skeleton className="h-96 w-full max-w-2xl" />
            </div>
        </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Set Up Your Profile</CardTitle>
            <CardDescription>
              Add some details to help people get to know you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={userProfile?.photoURL || ''} data-ai-hint="person face" />
                  <AvatarFallback className="text-3xl">{userProfile?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="text-xl font-bold">{userProfile?.name}</h3>
                    <p className="text-muted-foreground">{userProfile?.email}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone / WhatsApp</Label>
                <Input
                  id="phone"
                  placeholder="e.g. +923001234567"
                  {...form.register('phone')}
                />
                 {form.formState.errors.phone && (
                    <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us a little about yourself..."
                  {...form.register('bio')}
                />
                {form.formState.errors.bio && (
                    <p className="text-sm text-destructive">{form.formState.errors.bio.message}</p>
                )}
              </div>

              {userProfile?.accountType === 'tasker' && (
                <div className="space-y-4">
                    <Label>Skills</Label>
                    <p className="text-sm text-muted-foreground">Select the services you offer.</p>
                    <ScrollArea className="h-64 w-full rounded-md border p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                             <Controller
                                name="skills"
                                control={form.control}
                                render={({ field }) => (
                                    <>
                                    {categories.map((category) => (
                                        <div key={category.name} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={category.name}
                                            checked={field.value?.includes(category.name)}
                                            onCheckedChange={(checked) => {
                                            return checked
                                                ? field.onChange([...(field.value || []), category.name])
                                                : field.onChange(
                                                    field.value?.filter(
                                                    (value) => value !== category.name
                                                    )
                                                );
                                            }}
                                        />
                                        <label
                                            htmlFor={category.name}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {category.name}
                                        </label>
                                        </div>
                                    ))}
                                    </>
                                )}
                             />
                        </div>
                    </ScrollArea>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                 <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save and Continue'}
                 </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
