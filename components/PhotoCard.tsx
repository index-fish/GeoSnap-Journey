
import React from 'react';
import { PhotoEntry } from '../types';
import { Calendar, MapPin, Camera, Zap, User } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

interface PhotoCardProps {
  photo: PhotoEntry;
  onClick: (photo: PhotoEntry) => void;
}

const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onClick }) => {
  const { language } = useTranslation();
  
  return (
    <div 
      className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer group border border-transparent hover:border-blue-100 flex flex-col"
      onClick={() => onClick(photo)}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={photo.url} 
          alt={photo.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />
        {/* Author Badge */}
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md text-[9px] text-white rounded-lg flex items-center gap-1.5 font-bold uppercase tracking-widest border border-white/10">
          <User size={10} className="text-blue-400" />
          {photo.user_name}
        </div>
        
        {/* Overlay Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          <div className="flex gap-1">
            {photo.tags.slice(0, 2).map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-black/40 text-white text-[10px] rounded-full backdrop-blur-md border border-white/20">
                #{tag}
              </span>
            ))}
          </div>
          {photo.parameters?.camera && (
            <div className="px-2 py-0.5 bg-blue-600/80 text-white text-[9px] rounded-sm backdrop-blur-md font-bold uppercase tracking-widest flex items-center gap-1">
              <Camera size={8} />
              {photo.parameters.camera}
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">{photo.title}</h3>
        
        {/* Technical Summary */}
        {photo.parameters && (
          <div className="flex items-center gap-3 mb-3 text-[10px] text-gray-500 font-mono bg-gray-50 p-1.5 rounded-lg border border-gray-100">
            <span className="flex items-center gap-1"><Zap size={10} className="text-yellow-500" /> {photo.parameters.aperture || '--'}</span>
            <span className="w-px h-2 bg-gray-300"></span>
            <span>{photo.parameters.shutterSpeed || '--'}</span>
            <span className="w-px h-2 bg-gray-300"></span>
            <span>ISO {photo.parameters.iso || '--'}</span>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between text-[10px] text-gray-400">
          <div className="flex items-center gap-1">
            <Calendar size={10} />
            <span>{new Date(photo.date).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')}</span>
          </div>
          <div className="flex items-center gap-1 max-w-[100px] truncate">
            <MapPin size={10} />
            <span className="truncate">{photo.location.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoCard;
