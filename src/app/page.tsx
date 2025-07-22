'use client'

import { useState, useEffect } from 'react';
import HomePageClient from '@/components/HomePageClient';
import { type Task } from '@/components/TaskCard';
import { collection, getDocs, Timestamp, GeoPoint, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';


export default function Home() {
  const [tasks, setTasks] = useState<(Task & { coordinates: [number, number] | null, description: string, postedBy: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      const tasksCollection = collection(db, 'tasks');
      const q = query(tasksCollection, where('status', '==', 'open'), orderBy('createdAt', 'desc'));
      const taskSnapshot = await getDocs(q);
      const taskList = taskSnapshot.docs.map(doc => {
        const data = doc.data();
        
        let coordinates: [number, number] | null = null;
        if (data.coordinates instanceof GeoPoint) {
            coordinates = [data.coordinates.latitude, data.coordinates.longitude];
        }

        return {
          id: doc.id,
          title: data.title,
          location: data.location,
          // Convert Firestore Timestamp to a readable date string
          date: data.preferredDateTime instanceof Timestamp ? data.preferredDateTime.toDate().toLocaleDateString() : data.preferredDateTime,
          price: data.budget,
          offers: data.offerCount || 0, // Assuming you might add this field
          type: data.taskType,
          category: data.category || 'General',
          coordinates: coordinates,
          description: data.description,
          postedBy: data.postedByName || 'Anonymous', // Assuming you store the poster's name
          status: data.status || 'open',
          postedById: data.postedById,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        } as (Task & { coordinates: [number, number] | null, description: string, postedBy: string });
      });
      setTasks(taskList);
      setLoading(false);
    };

    fetchTasks();
  }, []);

  if (loading) {
    return (
       <div className="flex flex-col h-screen bg-background">
        <Skeleton className="h-14 w-full" />
        <div className="p-4">
            <Skeleton className="h-10 w-full mb-4" />
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[40%_60%] gap-4 flex-1">
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div>
            <Skeleton className="h-full w-full" />
          </div>
        </div>
       </div>
    );
  }

  return <HomePageClient tasks={tasks} />;
}
