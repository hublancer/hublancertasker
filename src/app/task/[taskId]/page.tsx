
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, Timestamp, GeoPoint } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Task } from '@/components/TaskCard';
import AppHeader from '@/components/AppHeader';
import TaskDetails from '@/components/TaskDetails';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

type FullTask = Task & {
  coordinates: [number, number] | null;
  description: string;
  postedBy: string;
};

export default function TaskPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;

  const [task, setTask] = useState<FullTask | null>(null);
  const [loading, setLoading] = useState(true);
  
  const fetchTask = async () => {
    if (!taskId) return;
     setLoading(true);

    try {
        const docRef = doc(db, 'tasks', taskId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            let coordinates: [number, number] | null = null;
            if (data.coordinates instanceof GeoPoint) {
                coordinates = [data.coordinates.latitude, data.coordinates.longitude];
            }
            setTask({
                id: docSnap.id,
                title: data.title,
                location: data.location,
                date: data.preferredDateTime instanceof Timestamp ? data.preferredDateTime.toDate().toLocaleDateString() : data.preferredDateTime,
                price: data.budget,
                offers: data.offerCount || 0,
                type: data.taskType,
                category: data.category || 'General',
                coordinates: coordinates,
                description: data.description,
                postedBy: data.postedByName || 'Anonymous',
                status: data.status || 'open',
                postedById: data.postedById,
                assignedToId: data.assignedToId,
                assignedToName: data.assignedToName,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            });
        } else {
            console.log('No such document!');
            setTask(null);
        }
    } catch(error) {
        console.error("Error fetching task:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const handleTaskUpdate = () => {
    fetchTask(); // Re-fetch the task data after an update
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto py-8 px-4 md:px-6">
          <Skeleton className="h-10 w-48 mb-4" />
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div>
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <AppHeader />
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">Task not found</h2>
          <p className="text-muted-foreground mt-2">
            This task may have been removed or the link is incorrect.
          </p>
          <Button onClick={() => router.push('/')} className="mt-4">
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1 container mx-auto py-8 px-4 md:px-6">
         <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        <TaskDetails 
            task={task} 
            onTaskUpdate={handleTaskUpdate}
            isPage={true}
        />
      </main>
    </div>
  );
}
