'use client';

import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import type { Task } from './TaskCard';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut } from 'lucide-react';
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
  center: [number, number] | null;
  zoom?: number;
}

const INITIAL_ZOOM = 6;
const DEFAULT_CENTER: [number, number] = [30.3753, 69.3451]; // Pakistan center

function MapViewUpdater({ center, zoom }: { center: [number, number] | null, zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

function MapControls() {
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
      </div>
    </div>
  );
}

const Map = ({ tasks, onTaskSelect, center, zoom = INITIAL_ZOOM }: MapProps) => {
  const physicalTasks = tasks.filter(task => task.type === 'physical');
  const mapCenter = center || DEFAULT_CENTER;
  
  if (typeof window === 'undefined') {
    return <Skeleton className="h-full w-full" />;
  }

  return (
    <MapContainer
      center={mapCenter}
      zoom={zoom}
      scrollWheelZoom={true}
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
      <MapViewUpdater center={center} zoom={zoom} />
      <MapControls />
    </MapContainer>
  );
};

export default Map;
