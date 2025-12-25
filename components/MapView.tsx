
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Rectangle } from 'react-leaflet';
import L from 'leaflet';
import { PhotoEntry, LocationGroup } from '../types';
import { MousePointer2, BoxSelect, X } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

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

const isValidCoord = (n: any) => typeof n === 'number' && !isNaN(n);

interface MapViewProps {
  photos: PhotoEntry[];
  onMarkerClick: (group: LocationGroup) => void;
  onAreaSelect: (bounds: L.LatLngBounds) => void;
  selectedCountry?: string;
  selectedRegion?: string;
}

// Handler for drawing the selection box
const SelectionHandler: React.FC<{ 
  active: boolean, 
  onSelectionEnd: (bounds: L.LatLngBounds) => void 
}> = ({ active, onSelectionEnd }) => {
  const map = useMap();
  const [startPos, setStartPos] = useState<L.LatLng | null>(null);
  const [currentPos, setCurrentPos] = useState<L.LatLng | null>(null);

  useEffect(() => {
    if (active) {
      map.dragging.disable();
    } else {
      map.dragging.enable();
      setStartPos(null);
      setCurrentPos(null);
    }
  }, [active, map]);

  useMapEvents({
    mousedown(e) {
      if (!active) return;
      setStartPos(e.latlng);
      setCurrentPos(e.latlng);
    },
    mousemove(e) {
      if (!active || !startPos) return;
      setCurrentPos(e.latlng);
    },
    mouseup() {
      if (!active || !startPos || !currentPos) return;
      const bounds = L.latLngBounds(startPos, currentPos);
      onSelectionEnd(bounds);
      setStartPos(null);
      setCurrentPos(null);
    }
  });

  if (!startPos || !currentPos) return null;

  return (
    <Rectangle 
      bounds={L.latLngBounds(startPos, currentPos)} 
      pathOptions={{ color: '#3b82f6', weight: 1, fillOpacity: 0.2, dashArray: '5, 5' }} 
    />
  );
};

// Helper to center and zoom map when needed
const ZoomHandler: React.FC<{ photos: PhotoEntry[] }> = ({ photos }) => {
  const map = useMap();
  const prevPhotosRef = useRef<string>('');

  useEffect(() => {
    const validPhotos = photos.filter(p => isValidCoord(p.location.lat) && isValidCoord(p.location.lng));
    
    if (validPhotos.length > 0) {
      const currentIds = validPhotos.map(p => p.id).sort().join(',');
      if (prevPhotosRef.current === currentIds) return;
      prevPhotosRef.current = currentIds;

      const bounds = L.latLngBounds(validPhotos.map(p => [p.location.lat, p.location.lng]));
      
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

const MapView: React.FC<MapViewProps> = ({ photos, onMarkerClick, onAreaSelect }) => {
  const { t } = useTranslation();
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  useEffect(() => {
    initLeaflet();
  }, []);

  // Group photos by location coordinates
  const groupedLocations = useMemo(() => {
    const groups: Record<string, LocationGroup> = {};
    photos.forEach(photo => {
      const lat = photo.location.lat;
      const lng = photo.location.lng;
      
      // Skip if coordinates are invalid
      if (!isValidCoord(lat) || !isValidCoord(lng)) return;

      const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
      if (!groups[key]) {
        groups[key] = {
          name: photo.location.name,
          lat: lat,
          lng: lng,
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
      {/* Map Tools Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex gap-2">
        <div className="bg-white/90 backdrop-blur-md p-1 rounded-full shadow-xl border border-white/20 flex items-center">
          <button 
            onClick={() => setIsSelectionMode(false)}
            className={`p-2 rounded-full transition-all flex items-center gap-2 px-4 ${!isSelectionMode ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <MousePointer2 size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">{t.map_view}</span>
          </button>
          <button 
            onClick={() => setIsSelectionMode(true)}
            className={`p-2 rounded-full transition-all flex items-center gap-2 px-4 ${isSelectionMode ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <BoxSelect size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">{t.selection_mode}</span>
          </button>
        </div>

        {isSelectionMode && (
          <div className="bg-blue-50/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-blue-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">{t.selection_instructions}</span>
            <button 
              onClick={() => setIsSelectionMode(false)}
              className="p-1 hover:bg-blue-200 rounded-full text-blue-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

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
              <div className="p-1 text-center">
                <p className="font-bold text-gray-800 text-sm leading-tight">{group.name}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{group.photos.length} {t.memories_count}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        
        <ZoomHandler photos={photos} />
        <SelectionHandler 
          active={isSelectionMode} 
          onSelectionEnd={(bounds) => {
            onAreaSelect(bounds);
            setIsSelectionMode(false);
          }} 
        />
      </MapContainer>
    </div>
  );
};

export default MapView;
