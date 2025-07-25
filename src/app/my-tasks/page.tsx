
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
  getDocs,
  limit,
  startAfter,
  DocumentSnapshot,
} from 'firebase/firestore';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { LoginDialog } from '@/components/LoginDialog';
import { useRouter } from 'next/navigation';
import TaskDetails from '@/components/TaskDetails';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

type TaskStatus = 'open' | 'assigned' | 'pending-completion' | 'completed';
const PAGE_SIZE = 10;

const TaskList = ({
  tasks,
  onSelect,
  onChat,
  onLoadMore,
  hasMore,
  loadingMore,
  emptyMessage
}: {
  tasks: Task[],
  onSelect: (task: Task) => void,
  onChat: (taskId: string) => void,
  onLoadMore: () => void,
  hasMore: boolean,
  loadingMore: boolean,
  emptyMessage: string
}) => {
  if (tasks.length === 0 && !loadingMore) {
    return <p className="text-center text-muted-foreground py-10">{emptyMessage}</p>
  }
  return (
    <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onSelect={() => onSelect(task)}
          onChat={onChat}
        />
      ))}
      {hasMore && (
        <div className="text-center md:col-span-2 lg:col-span-1 mt-4">
          <Button onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  )
}

export default function MyTasksPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [taskLists, setTaskLists] = useState<Record<TaskStatus, Task[]>>({
    open: [],
    assigned: [],
    'pending-completion': [],
    completed: [],
  });
  const [lastVisible, setLastVisible] = useState<Record<TaskStatus, DocumentSnapshot | null>>({
    open: null,
    assigned: null,
    'pending-completion': null,
    completed: null,
  });
   const [hasMore, setHasMore] = useState<Record<TaskStatus, boolean>>({
    open: true,
    assigned: true,
    'pending-completion': true,
    completed: true,
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState<Record<TaskStatus, boolean>>({
    open: false,
    assigned: false,
    'pending-completion': false,
    completed: false,
  });
  
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const fetchTasks = useCallback(async (status: TaskStatus, loadMore = false) => {
    if (!user || !userProfile) return;
    
    if (loadMore) {
      setLoadingMore(prev => ({...prev, [status]: true}));
    } else {
      setLoading(true);
    }

    const toTask = (doc: DocumentData): Task => {
        const data = doc.data();
        return {
            id: doc.id,
            title: data.title, location: data.location,
            date: data.preferredDateTime instanceof Timestamp ? data.preferredDateTime.toDate().toLocaleDateString() : data.preferredDateTime,
            price: data.budget, offers: data.offerCount || 0, type: data.taskType, status: data.status,
            category: data.category || 'General', description: data.description, postedBy: data.postedByName,
            postedById: data.postedById, assignedToId: data.assignedToId, assignedToName: data.assignedToName,
            coordinates: data.coordinates || null,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        } as Task;
    };

    let fieldToQuery = userProfile.accountType === 'client' ? 'postedById' : 'assignedToId';
    let q = query(
        collection(db, 'tasks'),
        where(fieldToQuery, '==', user.uid),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE)
    );
    
    if (loadMore && lastVisible[status]) {
      q = query(q, startAfter(lastVisible[status]));
    }
    
    try {
        const snapshot = await getDocs(q);
        const newTasks = snapshot.docs.map(toTask);
        
        setTaskLists(prev => ({ ...prev, [status]: loadMore ? [...prev[status], ...newTasks] : newTasks}));
        setLastVisible(prev => ({ ...prev, [status]: snapshot.docs[snapshot.docs.length - 1] || null }));
        setHasMore(prev => ({ ...prev, [status]: newTasks.length === PAGE_SIZE }));
    } catch (error) {
        console.error(`Error fetching ${status} tasks:`, error);
    } finally {
         setLoading(false);
         setLoadingMore(prev => ({...prev, [status]: false}));
    }
  }, [user, userProfile, lastVisible]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        setLoading(false);
        return;
    };
    
    const initialFetch = async () => {
        if (userProfile?.accountType === 'client') {
            await fetchTasks('open');
            await fetchTasks('assigned');
            await fetchTasks('pending-completion');
            await fetchTasks('completed');
        } else {
            await fetchTasks('assigned');
            await fetchTasks('pending-completion');
            await fetchTasks('completed');
        }
    }

    initialFetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, userProfile]);

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
  };
  
  const handleBack = () => {
    setSelectedTask(null);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
      // Find which list the task is in and update it
      Object.keys(taskLists).forEach(status => {
          const list = taskLists[status as TaskStatus];
          const taskIndex = list.findIndex(t => t.id === updatedTask.id);
          if (taskIndex > -1) {
              const newList = [...list];
              // If status changed, remove from old list
              if (updatedTask.status !== status) {
                  newList.splice(taskIndex, 1);
              } else {
                  newList[taskIndex] = updatedTask;
              }
              setTaskLists(prev => ({...prev, [status]: newList}));
          }
      });
      // Add to new list if status changed
      if (task.status !== updatedTask.status) {
          setTaskLists(prev => ({...prev, [updatedTask.status]: [updatedTask, ...prev[updatedTask.status]]}))
      }
      if(selectedTask?.id === updatedTask.id){
          setSelectedTask(updatedTask);
      }
  };

  const handleGoToChat = async (taskId: string) => {
    if(!user) return;
    const q = query(collection(db, 'conversations'), where('taskId', '==', taskId), where('participants', 'array-contains', user.uid));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        router.push(`/messages/${snapshot.docs[0].id}`);
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Conversation not found for this task.',
        });
    }
  };


  if (authLoading || loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto py-12 px-4 md:px-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-6 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
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
  
  const mergedAssignedAndPending = [...taskLists.assigned, ...taskLists['pending-completion']];

  const renderClientDashboard = () => (
    <Tabs defaultValue="open" className="w-full">
      <TabsList className="grid w-full grid-cols-4 max-w-lg">
        <TabsTrigger value="open">Open</TabsTrigger>
        <TabsTrigger value="assigned">Assigned</TabsTrigger>
        <TabsTrigger value="pending">Pending</TabsTrigger>
        <TabsTrigger value="completed">Completed</TabsTrigger>
      </TabsList>
      <TabsContent value="open" className="mt-6">
        <TaskList tasks={taskLists.open} onSelect={handleTaskSelect} onChat={handleGoToChat} onLoadMore={() => fetchTasks('open', true)} hasMore={hasMore.open} loadingMore={loadingMore.open} emptyMessage="You have no open tasks."/>
      </TabsContent>
       <TabsContent value="assigned" className="mt-6">
        <TaskList tasks={taskLists.assigned} onSelect={handleTaskSelect} onChat={handleGoToChat} onLoadMore={() => fetchTasks('assigned', true)} hasMore={hasMore.assigned} loadingMore={loadingMore.assigned} emptyMessage="You have no assigned tasks."/>
      </TabsContent>
      <TabsContent value="pending" className="mt-6">
        <TaskList tasks={taskLists['pending-completion']} onSelect={handleTaskSelect} onChat={handleGoToChat} onLoadMore={() => fetchTasks('pending-completion', true)} hasMore={hasMore['pending-completion']} loadingMore={loadingMore['pending-completion']} emptyMessage="You have no tasks pending completion."/>
      </TabsContent>
      <TabsContent value="completed" className="mt-6">
        <TaskList tasks={taskLists.completed} onSelect={handleTaskSelect} onChat={handleGoToChat} onLoadMore={() => fetchTasks('completed', true)} hasMore={hasMore.completed} loadingMore={loadingMore.completed} emptyMessage="You have no completed tasks."/>
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
            <TaskList 
                tasks={mergedAssignedAndPending} 
                onSelect={handleTaskSelect} 
                onChat={handleGoToChat} 
                onLoadMore={() => {
                    if (hasMore.assigned) fetchTasks('assigned', true);
                    if (hasMore['pending-completion']) fetchTasks('pending-completion', true);
                }} 
                hasMore={hasMore.assigned || hasMore['pending-completion']} 
                loadingMore={loadingMore.assigned || loadingMore['pending-completion']} 
                emptyMessage="You have no assigned tasks."
            />
        </TabsContent>
        <TabsContent value="completed" className="mt-6">
        <TaskList tasks={taskLists.completed} onSelect={handleTaskSelect} onChat={handleGoToChat} onLoadMore={() => fetchTasks('completed', true)} hasMore={hasMore.completed} loadingMore={loadingMore.completed} emptyMessage="You have no completed tasks."/>
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
            !selectedTask && 'hidden'
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
