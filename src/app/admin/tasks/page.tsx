
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, startAfter, limit, DocumentSnapshot, Timestamp } from 'firebase/firestore';
import type { Task } from '@/components/TaskCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

type FullTask = Task & { createdAt: Timestamp, budget: number };

const PAGE_SIZE = 20;

export default function AdminTasksPage() {
  const { settings } = useAuth();
  const [tasks, setTasks] = useState<FullTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchTasks = useCallback(async (loadMore = false) => {
    if (loadMore) {
        setLoadingMore(true);
    } else {
        setLoading(true);
    }

    try {
        let q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));

        if (loadMore && lastVisible) {
            q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'), startAfter(lastVisible), limit(PAGE_SIZE));
        }

        const querySnapshot = await getDocs(q);
        const tasksData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FullTask));
        
        setTasks(prev => loadMore ? [...prev, ...tasksData] : tasksData);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setHasMore(querySnapshot.docs.length === PAGE_SIZE);
    } catch (error) {
        console.error("Error fetching tasks:", error);
    } finally {
        setLoading(false);
        setLoadingMore(false);
    }
  }, [lastVisible]);

  useEffect(() => {
    fetchTasks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <div>Loading tasks...</div>;
  }
  
  const getStatusVariant = (status: Task['status']) => {
    switch (status) {
        case 'open': return 'default';
        case 'assigned': return 'secondary';
        case 'completed': return 'outline';
        default: return 'secondary';
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks</CardTitle>
        <CardDescription>A list of all tasks on the platform.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Posted By</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Budget</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map(task => (
              <TableRow key={task.id}>
                <TableCell>
                  <p className="font-medium">{task.title}</p>
                   <p className="text-xs text-muted-foreground">{task.id}</p>
                </TableCell>
                <TableCell>
                    <Link href={`/profile/${task.postedById}`} className="hover:underline">
                        {task.postedBy}
                    </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(task.status)} className="capitalize">
                    {task.status}
                  </Badge>
                </TableCell>
                <TableCell>
                   <Badge variant="outline" className="capitalize">{task.type}</Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {settings?.currencySymbol ?? 'Rs'}{(task.budget || task.price || 0).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {hasMore && (
            <div className="mt-4 text-center">
                <Button onClick={() => fetchTasks(true)} disabled={loadingMore}>
                    {loadingMore ? 'Loading...' : 'Load More'}
                </Button>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
