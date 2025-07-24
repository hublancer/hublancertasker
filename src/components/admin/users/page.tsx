
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { UserProfile, useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import UserAvatar from '@/components/UserAvatar';

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
)

export default function AdminUsersPage() {
  const { settings } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
        const usersData = snapshot.docs.map(doc => doc.data() as UserProfile);
        setUsers(usersData);
        setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>A list of all users on the platform.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead className="text-right">Wallet Balance</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.uid}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <UserAvatar 
                        name={user.name} 
                        imageUrl={user.photoURL} 
                        isOnline={user.isOnline}
                        className="h-9 w-9"
                    />
                    <div className="grid gap-0.5">
                      <p className="font-medium">{user.name}</p>
                       <p className="text-xs text-muted-foreground">{user.uid}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="capitalize">
                    {user.role || user.accountType}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.isVerified ? 'default' : 'outline'} className="capitalize">
                    {user.isVerified ? 'Yes' : 'No'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {settings?.currencySymbol ?? 'Rs'}{user.wallet?.balance.toFixed(2) ?? '0.00'}
                </TableCell>
                <TableCell className="text-right">
                    {user.phone && (
                        <Button asChild variant="outline" size="icon">
                           <Link href={`https://wa.me/${user.phone.replace(/\D/g, '')}`} target="_blank">
                               <WhatsAppIcon />
                           </Link>
                        </Button>
                    )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
