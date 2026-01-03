export enum StarCategory {
  Unawakened = 'Unawakened',
  Temptress = 'Temptress',
  Enchantress = 'Enchantress',
  Goddess = 'Goddess'
}

export interface XPLog {
  id: string;
  date: string; // ISO string
  amount: number;
  note?: string;
  mood?: string;
}

export interface Star {
  id: string;
  name: string;
  nickname?: string;
  images: string[]; // Base64 or URLs
  imageCutout?: string; // NEW: Base64 of transparent PNG for 3D effect
  xp: number;
  logs: XPLog[];
  tags: string[];
  bio?: string;
  nationality?: string;
  dob?: string;
  favorite?: boolean;
  streak?: number;
  lastActiveDate?: string; // ISO Date string (YYYY-MM-DD)
}

export interface GeminiConfig {
  apiKey: string;
}

export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

export const TAG_OPTIONS = [
  'Hollywood', 'Bollywood', 'Adult Actress', 'Model', 'Insta Influencer',
  'K-Drama', 'Blonde', 'Brunette', 'Redhead', 'Curvy', 'Petite', 'Milf', 'Teen'
];