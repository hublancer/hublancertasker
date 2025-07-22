'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import AppHeader from '@/components/AppHeader';
import { SignUpForm, SignUpFormValues } from '@/components/SignUpForm';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { setDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegisterPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSignUp = async (data: SignUpFormValues) => {
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const user = userCredential.user;

            // Add user to 'users' collection
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: data.email,
                accountType: data.accountType,
                name: data.name,
            });

            toast({
                title: "Account Created!",
                description: "You have been successfully registered.",
            });
            router.push('/');

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl font-headline sm:text-2xl">Sign Up</CardTitle>
            <CardDescription>
              Enter your information to create an account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignUpForm onSignUp={handleSignUp} loading={loading} />
            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Link href="/login" className="underline">
                Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
