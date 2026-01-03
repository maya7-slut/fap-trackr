import { StarCategory } from './types';

export const getCategory = (xp: number): StarCategory => {
  if (xp >= 101) return StarCategory.Goddess;
  if (xp >= 11) return StarCategory.Enchantress;
  if (xp >= 1) return StarCategory.Temptress;
  return StarCategory.Unawakened;
};

export const getCategoryColor = (category: StarCategory): string => {
  switch (category) {
    case StarCategory.Goddess: return 'text-amber-400 border-amber-400 shadow-amber-500/50';
    case StarCategory.Enchantress: return 'text-purple-400 border-purple-400 shadow-purple-500/50';
    case StarCategory.Temptress: return 'text-rose-400 border-rose-400 shadow-rose-500/50';
    default: return 'text-stone-500 border-stone-700';
  }
};

export const getCategoryGlow = (category: StarCategory): string => {
  switch (category) {
    case StarCategory.Goddess: return 'shadow-[0_0_30px_rgba(251,191,36,0.3)]';
    case StarCategory.Enchantress: return 'shadow-[0_0_20px_rgba(192,132,252,0.3)]';
    case StarCategory.Temptress: return 'shadow-[0_0_15px_rgba(251,113,133,0.3)]';
    default: return '';
  }
};
