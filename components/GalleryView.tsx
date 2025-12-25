
import React from 'react';
import { LocationGroup, PhotoEntry } from '../types';
import { X, Camera } from 'lucide-react';
import PhotoCard from './PhotoCard';
import { useTranslation } from '../context/LanguageContext';

interface GalleryViewProps {
  group: LocationGroup;
  onClose: () => void;
  onPhotoClick: (photo: PhotoEntry) => void;
}

const GalleryView: React.FC<GalleryViewProps> = ({ group, onClose, onPhotoClick }) => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      <div className="relative bg-gray-50 w-full max-w-6xl h-full max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Camera className="text-blue-500" />
              {group.name}
            </h2>
            <p className="text-gray-500 text-sm">{group.photos.length} {t.photos_captured}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {group.photos.map(photo => (
              <PhotoCard 
                key={photo.id} 
                photo={photo} 
                onClick={onPhotoClick} 
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryView;
