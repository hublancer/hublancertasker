
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const gatewaySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum(['manual', 'automatic']),
    instructions: z.string().optional(),
    apiKey: z.string().optional(),
    enabled: z.boolean().default(true),
});

type GatewayFormValues = z.infer<typeof gatewaySchema>;

interface PaymentGateway extends GatewayFormValues {
    id: string;
}

export default function AdminGatewaysPage() {
    const { toast } = useToast();
    const [gateways, setGateways] = useState<PaymentGateway[]>([]);
    const [loading, setLoading] = useState(true);

    const form = useForm<GatewayFormValues>({
        resolver: zodResolver(gatewaySchema),
        defaultValues: {
            name: '',
            type: 'manual',
            instructions: '',
            apiKey: '',
            enabled: true,
        },
    });

    const fetchGateways = async () => {
        setLoading(true);
        const q = query(collection(db, 'paymentGateways'));
        const snapshot = await getDocs(q);
        const gatewaysData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentGateway));
        setGateways(gatewaysData);
        setLoading(false);
    };

    useEffect(() => {
        fetchGateways();
    }, []);

    const onSubmit = async (data: GatewayFormValues) => {
        try {
            await addDoc(collection(db, 'paymentGateways'), data);
            toast({ title: 'Gateway Added', description: 'The new payment gateway has been added.' });
            form.reset();
            fetchGateways();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to add gateway.' });
        }
    };

    const toggleGatewayStatus = async (gateway: PaymentGateway) => {
        const gatewayRef = doc(db, 'paymentGateways', gateway.id);
        await updateDoc(gatewayRef, { enabled: !gateway.enabled });
        fetchGateways();
    };
    
    const deleteGateway = async (gatewayId: string) => {
        await deleteDoc(doc(db, 'paymentGateways', gatewayId));
        toast({ title: 'Gateway Deleted' });
        fetchGateways();
    }

    return (
        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Gateways</CardTitle>
                        <CardDescription>List of available payment methods for users.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={4}>Loading...</TableCell></TableRow>
                                ) : (
                                    gateways.map(gw => (
                                        <TableRow key={gw.id}>
                                            <TableCell className="font-medium">{gw.name}</TableCell>
                                            <TableCell className="capitalize">{gw.type}</TableCell>
                                            <TableCell>
                                                <Switch
                                                    checked={gw.enabled}
                                                    onCheckedChange={() => toggleGatewayStatus(gw)}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                         <Button variant="destructive" size="icon">
                                                            <Trash2 className="h-4 w-4" />
                                                         </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the gateway.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => deleteGateway(gw.id)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <div>
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Gateway</CardTitle>
                        <CardDescription>Configure a new payment method.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Gateway Name</FormLabel>
                                            <FormControl><Input placeholder="e.g., Bank Transfer" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Gateway Type</FormLabel>
                                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="manual">Manual</SelectItem>
                                                    <SelectItem value="automatic">Automatic</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {form.watch('type') === 'manual' && (
                                     <FormField
                                        control={form.control}
                                        name="instructions"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Instructions for User</FormLabel>
                                                <FormControl><Textarea placeholder="Bank: XYZ, Account: 123..." {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                                {form.watch('type') === 'automatic' && (
                                     <FormField
                                        control={form.control}
                                        name="apiKey"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>API Key</FormLabel>
                                                <FormControl><Input placeholder="Enter API Key" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                />
                                )}
                                <Button type="submit" className="w-full">Add Gateway</Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
