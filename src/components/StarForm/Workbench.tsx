
import React, { useRef, useState } from 'react';
import { Loader2, Eraser, RefreshCw, Box, Trash2, Layout, Upload, Camera } from 'lucide-react';

interface WorkbenchProps {
  mainImg?: string;
  cutout?: string | null;
  processing: boolean;
  progress: number;
  status: string;
  imageCount: number;
  maxImages: number;
  activeGalleryIndex: number;
  onGenerate: () => void;
  onRemove: () => void;
  onDeleteImage: () => void;
  onSetCover: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Workbench: React.FC<WorkbenchProps> = ({
  mainImg, cutout, processing, progress, status, imageCount, maxImages, activeGalleryIndex,
  onGenerate, onRemove, onDeleteImage, onSetCover, onFileChange
}) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

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
    
    const xPct = mouseX / width - 0.5; 
    const yPct = mouseY / height - 0.5;
    const x = yPct * -20; 
    const y = xPct * 20;
    
    setRotation({ x, y });
  };

  const handleEnter = () => setIsHovering(true);
  const handleLeave = () => { setIsHovering(false); setRotation({ x: 0, y: 0 }); };

  return (
    <div className="w-full h-[55vh] relative flex items-center justify-center p-6" style={{ perspective: '1000px' }}>
        {mainImg ? (
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
                className={`w-full h-full object-contain transition-opacity duration-300 ${cutout ? 'opacity-80 blur-[2px]' : 'opacity-100'}`} 
                alt="Main Preview" 
                />
                <div 
                className="absolute inset-0 pointer-events-none mix-blend-overlay transition-opacity duration-300"
                style={{
                    background: `linear-gradient(${115 + rotation.y * 2}deg, transparent 20%, rgba(255,255,255,0.2) 50%, transparent 80%)`,
                    opacity: isHovering ? 1 : 0
                }}
                />
            </div>
            
            {/* Layer 2: 3D Cutout */}
            {cutout && (
                <div 
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{ transform: 'translateZ(50px)' }}
                >
                    <img 
                    src={cutout} 
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
            {processing && (
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
                        <div className="h-full bg-gradient-to-r from-rose-600 to-purple-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-rose-200/80 text-[10px] font-mono animate-pulse">{status}</p>
                </div>
            )}
            </div>
        ) : (
            <div className="text-center opacity-50">
               <Camera className="mx-auto h-20 w-20 text-stone-600 mb-4" />
               <p className="font-serif text-stone-500">No Essence Captured</p>
            </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-6 right-6 flex gap-2 z-[60]">
            {cutout && !processing && (
                <button 
                type="button"
                onClick={onRemove}
                className="p-3 rounded-full backdrop-blur-md transition-all shadow-lg border border-white/10 bg-black/40 text-stone-400 hover:text-white hover:bg-red-500/20"
                title="Remove Hologram"
                >
                <Eraser size={18} />
                </button>
            )}

            {mainImg && (
                <button
                type="button"
                onClick={onGenerate}
                disabled={processing}
                className={`p-3 rounded-full backdrop-blur-md transition-all shadow-lg border border-white/10 ${
                    cutout 
                    ? 'bg-white/10 text-stone-400 hover:bg-white/20 hover:text-white'
                    : 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)] hover:bg-purple-500'
                }`}
                title={cutout ? "Regenerate 3D" : "Generate 3D"}
                >
                    {processing ? <Loader2 size={20} className="animate-spin" /> : cutout ? <RefreshCw size={18} /> : <Box size={20} />}
                </button>
            )}

            {mainImg && (
                <button 
                    type="button"
                    onClick={onDeleteImage} 
                    className="p-3 bg-black/60 text-rose-400 rounded-full hover:bg-rose-900/80 backdrop-blur-md transition-all shadow-lg border border-white/10" 
                    title="Delete Image"
                >
                    <Trash2 size={20} className="pointer-events-none" />
                </button>
            )}
            
            {activeGalleryIndex > 0 && (
                <button 
                type="button"
                onClick={onSetCover} 
                className="p-3 bg-black/60 text-white rounded-full hover:bg-white/20 backdrop-blur-md transition-all shadow-lg border border-white/10" 
                title="Make Cover"
                >
                    <Layout size={20} className="pointer-events-none" />
                </button>
            )}

            <label className={`p-3 rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform backdrop-blur-sm border border-white/10 ${imageCount >= maxImages ? 'bg-stone-700 opacity-50 cursor-not-allowed' : 'bg-rose-600/90'}`}>
                <Upload size={20} className="text-white pointer-events-none"/>
                <input type="file" className="hidden" accept="image/*" onChange={onFileChange} disabled={imageCount >= maxImages} />
            </label>
        </div>
    </div>
  );
};
