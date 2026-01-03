import React, { useState } from 'react';
import { Flame, Heart } from 'lucide-react';
import { Star } from '../../types';

interface XPModalProps { 
  star: Star; 
  onClose: () => void; 
  onConfirm: (amount: number, note: string) => void; 
}

export const XPModal: React.FC<XPModalProps> = ({ star, onClose, onConfirm }) => {
  const [mode, setMode] = useState<'quick' | 'manual'>('quick');
  const [note, setNote] = useState('');
  const [manualAmount, setManualAmount] = useState(1);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl transition-all duration-300" onClick={onClose} />
      <div className="relative w-full max-w-sm glass-card rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300 border border-white/10">
        <div className="flex flex-col items-center mb-6">
           <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-br from-rose-500 to-purple-600 shadow-lg mb-4">
             <div className="w-full h-full rounded-full overflow-hidden border-2 border-black">
               {star.images[0] ? (
                 <img 
                    src={star.images[0]} 
                    className="w-full h-full object-cover object-top" 
                    alt={star.name}
                 />
               ) : (
                 <div className="bg-stone-800 w-full h-full" />
               )}
             </div>
           </div>
           <h2 className="font-serif text-2xl text-white">Consecrate {star.name}</h2>
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
          onClick={() => onConfirm(mode === 'quick' ? 1 : manualAmount, note)}
          className="w-full py-4 bg-white text-black font-bold rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Heart size={18} fill="black" /> {mode === 'quick' ? 'Ignite' : 'Offer Tribute'}
        </button>
      </div>
    </div>
  );
};