import React, { useState } from 'react';
import { 
  Camera, X, MoreVertical, Trash2, Layout, Upload, Sparkles, Globe, Calendar, Heart, Save, Flame, Box, Loader2
} from 'lucide-react';
import { Star } from '../../types';
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

export const StarForm: React.FC<StarFormProps> = ({ 
  initialData, mode, apiKey, onClose, onSave, onDelete, onRequestKey 
}) => {
  const [formData, setFormData] = useState<Partial<Star>>(initialData || { images: [], tags: [] });
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  
  // 3D Generation States
  const [processing3D, setProcessing3D] = useState(false);
  const [progress3D, setProgress3D] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  const { showToast } = useToast();

  const mainImg = formData.images?.[activeImageIndex];
  const streak = formData.streak || 0;
  const imageCount = formData.images?.length || 0;
  const MAX_IMAGES = 10;

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
          
          // Max dimension 1200px to preserve LocalStorage space while keeping high quality
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
          
          // Smooth scaling
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG 0.85
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

    if ((formData.images?.length || 0) >= MAX_IMAGES) {
       showToast(`Limit reached. Maximum ${MAX_IMAGES} images per star.`, 'error');
       return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      showToast("Image too large. Max limit is 5MB.", 'error');
      return;
    }

    if (!file.type.startsWith('image/')) {
      showToast("Invalid file type. Please upload an image.", 'error');
      return;
    }

    try {
      showToast("Processing high-res image...", 'info');
      const optimizedImage = await processImage(file);
      
      setFormData(prev => ({
        ...prev, 
        images: [optimizedImage, ...(prev.images || [])],
        // Reset cutout when new main image is added (unless we support multiple cutouts later)
        imageCutout: undefined 
      }));
      setActiveImageIndex(0);
      showToast("Image added successfully.", 'success');
    } catch (error) {
      console.error(error);
      showToast("Failed to process image.", 'error');
    }
  };

  const handleGenerate3D = async () => {
    if (!mainImg) return;
    setProcessing3D(true);
    setProgress3D(0);
    setStatusMessage('Initializing Neural Net...');

    try {
      const cutout = await generateCutout(mainImg, (msg, p) => {
        setStatusMessage(msg);
        setProgress3D(p);
      });
      setFormData(prev => ({ ...prev, imageCutout: cutout }));
      showToast("3D Hologram Generated!", 'success');
    } catch (error: any) {
      showToast(error.message || "Failed to generate 3D effect.", 'error');
    } finally {
      setProcessing3D(false);
    }
  };

  const handleAutoBio = async () => {
    if (!formData.name) return;
    try {
      // @ts-ignore
      const data = await generateBio(apiKey, formData.name, formData.nickname || '', formData.tags || [], formData.images?.[0]);
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
     
     if (!formData.images || formData.images.length === 0) {
         showToast("No images to delete.", 'error');
         return;
     }

     if (confirm('Delete this image?')) {
        const newImages = formData.images.filter((_, i) => i !== activeImageIndex);
        setFormData(p => ({
            ...p, 
            images: newImages,
            // If we deleted the main image, remove the cutout too as it won't match
            imageCutout: activeImageIndex === 0 ? undefined : p.imageCutout 
        }));
        setActiveImageIndex(0); 
        showToast("Discarded. Click SAVE below to apply.", 'info');
     }
  };

  const handleSetCover = (e: React.MouseEvent) => {
     if (e) { e.stopPropagation(); e.preventDefault(); }
     if (!formData.images || formData.images.length < 2) return;
     const img = formData.images[activeImageIndex];
     const others = formData.images.filter((_, i) => i !== activeImageIndex);
     setFormData(p => ({
         ...p, 
         images: [img, ...others],
         imageCutout: undefined // Reset cutout because cover changed
     }));
     setActiveImageIndex(0);
     showToast("Cover changed. Re-generate 3D if needed.", 'info');
  };

  const handleDeleteStar = (e?: React.MouseEvent) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    const idToDelete = formData.id;
    if (!idToDelete) {
        showToast("Error: No Star ID found.", 'error');
        return;
    }
    onDelete(idToDelete);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black animate-in slide-in-from-bottom duration-500">
      
      {/* Background with Perfect Scaling */}
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
         {/* Main Image Preview Area */}
         <div className="w-full h-[55vh] relative flex items-center justify-center p-6">
            {mainImg && (
              <div className="relative w-full h-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-3xl overflow-hidden border border-white/10 group">
                <img 
                  src={mainImg} 
                  className="w-full h-full object-contain bg-black/20" 
                  alt="Main Preview" 
                />
                
                {/* 3D Cutout Overlay Preview (if generated) */}
                {formData.imageCutout && activeImageIndex === 0 && (
                   <img 
                      src={formData.imageCutout} 
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 animate-pulse"
                      style={{ filter: 'drop-shadow(0 0 10px rgba(225,29,72,0.5))' }}
                      alt="3D Cutout"
                   />
                )}

                {/* 3D Generation Progress Overlay */}
                {processing3D && (
                   <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-20 p-6 text-center">
                      <div className="relative mb-4">
                        <Loader2 className="animate-spin text-rose-500" size={40} />
                        <div className="absolute inset-0 animate-pulse bg-rose-500/20 blur-xl rounded-full"></div>
                      </div>
                      <p className="text-white text-xs font-bold uppercase tracking-widest mb-1">Engaging Neural Net</p>
                      
                      <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                         <div className="h-full bg-gradient-to-r from-rose-600 to-purple-600 transition-all duration-300" style={{ width: `${progress3D}%` }} />
                      </div>
                      
                      <p className="text-rose-200/80 text-[10px] font-mono animate-pulse">{statusMessage}</p>
                      
                      {/* Helper text only if downloading */}
                      {statusMessage.includes('Download') && (
                        <p className="text-stone-500 text-[9px] mt-4 max-w-[200px]">
                           First run requires downloading AI models (~40MB). This happens only once.
                        </p>
                      )}
                   </div>
                )}
              </div>
            )}

            <div className="absolute bottom-6 right-6 flex gap-2 z-[60]">
               {/* 3D Generator Button */}
               {activeImageIndex === 0 && mainImg && (
                  <button
                    type="button"
                    onClick={handleGenerate3D}
                    disabled={processing3D}
                    className={`p-3 rounded-full backdrop-blur-md transition-all shadow-lg border border-white/10 ${formData.imageCutout ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]' : 'bg-black/60 text-purple-400 hover:bg-purple-900/80 hover:text-white'}`}
                    title={formData.imageCutout ? "Regenerate 3D Cutout" : "Generate 3D Cutout"}
                  >
                     <Box size={20} className={processing3D ? 'animate-pulse' : ''} />
                  </button>
               )}

               <button 
                 type="button"
                 onClick={(e) => handleDeleteActiveImage(e)} 
                 className="p-3 bg-black/60 text-rose-400 rounded-full hover:bg-rose-900/80 backdrop-blur-md transition-all shadow-lg border border-white/10" 
                 title="Delete Image"
               >
                 <Trash2 size={20} className="pointer-events-none" />
               </button>
               {activeImageIndex > 0 && (
                  <button 
                    type="button"
                    onClick={(e) => handleSetCover(e)} 
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

         <div className="min-h-[60vh] bg-black/60 backdrop-blur-xl border-t border-white/10 rounded-t-[2.5rem] p-6 pb-32 shadow-[0_-10px_60px_rgba(0,0,0,0.7)]">
           <div className="flex justify-between items-center -mt-10 mb-4 px-2">
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-widest">
                 Gallery ({imageCount}/{MAX_IMAGES})
              </span>
           </div>
           
           {formData.images && formData.images.length > 0 && (
             <div className="mb-6 flex gap-3 overflow-x-auto no-scrollbar py-2 px-2">
                {formData.images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImageIndex(i)} className={`w-14 h-14 rounded-xl border-2 flex-shrink-0 overflow-hidden transition-all shadow-lg ${i === activeImageIndex ? 'border-rose-500 scale-110 z-10' : 'border-white/20 grayscale'} ${i===0 ? 'relative' : ''}`}>
                    <img src={img} className="w-full h-full object-cover" />
                    {i === 0 && <div className="absolute bottom-0 left-0 w-full bg-rose-600 text-[8px] text-white text-center font-bold">COVER</div>}
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

             {/* Streak Button */}
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
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
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
                    onImageGenerated={(u) => setFormData(p=>({...p, images: [u, ...(p.images||[])]}))} 
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