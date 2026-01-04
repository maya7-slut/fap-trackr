
import React, { useState, useRef } from 'react';
import { 
  Camera, X, MoreVertical, Trash2, Layout, Upload, Sparkles, Globe, Calendar, Heart, Save, Flame, Box, Loader2, RefreshCw, Eraser
} from 'lucide-react';
import { Star, GalleryItem } from '../../types';
import { AIGenerator } from '../components/AIGenerator';
import { generateBio } from '../../services/geminiService';
import { useToast } from '../context/ToastContext';
import { StreakModal } from '../components/StreakModal';
import { generateCutout } from '../../services/imageProcessing';

interface StarFormProps {
  initialData?: Star | null;
  mode: 'add' | 'update';
  apiKey: string;
  onClose: () => void;
  onSave: (data: Partial<Star>) => void;
  onDelete: (id: string) => void;
  onRequestKey: () => void;
}

// Helper to create valid gallery items
const createGalleryItem = (url: string): GalleryItem => ({
    id: Math.random().toString(36).substring(2, 9),
    url,
    cutout: null,
    dateAdded: new Date().toISOString()
});

export const StarForm: React.FC<StarFormProps> = ({ 
  initialData, mode, apiKey, onClose, onSave, onDelete, onRequestKey 
}) => {
  // Initialize with gallery structure
  const [formData, setFormData] = useState<Partial<Star>>(initialData || { gallery: [], tags: [] });
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  
  // 3D Generation States
  const [processing3D, setProcessing3D] = useState(false);
  const [progress3D, setProgress3D] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  // 3D Tilt State for Workbench
  const previewRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const { showToast } = useToast();

  // Derived state from Gallery
  const gallery = formData.gallery || [];
  const currentItem = gallery[activeGalleryIndex];
  const mainImg = currentItem?.url;
  const currentCutout = currentItem?.cutout;
  
  const streak = formData.streak || 0;
  const imageCount = gallery.length;
  const MAX_IMAGES = 10;

  // --- Tilt Logic ---
  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    let clientX, clientY;
    if ('touches' in e) {
       clientX = e.touches[0].clientX;
       clientY = e.touches[0].clientY;
    } else {
       clientX = (e as React.MouseEvent).clientX;
       clientY = (e as React.MouseEvent).clientY;
    }

    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    
    // Calculate rotation (Max 20 deg)
    const xPct = mouseX / width - 0.5; 
    const yPct = mouseY / height - 0.5;
    const x = yPct * -20; 
    const y = xPct * 20;
    
    setRotation({ x, y });
  };

  const handleEnter = () => setIsHovering(true);
  
  const handleLeave = () => {
    setIsHovering(false);
    setRotation({ x: 0, y: 0 });
  };

  // --- Image Processing Helper ---
  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_DIM = 1200;
          if (width > height) {
            if (width > MAX_DIM) {
              height *= MAX_DIM / width;
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width *= MAX_DIM / height;
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Canvas context failed"));
            return;
          }
          
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; 
    if (!file) return;

    if (imageCount >= MAX_IMAGES) {
       showToast(`Limit reached. Maximum ${MAX_IMAGES} images per star.`, 'error');
       return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      showToast("Image too large. Max limit is 5MB.", 'error');
      return;
    }

    if (!file.type.startsWith('image/')) {
      showToast("Invalid file type.", 'error');
      return;
    }

    try {
      showToast("Processing high-res image...", 'info');
      const optimizedImage = await processImage(file);
      
      const newItem = createGalleryItem(optimizedImage);

      setFormData(prev => ({
        ...prev, 
        gallery: [...(prev.gallery || []), newItem]
      }));

      // Switch to new image
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
      // @ts-ignore
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
    setFormData(prev => {
        const newLogs = prev.logs?.filter(l => l.id !== logId) || [];
        const newXp = Math.max(0, (prev.xp || 0) - amount);
        return { ...prev, logs: newLogs, xp: newXp };
    });
    showToast("Log removed. Save to persist.", 'info');
  };

  const handleDeleteActiveImage = (e: React.MouseEvent) => {
     if (e) { e.stopPropagation(); e.preventDefault(); }
     
     if (imageCount === 0) return;

     if (confirm('Delete this image and its 3D data?')) {
        const newGallery = gallery.filter((_, i) => i !== activeGalleryIndex);
        setFormData(p => ({ ...p, gallery: newGallery }));
        setActiveGalleryIndex(0); 
        showToast("Image deleted.", 'info');
     }
  };

  const handleSetCover = (e: React.MouseEvent) => {
     if (e) { e.stopPropagation(); e.preventDefault(); }
     if (imageCount < 2) return;
     
     // Move current index to 0
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
        gallery: [newItem, ...(prev.gallery || [])] // Prepend AI images as new cover usually
      }));
      setActiveGalleryIndex(0);
  };

  const handleDeleteStar = (e?: React.MouseEvent) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    const idToDelete = formData.id;
    if (!idToDelete) return;
    onDelete(idToDelete);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black animate-in slide-in-from-bottom duration-500">
      <style>
        {`
          @keyframes float-hologram {
            0%, 100% { transform: scale(1.0) translateY(-2%) translateZ(40px); }
            50% { transform: scale(1.0) translateY(-5%) translateZ(40px); }
          }
        `}
      </style>
      
      {/* Background */}
      {mainImg ? (
         <div className="fixed inset-0 z-0">
           <img 
             src={mainImg} 
             className="w-full h-full object-cover object-center opacity-60" 
             alt="Background" 
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" /> 
           <div className="absolute inset-0 backdrop-blur-[20px]" />
         </div>
      ) : (
         <div className="fixed inset-0 z-0 bg-gradient-to-b from-stone-900 to-black flex items-center justify-center">
           <div className="text-center opacity-50">
             <Camera className="mx-auto h-20 w-20 text-stone-600 mb-4" />
             <p className="font-serif text-stone-500">No Essence Captured</p>
           </div>
         </div>
      )}

      {/* Navigation */}
      <div className="fixed top-0 left-0 w-full p-4 flex justify-between items-center z-50 pointer-events-none">
         <button onClick={onClose} className="pointer-events-auto w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white backdrop-blur-md shadow-lg"><X size={20}/></button>
         
         <div className="flex items-center gap-3 pointer-events-auto">
           {mode === 'update' && (
             <div className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10 bg-black/40 backdrop-blur-md">
                <Flame size={12} className="text-rose-500" fill="currentColor" />
                <span className="text-xs font-bold text-rose-100">{formData.xp || 0} XP</span>
             </div>
           )}
           {mode === 'update' && (
             <div className="relative">
                <button onClick={() => setShowDropdown(!showDropdown)} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-stone-200 hover:bg-white/10 backdrop-blur-md">
                  <MoreVertical size={20}/>
                </button>
                {showDropdown && (
                  <div className="absolute right-0 top-12 w-48 glass-card rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 z-[60] border border-white/10 pointer-events-auto">
                    <button 
                      type="button"
                      onClick={(e) => handleDeleteStar(e)}
                      className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                    >
                      <Trash2 size={14} /> Delete Star
                    </button>
                  </div>
                )}
             </div>
           )}
         </div>
      </div>

      {/* Content */}
      <div className="absolute inset-0 z-10 overflow-y-auto no-scrollbar">
         
         {/* HOLOGRAPHIC WORKBENCH PREVIEW AREA */}
         <div className="w-full h-[55vh] relative flex items-center justify-center p-6" style={{ perspective: '1000px' }}>
            {mainImg && (
              <div 
                 ref={previewRef}
                 className="relative w-full h-full max-w-lg transition-transform duration-100 ease-out"
                 style={{ 
                    transformStyle: 'preserve-3d',
                    transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
                 }}
                 onMouseMove={handleMove}
                 onMouseEnter={handleEnter}
                 onMouseLeave={handleLeave}
                 onTouchStart={handleEnter}
                 onTouchMove={handleMove}
                 onTouchEnd={handleLeave}
              >
                {/* Layer 1: Base Card */}
                <div 
                   className="absolute inset-0 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-3xl overflow-hidden border border-white/10 bg-black/20"
                   style={{ transform: 'translateZ(0)' }}
                >
                  <img 
                    src={mainImg} 
                    className={`w-full h-full object-contain transition-opacity duration-300 ${currentCutout ? 'opacity-80 blur-[2px]' : 'opacity-100'}`} 
                    alt="Main Preview" 
                  />
                  
                  {/* Glare */}
                  <div 
                    className="absolute inset-0 pointer-events-none mix-blend-overlay transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(${115 + rotation.y * 2}deg, transparent 20%, rgba(255,255,255,0.2) 50%, transparent 80%)`,
                      opacity: isHovering ? 1 : 0
                    }}
                  />
                </div>
                
                {/* Layer 2: 3D Cutout */}
                {currentCutout && (
                   <div 
                     className="absolute inset-0 pointer-events-none z-10"
                     style={{ transform: 'translateZ(50px)' }}
                   >
                     <img 
                        src={currentCutout} 
                        className="w-full h-full object-contain"
                        style={{ 
                          filter: isHovering ? 'drop-shadow(0 15px 30px rgba(0,0,0,0.7)) brightness(1.1)' : 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))',
                          animation: 'float-hologram 6s ease-in-out infinite'
                        }}
                        alt="3D Cutout"
                     />
                   </div>
                )}

                {/* Layer 3: Loading */}
                {processing3D && (
                   <div 
                     className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-20 p-6 text-center rounded-3xl"
                     style={{ transform: 'translateZ(60px)' }}
                   >
                      <div className="relative mb-4">
                        <Loader2 className="animate-spin text-rose-500" size={40} />
                        <div className="absolute inset-0 animate-pulse bg-rose-500/20 blur-xl rounded-full"></div>
                      </div>
                      <p className="text-white text-xs font-bold uppercase tracking-widest mb-1">Engaging Neural Net</p>
                      <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                         <div className="h-full bg-gradient-to-r from-rose-600 to-purple-600 transition-all duration-300" style={{ width: `${progress3D}%` }} />
                      </div>
                      <p className="text-rose-200/80 text-[10px] font-mono animate-pulse">{statusMessage}</p>
                   </div>
                )}
              </div>
            )}

            {/* Controls */}
            <div className="absolute bottom-6 right-6 flex gap-2 z-[60]">
               
               {currentCutout && !processing3D && (
                  <button 
                    type="button"
                    onClick={handleRemoveCutout}
                    className="p-3 rounded-full backdrop-blur-md transition-all shadow-lg border border-white/10 bg-black/40 text-stone-400 hover:text-white hover:bg-red-500/20"
                    title="Remove Hologram"
                  >
                    <Eraser size={18} />
                  </button>
               )}

               {mainImg && (
                  <button
                    type="button"
                    onClick={handleGenerate3D}
                    disabled={processing3D}
                    className={`p-3 rounded-full backdrop-blur-md transition-all shadow-lg border border-white/10 ${
                        currentCutout 
                        ? 'bg-white/10 text-stone-400 hover:bg-white/20 hover:text-white'
                        : 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)] hover:bg-purple-500'
                    }`}
                    title={currentCutout ? "Regenerate 3D" : "Generate 3D"}
                  >
                     {processing3D ? <Loader2 size={20} className="animate-spin" /> : currentCutout ? <RefreshCw size={18} /> : <Box size={20} />}
                  </button>
               )}

               <button 
                 type="button"
                 onClick={handleDeleteActiveImage} 
                 className="p-3 bg-black/60 text-rose-400 rounded-full hover:bg-rose-900/80 backdrop-blur-md transition-all shadow-lg border border-white/10" 
                 title="Delete Image"
               >
                 <Trash2 size={20} className="pointer-events-none" />
               </button>
               
               {activeGalleryIndex > 0 && (
                  <button 
                    type="button"
                    onClick={handleSetCover} 
                    className="p-3 bg-black/60 text-white rounded-full hover:bg-white/20 backdrop-blur-md transition-all shadow-lg border border-white/10" 
                    title="Make Cover"
                  >
                     <Layout size={20} className="pointer-events-none" />
                  </button>
               )}

               <label className={`p-3 rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform backdrop-blur-sm border border-white/10 ${imageCount >= MAX_IMAGES ? 'bg-stone-700 opacity-50 cursor-not-allowed' : 'bg-rose-600/90'}`}>
                  <Upload size={20} className="text-white pointer-events-none"/>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={imageCount >= MAX_IMAGES} />
               </label>
            </div>
         </div>

         {/* Form Body */}
         <div className="min-h-[60vh] bg-black/60 backdrop-blur-xl border-t border-white/10 rounded-t-[2.5rem] p-6 pb-32 shadow-[0_-10px_60px_rgba(0,0,0,0.7)]">
           <div className="flex justify-between items-center -mt-10 mb-4 px-2">
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-widest">
                 Gallery ({imageCount}/{MAX_IMAGES})
              </span>
           </div>
           
           {gallery.length > 0 && (
             <div className="mb-6 flex gap-3 overflow-x-auto no-scrollbar py-2 px-2">
                {gallery.map((item, i) => (
                  <button key={item.id} onClick={() => setActiveGalleryIndex(i)} className={`w-14 h-14 rounded-xl border-2 flex-shrink-0 overflow-hidden transition-all shadow-lg relative ${i === activeGalleryIndex ? 'border-rose-500 scale-110 z-10' : 'border-white/20 grayscale'} ${i===0 ? 'relative' : ''}`}>
                    <img src={item.url} className="w-full h-full object-cover" />
                    {i === 0 && <div className="absolute bottom-0 left-0 w-full bg-rose-600 text-[8px] text-white text-center font-bold">COVER</div>}
                    {item.cutout && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-purple-500 ring-1 ring-black" />}
                  </button>
                ))}
             </div>
           )}

           <div className="space-y-8 mt-2">
             <div className="space-y-4">
                <div className="relative">
                  <input 
                    value={formData.name || ''}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Star Name"
                    className="w-full bg-transparent text-3xl font-serif text-white placeholder-stone-400 outline-none border-b border-white/20 focus:border-rose-500 pb-2 transition-colors pr-10"
                  />
                  {formData.name && (
                    <button 
                      type="button"
                      onClick={handleAutoBio} 
                      className="absolute right-0 top-1 p-2 bg-purple-600/20 rounded-full text-purple-400 hover:bg-purple-600 hover:text-white transition-all"
                      title="Auto Fill Details"
                    >
                      <Sparkles size={16}/>
                    </button>
                  )}
                </div>
                <input 
                  value={formData.nickname || ''}
                  onChange={e => setFormData({...formData, nickname: e.target.value})}
                  placeholder="Do you desire her with any nickname? 😉"
                  className="w-full bg-transparent text-sm text-rose-300 placeholder-stone-400 outline-none font-medium tracking-wide"
                />
             </div>

             {/* Streak */}
             {mode === 'update' && (
                <div className="flex justify-start">
                   <button 
                     onClick={() => setShowStreakModal(true)}
                     className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-900/40 to-rose-900/40 border border-orange-500/30 px-5 py-3 flex items-center gap-3 hover:border-orange-500/60 transition-all shadow-[0_0_15px_rgba(234,88,12,0.1)] hover:shadow-[0_0_25px_rgba(234,88,12,0.2)]"
                   >
                      <div className="bg-orange-500/20 p-2 rounded-full group-hover:scale-110 transition-transform duration-500">
                        <Flame size={16} className="text-orange-500" fill="currentColor" />
                      </div>
                      <div className="text-left">
                         <p className="text-[10px] uppercase font-bold text-orange-300 tracking-wider">Streak</p>
                         <p className="text-xl font-serif text-white leading-none">{streak} <span className="text-xs font-sans text-white/50">Days</span></p>
                      </div>
                   </button>
                </div>
             )}

             <div className="grid grid-cols-2 gap-4">
               <div className="glass-panel p-3 rounded-2xl flex items-center gap-3 bg-white/5">
                 <Globe className="text-stone-400" size={18} />
                 <div>
                   <p className="text-[9px] uppercase text-stone-400 font-bold">Origin</p>
                   <input value={formData.nationality || ''} onChange={e => setFormData({...formData, nationality: e.target.value})} placeholder="Unknown" className="bg-transparent text-sm text-stone-200 w-full outline-none placeholder:text-stone-500"/>
                 </div>
               </div>
               <div className="glass-panel p-3 rounded-2xl flex items-center gap-3 bg-white/5">
                 <Calendar className="text-stone-400" size={18} />
                 <div>
                   <p className="text-[9px] uppercase text-stone-400 font-bold">Born</p>
                   <input value={formData.dob || ''} onChange={e => setFormData({...formData, dob: e.target.value})} placeholder="Unknown" className="bg-transparent text-sm text-stone-200 w-full outline-none placeholder:text-stone-500"/>
                 </div>
               </div>
             </div>

             <div>
               <div className="flex justify-between items-center mb-2">
                 <h3 className="font-serif text-stone-300 text-sm">Fantasies & Notes</h3>
               </div>
               <textarea 
                 value={formData.bio || ''}
                 onChange={e => setFormData({...formData, bio: e.target.value})}
                 className="w-full bg-white/5 rounded-2xl p-4 text-stone-200 text-sm leading-relaxed outline-none border border-transparent focus:border-white/10 min-h-[120px] placeholder:text-stone-500"
                 placeholder="Capture her essence..."
               />
               <div className="mt-4">
                  <AIGenerator 
                    apiKey={apiKey} 
                    description={formData.bio} 
                    onImageGenerated={handleAIImageGenerated} 
                    onRequestKey={onRequestKey} 
                  />
               </div>
             </div>

             {mode === 'update' && formData.logs && formData.logs.length > 0 && (
                <div className="pt-4 border-t border-white/10">
                   <h3 className="font-serif text-stone-300 text-sm mb-4">Fap History</h3>
                   <div className="space-y-4 pl-4 border-l border-white/10 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {formData.logs.map(log => (
                        <div key={log.id} className="relative pl-4 group">
                           <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-rose-600 ring-4 ring-black/80" />
                           <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <span className="text-xs text-rose-400 font-bold mr-2">+{log.amount} XP</span>
                                <span className="text-[10px] text-stone-400">{new Date(log.date).toLocaleDateString()}</span>
                                {log.note && <p className="text-xs text-stone-400 mt-1 italic">"{log.note}"</p>}
                              </div>
                              <button 
                                type="button"
                                onClick={(e) => handleDeleteLog(e, log.id, log.amount)}
                                className="opacity-60 hover:opacity-100 p-2 text-stone-600 hover:text-red-400 transition-all"
                                title="Delete Log"
                              >
                                <Trash2 size={14} />
                              </button>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             )}
             <div className="h-16" />
           </div>
         </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full p-4 z-50 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none">
         <button 
           onClick={() => onSave(formData)}
           className="pointer-events-auto w-full py-4 bg-white text-black font-bold rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
         >
           {mode === 'add' ? <Heart size={18} fill="black" /> : <Save size={18} />}
           {mode === 'add' ? '❤️ Add to your world 😈' : 'Save Changes'}
         </button>
      </div>

      {/* Streak Modal */}
      <StreakModal 
        isOpen={showStreakModal} 
        onClose={() => setShowStreakModal(false)} 
        streak={streak} 
        name={formData.name} 
      />
    </div>
  );
};
