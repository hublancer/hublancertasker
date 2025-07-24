
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import AppHeader from '@/components/AppHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';

const kycSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters long.'),
  cnic: z.string().regex(/^\d{5}-\d{7}-\d{1}$/, 'Please enter a valid CNIC (e.g., 12345-1234567-1).'),
  cnicPhoto: z.any()
    .refine(files => files?.length === 1, "CNIC photo is required.")
    .refine(files => files?.[0]?.size <= 5000000, `Max file size is 5MB.`)
    .refine(
      files => ["image/jpeg", "image/png"].includes(files?.[0]?.type),
      ".jpg and .png files are accepted."
    ),
});

type KycFormValues = z.infer<typeof kycSchema>;

interface KycSubmission {
  fullName: string;
  cnic: string;
  cnicPhotoUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: any;
  rejectionReason?: string;
}

export default function KycPage() {
  const { user, userProfile, loading } = useAuth();
  const { toast } = useToast();
  const [kycData, setKycData] = useState<KycSubmission | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<KycFormValues>({
    resolver: zodResolver(kycSchema),
    defaultValues: { fullName: '', cnic: '' },
  });
  const cnicPhotoRef = form.register("cnicPhoto");


  useEffect(() => {
    if (loading) return;
    if (!user) {
      setPageLoading(false);
      return;
    }

    const fetchKycData = async () => {
      const kycDocRef = doc(db, 'kycSubmissions', user.uid);
      const kycDoc = await getDoc(kycDocRef);
      if (kycDoc.exists()) {
        const data = kycDoc.data() as KycSubmission;
        setKycData(data);
        form.reset({ fullName: data.fullName, cnic: data.cnic });
      }
      setPageLoading(false);
    };

    fetchKycData();
  }, [user, loading, form]);

  const onSubmit = async (data: KycFormValues) => {
    if (!user || !userProfile) return;
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const photoFile = data.cnicPhoto[0];
      const storageRef = ref(storage, `kyc-photos/${user.uid}/${photoFile.name}`);
      
      // Simulate progress for better UX
      setUploadProgress(30);
      const snapshot = await uploadBytes(storageRef, photoFile);
      setUploadProgress(70);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setUploadProgress(100);

      const kycDocRef = doc(db, 'kycSubmissions', user.uid);
      const userDocRef = doc(db, 'users', user.uid);

      const submissionData = {
        fullName: data.fullName,
        cnic: data.cnic,
        cnicPhotoUrl: downloadURL,
        userId: user.uid,
        userName: userProfile.name,
        status: 'pending' as const,
        submittedAt: serverTimestamp(),
      }
      
      await setDoc(kycDocRef, submissionData, { merge: true });
      await updateDoc(userDocRef, { kycStatus: 'pending' });

      setKycData({ ...submissionData, submittedAt: new Date() });
      toast({ title: 'KYC Submitted', description: 'Your information has been sent for review.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
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
                        <Input placeholder="XXXXX-XXXXXXX-X" {...field} disabled={isFormDisabled} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="cnicPhoto"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>CNIC Photo</FormLabel>
                        <FormControl>
                            <Input type="file" {...cnicPhotoRef} disabled={isFormDisabled} />
                        </FormControl>
                        <FormDescription>
                            Please upload a clear picture of your CNIC. Max 5MB.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                  )}
                />

                {isSubmitting && <Progress value={uploadProgress} className="w-full" />}

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
