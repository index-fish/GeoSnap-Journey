
import React, { useState, useRef, useEffect } from 'react';
import { X, MapPin, Loader2, Sparkles, Camera, Sliders, Upload, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { PhotoEntry, GeoLocation } from '../types';
import { generatePhotoCaption } from '../services/geminiService';
import { reverseGeocode } from '../services/geocodingService';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
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
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [extractStatus, setExtractStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    locationName: '',
    lat: 0,
    lng: 0,
    country: '',
    region: '',
    tags: '',
    camera: '',
    aperture: '',
    shutterSpeed: '',
    iso: '',
    focalLength: ''
  });

  const handleReverseGeocode = async (lat: number, lng: number) => {
    if (lat === 0 && lng === 0) return;
    setIsGeocoding(true);
    const result = await reverseGeocode(lat, lng, language);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsExtracting(true);
    setExtractStatus('idle');

    // Preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
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

        const newLat = output.latitude || 0;
        const newLng = output.longitude || 0;

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
          lat: newLat,
          lng: newLng
        }));
        setExtractStatus('success');

        if (newLat && newLng) {
          handleReverseGeocode(newLat, newLng);
        }
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

  const handleAISuggest = async () => {
    if (!formData.locationName) return;
    setLoading(true);
    const caption = await generatePhotoCaption(formData.locationName, formData.description);
    setFormData(prev => ({ ...prev, description: caption }));
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !user) return;

    setLoading(true);
    try {
      // 1. Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName);

      // 3. Save to Database
      const photoPayload = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        url: publicUrl,
        lat: formData.lat,
        lng: formData.lng,
        location_name: formData.locationName,
        country: formData.country,
        region: formData.region,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t !== ''),
        camera: formData.camera,
        aperture: formData.aperture,
        shutter_speed: formData.shutterSpeed,
        iso: formData.iso,
        focal_length: formData.focalLength,
        user_id: user.id,
        user_name: user.name
      };

      const { data: dbData, error: dbError } = await supabase
        .from('photos')
        .insert([photoPayload])
        .select();

      if (dbError) throw dbError;

      const newPhoto: PhotoEntry = {
        id: dbData[0].id,
        ...photoPayload,
        location: {
          lat: formData.lat,
          lng: formData.lng,
          name: formData.locationName,
          country: formData.country,
          region: formData.region
        },
        parameters: {
          camera: formData.camera,
          aperture: formData.aperture,
          shutterSpeed: formData.shutterSpeed,
          iso: formData.iso,
          focalLength: formData.focalLength
        }
      };

      onAdd(newPhoto);
    } catch (err) {
      console.error('Submission failed:', err);
      alert('Failed to save photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            <Camera className="text-blue-600" size={24} />
            {t.add_modal_title}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Photo Upload</h3>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl aspect-video flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${previewUrl ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'}`}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center space-y-2 p-4">
                  <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border text-blue-600">
                    <Upload size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-700">Choose a photo</p>
                    <p className="text-xs text-gray-500 mt-1">Cloud sync enabled</p>
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
              
              {(isExtracting || loading) && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="text-blue-600 animate-spin" size={32} />
                    <p className="text-xs font-bold text-blue-700">{loading ? 'Uploading to Cloud...' : 'Extracting EXIF...'}</p>
                  </div>
                </div>
              )}
            </div>

            {extractStatus === 'success' && (
              <div className="flex items-center gap-2 text-[10px] font-bold text-green-600 bg-green-50 p-2 rounded-lg border border-green-100 animate-in fade-in slide-in-from-top-1">
                <CheckCircle2 size={14} />
                Metadata sync successful!
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
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
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
              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 mb-1">{t.location_name}</label>
                <div className="relative">
                  <input 
                    required 
                    type="text" 
                    className="w-full pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                    placeholder={t.location_placeholder} 
                    value={formData.locationName} 
                    onChange={e => setFormData({...formData, locationName: e.target.value})}
                  />
                  {isGeocoding ? (
                    <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
                  ) : formData.lat !== 0 && (
                    <button 
                      type="button" 
                      onClick={() => handleReverseGeocode(formData.lat, formData.lng)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Update location name from GPS"
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}
                </div>
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
              disabled={!previewUrl || loading}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="animate-spin" size={18} />}
              {t.save_memory}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPhotoModal;
