import React, { useState } from 'react';
import { Flame, Trophy, Search, Plus, Settings, Droplets, Grid, CheckSquare, Trash2, X } from 'lucide-react';
import { Star } from '../../types';
import { StarCard } from '../components/StarCard';
import { StreakModal } from '../components/StreakModal';
// Fix: corrected import path from ../../services/storage (root) to ../services/storage (src)
import { bulkDeleteStars } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface DashboardProps {
  stars: Star[];
  onAddXP: (id: string) => void;
  onEditStar: (star: Star) => void;
  onAddNew: () => void;
  onOpenSettings: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ stars, onAddXP, onEditStar, onAddNew, onOpenSettings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'xp' | 'recent' | 'favorites'>('xp');
  const [showGlobalStreak, setShowGlobalStreak] = useState(false);
  
  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const { user } = useAuth();
  const { showToast } = useToast();

  let filtered = stars.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));
  if (filterType === 'xp') filtered.sort((a, b) => b.xp - a.xp);
  if (filterType === 'recent') filtered.sort((a, b) => (new Date(b.logs[0]?.date || 0).getTime() - new Date(a.logs[0]?.date || 0).getTime()));
  if (filterType === 'favorites') filtered = filtered.filter(s => s.favorite);

  const totalXP = stars.reduce((acc, s) => acc + s.xp, 0);
  const topMuse = stars.length ? stars.reduce((p, c) => (p.xp > c.xp ? p : c)) : null;
  const maxStreak = stars.length ? Math.max(...stars.map(s => s.streak || 0)) : 0;

  // --- Handlers ---

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectionMode = () => {
    if (isSelectionMode) {
      // Cancel
      setIsSelectionMode(false);
      setSelectedIds([]);
    } else {
      // Start
      setIsSelectionMode(true);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    if (confirm(`Permanently banish ${selectedIds.length} stars? This cannot be undone.`)) {
      try {
        await bulkDeleteStars(selectedIds, user?.id);
        
        showToast(`${selectedIds.length} stars banished.`, 'success');
        setIsSelectionMode(false);
        setSelectedIds([]);
        // Ideally we trigger a reload here, but the parent App component handles the data load on state change usually. 
        // We might need to trigger a refresh manually if not reactive.
        // Assuming App.tsx passes new stars prop on change or we force reload window (less elegant).
        // Since we modified storage but App.tsx holds state, we should ideally have a callback for onRefresh.
        // For now, simple reload helps ensure state consistency if props don't update immediately.
        window.location.reload(); 
      } catch (e: any) {
        showToast(e.message || "Bulk delete failed.", 'error');
      }
    }
  };

  return (
    <div className="h-screen w-full overflow-y-auto pb-32">
      {/* Header Stats */}
      <div className="pt-8 px-5 grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* Total Faps */}
        <div className="col-span-2 md:col-span-1 glass-panel p-5 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Droplets size={40} className="text-rose-500" /></div>
          <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">Total Faps</p>
          <p className="text-3xl font-serif text-rose-500">{totalXP.toLocaleString()}</p>
        </div>

        {/* Top Star */}
        <div className="glass-panel p-5 rounded-3xl relative overflow-hidden group border-purple-500/10">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Trophy size={40} className="text-purple-500"/></div>
          <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">Top Star</p>
          <p className="text-xl font-serif text-purple-400 truncate leading-tight">{topMuse?.name || '---'}</p>
          {topMuse && <p className="text-xs text-stone-500 mt-1">{topMuse.xp} XP</p>}
        </div>
        
        {/* Overall Streak */}
        <div 
           onClick={() => setShowGlobalStreak(true)}
           className="glass-panel p-5 rounded-3xl relative overflow-hidden group border-amber-500/10 cursor-pointer hover:bg-white/5 transition-colors"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Flame size={40} className="text-amber-500"/></div>
          <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1 flex items-center gap-1">
             Best Streak <Flame size={10} className="text-orange-500 fill-orange-500 animate-pulse" />
          </p>
          <p className="text-3xl font-serif text-amber-500 truncate">{maxStreak} <span className="text-sm text-stone-500 font-sans">Days</span></p>
        </div>
      </div>

      {/* Search & Filter Dock */}
      <div className="sticky top-4 z-40 px-5 mt-6 mb-6">
        <div className="glass-panel rounded-full p-2 flex items-center shadow-lg border-white/10 relative overflow-hidden">
          
          {/* Search Bar Content */}
          <div className={`flex items-center w-full transition-opacity duration-300 ${isSelectionMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <Search className="text-stone-500 ml-3 shrink-0" size={18} />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search your stars..."
              className="bg-transparent w-full px-3 py-2 text-sm text-white placeholder-stone-600 outline-none"
            />
            <button 
              onClick={onAddNew}
              className="p-2 bg-rose-600/20 text-rose-400 rounded-full hover:bg-rose-600 hover:text-white transition-colors mr-1 shrink-0"
              title="Add New Star"
            >
              <Plus size={16} />
            </button>
            <button onClick={onOpenSettings} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-stone-400 shrink-0"><Settings size={16}/></button>
          </div>

          {/* Selection Mode Indicator overlay inside the bar */}
          <div className={`absolute inset-0 flex items-center justify-between px-4 bg-rose-900/80 backdrop-blur-md transition-transform duration-300 ${isSelectionMode ? 'translate-y-0' : 'translate-y-full'}`}>
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <CheckSquare size={16} /> 
              {selectedIds.length} Selected
            </span>
            <button onClick={toggleSelectionMode} className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white">
               <X size={18} />
            </button>
          </div>
        </div>

        {/* Filters / Tools */}
        <div className="flex justify-between items-center mt-3">
          <div className={`flex gap-2 overflow-x-auto no-scrollbar pb-2 transition-opacity ${isSelectionMode ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            {[ {id:'xp', label:'Faps'}, {id:'recent', label:'Recent'}, {id:'favorites', label:'Hearts'} ].map(f => (
              <button 
                key={f.id} 
                onClick={() => setFilterType(f.id as any)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${filterType === f.id ? 'bg-rose-600 border-rose-500 text-white' : 'bg-white/5 border-white/5 text-stone-500'}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Toggle Selection Mode Button */}
          <button 
            onClick={toggleSelectionMode}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border flex items-center gap-1 ${isSelectionMode ? 'bg-rose-600 border-rose-500 text-white' : 'bg-white/5 border-white/5 text-stone-500 hover:text-white'}`}
          >
            {isSelectionMode ? 'Done' : 'Manage'}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="px-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(s => (
          <StarCard 
            key={s.id} 
            star={s} 
            onAddXP={onAddXP} 
            onClick={onEditStar} 
            isSelectionMode={isSelectionMode}
            isSelected={selectedIds.includes(s.id)}
            onToggleSelect={handleToggleSelect}
          />
        ))}
        {!isSelectionMode && filtered.length === 0 && (
           <div onClick={onAddNew} className="aspect-[3/4] rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-stone-600 hover:border-rose-500/50 hover:text-rose-500 transition-colors cursor-pointer bg-white/5">
              <Plus size={32} className="mb-2 opacity-50" />
              <span className="text-xs uppercase tracking-widest font-bold">Summon New</span>
           </div>
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      <div className={`fixed bottom-6 left-5 right-5 z-[80] transition-all duration-300 transform ${isSelectionMode && selectedIds.length > 0 ? 'translate-y-0 opacity-100' : 'translate-y-[200%] opacity-0'}`}>
         <div className="glass-panel bg-rose-950/90 border-rose-500/30 p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-rose-600 flex items-center justify-center font-bold text-white shadow-lg">
                  {selectedIds.length}
               </div>
               <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">Items Selected</span>
                  <span className="text-[10px] text-rose-300">Choose an action</span>
               </div>
            </div>
            <button 
               onClick={handleBulkDelete}
               className="px-6 py-3 bg-white text-rose-900 font-bold rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 uppercase text-xs tracking-wider"
            >
               <Trash2 size={16} /> Delete
            </button>
         </div>
      </div>

      <StreakModal 
         isOpen={showGlobalStreak}
         onClose={() => setShowGlobalStreak(false)}
         streak={maxStreak}
      />
    </div>
  );
};