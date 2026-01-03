import React, { useState } from 'react';
import { Flame, Trophy, Search, Plus, Settings, Droplets } from 'lucide-react';
import { Star } from '../../types';
import { StarCard } from '../components/StarCard';
import { StreakModal } from '../components/StreakModal';

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

  let filtered = stars.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));
  if (filterType === 'xp') filtered.sort((a, b) => b.xp - a.xp);
  if (filterType === 'recent') filtered.sort((a, b) => (new Date(b.logs[0]?.date || 0).getTime() - new Date(a.logs[0]?.date || 0).getTime()));
  if (filterType === 'favorites') filtered = filtered.filter(s => s.favorite);

  const totalXP = stars.reduce((acc, s) => acc + s.xp, 0);
  const topMuse = stars.length ? stars.reduce((p, c) => (p.xp > c.xp ? p : c)) : null;
  // Calculate max streak among all stars for dashboard overview
  const maxStreak = stars.length ? Math.max(...stars.map(s => s.streak || 0)) : 0;

  return (
    <div className="h-screen w-full overflow-y-auto pb-32">
      {/* Header Stats */}
      <div className="pt-8 px-5 grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* Total Faps - Full width on mobile to emphasize total count */}
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
        
        {/* Clickable Overall Streak */}
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
        <div className="glass-panel rounded-full p-2 flex items-center shadow-lg border-white/10">
          <Search className="text-stone-500 ml-3" size={18} />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search your stars..."
            className="bg-transparent w-full px-3 py-2 text-sm text-white placeholder-stone-600 outline-none"
          />
           <button 
              onClick={onAddNew}
              className="p-2 bg-rose-600/20 text-rose-400 rounded-full hover:bg-rose-600 hover:text-white transition-colors mr-1"
              title="Add New Star"
            >
              <Plus size={16} />
            </button>
          <button onClick={onOpenSettings} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-stone-400"><Settings size={16}/></button>
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-2">
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
      </div>

      {/* Grid */}
      <div className="px-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(s => (
          <StarCard key={s.id} star={s} onAddXP={onAddXP} onClick={onEditStar} />
        ))}
        {filtered.length === 0 && (
           <div onClick={onAddNew} className="aspect-[3/4] rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-stone-600 hover:border-rose-500/50 hover:text-rose-500 transition-colors cursor-pointer bg-white/5">
              <Plus size={32} className="mb-2 opacity-50" />
              <span className="text-xs uppercase tracking-widest font-bold">Summon New</span>
           </div>
        )}
      </div>

      <StreakModal 
         isOpen={showGlobalStreak}
         onClose={() => setShowGlobalStreak(false)}
         streak={maxStreak}
      />
    </div>
  );
};