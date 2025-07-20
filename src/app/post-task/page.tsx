import AppHeader from '@/components/AppHeader';
import PostTaskForm from '@/components/PostTaskForm';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

export default function PostTaskPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1">
        <div className="container mx-auto py-12 px-4 md:px-6">
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="font-headline text-3xl">
                Post a New Task
              </CardTitle>
              <CardDescription>
                Fill out the details below to find the right person for the job.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PostTaskForm />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
