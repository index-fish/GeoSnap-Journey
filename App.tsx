
import React, { useState, useEffect, useMemo } from 'react';
import { Camera, Map as MapIcon, Image as ImageIcon, Plus, Compass, Search, Github, Info, Sliders, Calendar, MapPin, Tag, Languages, Globe, ChevronRight, LayoutGrid, Edit2, X, Filter, RotateCcw, LogOut, User as UserIcon, Loader2 } from 'lucide-react';
import { get, set } from 'idb-keyval';
import L from 'leaflet';
import MapView from './components/MapView';
import GalleryView from './components/GalleryView';
import AddPhotoModal from './components/AddPhotoModal';
import EditPhotoModal from './components/EditPhotoModal';
import ManageMemoriesView from './components/ManageMemoriesView';
import AuthModal from './components/AuthModal';
import { PhotoEntry, LocationGroup } from './types';
import { INITIAL_PHOTOS } from './constants';
import { useTranslation } from './context/LanguageContext';
import { useAuth } from './context/AuthContext';
import { Language } from './translations';

const isValidCoord = (n: any) => typeof n === 'number' && !isNaN(n);

const App: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  
  const [photos, setPhotos] = useState<PhotoEntry[]>(INITIAL_PHOTOS);
  const [isDBLoaded, setIsDBLoaded] = useState(false);
  const [currentView, setCurrentView] = useState<'map' | 'manage'>('map');
  
  const [selectedGroup, setSelectedGroup] = useState<LocationGroup | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<PhotoEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEntry | null>(null);
  
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Geographical Filter State
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [activeCountry, setActiveCountry] = useState<string | null>(null);

  // Date Filter State
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Load photos from IndexedDB on mount
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const saved = await get('geosnap_photos');
        if (saved && Array.isArray(saved)) {
          setPhotos(saved);
        }
      } catch (err) {
        console.error('Failed to load photos from IndexedDB:', err);
      } finally {
        setIsDBLoaded(true);
      }
    };
    loadPhotos();
  }, []);

  // Save photos to IndexedDB whenever they change
  useEffect(() => {
    if (isDBLoaded) {
      set('geosnap_photos', photos).catch(err => {
        console.error('Failed to save photos to IndexedDB:', err);
      });
    }
  }, [photos, isDBLoaded]);

  const handleAddPhoto = (newPhoto: PhotoEntry) => {
    setPhotos(prev => [newPhoto, ...prev]);
    setIsAdding(false);
  };

  const handleUpdatePhoto = (updatedPhoto: PhotoEntry) => {
    setPhotos(prev => prev.map(p => p.id === updatedPhoto.id ? updatedPhoto : p));
    setIsEditing(null);
    if (selectedPhoto?.id === updatedPhoto.id) {
      setSelectedPhoto(updatedPhoto);
    }
  };

  const handleDeletePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
    setIsEditing(null);
    if (selectedPhoto?.id === id) {
      setSelectedPhoto(null);
    }
  };

  const handleAreaSelect = (bounds: L.LatLngBounds) => {
    const photosInArea = filteredPhotos.filter(p => {
      if (!isValidCoord(p.location.lat) || !isValidCoord(p.location.lng)) return false;
      return bounds.contains(L.latLng(p.location.lat, p.location.lng));
    });
    
    if (photosInArea.length > 0) {
      setSelectedGroup({
        name: t.photos_in_area,
        lat: bounds.getCenter().lat,
        lng: bounds.getCenter().lng,
        photos: photosInArea
      });
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setActiveRegion(null);
    setActiveCountry(null);
    setSearchQuery('');
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
      
      const photoDate = new Date(p.date).getTime();
      const matchesStartDate = startDate ? photoDate >= new Date(startDate).getTime() : true;
      const matchesEndDate = endDate ? photoDate <= new Date(endDate).getTime() : true;
      
      return matchesSearch && matchesRegion && matchesCountry && matchesStartDate && matchesEndDate;
    });
  }, [photos, searchQuery, activeRegion, activeCountry, startDate, endDate]);

  if (isAuthLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="text-blue-600 animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 overflow-hidden font-sans text-gray-900">
      {!user && <AuthModal />}

      {/* Header */}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Camera size={24} />
          </div>
          <div className="cursor-pointer" onClick={() => setCurrentView('map')}>
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
          <div className="flex bg-gray-100 p-1 rounded-full border border-gray-200">
            <button 
              onClick={() => setCurrentView('map')}
              className={`p-1.5 rounded-full transition-all ${currentView === 'map' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              title={t.map_view}
            >
              <MapIcon size={18} />
            </button>
            <button 
              onClick={() => setCurrentView('manage')}
              className={`p-1.5 rounded-full transition-all ${currentView === 'manage' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              title={t.manage_memories}
            >
              <LayoutGrid size={18} />
            </button>
          </div>

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

          {/* User Profile */}
          {user && (
            <div className="relative">
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="w-10 h-10 rounded-full bg-gray-100 border flex items-center justify-center text-blue-600 hover:bg-gray-200 transition-colors"
              >
                <UserIcon size={20} />
              </button>
              
              {isUserMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[60]" onClick={() => setIsUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border p-2 z-[70] animate-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b mb-1">
                      <p className="text-xs font-black text-gray-900 truncate">{user.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                    </div>
                    <button 
                      onClick={() => { logout(); setIsUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-bold"
                    >
                      <LogOut size={16} />
                      {language === 'zh' ? '注销登录' : 'Logout'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative flex">
        {currentView === 'map' ? (
          <>
            {/* Sidebar - Regional Explorer */}
            <aside className="hidden lg:flex w-80 bg-white border-r flex-col overflow-y-auto z-40">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                   <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{t.explore_regions}</h2>
                   {(activeRegion || activeCountry || startDate || endDate || searchQuery) && (
                     <button 
                        onClick={clearFilters}
                        className="text-[10px] flex items-center gap-1 text-blue-600 font-black uppercase hover:text-blue-700 transition-colors"
                     >
                       <RotateCcw size={10} /> {t.clear_filters}
                     </button>
                   )}
                </div>
                
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

              {/* Date Filter Section */}
              <div className="p-6 border-b">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Filter size={14} /> {t.filter_by_date}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">{t.start_date}</label>
                    <input 
                      type="date" 
                      className="w-full text-xs p-2 bg-gray-50 border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">{t.end_date}</label>
                    <input 
                      type="date" 
                      className="w-full text-xs p-2 bg-gray-50 border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
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
                onAreaSelect={handleAreaSelect}
              />
            </div>
          </>
        ) : (
          <ManageMemoriesView 
            photos={photos} 
            onEdit={(photo) => setIsEditing(photo)} 
            onDelete={handleDeletePhoto} 
          />
        )}
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

      {isEditing && (
        <EditPhotoModal 
          photo={isEditing} 
          onClose={() => setIsEditing(null)} 
          onUpdate={handleUpdatePhoto}
          onDelete={handleDeletePhoto}
        />
      )}

      {/* Large Image Preview */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[3000] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-10 overflow-y-auto">
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
              {/* Header Actions - Moved here to prevent overlapping technical specs */}
              <div className="flex items-center justify-end gap-3 mb-2">
                <button 
                  onClick={() => setIsEditing(selectedPhoto)}
                  className="text-white/70 hover:text-blue-400 transition-colors p-2 bg-white/10 rounded-full hover:bg-white/20 flex items-center gap-2 px-4 border border-white/5"
                >
                  <Edit2 size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">{t.edit_action}</span>
                </button>
                <button 
                  onClick={() => setSelectedPhoto(null)}
                  className="text-white/70 hover:text-white transition-colors p-2 bg-white/10 rounded-full hover:bg-white/20 border border-white/5"
                >
                  <X size={20} />
                </button>
              </div>

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

export default App;
