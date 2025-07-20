import HomePageClient from '@/components/HomePageClient';
import { type Task } from '@/components/TaskCard';

const mockTasks: (Task & {
  coordinates: [number, number];
  description: string;
  postedBy: string;
})[] = [
  {
    id: '1',
    title: 'Garden Cleanup and Mowing',
    location: 'Greenwich, London',
    date: 'Today',
    price: 75,
    offers: 3,
    type: 'physical',
    coordinates: [51.4826, -0.0077],
    description:
      "I need help getting my garden ready for a summer party. The main tasks include mowing the front and back lawn (approx 100 sq meters total), weeding the flower beds, trimming the hedges, and taking away all the garden waste. All tools will be provided, but you're welcome to bring your own if you prefer. This should take about 3-4 hours.",
    postedBy: 'Laura D.',
    status: 'open',
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
    description:
      'Looking for a skilled developer to build a responsive 5-page website for a new startup. Tech stack should be Next.js and Tailwind CSS. Figma designs will be provided. Need to be able to work independently and meet deadlines.',
    postedBy: 'Mike W.',
    status: 'open',
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
    description:
      'Need a hand moving some furniture and boxes from a 2nd floor apartment to a moving van. No heavy lifting required, just need an extra pair of hands. Should take about 2-3 hours.',
    postedBy: 'Sarah P.',
    status: 'assigned',
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
    description:
      'We are a new coffee brand and need a modern, minimalist logo. We will provide a brief with our brand values and some inspiration. Looking for a creative designer with a strong portfolio.',
    postedBy: 'John D.',
    status: 'open',
  },
  {
    id: '5',
    title: 'Assemble a new bookshelf',
    location: 'Paris, France',
    date: 'July 30, 2024',
    price: 60,
    offers: 0,
    type: 'physical',
    coordinates: [48.8596, 2.3552],
    description:
      'I have a new IKEA bookshelf that needs assembling. The instructions and all parts are here. Should be a quick job for someone who knows what they are doing!',
    postedBy: 'Emilie L.',
    status: 'open',
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
    description:
      'Seeking a writer to create 5 blog posts (around 1000 words each) on the topic of AI and machine learning. Must have some knowledge in the area and be able to write in an engaging, accessible style.',
    postedBy: 'Alex C.',
    status: 'open',
  },
];

export default function Home() {
  return <HomePageClient tasks={mockTasks} />;
}
