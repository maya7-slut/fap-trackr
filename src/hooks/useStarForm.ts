
import { useState } from 'react';
import { Star, GalleryItem } from '../types';
import { generateBio } from '../services/geminiService';
import { generateCutout, processUploadedImage } from '../services/imageProcessing';
import { deleteLog } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export interface UseStarFormProps {
  initialData?: Star | null;
  onSave: (data: Partial<Star>) => void;
  onDelete: (id: string) => void;
  apiKey: string;
}

const MAX_IMAGES = 10;

// Helper to create valid gallery items
const createGalleryItem = (url: string): GalleryItem => ({
    id: Math.random().toString(36).substring(2, 9),
    url,
    cutout: null,
    dateAdded: new Date().toISOString()
});

export const useStarForm = ({ initialData, onSave, onDelete, apiKey }: UseStarFormProps) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState<Partial<Star>>(initialData || { gallery: [], tags: [] });
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [deletedLogIds, setDeletedLogIds] = useState<string[]>([]);
  const [processing3D, setProcessing3D] = useState(false);
  const [progress3D, setProgress3D] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  const gallery = formData.gallery || [];
  const currentItem = gallery[activeGalleryIndex];
  const mainImg = currentItem?.url;
  const currentCutout = currentItem?.cutout;
  const imageCount = gallery.length;

  // --- Handlers ---

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; 
    if (!file) return;

    if (imageCount >= MAX_IMAGES) {
       showToast(`Limit reached. Maximum ${MAX_IMAGES} images per star.`, 'error');
       return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image too large. Max limit is 5MB.", 'error');
      return;
    }

    if (!file.type.startsWith('image/')) {
      showToast("Invalid file type.", 'error');
      return;
    }

    try {
      showToast("Processing high-res image...", 'info');
      const optimizedImage = await processUploadedImage(file);
      const newItem = createGalleryItem(optimizedImage);

      setFormData(prev => ({ ...prev, gallery: [...(prev.gallery || []), newItem] }));
      setActiveGalleryIndex(imageCount);
      showToast("Image added to gallery.", 'success');
    } catch (error) {
      console.error(error);
      showToast("Failed to process image.", 'error');
    }
  };

  const handleGenerate3D = async () => {
    if (!mainImg) return;
    
    if (currentCutout && !confirm("Regenerate 3D Cutout? This will replace the current hologram.")) {
        return;
    }

    setProcessing3D(true);
    setProgress3D(0);
    setStatusMessage('Initializing Neural Net...');

    try {
      const cutout = await generateCutout(mainImg, (msg, p) => {
        setStatusMessage(msg);
        setProgress3D(p);
      });
      
      setFormData(prev => {
         const newGallery = [...(prev.gallery || [])];
         if (newGallery[activeGalleryIndex]) {
            newGallery[activeGalleryIndex] = { ...newGallery[activeGalleryIndex], cutout };
         }
         return { ...prev, gallery: newGallery };
      });

      showToast("3D Hologram Generated!", 'success');
    } catch (error: any) {
      showToast(error.message || "Failed to generate 3D effect.", 'error');
    } finally {
      setProcessing3D(false);
    }
  };

  const handleRemoveCutout = () => {
    if (confirm("Remove the 3D Hologram effect?")) {
       setFormData(prev => {
         const newGallery = [...(prev.gallery || [])];
         if (newGallery[activeGalleryIndex]) {
            newGallery[activeGalleryIndex] = { ...newGallery[activeGalleryIndex], cutout: null };
         }
         return { ...prev, gallery: newGallery };
       });
       showToast("Hologram removed.", 'info');
    }
  };

  const handleAutoBio = async () => {
    if (!formData.name) return;
    try {
      const data = await generateBio(apiKey, formData.name, formData.nickname || '', formData.tags || [], gallery[0]?.url);
      setFormData(prev => ({ 
        ...prev, 
        bio: data.bio,
        nationality: data.nationality,
        dob: data.dob
      }));
      showToast("Identity divined.", 'success');
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const handleDeleteLog = (e: React.MouseEvent, logId: string, amount: number) => {
    e.stopPropagation();
    e.preventDefault();
    setDeletedLogIds(prev => [...prev, logId]);
    setFormData(prev => {
        const newLogs = prev.logs?.filter(l => l.id !== logId) || [];
        const newXp = Math.max(0, (prev.xp || 0) - amount);
        return { ...prev, logs: newLogs, xp: newXp };
    });
    showToast("Log removed. Save to persist.", 'info');
  };

  const handleDeleteActiveImage = (e?: React.MouseEvent) => {
     if (e) { e.stopPropagation(); e.preventDefault(); }
     if (imageCount === 0) return;

     if (confirm('Delete this image and its 3D data?')) {
        const newGallery = gallery.filter((_, i) => i !== activeGalleryIndex);
        setFormData(p => ({ ...p, gallery: newGallery }));
        setActiveGalleryIndex(0); 
        showToast("Image deleted.", 'info');
     }
  };

  const handleSetCover = (e?: React.MouseEvent) => {
     if (e) { e.stopPropagation(); e.preventDefault(); }
     if (imageCount < 2) return;
     
     const item = gallery[activeGalleryIndex];
     const others = gallery.filter((_, i) => i !== activeGalleryIndex);
     
     setFormData(p => ({ ...p, gallery: [item, ...others] }));
     setActiveGalleryIndex(0);
     showToast("Cover changed.", 'info');
  };

  const handleAIImageGenerated = (url: string) => {
      const newItem = createGalleryItem(url);
      setFormData(prev => ({
        ...prev, 
        gallery: [newItem, ...(prev.gallery || [])] 
      }));
      setActiveGalleryIndex(0);
  };

  const handleDeleteStar = (e?: React.MouseEvent) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    if (formData.id) onDelete(formData.id);
  };

  const handleSaveChanges = async () => {
      if (deletedLogIds.length > 0) {
          for (const logId of deletedLogIds) {
              await deleteLog(logId, user?.id);
          }
      }
      onSave(formData);
  };

  return {
    formData,
    setFormData,
    activeGalleryIndex,
    setActiveGalleryIndex,
    processing3D,
    progress3D,
    statusMessage,
    currentItem,
    mainImg,
    currentCutout,
    imageCount,
    MAX_IMAGES,
    handlers: {
      handleFileChange,
      handleGenerate3D,
      handleRemoveCutout,
      handleAutoBio,
      handleDeleteLog,
      handleDeleteActiveImage,
      handleSetCover,
      handleAIImageGenerated,
      handleDeleteStar,
      handleSaveChanges
    }
  };
};
