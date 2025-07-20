
import HomePageClient from '@/components/HomePageClient';
import { type Task } from '@/components/TaskCard';

const mockTasks: (Task & { coordinates: [number, number] })[] = [
  {
    id: '1',
    title: 'Garden Cleanup and Mowing',
    location: 'Greenwich, London',
    date: 'Today',
    price: 75,
    offers: 3,
    type: 'physical',
    coordinates: [51.4826, -0.0077],
  },
  {
    id: '2',
    title: 'Build a responsive React website',
    location: 'Remote',
    date: 'Flexible',
    price: 500,
    offers: 8,
    type: 'online',
    coordinates: [34.0522, -118.2437], // Remote tasks can still have a general location, e.g. LA
  },
  {
    id: '3',
    title: 'Help moving apartments',
    location: 'SoHo, New York',
    date: 'August 2, 2024',
    price: 150,
    offers: 1,
    type: 'physical',
    coordinates: [40.7233, -74.0016],
  },
  {
    id: '4',
    title: 'Design a company logo',
    location: 'Remote',
    date: '1-week deadline',
    price: 250,
    offers: 12,
    type: 'online',
    coordinates: [48.8566, 2.3522], // e.g. Paris
  },
  {
    id: '5',
    title: 'Assemble a new bookshelf',
    location: 'Paris, France',
    date: 'July 30, 2024',
    price: 60,
    offers: 5,
    type: 'physical',
    coordinates: [48.8596, 2.3552],
  },
  {
    id: '6',
    title: 'Write 5 blog posts on tech',
    location: 'Remote',
    date: 'Flexible',
    price: 300,
    offers: 6,
    type: 'online',
    coordinates: [51.5072, -0.1276], // e.g. London
  },
];

export default function Home() {
  return <HomePageClient tasks={mockTasks} />;
}
