import React from 'react';
import { Sparkles, Flame, Zap, Crown, X } from 'lucide-react';

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  streak: number;
  name?: string; // Optional name context
}

export const StreakModal: React.FC<StreakModalProps> = ({ isOpen, onClose, streak, name }) => {
  if (!isOpen) return null;

  // Milestones based on prompt: 1, 3 (2-5), 7 (5-7), 14 (7+)
  const milestones = [
    { day: 1, icon: Sparkles, label: "Spark" },
    { day: 3, icon: Flame, label: "Ignited" },
    { day: 7, icon: Zap, label: "Charged" },
    { day: 30, icon: Crown, label: "Eternal" },
  ];

  // Calculate progress bar percentage
  // 0% at 0 days, 100% at 30 days.
  const maxDays = 30;
  const progressPercent = Math.min((streak / maxDays) * 100, 100);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-500" 
        onClick={onClose} 
      />
      <div className="relative w-full max-w-md glass-card rounded-[2rem] p-8 border border-white/10 shadow-[0_0_50px_rgba(225,29,72,0.2)] animate-in zoom-in-95 fade-in duration-300 flex flex-col items-center">
        
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors">
          <X size={20} />
        </button>

        <div className="mb-2 p-3 bg-gradient-to-br from-orange-500/20 to-rose-600/20 rounded-full shadow-[0_0_20px_rgba(249,115,22,0.3)] animate-pulse">
           <Flame size={32} className="text-orange-500" fill="currentColor" />
        </div>
        
        <h2 className="font-serif text-3xl text-white mb-1">{streak} Day Streak</h2>
        <p className="text-stone-400 text-sm mb-10 font-medium tracking-wide">
          {name ? `Your devotion to ${name}` : 'Longest active consistency'}
        </p>

        {/* Timeline Container */}
        <div className="w-full relative px-4 mb-8">
          
          {/* Background Line */}
          <div className="absolute top-1/2 left-4 right-4 h-1 bg-white/10 -translate-y-1/2 rounded-full" />
          
          {/* Active Progress Line */}
          <div 
            className="absolute top-1/2 left-4 h-1 bg-gradient-to-r from-orange-500 to-rose-600 -translate-y-1/2 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(244,63,94,0.8)]" 
            style={{ width: `calc(${progressPercent}% - 32px)` }} 
          />

          {/* Icons Row */}
          <div className="relative flex justify-between w-full">
            {milestones.map((m, i) => {
              const isUnlocked = streak >= m.day;
              const isCurrent = streak >= m.day && (i === milestones.length - 1 || streak < milestones[i+1].day);
              
              return (
                <div key={m.day} className="flex flex-col items-center gap-3">
                  <div 
                    className={`
                      w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500 z-10 relative
                      ${isUnlocked 
                        ? 'bg-black border-orange-500 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.6)] scale-110' 
                        : 'bg-black/80 border-white/10 text-stone-600'
                      }
                      ${isCurrent ? 'animate-bounce-slow ring-4 ring-orange-500/20' : ''}
                    `}
                  >
                    <m.icon size={isUnlocked ? 20 : 18} fill={isUnlocked && m.icon === Flame ? "currentColor" : "none"} />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest absolute -bottom-8 w-20 text-center transition-colors ${isUnlocked ? 'text-orange-200' : 'text-stone-600'}`}>
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-stone-500 mt-4 italic text-center max-w-[80%]">
           Keep the flame alive daily to unlock higher tiers of worship.
        </p>
      </div>
    </div>
  );
};