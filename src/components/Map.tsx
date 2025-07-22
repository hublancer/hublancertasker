
'use client';

import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import type { Task } from './TaskCard';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect } from 'react';
import { Skeleton } from './ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});


// This is to fix the missing marker icon issue with react-leaflet
// delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapProps {
  tasks: (Task & { coordinates: [number, number] | null })[];
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

function MapControls({ onRefresh }: { onRefresh: () => void }) {
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
            className="h-8 w-8 bg-white"
            onClick={onRefresh}
            aria-label="Refresh map"
        >
            <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

const Map = ({ tasks, onTaskSelect, center, zoom = INITIAL_ZOOM }: MapProps) => {
  const { settings } = useAuth();
  const physicalTasks = tasks.filter(task => task.type === 'physical' && task.coordinates);
  const mapCenter = center || DEFAULT_CENTER;
  
  const map = useMap();

  const handleRefresh = () => {
    if (physicalTasks.length > 0) {
        const bounds = L.latLngBounds(physicalTasks.map(task => task.coordinates as L.LatLngTuple));
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    } else {
        map.setView(DEFAULT_CENTER, INITIAL_ZOOM);
    }
  };
  
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
        task.coordinates && (
            <Marker key={task.id} position={task.coordinates} icon={greenIcon}>
            <Popup>
                <div className="space-y-1">
                <h3 className="font-bold">{task.title}</h3>
                <p>{settings?.currencySymbol ?? 'Rs'}{task.price}</p>
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
        )
      ))}
      <MapViewUpdater center={center} zoom={zoom} />
      <MapControls onRefresh={handleRefresh} />
    </MapContainer>
  );
};

// A wrapper component is needed because useMap can only be used by a child of MapContainer
const MapWrapper = (props: MapProps) => {
    return (
        <MapContainer
            center={props.center || DEFAULT_CENTER}
            zoom={props.zoom || INITIAL_ZOOM}
            scrollWheelZoom={true}
            className="h-full w-full"
            zoomControl={false}
        >
            <Map {...props} />
        </MapContainer>
    )
}


export default MapWrapper;
