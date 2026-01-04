
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

export interface GalleryItem {
  id: string;
  url: string; // Base64 or URL
  cutout: string | null; // 3D Cutout version
  dateAdded: string;
}

export interface Star {
  id: string;
  name: string;
  nickname?: string;
  
  // New Structure
  gallery: GalleryItem[];
  
  // Deprecated (kept for temporary type compatibility during migration)
  images?: string[]; 
  imageCutout?: string;

  xp: number;
  logs: XPLog[];
  tags: string[];
  bio?: string;
  nationality?: string;
  dob?: string;
  favorite?: boolean;
  streak?: number;
  lastActiveDate?: string; // ISO Date string (YYYY-MM-DD)
  
  // Soft Delete
  deletedAt?: string;
}

export interface GeminiConfig {
  apiKey: string;
}

export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

export const TAG_OPTIONS = [
  'Hollywood', 'Bollywood', 'Adult Actress', 'Model', 'Insta Influencer',
  'K-Drama', 'Blonde', 'Brunette', 'Redhead', 'Curvy', 'Petite', 'Milf', 'Teen'
];
