
import React, { useState, useEffect, useMemo } from 'react';
import { Camera, Map as MapIcon, Image as ImageIcon, Plus, Compass, Search, Github, Info, Sliders, Calendar, MapPin, Tag, Languages, Globe, ChevronRight } from 'lucide-react';
import MapView from './components/MapView';
import GalleryView from './components/GalleryView';
import AddPhotoModal from './components/AddPhotoModal';
import { PhotoEntry, LocationGroup } from './types';
import { INITIAL_PHOTOS } from './constants';
import { useTranslation } from './context/LanguageContext';
import { Language } from './translations';

const App: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  
  const [photos, setPhotos] = useState<PhotoEntry[]>(() => {
    const saved = localStorage.getItem('geosnap_photos');
    return saved ? JSON.parse(saved) : INITIAL_PHOTOS;
  });
  
  const [selectedGroup, setSelectedGroup] = useState<LocationGroup | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEntry | null>(null);
  
  // Geographical Filter State
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [activeCountry, setActiveCountry] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('geosnap_photos', JSON.stringify(photos));
  }, [photos]);

  const handleAddPhoto = (newPhoto: PhotoEntry) => {
    setPhotos(prev => [newPhoto, ...prev]);
    setIsAdding(false);
  };

  // Grouping logic for the Region Browser
  const regionHierarchy = useMemo(() => {
    const hierarchy: Record<string, Set<string>> = {};
    photos.forEach(p => {
      const reg = p.location.region || 'Others';
      const countr = p.location.country || 'Unknown';
      if (!hierarchy[reg]) hierarchy[reg] = new Set();
      hierarchy[reg].add(countr);
    });
    return hierarchy;
  }, [photos]);

  const filteredPhotos = useMemo(() => {
    return photos.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesRegion = activeRegion ? p.location.region === activeRegion : true;
      const matchesCountry = activeCountry ? p.location.country === activeCountry : true;
      
      return matchesSearch && matchesRegion && matchesCountry;
    });
  }, [photos, searchQuery, activeRegion, activeCountry]);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 overflow-hidden font-sans">
      {/* Header */}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Camera size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-gray-900">GeoSnap</h1>
            <p className="text-[10px] uppercase tracking-widest text-blue-600 font-bold -mt-1">{t.logo_sub}</p>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-8 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder={t.search_placeholder}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full border-none focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full border border-transparent focus-within:border-blue-500 transition-all cursor-pointer">
            <Languages size={16} className="text-gray-500" />
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer appearance-none min-w-[32px] text-center"
              aria-label="Select Language"
            >
              <option value="en">EN</option>
              <option value="zh">ZH</option>
            </select>
          </div>
          
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">{t.add_memory}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative flex">
        {/* Sidebar - Regional Explorer */}
        <aside className="hidden lg:flex w-80 bg-white border-r flex-col overflow-y-auto z-40">
          <div className="p-6 border-b">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">{t.explore_regions}</h2>
            <button 
              onClick={() => { setActiveRegion(null); setActiveCountry(null); }}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all mb-4 ${!activeRegion ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
            >
              <div className="flex items-center gap-3">
                <Globe size={18} />
                <span className="font-bold text-sm">{t.all_regions}</span>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">{photos.length}</span>
            </button>

            <div className="space-y-1">
              {Object.entries(regionHierarchy).map(([region, countries]) => (
                <div key={region} className="space-y-1">
                  <button 
                    onClick={() => { setActiveRegion(region); setActiveCountry(null); }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-sm font-bold transition-colors ${activeRegion === region && !activeCountry ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <span>{region}</span>
                    <ChevronRight size={14} className={`transform transition-transform ${activeRegion === region ? 'rotate-90 text-blue-500' : ''}`} />
                  </button>
                  
                  {activeRegion === region && (
                    <div className="ml-4 pl-2 border-l-2 border-blue-100 space-y-1 animate-in slide-in-from-left-2 duration-200">
                      {Array.from(countries).map(country => (
                        <button 
                          key={country}
                          onClick={() => setActiveCountry(country)}
                          className={`w-full text-left p-2 rounded-md text-xs font-medium transition-colors ${activeCountry === country ? 'text-blue-600 bg-blue-50 font-bold' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                          {country}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border-b">
             <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <div className="text-2xl font-black text-blue-900">{filteredPhotos.length}</div>
                <div className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">{t.captures}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                <div className="text-2xl font-black text-purple-900">{new Set(filteredPhotos.map(p => p.location.name)).size}</div>
                <div className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">{t.locations}</div>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">{t.recent_explorations}</h2>
            <div className="space-y-4">
              {filteredPhotos.slice(0, 5).map(photo => (
                <div 
                  key={photo.id} 
                  className="flex gap-3 group cursor-pointer p-2 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm border border-gray-100 relative">
                    <img src={photo.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" loading="lazy" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="font-bold text-sm truncate text-gray-800">{photo.title}</h3>
                    <p className="text-[11px] text-gray-500 truncate flex items-center gap-1"><MapPin size={10}/> {photo.location.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Map Area */}
        <div className="flex-1 relative">
          <MapView 
            photos={filteredPhotos} 
            onMarkerClick={(group) => setSelectedGroup(group)}
          />
        </div>
      </main>

      {/* Overlays & Modals */}
      {selectedGroup && (
        <GalleryView 
          group={selectedGroup} 
          onClose={() => setSelectedGroup(null)} 
          onPhotoClick={(photo) => setSelectedPhoto(photo)}
        />
      )}

      {isAdding && (
        <AddPhotoModal 
          onClose={() => setIsAdding(false)} 
          onAdd={handleAddPhoto} 
        />
      )}

      {/* Large Image Preview */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[3000] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-10 overflow-y-auto">
          <button 
            onClick={() => setSelectedPhoto(null)}
            className="fixed top-6 right-6 text-white/50 hover:text-white transition-colors p-2 z-[3001] bg-white/10 rounded-full hover:bg-white/20"
          >
            <X size={24} />
          </button>
          
          <div className="max-w-7xl w-full flex flex-col lg:flex-row gap-8 items-stretch h-full lg:h-auto animate-in zoom-in fade-in duration-300">
            <div className="flex-1 bg-white/5 rounded-2xl overflow-hidden shadow-2xl relative group flex items-center justify-center min-h-[50vh]">
              <img 
                src={selectedPhoto.url} 
                alt={selectedPhoto.title} 
                className="max-h-full max-w-full object-contain" 
              />
              <div className="absolute bottom-4 left-4 flex gap-2">
                 {selectedPhoto.tags.map(tag => (
                   <span key={tag} className="px-3 py-1 bg-black/50 text-white text-[10px] rounded-full backdrop-blur-md border border-white/10 uppercase tracking-widest font-bold">#{tag}</span>
                 ))}
              </div>
            </div>

            <div className="w-full lg:w-96 flex flex-col gap-6 text-white p-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-widest">
                   <MapPin size={12} />
                   {selectedPhoto.location.name}
                </div>
                <h2 className="text-4xl font-black leading-tight">{selectedPhoto.title}</h2>
                <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                  <Calendar size={14} />
                  {new Date(selectedPhoto.date).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { dateStyle: 'long' })}
                </div>
              </div>

              <div className="p-6 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-xl">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                    <Sliders size={12} /> {t.technical_specs}
                 </h3>
                 <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                    <div className="col-span-2 flex items-center gap-3 border-b border-white/5 pb-4">
                       <div className="p-2 bg-blue-600 rounded-lg"><Camera size={16}/></div>
                       <div>
                          <p className="text-[9px] uppercase font-bold text-gray-500">{t.camera_body}</p>
                          <p className="text-lg font-bold leading-tight">{selectedPhoto.parameters?.camera || t.unknown}</p>
                       </div>
                    </div>
                    <div>
                       <p className="text-[9px] uppercase font-bold text-gray-500 mb-1">{t.aperture}</p>
                       <p className="text-xl font-mono font-bold text-blue-300">{selectedPhoto.parameters?.aperture || '--'}</p>
                    </div>
                    <div>
                       <p className="text-[9px] uppercase font-bold text-gray-500 mb-1">{t.exposure}</p>
                       <p className="text-xl font-mono font-bold">{selectedPhoto.parameters?.shutterSpeed || '--'}</p>
                    </div>
                    <div>
                       <p className="text-[9px] uppercase font-bold text-gray-500 mb-1">{t.iso_speed}</p>
                       <p className="text-xl font-mono font-bold text-yellow-400">{selectedPhoto.parameters?.iso || '--'}</p>
                    </div>
                    <div>
                       <p className="text-[9px] uppercase font-bold text-gray-500 mb-1">{t.focal_length}</p>
                       <p className="text-xl font-mono font-bold">{selectedPhoto.parameters?.focalLength || '--'}</p>
                    </div>
                 </div>
              </div>

              <div className="flex-1 space-y-4">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Info size={12} /> {t.narrative}
                 </h3>
                 <p className="text-gray-300 leading-relaxed italic border-l-2 border-blue-500 pl-4 py-1">
                   "{selectedPhoto.description}"
                 </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const X = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default App;
