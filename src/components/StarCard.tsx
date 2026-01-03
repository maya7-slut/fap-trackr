import React, { useState, useRef } from 'react';
import { Plus, Image as ImageIcon, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { Star, StarCategory } from '../../types';
import { getCategory } from '../../constants';
import { useCursor } from '../context/CursorContext';
import { useSettings, BorderStyle, CardShape } from '../context/SettingsContext';

interface StarCardProps { 
  star: Star; 
  onAddXP: (id: string) => void; 
  onClick: (star: Star) => void; 
}

export const StarCard: React.FC<StarCardProps> = ({ star, onAddXP, onClick }) => {
  const category = getCategory(star.xp);
  const [currentIdx, setCurrentIdx] = useState(0);
  const streak = star.streak || 0;
  const { setVariant } = useCursor();
  const { settings } = useSettings();

  // 3D Tilt State
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const displayImage = star.images[currentIdx] || star.images[0];
  const hasMultipleImages = star.images.length > 1;
  const show3D = !!star.imageCutout && currentIdx === 0;

  // --- Dynamic Styling Helpers ---
  const getBorderClasses = (style: BorderStyle) => {
    switch (style) {
      case 'neon': return 'border-2 border-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.6)]';
      case 'glow': return 'border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.2)]';
      case 'gold': return 'border-2 border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]';
      case 'minimal': return 'border-0 shadow-none bg-stone-900';
      case 'glass': default: return 'glass-card border-0';
    }
  };

  const getRadiusClass = (shape: CardShape) => {
    return shape === 'pill' ? 'rounded-[2.5rem]' : 'rounded-3xl';
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
       clientX = e.touches[0].clientX;
       clientY = e.touches[0].clientY;
    } else {
       clientX = (e as React.MouseEvent).clientX;
       clientY = (e as React.MouseEvent).clientY;
    }

    const width = rect.width;
    const height = rect.height;
    
    // Calculate position relative to center
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const xPct = mouseX / width - 0.5; 
    const yPct = mouseY / height - 0.5;

    // Calculate rotation (Max 15 deg)
    const x = yPct * -20; 
    const y = xPct * 20;
    
    setRotation({ x, y });
  };

  const handleEnter = () => {
    setIsHovering(true);
    setVariant('hot');
  };

  const handleLeave = () => {
    setIsHovering(false);
    setRotation({ x: 0, y: 0 });
    setVariant('default');
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIdx(prev => (prev - 1 + star.images.length) % star.images.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIdx(prev => (prev + 1) % star.images.length);
  };

  return (
    <div 
      ref={cardRef}
      className={`group relative w-full aspect-[3/4] cursor-pointer ${isHovering ? 'z-50' : 'z-0'} ${getRadiusClass(settings.cardShape)}`}
      style={{ 
        perspective: '1000px',
        marginTop: `${settings.margins.top}px`,
        marginBottom: `${settings.margins.bottom}px`,
        marginLeft: `${settings.margins.left}px`,
        marginRight: `${settings.margins.right}px`,
      }}
      onMouseMove={handleMove}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onTouchStart={handleEnter}
      onTouchMove={handleMove}
      onTouchEnd={handleLeave}
      onClick={() => onClick(star)}
    >
      {/* 3D Container */}
      <div 
        className={`relative h-full w-full transition-all duration-100 ease-out preserve-3d ${getRadiusClass(settings.cardShape)}`}
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(${isHovering ? 1.05 : 1}, ${isHovering ? 1.05 : 1}, 1)`,
          transition: isHovering ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
          transformStyle: 'preserve-3d',
        }}
      >
        
        {/* Shadow/Glow behind card */}
        <div className={`absolute inset-0 transition-opacity duration-500 blur-xl bg-gradient-to-t from-rose-600 to-purple-600 ${getRadiusClass(settings.cardShape)} ${isHovering ? 'opacity-40' : 'opacity-0'}`} style={{ transform: 'translateZ(-10px)' }} />

        {/* LAYER 1: BASE FRAME & BACKGROUND */}
        <div className={`absolute inset-0 overflow-hidden bg-stone-900 ${getBorderClasses(settings.borderStyle)} ${getRadiusClass(settings.cardShape)}`} style={{ transform: 'translateZ(0)' }}>
          {displayImage ? (
            <img 
              src={displayImage} 
              alt={star.name} 
              className={`absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 ${show3D ? 'opacity-80 blur-[2px]' : ''}`}
              style={{ transform: isHovering && !show3D ? 'scale(1.1)' : 'scale(1)' }}
            />
          ) : (
            <div className="absolute inset-0 bg-stone-900 flex items-center justify-center">
              <ImageIcon className="text-stone-700 opacity-50" size={48} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
          
          {/* Subtle Glare Effect on Base */}
          <div 
            className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `linear-gradient(${115 + rotation.y * 2}deg, transparent 20%, rgba(255,255,255,0.3) 50%, transparent 80%)`
            }}
          />
        </div>

        {/* LAYER 2: 3D POP-OUT CUTOUT */}
        {show3D && (
          <div 
             className={`absolute inset-0 pointer-events-none overflow-visible ${getRadiusClass(settings.cardShape)}`}
             style={{ transform: 'translateZ(40px)' }}
          >
             <img 
               src={star.imageCutout}
               className="w-full h-full object-cover object-top transition-transform duration-100"
               style={{ 
                  transform: 'scale(1.15) translateY(-5%)', 
                  filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))',
                  // Ensure bottom is masked if needed, though overflow-visible is set on parent for top pop-out.
                  // Usually 3D cards allow pop out on top but bottom is clipped by container context visually if not careful.
                  // Here we let it float.
               }}
               alt="3D Hologram"
             />
          </div>
        )}

        {/* LAYER 3: UI ELEMENTS */}
        <div className="absolute inset-0 pointer-events-none" style={{ transform: 'translateZ(50px)' }}>
          
          {/* Carousel Controls */}
          {hasMultipleImages && (
            <div className="pointer-events-auto h-full w-full">
              <button 
                onClick={handlePrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 h-24 w-10 flex items-center justify-center z-30 text-white/30 hover:text-white transition-colors"
              >
                <ChevronLeft size={24} strokeWidth={3} className="drop-shadow-lg" />
              </button>
              <button 
                onClick={handleNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 h-24 w-10 flex items-center justify-center z-30 text-white/30 hover:text-white transition-colors"
              >
                <ChevronRight size={24} strokeWidth={3} className="drop-shadow-lg" />
              </button>
            </div>
          )}

          {/* Indicators */}
          {hasMultipleImages && (
             <div className="absolute top-4 left-4 flex gap-1 z-20">
                {star.images.map((_, i) => (
                   <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === currentIdx ? 'w-4 bg-rose-500' : 'w-1 bg-white/30'}`} />
                ))}
             </div>
          )}

          {/* Streak Indicator */}
          {streak > 1 && (
            <div className="absolute top-12 left-4 z-20 flex items-center gap-1 animate-pulse">
              <Flame size={14} className="text-orange-500 fill-orange-500" />
              <span className="text-[10px] font-bold text-orange-200 drop-shadow-[0_0_5px_rgba(249,115,22,0.8)]">
                {streak} Days
              </span>
            </div>
          )}

          {/* Category Badge */}
          <div className="absolute top-4 right-4 z-10">
             <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest backdrop-blur-md border border-white/10 ${
               category === StarCategory.Goddess ? 'bg-amber-500/20 text-amber-200' : 
               category === StarCategory.Enchantress ? 'bg-purple-500/20 text-purple-200' : 
               'bg-rose-500/20 text-rose-200'
             }`}>
               {category}
             </span>
          </div>

          {/* Bottom Info */}
          <div className="absolute bottom-0 w-full p-5 flex flex-col gap-1 z-10">
            <h3 className="font-serif text-2xl font-bold text-white drop-shadow-md leading-none">{star.name}</h3>
            {star.nickname && <p className="text-rose-300/80 text-sm font-medium tracking-wide">{star.nickname}</p>}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                <div 
                  className="h-full bg-gradient-to-r from-rose-500 to-amber-500 shadow-[0_0_15px_rgba(244,63,94,0.8)]" 
                  style={{ width: `${Math.min((star.xp % 100) || 100, 100)}%` }} 
                />
              </div>
              <span className="text-xs font-mono text-white/60">{star.xp} XP</span>
            </div>
          </div>

          {/* Add XP Button */}
          <button 
            onClick={(e) => { e.stopPropagation(); onAddXP(star.id); }}
            className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.4)] hover:bg-rose-500 hover:scale-110 active:scale-90 transition-all z-20 pointer-events-auto"
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};