
import React, { useState, useRef } from 'react';
import { X, MapPin, Loader2, Sparkles, Camera, Sliders, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { PhotoEntry, GeoLocation } from '../types';
import { generatePhotoCaption } from '../services/geminiService';
import { useTranslation } from '../context/LanguageContext';
import exifr from 'exifr';

interface AddPhotoModalProps {
  onClose: () => void;
  onAdd: (photo: PhotoEntry) => void;
}

const formatShutterSpeed = (exposureTime: number | undefined): string => {
  if (!exposureTime) return '';
  if (exposureTime >= 1) return `${Math.round(exposureTime * 10) / 10}s`;
  const denominator = Math.round(1 / exposureTime);
  return `1/${denominator}s`;
};

const AddPhotoModal: React.FC<AddPhotoModalProps> = ({ onClose, onAdd }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractStatus, setExtractStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    url: '',
    locationName: '',
    lat: 0,
    lng: 0,
    tags: '',
    camera: '',
    aperture: '',
    shutterSpeed: '',
    iso: '',
    focalLength: ''
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setExtractStatus('idle');

    // Preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({ ...prev, url: event.target?.result as string }));
    };
    reader.readAsDataURL(file);

    try {
      // Extract Metadata
      const output = await exifr.parse(file, {
        pick: ['Make', 'Model', 'FNumber', 'ExposureTime', 'ISO', 'FocalLength', 'DateTimeOriginal', 'latitude', 'longitude'],
        reviveValues: true
      });

      if (output) {
        const camera = (output.Make && output.Model) 
          ? `${output.Make} ${output.Model}` 
          : (output.Model || output.Make || '');

        setFormData(prev => ({
          ...prev,
          camera: camera,
          aperture: output.FNumber ? `f/${output.FNumber}` : prev.aperture,
          shutterSpeed: output.ExposureTime ? formatShutterSpeed(output.ExposureTime) : prev.shutterSpeed,
          iso: output.ISO ? String(output.ISO) : prev.iso,
          focalLength: output.FocalLength ? `${output.FocalLength}mm` : prev.focalLength,
          date: output.DateTimeOriginal 
            ? new Date(output.DateTimeOriginal).toISOString().split('T')[0] 
            : prev.date,
          lat: output.latitude || prev.lat,
          lng: output.longitude || prev.lng
        }));
        setExtractStatus('success');
      } else {
        setExtractStatus('error');
      }
    } catch (err) {
      console.error('Metadata extraction failed', err);
      setExtractStatus('error');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData(prev => ({
          ...prev,
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }));
      });
    }
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
    if (!formData.url) return;

    const newPhoto: PhotoEntry = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      date: formData.date,
      url: formData.url,
      location: {
        lat: formData.lat,
        lng: formData.lng,
        name: formData.locationName
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
    onAdd(newPhoto);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Camera className="text-blue-600" size={24} />
            {t.add_modal_title}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
          {/* File Upload Area */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Photo Upload</h3>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl aspect-video flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${formData.url ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'}`}
            >
              {formData.url ? (
                <img src={formData.url} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center space-y-2 p-4">
                  <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border text-blue-600">
                    <Upload size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-700">Choose a photo</p>
                    <p className="text-xs text-gray-500 mt-1">Metadata will be extracted automatically</p>
                  </div>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
              />
              
              {isExtracting && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="text-blue-600 animate-spin" size={32} />
                    <p className="text-xs font-bold text-blue-700">Extracting EXIF...</p>
                  </div>
                </div>
              )}
            </div>

            {extractStatus === 'success' && (
              <div className="flex items-center gap-2 text-[10px] font-bold text-green-600 bg-green-50 p-2 rounded-lg border border-green-100 animate-in fade-in slide-in-from-top-1">
                <CheckCircle2 size={14} />
                Shooting parameters read successfully from image!
              </div>
            )}
            {extractStatus === 'error' && (
              <div className="flex items-center gap-2 text-[10px] font-bold text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100">
                <AlertCircle size={14} />
                No camera metadata found in this image.
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">{t.basic_info}</h3>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">{t.memory_title}</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder={t.title_placeholder}
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
                <input required type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" placeholder={t.location_placeholder} value={formData.locationName} onChange={e => setFormData({...formData, locationName: e.target.value})}/>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
              <Sliders size={14} /> {t.shooting_params}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 mb-1">{t.camera_body}</label>
                <input type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" placeholder={t.camera_placeholder} value={formData.camera} onChange={e => setFormData({...formData, camera: e.target.value})}/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">{t.aperture}</label>
                <input type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" placeholder="e.g., f/2.8" value={formData.aperture} onChange={e => setFormData({...formData, aperture: e.target.value})}/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">{t.shutter_speed}</label>
                <input type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" placeholder="e.g., 1/1000s" value={formData.shutterSpeed} onChange={e => setFormData({...formData, shutterSpeed: e.target.value})}/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">{t.iso}</label>
                <input type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" placeholder="e.g., 100" value={formData.iso} onChange={e => setFormData({...formData, iso: e.target.value})}/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">{t.focal_length}</label>
                <input type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" placeholder="e.g., 35mm" value={formData.focalLength} onChange={e => setFormData({...formData, focalLength: e.target.value})}/>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">{t.narrative}</h3>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-gray-500">{t.story_label}</label>
                <button type="button" onClick={handleAISuggest} disabled={loading || !formData.locationName} className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 disabled:opacity-50 font-bold uppercase tracking-wider">
                  {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} {t.ai_generate}
                </button>
              </div>
              <textarea rows={3} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none resize-none" placeholder={t.story_placeholder} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}/>
            </div>
          </section>

          <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t mt-4">
            <button 
              type="submit" 
              disabled={!formData.url}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
            >
              {t.save_memory}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPhotoModal;
