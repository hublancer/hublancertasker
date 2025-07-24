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
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { setDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoginDialog } from '@/components/LoginDialog';
import { Separator } from '@/components/ui/separator';

export default function RegisterPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    const handleGoogleSignIn = async () => {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
           await setDoc(userDocRef, {
                uid: user.uid,
                email: user.email,
                name: user.displayName,
                photoURL: user.photoURL,
                accountType: 'client', // Default to client, can be changed in profile setup
                role: 'client',
                wallet: {
                  balance: 0,
                },
                createdAt: serverTimestamp(),
            });
           router.push('/profile-setup');
        } else {
           router.push('/');
        }
        
        toast({
            title: "Signed In!",
            description: `Welcome back, ${user.displayName}!`,
        });

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
                role: data.accountType,
                name: data.name,
                photoURL: '',
                wallet: {
                  balance: 0,
                },
                createdAt: serverTimestamp(),
            });

            toast({
                title: "Account Created!",
                description: "Let's set up your profile.",
            });
            router.push('/profile-setup');

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
    <>
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl font-headline sm:text-2xl">Create an Account</CardTitle>
            <CardDescription>
              Choose your sign up method below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                <Button onClick={handleGoogleSignIn} variant="outline" className="w-full" disabled={loading}>
                    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.5 172.9 56.6l-67.7 67.7C314.6 94.6 282.4 80 248 80c-73.2 0-132.3 59.2-132.3 132S174.8 384 248 384c43.1 0 79.1-14.3 104.2-36.8l68.1 68.1c-51.4 49.6-119.8 79.2-194.3 79.2C111.9 496 8 391.1 8 256S111.9 16 248 16c81.1 0 148.8 28.3 198.8 76.2l-64.8 64.8C404.2 153.6 448 206.1 448 261.8z"></path></svg>
                    Sign up with Google
                </Button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                    </div>
                </div>

                <SignUpForm onSignUp={handleSignUp} loading={loading} />
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Button variant="link" className="underline p-0 h-auto" onClick={() => setIsLoginOpen(true)}>
                Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
    <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </>
  );
}
