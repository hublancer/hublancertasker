
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
  Timestamp,
  orderBy,
  DocumentData,
  onSnapshot,
} from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { LoginDialog } from '@/components/LoginDialog';
import { useRouter } from 'next/navigation';
import TaskDetails from '@/components/TaskDetails';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function MyTasksPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // Combined task list
  const [allTasks, setAllTasks] = useState<Task[]>([]);

  const [loading, setLoading] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    if (authLoading) return;
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
        assignedToId: data.assignedToId,
        assignedToName: data.assignedToName,
        coordinates: data.coordinates || null,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString(),
      } as Task;
    };

    let q;
    if (userProfile.accountType === 'client') {
      q = query(
        collection(db, 'tasks'),
        where('postedById', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'tasks'),
        where('assignedToId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const tasksData = snapshot.docs.map(toTask);
        setAllTasks(tasksData);
        setLoading(false);
      },
      error => {
        console.error('Error fetching tasks: ', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, userProfile, authLoading]);

  // Update selected task with fresh data
  useEffect(() => {
    if (selectedTask) {
        const freshTask = allTasks.find(t => t.id === selectedTask.id);
        if (freshTask) {
            setSelectedTask(freshTask);
        } else {
            // Task might have been deleted or status changed, so deselect it
            setSelectedTask(null);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTasks])

  // Memoized lists for rendering
  const {
    openPostedTasks,
    assignedPostedTasks,
    pendingCompletionPostedTasks,
    completedPostedTasks,
  } = useMemo(() => {
    if (userProfile?.accountType !== 'client') return { openPostedTasks: [], assignedPostedTasks: [], pendingCompletionPostedTasks: [], completedPostedTasks: [] };
    return {
      openPostedTasks: allTasks.filter(t => t.status === 'open'),
      assignedPostedTasks: allTasks.filter(t => t.status === 'assigned'),
      pendingCompletionPostedTasks: allTasks.filter(t => t.status === 'pending-completion'),
      completedPostedTasks: allTasks.filter(t => t.status === 'completed'),
    };
  }, [allTasks, userProfile]);

  const { assignedToMeTasks, completedByMeTasks } = useMemo(() => {
    if (userProfile?.accountType !== 'tasker') return { assignedToMeTasks: [], completedByMeTasks: [] };
    return {
      assignedToMeTasks: allTasks.filter(t => t.status === 'assigned' || t.status === 'pending-completion'),
      completedByMeTasks: allTasks.filter(t => t.status === 'completed'),
    };
  }, [allTasks, userProfile]);

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
  };
  
  const handleBack = () => {
    setSelectedTask(null);
  };

  const handleTaskUpdate = () => {
      // The snapshot listener will automatically update the task list.
      // We don't need to manually refetch.
      console.log("Task updated, listener will refresh data.");
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
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
          {openPostedTasks.length > 0 ? (
            openPostedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onSelect={() => handleTaskSelect(task)}
              />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-10">You have no open tasks.</p>
          )}
        </div>
      </TabsContent>
      <TabsContent value="assigned" className="mt-6">
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
          {assignedPostedTasks.length > 0 ? (
            assignedPostedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onSelect={() => handleTaskSelect(task)}
              />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-10">You have no assigned tasks.</p>
          )}
        </div>
      </TabsContent>
      <TabsContent value="pending" className="mt-6">
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
          {pendingCompletionPostedTasks.length > 0 ? (
            pendingCompletionPostedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onSelect={() => handleTaskSelect(task)}
              />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-10">You have no tasks pending completion.</p>
          )}
        </div>
      </TabsContent>
      <TabsContent value="completed" className="mt-6">
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
          {completedPostedTasks.length > 0 ? (
            completedPostedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onSelect={() => handleTaskSelect(task)}
              />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-10">You have no completed tasks.</p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );

  const renderTaskerDashboard = () => (
    <Tabs defaultValue="assigned" className="w-full">
      <TabsList className="grid w-full grid-cols-2 max-w-sm">
        <TabsTrigger value="assigned">My Work</TabsTrigger>
        <TabsTrigger value="completed">Completed</TabsTrigger>
      </TabsList>
       <TabsContent value="assigned" className="mt-6">
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
          {assignedToMeTasks.length > 0 ? (
            assignedToMeTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onSelect={() => handleTaskSelect(task)}
              />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-10">You have no assigned tasks.</p>
          )}
        </div>
      </TabsContent>
      <TabsContent value="completed" className="mt-6">
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
          {completedByMeTasks.length > 0 ? (
            completedByMeTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onSelect={() => handleTaskSelect(task)}
              />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-10">You have no completed tasks.</p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
  
    const mainContent = (
        <div className="p-4 md:p-6">
            <div className="space-y-4 mb-8">
                <h1 className="text-3xl font-bold font-headline">My Dashboard</h1>
                <p className="text-muted-foreground">
                {userProfile?.accountType === 'client' 
                    ? 'Manage the tasks you have posted.'
                    : 'Manage your assigned work and find new tasks.'
                }
                </p>
            </div>
            {userProfile?.accountType === 'client' ? renderClientDashboard() : renderTaskerDashboard()}
        </div>
    );

  return (
    <div className="flex flex-col h-screen bg-background">
      <AppHeader />
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 min-h-0">
        <ScrollArea className={cn('h-[calc(100vh-57px)]', selectedTask && 'hidden md:block')}>
            {mainContent}
        </ScrollArea>
        <div className={cn(
            'bg-card border-l h-full overflow-y-auto',
            !selectedTask && 'hidden md:hidden'
          )}>
         {selectedTask && (
            <TaskDetails task={selectedTask} onBack={handleBack} onTaskUpdate={handleTaskUpdate} />
         )}
        </div>
      </main>
      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </div>
  );
}
