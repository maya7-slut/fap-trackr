
import React from 'react';
import { Flame, Globe, Calendar, Sparkles, Trash2, X, MoreVertical } from 'lucide-react';
import { Star, GalleryItem, XPLog } from '../../types';
import { AIGenerator } from '../AIGenerator';

// --- Gallery Strip ---
export const GalleryStrip: React.FC<{ 
  gallery: GalleryItem[]; 
  activeIndex: number; 
  onSelect: (index: number) => void; 
}> = ({ gallery, activeIndex, onSelect }) => {
  if (gallery.length === 0) return null;
  return (
    <div className="mb-6 flex gap-3 overflow-x-auto no-scrollbar py-2 px-2">
      {gallery.map((item, i) => (
        <button key={item.id} onClick={() => onSelect(i)} className={`w-14 h-14 rounded-xl border-2 flex-shrink-0 overflow-hidden transition-all shadow-lg relative ${i === activeIndex ? 'border-rose-500 scale-110 z-10' : 'border-white/20 grayscale'} ${i===0 ? 'relative' : ''}`}>
          <img src={item.url} className="w-full h-full object-cover" />
          {i === 0 && <div className="absolute bottom-0 left-0 w-full bg-rose-600 text-[8px] text-white text-center font-bold">COVER</div>}
          {item.cutout && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-purple-500 ring-1 ring-black" />}
        </button>
      ))}
    </div>
  );
};

// --- Basic Info Inputs ---
export const BasicInfoInputs: React.FC<{
  formData: Partial<Star>;
  setFormData: (val: Partial<Star>) => void;
  enableAI: boolean;
  onAutoBio: () => void;
  mode: 'add' | 'update';
  onStreakClick: () => void;
  streak: number;
}> = ({ formData, setFormData, enableAI, onAutoBio, mode, onStreakClick, streak }) => (
  <div className="space-y-4">
      <div className="relative">
        <input 
          value={formData.name || ''}
          onChange={e => setFormData({...formData, name: e.target.value})}
          placeholder="Star Name"
          className="w-full bg-transparent text-3xl font-serif text-white placeholder-stone-400 outline-none border-b border-white/20 focus:border-rose-500 pb-2 transition-colors pr-10"
        />
        {formData.name && enableAI && (
          <button 
            type="button"
            onClick={onAutoBio} 
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
      {mode === 'update' && (
          <div className="flex justify-start">
              <button 
                onClick={onStreakClick}
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
  </div>
);

// --- Detail Grids (Origin, DOB) ---
export const DetailGrids: React.FC<{
  formData: Partial<Star>;
  setFormData: (val: Partial<Star>) => void;
}> = ({ formData, setFormData }) => (
  <div className="grid grid-cols-2 gap-4 mt-8">
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
);

// --- Bio & AI Section ---
export const BioSection: React.FC<{
  formData: Partial<Star>;
  setFormData: (val: Partial<Star>) => void;
  enableAI: boolean;
  apiKey: string;
  onRequestKey: () => void;
  onAIImageGenerated: (url: string) => void;
}> = ({ formData, setFormData, enableAI, apiKey, onRequestKey, onAIImageGenerated }) => (
  <div className="mt-8">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-serif text-stone-300 text-sm">Fantasies & Notes</h3>
      </div>
      <textarea 
        value={formData.bio || ''}
        onChange={e => setFormData({...formData, bio: e.target.value})}
        className="w-full bg-white/5 rounded-2xl p-4 text-stone-200 text-sm leading-relaxed outline-none border border-transparent focus:border-white/10 min-h-[120px] placeholder:text-stone-500"
        placeholder="Capture her essence..."
      />
      
      {enableAI && (
          <div className="mt-4">
              <AIGenerator 
                apiKey={apiKey} 
                description={formData.bio} 
                onImageGenerated={onAIImageGenerated} 
                onRequestKey={onRequestKey} 
              />
          </div>
      )}
  </div>
);

// --- Log History List ---
export const LogHistory: React.FC<{
  logs: XPLog[];
  onDeleteLog: (e: React.MouseEvent, id: string, amount: number) => void;
}> = ({ logs, onDeleteLog }) => (
  <div className="pt-4 border-t border-white/10 mt-8">
      <h3 className="font-serif text-stone-300 text-sm mb-4">Fap History</h3>
      <div className="space-y-4 pl-4 border-l border-white/10 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {logs.map(log => (
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
                  onClick={(e) => onDeleteLog(e, log.id, log.amount)}
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
);

// --- Header Component ---
export const FormHeader: React.FC<{
  mode: 'add' | 'update';
  xp: number;
  onClose: () => void;
  onDeleteStar: (e: React.MouseEvent) => void;
}> = ({ mode, xp, onClose, onDeleteStar }) => {
  const [showDropdown, setShowDropdown] = React.useState(false);
  return (
    <div className="fixed top-0 left-0 w-full p-4 flex justify-between items-center z-50 pointer-events-none">
        <button onClick={onClose} className="pointer-events-auto w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white backdrop-blur-md shadow-lg"><X size={20}/></button>
        
        <div className="flex items-center gap-3 pointer-events-auto">
          {mode === 'update' && (
            <div className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10 bg-black/40 backdrop-blur-md">
                <Flame size={12} className="text-rose-500" fill="currentColor" />
                <span className="text-xs font-bold text-rose-100">{xp} XP</span>
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
                      onClick={(e) => onDeleteStar(e)}
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
  );
};
