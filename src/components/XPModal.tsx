
import React, { useState, useEffect, useRef } from 'react';
import { Flame, Heart } from 'lucide-react';
import { Star } from '../../types';

interface XPModalProps { 
  star: Star; 
  onClose: () => void; 
  onConfirm: (amount: number, note: string) => void; 
}

// --- Internal Component: 3D Blue Rain Effect ---
const RainEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to match parent container
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resize();

    // Particle System
    const drops: { x: number; y: number; z: number; speed: number; len: number }[] = [];
    const maxDrops = 100;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn new drops
      if (drops.length < maxDrops) {
        drops.push({
          x: Math.random() * canvas.width,
          y: -20,
          z: Math.random() * 0.5 + 0.5, // Depth factor (0.5 to 1.0)
          speed: Math.random() * 5 + 5,
          len: Math.random() * 20 + 10
        });
      }

      // Update & Draw
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        
        // Move
        d.y += d.speed * d.z;
        // Flowy effect: slight sine wave sway based on depth
        d.x += Math.sin(d.y * 0.05) * 0.5;

        // Draw
        ctx.beginPath();
        const thickness = d.z * 2;
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        
        // Gradient for "water" look (Light Blue -> Transparent)
        const grad = ctx.createLinearGradient(d.x, d.y, d.x, d.y + d.len * d.z);
        grad.addColorStop(0, `rgba(56, 189, 248, ${d.z})`); // Sky Blue
        grad.addColorStop(1, `rgba(37, 99, 235, 0)`); // Fade out
        
        ctx.strokeStyle = grad;
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x, d.y + d.len * d.z);
        ctx.stroke();

        // Remove if off screen
        if (d.y > canvas.height + 50) {
          drops.splice(i, 1);
          i--;
        }
      }

      requestAnimationFrame(animate);
    };

    const animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-0 pointer-events-none rounded-3xl opacity-80"
    />
  );
};

export const XPModal: React.FC<XPModalProps> = ({ star, onClose, onConfirm }) => {
  const [mode, setMode] = useState<'quick' | 'manual'>('quick');
  const [note, setNote] = useState('');
  const [manualAmount, setManualAmount] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  const displayImage = star.gallery?.[0]?.url;

  const handleIgnite = () => {
    setIsAnimating(true);
    // Let animation play for 1.2 seconds before closing
    setTimeout(() => {
      onConfirm(1, '');
    }, 1200);
  };

  const handleTribute = () => {
    onConfirm(manualAmount, note);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl transition-all duration-300" onClick={onClose} />
      
      {/* Card Container */}
      <div className="relative w-full max-w-sm glass-card rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300 border border-white/10 overflow-hidden">
        
        {/* Background Animation Layer */}
        {isAnimating && <RainEffect />}

        {/* Content Layer (z-10 to sit above rain) */}
        <div className={`relative z-10 transition-opacity duration-500 ${isAnimating ? 'opacity-20 blur-sm' : 'opacity-100'}`}>
          <div className="flex flex-col items-center mb-6">
             <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-br from-rose-500 to-purple-600 shadow-lg mb-4">
               <div className="w-full h-full rounded-full overflow-hidden border-2 border-black">
                 {displayImage ? (
                   <img 
                      src={displayImage} 
                      className="w-full h-full object-cover object-top" 
                      alt={star.name}
                   />
                 ) : (
                   <div className="bg-stone-800 w-full h-full" />
                 )}
               </div>
             </div>
             {/* Renamed Title */}
             <h2 className="font-serif text-2xl text-white">Tribute {star.name}</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button 
              onClick={() => setMode('quick')}
              className={`py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${mode === 'quick' ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/20' : 'bg-white/5 text-stone-400 hover:bg-white/10'}`}
            >
              Quick Spark
            </button>
            <button 
              onClick={() => setMode('manual')}
              className={`py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${mode === 'manual' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'bg-white/5 text-stone-400 hover:bg-white/10'}`}
            >
              Deep Ritual
            </button>
          </div>

          {mode === 'manual' && (
            <div className="mb-4 space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="bg-black/30 rounded-2xl p-3 border border-white/5 flex items-center gap-4">
                 <Flame className="text-rose-500 ml-2" size={20} />
                 <input 
                   type="number" 
                   min="1" 
                   value={manualAmount} 
                   onChange={(e) => setManualAmount(Number(e.target.value))}
                   className="bg-transparent text-white text-xl font-bold w-full outline-none"
                 />
                 <span className="text-xs text-stone-500 mr-2 uppercase">XP</span>
              </div>
              <textarea 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What captivated you?"
                className="w-full bg-black/30 border border-white/5 rounded-2xl p-4 text-stone-200 outline-none text-sm min-h-[80px] focus:border-white/20 transition-colors placeholder:text-stone-600"
              />
            </div>
          )}
          
          <button 
            onClick={mode === 'quick' ? handleIgnite : handleTribute}
            disabled={isAnimating}
            className="w-full py-4 bg-white text-black font-bold rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {isAnimating ? (
               <span className="animate-pulse">Offering...</span>
            ) : (
               <>
                 <Heart size={18} fill="black" /> {mode === 'quick' ? 'Ignite' : 'Offer Tribute'}
               </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
