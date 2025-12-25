
import React, { useState } from 'react';
import { PhotoEntry } from '../types';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
// Fix: Added missing Loader2 import from lucide-react
import { Search, Edit2, Trash2, MapPin, Calendar, Camera, User, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface ManageMemoriesViewProps {
  photos: PhotoEntry[];
  onEdit: (photo: PhotoEntry) => void;
  onDelete: (id: string) => void;
}

const ManageMemoriesView: React.FC<ManageMemoriesViewProps> = ({ photos, onEdit, onDelete }) => {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = photos.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.location.name.toLowerCase().includes(search.toLowerCase()) ||
    p.user_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (photoId: string) => {
    if (!window.confirm(t.confirm_delete)) return;
    
    setLoadingId(photoId);
    try {
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);
      
      if (error) throw error;
      onDelete(photoId);
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete photo.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-white overflow-hidden">
      {/* View Header */}
      <div className="p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">{t.manage_memories}</h2>
          <p className="text-sm text-gray-500">{photos.length} {t.captures}</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder={t.search_placeholder}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-2">
            <Camera size={48} strokeWidth={1} />
            <p>{t.no_memories}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map(photo => (
              <div 
                key={photo.id}
                className="group bg-white border rounded-2xl p-3 flex items-center gap-4 hover:border-blue-200 hover:shadow-sm transition-all"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative">
                  <img src={photo.url} className="w-full h-full object-cover" alt={photo.title} />
                  {loadingId === photo.id && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <Loader2 className="animate-spin text-blue-500" size={20} />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900 truncate">{photo.title}</h4>
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-black uppercase flex items-center gap-1">
                      <User size={8} /> {photo.user_name}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin size={12} /> {photo.location.name}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar size={12} /> {new Date(photo.date).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {user?.id === photo.user_id ? (
                    <>
                      <button 
                        onClick={() => onEdit(photo)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        title={t.edit_action}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(photo.id)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        title={t.delete_memory}
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest px-3">View Only</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageMemoriesView;
