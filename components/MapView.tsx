
import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { PhotoEntry, LocationGroup } from '../types';

// Note: leaflet CSS is loaded in index.html via <link> tag

// Fix for default marker icon in Leaflet
const initLeaflet = () => {
  const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });
  L.Marker.prototype.options.icon = DefaultIcon;
};

interface MapViewProps {
  photos: PhotoEntry[];
  onMarkerClick: (group: LocationGroup) => void;
  selectedCountry?: string;
  selectedRegion?: string;
}

// Helper to center and zoom map when needed
const ZoomHandler: React.FC<{ photos: PhotoEntry[] }> = ({ photos }) => {
  const map = useMap();
  const prevPhotosRef = useRef<string>('');

  useEffect(() => {
    if (photos.length > 0) {
      const currentIds = photos.map(p => p.id).sort().join(',');
      if (prevPhotosRef.current === currentIds) return;
      prevPhotosRef.current = currentIds;

      const bounds = L.latLngBounds(photos.map(p => [p.location.lat, p.location.lng]));
      
      // If only one point or multiple points very close, use flyTo
      if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
        map.flyTo(bounds.getCenter(), 10, { duration: 1.5 });
      } else {
        map.flyToBounds(bounds, {
          padding: [50, 50],
          maxZoom: 12,
          duration: 1.5
        });
      }
    }
  }, [photos, map]);
  return null;
};

const MapView: React.FC<MapViewProps> = ({ photos, onMarkerClick }) => {
  useEffect(() => {
    initLeaflet();
  }, []);

  // Group photos by location coordinates
  const groupedLocations = useMemo(() => {
    const groups: Record<string, LocationGroup> = {};
    photos.forEach(photo => {
      const key = `${photo.location.lat.toFixed(3)},${photo.location.lng.toFixed(3)}`;
      if (!groups[key]) {
        groups[key] = {
          name: photo.location.name,
          lat: photo.location.lat,
          lng: photo.location.lng,
          photos: []
        };
      }
      groups[key].photos.push(photo);
    });
    return Object.values(groups);
  }, [photos]);

  const customMarkerIcon = (photoUrl: string) => L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="relative w-12 h-12 rounded-full border-4 border-white shadow-lg overflow-hidden transform hover:scale-110 transition-transform bg-gray-200">
        <img src="${photoUrl}" class="w-full h-full object-cover" loading="lazy" />
      </div>
      <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white mx-auto -mt-1 shadow-sm"></div>
    `,
    iconSize: [48, 56],
    iconAnchor: [24, 56]
  });

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={[20, 0] as [number, number]} 
        zoom={2.5} 
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {groupedLocations.map((group, idx) => (
          <Marker 
            key={`${group.lat}-${group.lng}-${idx}`} 
            position={[group.lat, group.lng] as [number, number]}
            icon={customMarkerIcon(group.photos[0].url)}
            eventHandlers={{
              click: () => onMarkerClick(group)
            }}
          >
            <Popup className="rounded-lg overflow-hidden">
              <div className="p-1">
                <p className="font-bold text-gray-800">{group.name}</p>
                <p className="text-xs text-gray-500">{group.photos.length} memories</p>
              </div>
            </Popup>
          </Marker>
        ))}
        
        <ZoomHandler photos={photos} />
      </MapContainer>
    </div>
  );
};

export default MapView;
