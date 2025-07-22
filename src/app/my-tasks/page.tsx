'use client';
import AppHeader from '@/components/AppHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TaskCard, { type Task } from '@/components/TaskCard';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  DocumentData,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { LoginDialog } from '@/components/LoginDialog';
import { useRouter } from 'next/navigation';

export default function MyTasksPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // Client state
  const [openPostedTasks, setOpenPostedTasks] = useState<Task[]>([]);
  const [assignedPostedTasks, setAssignedPostedTasks] = useState<Task[]>([]);
  const [pendingCompletionPostedTasks, setPendingCompletionPostedTasks] = useState<Task[]>([]);
  const [completedPostedTasks, setCompletedPostedTasks] = useState<Task[]>([]);

  // Tasker state
  const [assignedToMeTasks, setAssignedToMeTasks] = useState<Task[]>([]);
  const [completedByMeTasks, setCompletedByMeTasks] = useState<Task[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);

  const [loading, setLoading] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user || !userProfile) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const toTask = (doc: DocumentData): Task => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          location: data.location,
          date:
            data.preferredDateTime instanceof Timestamp
              ? data.preferredDateTime.toDate().toLocaleDateString()
              : data.preferredDateTime,
          price: data.budget,
          offers: data.offerCount || 0,
          type: data.taskType,
          status: data.status,
          category: data.category || 'General',
          description: data.description,
          postedBy: data.postedByName,
          postedById: data.postedById,
          coordinates: data.coordinates || null,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate().toISOString()
              : new Date().toISOString(),
        } as Task;
      };

      if (userProfile.accountType === 'client') {
        const postedQuery = query(
          collection(db, 'tasks'),
          where('postedById', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const postedSnapshot = await getDocs(postedQuery);

        const open: Task[] = [];
        const assigned: Task[] = [];
        const pendingCompletion: Task[] = [];
        const completed: Task[] = [];

        postedSnapshot.forEach(doc => {
          const task = toTask(doc);
          if (task.status === 'open') open.push(task);
          if (task.status === 'assigned') assigned.push(task);
          if (task.status === 'pending-completion') pendingCompletion.push(task);
          if (task.status === 'completed') completed.push(task);
        });
        setOpenPostedTasks(open);
        setAssignedPostedTasks(assigned);
        setPendingCompletionPostedTasks(pendingCompletion);
        setCompletedPostedTasks(completed);
      } else if (userProfile.accountType === 'tasker') {
        // Fetch tasks assigned to the tasker
        const assignedQuery = query(
          collection(db, 'tasks'),
          where('assignedToId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const assignedSnapshot = await getDocs(assignedQuery);
        const assignedList: Task[] = [];
        const completedList: Task[] = [];
        assignedSnapshot.forEach(doc => {
          const task = toTask(doc);
          if (task.status === 'assigned') assignedList.push(task);
          if (task.status === 'completed') completedList.push(task);
        });
        setAssignedToMeTasks(assignedList);
        setCompletedByMeTasks(completedList);

        // Fetch all open tasks for browsing
        const availableQuery = query(
          collection(db, 'tasks'),
          where('status', '==', 'open'),
          orderBy('createdAt', 'desc')
        );
        const availableSnapshot = await getDocs(availableQuery);
        setAvailableTasks(availableSnapshot.docs.map(toTask));
      }

      setLoading(false);
    };

    if (!authLoading) {
      fetchTasks();
    }
  }, [user, userProfile, authLoading]);

  const handleTaskSelect = (taskId: string) => {
    router.push(`/task/${taskId}`);
  };

  const renderSkeletons = () => (
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

  if (authLoading || loading) {
    return renderSkeletons();
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <AppHeader />
        <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <h2 className="text-2xl font-bold mb-2">Access Your Tasks</h2>
          <p className="text-muted-foreground mb-4">
            You need to be logged in to view your task dashboard.
          </p>
          <Button onClick={() => setIsLoginOpen(true)}>Login</Button>
        </main>
        <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
      </div>
    );
  }

  const renderClientDashboard = () => (
    <Tabs defaultValue="open" className="w-full">
      <TabsList className="grid w-full grid-cols-4 max-w-lg">
        <TabsTrigger value="open">Open</TabsTrigger>
        <TabsTrigger value="assigned">Assigned</TabsTrigger>
        <TabsTrigger value="pending">Pending</TabsTrigger>
        <TabsTrigger value="completed">Completed</TabsTrigger>
      </TabsList>
      <TabsContent value="open" className="mt-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {openPostedTasks.length > 0 ? (
            openPostedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onSelect={() => handleTaskSelect(task.id)}
              />
            ))
          ) : (
            <p>You have no open tasks.</p>
          )}
        </div>
      </TabsContent>
      <TabsContent value="assigned" className="mt-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {assignedPostedTasks.length > 0 ? (
            assignedPostedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onSelect={() => handleTaskSelect(task.id)}
              />
            ))
          ) : (
            <p>You have no assigned tasks.</p>
          )}
        </div>
      </TabsContent>
      <TabsContent value="pending" className="mt-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {pendingCompletionPostedTasks.length > 0 ? (
            pendingCompletionPostedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onSelect={() => handleTaskSelect(task.id)}
              />
            ))
          ) : (
            <p>You have no tasks pending completion.</p>
          )}
        </div>
      </TabsContent>
      <TabsContent value="completed" className="mt-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {completedPostedTasks.length > 0 ? (
            completedPostedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onSelect={() => handleTaskSelect(task.id)}
              />
            ))
          ) : (
            <p>You have no completed tasks.</p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );

  const renderTaskerDashboard = () => (
    <Tabs defaultValue="assigned" className="w-full">
      <TabsList className="grid w-full grid-cols-3 max-w-md">
        <TabsTrigger value="assigned">My Work</TabsTrigger>
        <TabsTrigger value="completed">Completed</TabsTrigger>
        <TabsTrigger value="browse">Browse Tasks</TabsTrigger>
      </TabsList>
      <TabsContent value="assigned" className="mt-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {assignedToMeTasks.length > 0 ? (
            assignedToMeTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onSelect={() => handleTaskSelect(task.id)}
              />
            ))
          ) : (
            <p>You have no assigned tasks.</p>
          )}
        </div>
      </TabsContent>
      <TabsContent value="completed" className="mt-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {completedByMeTasks.length > 0 ? (
            completedByMeTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onSelect={() => handleTaskSelect(task.id)}
              />
            ))
          ) : (
            <p>You have no completed tasks.</p>
          )}
        </div>
      </TabsContent>
      <TabsContent value="browse" className="mt-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {availableTasks.length > 0 ? (
            availableTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onSelect={() => handleTaskSelect(task.id)}
              />
            ))
          ) : (
            <p>No tasks currently available.</p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1">
        <div className="container mx-auto py-12 px-4 md:px-6">
          <div className="space-y-4 mb-8">
            <h1 className="text-3xl font-bold font-headline">My Dashboard</h1>
            <p className="text-muted-foreground">
              {userProfile?.accountType === 'client'
                ? 'Manage the tasks you have posted.'
                : 'Manage your assigned work and find new tasks.'}
            </p>
          </div>
          {userProfile?.accountType === 'client'
            ? renderClientDashboard()
            : renderTaskerDashboard()}
        </div>
      </main>
    </div>
  );
}
