'use client';

import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import type { Task } from './TaskCard';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { useEffect } from 'react';

// This is to fix the missing marker icon issue with react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapProps {
  tasks: (Task & { coordinates: [number, number] })[];
  onTaskSelect: (task: Task) => void;
}

const INITIAL_ZOOM = 10;
const DEFAULT_CENTER: [number, number] = [51.505, -0.09];

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom() || INITIAL_ZOOM);
  }, [center, map]);
  return null;
}

function MapControls({ center }: { center: [number, number] }) {
  const map = useMap();

  return (
    <div className="leaflet-top leaflet-right">
      <div className="leaflet-control leaflet-bar flex flex-col gap-px mt-2 mr-2">
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

const Map = ({ tasks, onTaskSelect }: MapProps) => {
  const physicalTasks = tasks.filter(task => task.type === 'physical');
  const center: [number, number] =
    physicalTasks.length > 0 ? physicalTasks[0].coordinates : DEFAULT_CENTER;

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
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => onTaskSelect(task)}
              >
                View Task
              </Button>
            </div>
          </Popup>
        </Marker>
      ))}
      <MapUpdater center={center} />
      <MapControls center={center} />
    </MapContainer>
  );
};

export default Map;
