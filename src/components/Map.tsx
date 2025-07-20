'use client';

import { Marker, Popup } from 'react-leaflet';
import { Task } from './TaskCard';
import L from 'leaflet';
import Link from 'next/link';

// Fix for default icon path issue with webpack
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  tasks: (Task & { coordinates: [number, number] })[];
}

const Map = ({ tasks }: MapProps) => {
  const physicalTasks = tasks.filter(task => task.type === 'physical');

  return (
    <>
      {physicalTasks.map(task => (
        <Marker key={task.id} position={task.coordinates}>
          <Popup>
            <div className="space-y-1">
              <h3 className="font-bold">{task.title}</h3>
              <p>${task.price}</p>
              <Link href={`/tasks/${task.id}`} className="text-primary hover:underline text-sm">
                View Task
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

export default Map;