
import React, { useState } from 'react';
import { Save, Heart } from 'lucide-react';
import { Star } from '../types';
import { useSettings } from '../context/SettingsContext';
import { StreakModal } from '../components/StreakModal';
import { useStarForm } from '../hooks/useStarForm';

// Modular Components
import { Workbench } from '../components/StarForm/Workbench';
import { FormHeader, GalleryStrip, BasicInfoInputs, DetailGrids, BioSection, LogHistory } from '../components/StarForm/FormSections';

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
  const { settings } = useSettings();
  const [showStreakModal, setShowStreakModal] = useState(false);

  // Hook handles all logic
  const { 
    formData, setFormData, activeGalleryIndex, setActiveGalleryIndex,
    processing3D, progress3D, statusMessage, 
    mainImg, currentCutout, imageCount, MAX_IMAGES,
    handlers 
  } = useStarForm({ initialData, onSave, onDelete, apiKey });

  const streak = formData.streak || 0;
  const gallery = formData.gallery || [];

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
      
      {/* Background Layer */}
      {mainImg ? (
         <div className="fixed inset-0 z-0">
           <img src={mainImg} className="w-full h-full object-cover object-center opacity-60" alt="Background" />
           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" /> 
           <div className="absolute inset-0 backdrop-blur-[20px]" />
         </div>
      ) : (
         <div className="fixed inset-0 z-0 bg-gradient-to-b from-stone-900 to-black" />
      )}

      {/* Top Header */}
      <FormHeader mode={mode} xp={formData.xp || 0} onClose={onClose} onDeleteStar={handlers.handleDeleteStar} />

      {/* Main Content Scroll Area */}
      <div className="absolute inset-0 z-10 overflow-y-auto no-scrollbar">
         
         {/* 3D Workbench */}
         <Workbench 
            mainImg={mainImg}
            cutout={currentCutout}
            processing={processing3D}
            progress={progress3D}
            status={statusMessage}
            imageCount={imageCount}
            maxImages={MAX_IMAGES}
            activeGalleryIndex={activeGalleryIndex}
            onGenerate={handlers.handleGenerate3D}
            onRemove={handlers.handleRemoveCutout}
            onDeleteImage={handlers.handleDeleteActiveImage}
            onSetCover={handlers.handleSetCover}
            onFileChange={handlers.handleFileChange}
         />

         {/* Form Sheet */}
         <div className="min-h-[60vh] bg-black/60 backdrop-blur-xl border-t border-white/10 rounded-t-[2.5rem] p-6 pb-32 shadow-[0_-10px_60px_rgba(0,0,0,0.7)]">
           <div className="flex justify-between items-center -mt-10 mb-4 px-2">
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-widest">
                 Gallery ({imageCount}/{MAX_IMAGES})
              </span>
           </div>
           
           <GalleryStrip 
              gallery={gallery} 
              activeIndex={activeGalleryIndex} 
              onSelect={setActiveGalleryIndex} 
           />

           <div className="mt-2">
             <BasicInfoInputs 
                formData={formData} 
                setFormData={setFormData} 
                enableAI={settings.enableAI} 
                onAutoBio={handlers.handleAutoBio}
                mode={mode}
                streak={streak}
                onStreakClick={() => setShowStreakModal(true)}
             />

             <DetailGrids formData={formData} setFormData={setFormData} />

             <BioSection 
                formData={formData} 
                setFormData={setFormData} 
                enableAI={settings.enableAI} 
                apiKey={apiKey}
                onRequestKey={onRequestKey}
                onAIImageGenerated={handlers.handleAIImageGenerated}
             />

             {mode === 'update' && formData.logs && formData.logs.length > 0 && (
                <LogHistory logs={formData.logs} onDeleteLog={handlers.handleDeleteLog} />
             )}
             
             <div className="h-16" />
           </div>
         </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 w-full p-4 z-50 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none">
         <button 
           onClick={handlers.handleSaveChanges}
           className="pointer-events-auto w-full py-4 bg-white text-black font-bold rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
         >
           {mode === 'add' ? <Heart size={18} fill="black" /> : <Save size={18} />}
           {mode === 'add' ? '❤️ Add to your world 😈' : 'Save Changes'}
         </button>
      </div>

      <StreakModal 
        isOpen={showStreakModal} 
        onClose={() => setShowStreakModal(false)} 
        streak={streak} 
        name={formData.name} 
      />
    </div>
  );
};
