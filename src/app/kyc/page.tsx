
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import AppHeader from '@/components/AppHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';

const kycSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters long.'),
  cnic: z.string().length(15, 'Please enter a valid 13-digit CNIC.'),
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Please enter a valid date."}),
});

type KycFormValues = z.infer<typeof kycSchema>;

interface KycSubmission {
  fullName: string;
  cnic: string;
  cnicPhotoUrl: string;
  dob: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: any;
  rejectionReason?: string;
}

export default function KycPage() {
  const { user, userProfile, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [kycData, setKycData] = useState<KycSubmission | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<KycFormValues>({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      fullName: '',
      cnic: '',
      dob: '',
    },
  });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchKycData = async () => {
      const kycDocRef = doc(db, 'kycSubmissions', user.uid);
      const kycDoc = await getDoc(kycDocRef);
      if (kycDoc.exists()) {
        const data = kycDoc.data() as KycSubmission;
        setKycData(data);
        form.reset({ fullName: data.fullName, cnic: data.cnic, dob: data.dob });
      }
      setPageLoading(false);
    };

    fetchKycData();
  }, [user, loading, form, router]);

  const onSubmit = async (data: KycFormValues) => {
    if (!user || !userProfile) return;
    setIsSubmitting(true);

    try {
      const kycDocRef = doc(db, 'kycSubmissions', user.uid);
      const userDocRef = doc(db, 'users', user.uid);

      const submissionData = {
        fullName: data.fullName,
        cnic: data.cnic,
        dob: data.dob,
        userId: user.uid,
        userName: userProfile.name,
        status: 'pending' as const,
        submittedAt: serverTimestamp(),
      }
      
      await setDoc(kycDocRef, submissionData, { merge: true });
      await updateDoc(userDocRef, { kycStatus: 'pending' });

      setKycData({ ...submissionData, submittedAt: new Date(), cnicPhotoUrl: '' }); // cnicPhotoUrl is not used anymore
      toast({ title: 'KYC Submitted', description: 'Your information has been sent for review.' });
      router.push('/');

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    let formattedValue = value;
    if (value.length > 5) {
      formattedValue = `${value.slice(0, 5)}-${value.slice(5)}`;
    }
    if (value.length > 12) {
      formattedValue = `${value.slice(0, 5)}-${value.slice(5, 12)}-${value.slice(12, 13)}`;
    }
    form.setValue('cnic', formattedValue);
  };


  const renderStatus = () => {
    if (!kycData) {
      return (
        <CardDescription>
          Verify your identity to increase trust and access more features.
        </CardDescription>
      );
    }
    switch (kycData.status) {
      case 'pending':
        return <Badge variant="secondary">Your submission is under review.</Badge>;
      case 'approved':
        return <Badge variant="default">Your KYC is approved. You are verified!</Badge>;
      case 'rejected':
        return (
            <div>
                 <Badge variant="destructive">Your submission was rejected.</Badge>
                 <p className="text-sm text-destructive mt-2">{kycData.rejectionReason || 'Please review your details and resubmit.'}</p>
            </div>
        )
      default:
        return null;
    }
  };
  
  const isFormDisabled = isSubmitting || kycData?.status === 'pending' || kycData?.status === 'approved';

  if (pageLoading || loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <AppHeader />
        <main className="flex-1 container mx-auto py-12 px-4 md:px-6 max-w-2xl">
            <Skeleton className="h-80 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1 container mx-auto py-12 px-4 md:px-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Identity Verification (KYC)</CardTitle>
            {renderStatus()}
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Legal Name</FormLabel>
                      <FormControl>
                        <Input placeholder="As it appears on your CNIC" {...field} disabled={isFormDisabled} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cnic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNIC Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="XXXXX-XXXXXXX-X" 
                          {...field} 
                          onChange={handleCnicChange}
                          maxLength={15}
                          disabled={isFormDisabled} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} disabled={isFormDisabled} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isFormDisabled}>
                   {isSubmitting ? 'Submitting...' : kycData?.status === 'pending' ? 'Submitted for Review' : kycData?.status === 'approved' ? 'Verified' : 'Submit for Verification'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
