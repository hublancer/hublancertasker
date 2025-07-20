'use client';

import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import type { Task } from './TaskCard';
import L from 'leaflet';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl =
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl =
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  tasks: (Task & { coordinates: [number, number] })[];
}

const INITIAL_ZOOM = 10;

function MapControls({
  center,
}: {
  center: [number, number];
}) {
  const map = useMap();

  return (
    <div className="leaflet-top leaflet-right">
      <div className="leaflet-control leaflet-bar flex flex-col gap-px">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-white"
          onClick={() => map.zoomIn()}
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-white"
          onClick={() => map.zoomOut()}
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-white mt-2"
          onClick={() => map.setView(center, INITIAL_ZOOM)}
          aria-label="Refresh map view"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}


const Map = ({ tasks }: MapProps) => {
  const physicalTasks = tasks.filter(task => task.type === 'physical');
  const center: [number, number] =
    physicalTasks.length > 0 ? physicalTasks[0].coordinates : [51.505, -0.09];

  return (
    <MapContainer
      center={center}
      zoom={INITIAL_ZOOM}
      scrollWheelZoom={false}
      className="h-full w-full"
      zoomControl={false} // Disable default zoom control
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {physicalTasks.map(task => (
        <Marker key={task.id} position={task.coordinates}>
          <Popup>
            <div className="space-y-1">
              <h3 className="font-bold">{task.title}</h3>
              <p>${task.price}</p>
              <Link
                href={`/tasks/${task.id}`}
                className="text-primary hover:underline text-sm"
              >
                View Task
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
      <MapControls center={center} />
    </MapContainer>
  );
};

export default Map;
