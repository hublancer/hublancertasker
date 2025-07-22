'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function AdminSettingsPage() {
    const { settings } = useAuth();
    const { toast } = useToast();
    const [commissionRate, setCommissionRate] = useState(0);
    const [currencySymbol, setCurrencySymbol] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (settings) {
            setCommissionRate(settings.commissionRate * 100); // Display as percentage
            setCurrencySymbol(settings.currencySymbol);
            setLoading(false);
        }
    }, [settings]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const settingsRef = doc(db, 'settings', 'platform');
            await setDoc(settingsRef, {
                commissionRate: commissionRate / 100, // Save as decimal
                currencySymbol: currencySymbol,
            }, { merge: true });

            toast({
                title: 'Settings Saved',
                description: 'Platform settings have been updated.',
            });
        } catch (error) {
            console.error("Error saving settings:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to save settings.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <div>Loading settings...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Platform Settings</CardTitle>
                    <CardDescription>Manage global settings for the application.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                        <Input
                            id="commissionRate"
                            type="number"
                            value={commissionRate}
                            onChange={(e) => setCommissionRate(Number(e.target.value))}
                            placeholder="e.g., 10"
                        />
                        <p className="text-sm text-muted-foreground">
                            The percentage the platform takes from each completed task.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="currencySymbol">Currency Symbol</Label>
                        <Input
                            id="currencySymbol"
                            type="text"
                            value={currencySymbol}
                            onChange={(e) => setCurrencySymbol(e.target.value)}
                            placeholder="e.g., $, €, Rs"
                        />
                        <p className="text-sm text-muted-foreground">
                            The currency symbol used across the site.
                        </p>
                    </div>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
