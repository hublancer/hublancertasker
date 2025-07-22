
'use client';
import AppHeader from '@/components/AppHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TaskCard, { type Task } from '@/components/TaskCard';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyTasksPage() {
  const { user, loading: authLoading } = useAuth();
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      // Fetch tasks posted by the user
      const postedQuery = query(collection(db, 'tasks'), where('postedById', '==', user.uid));
      const postedSnapshot = await getDocs(postedQuery);
      const open: Task[] = [];
      const assigned: Task[] = [];
      const completed: Task[] = [];
      
      postedSnapshot.forEach(doc => {
        const data = doc.data();
        const task = {
          id: doc.id,
          title: data.title,
          location: data.location,
          date: data.preferredDateTime instanceof Timestamp ? data.preferredDateTime.toDate().toLocaleDateString() : data.preferredDateTime,
          price: data.budget,
          offers: data.offerCount || 0,
          type: data.taskType,
          status: data.status,
          category: data.category || 'General',
        } as Task;

        if (task.status === 'open') open.push(task);
        if (task.status === 'assigned') assigned.push(task);
        if (task.status === 'completed') completed.push(task);
      });
      setMyTasks(open);
      setCompletedTasks(completed);

      // Fetch tasks assigned to the user
      const assignedQuery = query(collection(db, 'tasks'), where('assignedToId', '==', user.uid));
      const assignedSnapshot = await getDocs(assignedQuery);
      const assignedList = assignedSnapshot.docs.map(doc => {
         const data = doc.data();
         return {
          id: doc.id,
          title: data.title,
          location: data.location,
          date: data.preferredDateTime instanceof Timestamp ? data.preferredDateTime.toDate().toLocaleDateString() : data.preferredDateTime,
          price: data.budget,
          offers: data.offerCount || 0,
          type: data.taskType,
          status: data.status,
          category: data.category || 'General',
        } as Task;
      });
      setAssignedTasks(assignedList);


      setLoading(false);
    };

    if (!authLoading) {
        fetchTasks();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
       <div className="flex flex-col min-h-screen bg-background">
        <AppHeader />
         <div className="container mx-auto py-12 px-4 md:px-6">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-6 w-64 mb-8" />
            <div className="flex gap-4 mb-6">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
            </div>
             <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                 <Skeleton className="h-64 w-full" />
                 <Skeleton className="h-64 w-full" />
             </div>
         </div>
       </div>
    );
  }
  
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Please log in to see your tasks.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1">
        <div className="container mx-auto py-12 px-4 md:px-6">
          <div className="space-y-4 mb-8">
            <h1 className="text-3xl font-bold font-headline">My Tasks</h1>
            <p className="text-muted-foreground">
              Manage your posted and assigned tasks.
            </p>
          </div>
          <Tabs defaultValue="open" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="assigned">Assigned</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <TabsContent value="open" className="mt-6">
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {myTasks.length > 0 ? (
                  myTasks.map(task => <TaskCard key={task.id} task={task} />)
                ) : (
                  <p>You have no open tasks.</p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="assigned" className="mt-6">
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {assignedTasks.length > 0 ? (
                  assignedTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))
                ) : (
                  <p>You have no assigned tasks.</p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="completed" className="mt-6">
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {completedTasks.length > 0 ? (
                  completedTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))
                ) : (
                  <p>You have no completed tasks.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

