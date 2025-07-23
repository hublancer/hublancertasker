
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const withdrawSchema = z.object({
    amount: z.coerce.number().positive('Amount must be positive'),
    method: z.string().min(1, 'Please specify a withdrawal method.'),
    details: z.string().min(10, 'Please provide your account details.'),
});

type WithdrawFormValues = z.infer<typeof withdrawSchema>;

interface WithdrawModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function WithdrawModal({ open, onOpenChange, onSuccess }: WithdrawModalProps) {
    const { user, userProfile } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<WithdrawFormValues>({
        resolver: zodResolver(withdrawSchema),
        defaultValues: { amount: '' as any, method: '', details: '' }
    });

    const onSubmit = async (data: WithdrawFormValues) => {
        if (!user || !userProfile) return;

        if (data.amount > (userProfile.wallet?.balance ?? 0)) {
            form.setError('amount', { type: 'manual', message: 'Insufficient balance for this withdrawal.' });
            return;
        }
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'withdrawals'), {
                userId: user.uid,
                userName: userProfile.name,
                amount: data.amount,
                method: data.method,
                details: data.details,
                status: 'pending',
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Request Submitted', description: 'Your withdrawal request has been submitted for processing.' });
            onSuccess();
            onOpenChange(false);
            form.reset();

        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit withdrawal request.' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Request Withdrawal</DialogTitle>
                    <DialogDescription>Submit a request to withdraw funds from your wallet.</DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                         <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount to Withdraw</FormLabel>
                                    <FormControl><Input type="number" placeholder="0.00" {...field} value={field.value ?? ''} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="method"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Withdrawal Method</FormLabel>
                                    <FormControl><Input placeholder="e.g. Bank Transfer, JazzCash" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="details"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Account Details</FormLabel>
                                    <FormControl><Textarea placeholder="Bank: XYZ, Account No: 12345, Name: John Doe" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                           {isSubmitting ? 'Submitting...' : 'Submit Request'}
                        </Button>
                    </form>
                 </Form>
            </DialogContent>
        </Dialog>
    )
}
