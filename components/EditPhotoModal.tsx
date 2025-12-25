
import React, { useState } from 'react';
import { X, MapPin, Loader2, Sparkles, Sliders, Save, Trash2, RefreshCw } from 'lucide-react';
import { PhotoEntry } from '../types';
import { generatePhotoCaption } from '../services/geminiService';
import { reverseGeocode } from '../services/geocodingService';
import { useTranslation } from '../context/LanguageContext';

interface EditPhotoModalProps {
  photo: PhotoEntry;
  onClose: () => void;
  onUpdate: (photo: PhotoEntry) => void;
  onDelete?: (id: string) => void;
}

const EditPhotoModal: React.FC<EditPhotoModalProps> = ({ photo, onClose, onUpdate, onDelete }) => {
  const { t, language } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  const [formData, setFormData] = useState({
    title: photo.title,
    description: photo.description,
    date: photo.date,
    locationName: photo.location.name,
    lat: photo.location.lat,
    lng: photo.location.lng,
    country: photo.location.country || '',
    region: photo.location.region || '',
    tags: photo.tags.join(', '),
    camera: photo.parameters?.camera || '',
    aperture: photo.parameters?.aperture || '',
    shutterSpeed: photo.parameters?.shutterSpeed || '',
    iso: photo.parameters?.iso || '',
    focalLength: photo.parameters?.focalLength || ''
  });

  const handleReverseGeocode = async () => {
    if (formData.lat === 0 && formData.lng === 0) return;
    setIsGeocoding(true);
    const result = await reverseGeocode(formData.lat, formData.lng, language);
    if (result) {
      setFormData(prev => ({
        ...prev,
        locationName: result.name,
        country: result.country,
        region: result.region
      }));
    }
    setIsGeocoding(false);
  };

  const handleAISuggest = async () => {
    if (!formData.locationName) return;
    setLoading(true);
    const caption = await generatePhotoCaption(formData.locationName, formData.description);
    setFormData(prev => ({ ...prev, description: caption }));
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedPhoto: PhotoEntry = {
      ...photo,
      title: formData.title,
      description: formData.description,
      date: formData.date,
      location: {
        ...photo.location,
        lat: formData.lat,
        lng: formData.lng,
        name: formData.locationName,
        country: formData.country,
        region: formData.region
      },
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t !== ''),
      parameters: {
        camera: formData.camera,
        aperture: formData.aperture,
        shutterSpeed: formData.shutterSpeed,
        iso: formData.iso,
        focalLength: formData.focalLength
      }
    };
    onUpdate(updatedPhoto);
  };

  const handleDeleteClick = () => {
    if (onDelete && window.confirm(t.confirm_delete)) {
      onDelete(photo.id);
    }
  };

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            <Sliders className="text-blue-600" size={24} />
            {t.edit_modal_title}
          </h2>
          <div className="flex items-center gap-2">
            {onDelete && (
              <button 
                type="button" 
                onClick={handleDeleteClick}
                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title={t.delete_memory}
              >
                <Trash2 size={20} />
              </button>
            )}
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
          <div className="aspect-video rounded-xl overflow-hidden border bg-gray-100">
            <img src={photo.url} alt={photo.title} className="w-full h-full object-cover" />
          </div>

          <section className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">{t.basic_info}</h3>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">{t.memory_title}</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">{t.date}</label>
                <input required type="date" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">{t.location_name}</label>
                <div className="relative">
                  <input 
                    required 
                    type="text" 
                    className="w-full pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                    value={formData.locationName} 
                    onChange={e => setFormData({...formData, locationName: e.target.value})}
                  />
                  {isGeocoding ? (
                    <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
                  ) : formData.lat !== 0 && (
                    <button 
                      type="button" 
                      onClick={handleReverseGeocode}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Refresh location name in current language"
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">{t.shooting_params}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 mb-1">{t.camera_body}</label>
                <input type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" value={formData.camera} onChange={e => setFormData({...formData, camera: e.target.value})}/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">{t.aperture}</label>
                <input type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" value={formData.aperture} onChange={e => setFormData({...formData, aperture: e.target.value})}/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">{t.shutter_speed}</label>
                <input type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" value={formData.shutterSpeed} onChange={e => setFormData({...formData, shutterSpeed: e.target.value})}/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">{t.iso}</label>
                <input type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" value={formData.iso} onChange={e => setFormData({...formData, iso: e.target.value})}/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">{t.focal_length}</label>
                <input type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" value={formData.focalLength} onChange={e => setFormData({...formData, focalLength: e.target.value})}/>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">{t.narrative}</h3>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-gray-500">{t.story_label}</label>
                <button type="button" onClick={handleAISuggest} disabled={loading} className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 disabled:opacity-50 font-bold uppercase tracking-wider">
                  {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} {t.ai_generate}
                </button>
              </div>
              <textarea rows={3} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}/>
            </div>
          </section>

          <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t mt-4">
            <button 
              type="submit" 
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {t.update_memory}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPhotoModal;
