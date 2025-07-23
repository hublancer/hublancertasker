
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface PaymentGateway {
    id: string;
    name: string;
    type: 'manual' | 'automatic';
    instructions?: string;
    enabled: boolean;
}

const depositSchema = z.object({
    amount: z.coerce.number().positive('Amount must be positive'),
    gatewayId: z.string().min(1, 'Please select a payment method'),
    trxId: z.string().optional(),
});

type DepositFormValues = z.infer<typeof depositSchema>;

interface DepositModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DepositModal({ open, onOpenChange }: DepositModalProps) {
    const { user, userProfile } = useAuth();
    const { toast } = useToast();
    const [gateways, setGateways] = useState<PaymentGateway[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);

    const form = useForm<DepositFormValues>({
        resolver: zodResolver(depositSchema),
        defaultValues: {
            amount: undefined,
            gatewayId: '',
            trxId: '',
        }
    });

    useEffect(() => {
        const q = query(collection(db, 'paymentGateways'), where('enabled', '==', true));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const gatewaysData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentGateway));
            setGateways(gatewaysData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleGatewayChange = (gatewayId: string) => {
        form.setValue('gatewayId', gatewayId);
        const gateway = gateways.find(g => g.id === gatewayId);
        setSelectedGateway(gateway || null);
    };

    const onSubmit = async (data: DepositFormValues) => {
        if (!user || !userProfile || !selectedGateway) return;
        
        if (selectedGateway.type === 'manual' && !data.trxId) {
            form.setError('trxId', { type: 'manual', message: 'Transaction ID is required for manual deposits.' });
            return;
        }

        try {
            if (selectedGateway.type === 'manual') {
                await addDoc(collection(db, 'deposits'), {
                    userId: user.uid,
                    userName: userProfile.name,
                    amount: data.amount,
                    gatewayId: selectedGateway.id,
                    gatewayName: selectedGateway.name,
                    trxId: data.trxId,
                    status: 'pending',
                    createdAt: serverTimestamp(),
                });
                toast({ title: 'Request Submitted', description: 'Your deposit request has been submitted for manual verification.' });
            } else {
                // Handle automatic gateway logic here
                toast({ title: 'Automatic Gateway', description: 'This would redirect to the payment provider.' });
            }
            onOpenChange(false);
            form.reset();
            setSelectedGateway(null);

        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit deposit request.' });
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Deposit Funds</DialogTitle>
                    <DialogDescription>Select a method and enter the amount to add funds.</DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="gatewayId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Payment Method</FormLabel>
                                    <Select onValueChange={handleGatewayChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a method" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {loading ? <SelectItem value="loading" disabled>Loading...</SelectItem> :
                                             gateways.map(gw => <SelectItem key={gw.id} value={gw.id}>{gw.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        {selectedGateway?.type === 'manual' && (
                             <Card className="bg-muted/50">
                                <CardContent className="p-4 text-sm">
                                    <p className="font-semibold mb-2">Instructions</p>
                                    <pre className="whitespace-pre-wrap font-sans">{selectedGateway.instructions}</pre>
                                </CardContent>
                            </Card>
                        )}
                        
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount</FormLabel>
                                    <FormControl><Input type="number" placeholder="0.00" {...field} value={field.value ?? ''} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {selectedGateway?.type === 'manual' && (
                            <FormField
                                control={form.control}
                                name="trxId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Transaction ID (TRXID)</FormLabel>
                                        <FormControl><Input placeholder="Enter your payment transaction ID" {...field} value={field.value ?? ''} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <Button type="submit" className="w-full">
                            {selectedGateway?.type === 'manual' ? 'Submit for Review' : 'Proceed to Payment'}
                        </Button>
                    </form>
                 </Form>
            </DialogContent>
        </Dialog>
    )
}

    
