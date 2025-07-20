import AppHeader from '@/components/AppHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TaskCard, { type Task } from '@/components/TaskCard';

const myTasks: Task[] = [
  {
    id: '1',
    title: 'Garden Cleanup and Mowing',
    location: 'Greenwich, London',
    date: 'July 28, 2024',
    price: 75,
    offers: 3,
    type: 'physical',
  },
  {
    id: '2',
    title: 'Build a responsive React website',
    location: 'Remote',
    date: 'Flexible',
    price: 500,
    offers: 8,
    type: 'online',
  },
];
const assignedTasks: Task[] = [
  {
    id: '3',
    title: 'Help moving apartments',
    location: 'SoHo, New York',
    date: 'August 2, 2024',
    price: 150,
    offers: 1,
    type: 'physical',
  },
];
const completedTasks: Task[] = [
  {
    id: '4',
    title: 'Design a company logo',
    location: 'Remote',
    date: '1-week deadline',
    price: 250,
    offers: 12,
    type: 'online',
  },
];

export default function MyTasksPage() {
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
