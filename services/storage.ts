import { Star } from '../types';

const STORAGE_KEY = 'star_mastery_data_v1';

// Seed data with placeholder images - User needs to update with real images if desired
const defaultStars: Star[] = [
  {
    id: 'seed-1',
    name: 'Kriti Sanon',
    nickname: 'Param Sundari',
    // Using high quality generic placeholders. 
    // In a real scenario, the user would upload real Base64 images.
    images: ['https://images.unsplash.com/photo-1616091093747-478045110903?q=80&w=600&auto=format&fit=crop'], 
    gallery: [
      {
        id: 'seed-g1',
        url: 'https://images.unsplash.com/photo-1616091093747-478045110903?q=80&w=600&auto=format&fit=crop',
        cutout: null,
        dateAdded: new Date().toISOString()
      }
    ],
    xp: 100,
    logs: [
       { id: 'l1', date: new Date().toISOString(), amount: 100, note: "Initial worship" }
    ],
    tags: ['Bollywood', 'Model', 'Tall', 'Brunette'],
    bio: 'The towering beauty with legs for days and a smile that melts hearts.',
    nationality: '🇮🇳 India',
    dob: '1990-07-27',
    favorite: true,
    streak: 30,
    lastActiveDate: new Date().toISOString()
  },
  {
    id: 'seed-2',
    name: 'Alia Bhatt',
    nickname: 'Aloo',
    images: ['https://images.unsplash.com/photo-1621784563330-caee0b138a00?q=80&w=600&auto=format&fit=crop'],
    gallery: [
      {
        id: 'seed-g2',
        url: 'https://images.unsplash.com/photo-1621784563330-caee0b138a00?q=80&w=600&auto=format&fit=crop',
        cutout: null,
        dateAdded: new Date().toISOString()
      }
    ],
    xp: 10,
    logs: [
       { id: 'l2', date: new Date().toISOString(), amount: 10, note: "Quick spark" }
    ],
    tags: ['Bollywood', 'Cute', 'Petite'],
    bio: 'The sparkling star with intense talent and undeniable charm.',
    nationality: '🇮🇳 India',
    dob: '1993-03-15',
    favorite: false,
    streak: 4,
    lastActiveDate: new Date().toISOString()
  }
];

export const getStars = (): Star[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultStars));
    return defaultStars;
  }
  const stars = JSON.parse(data);
  // Merge default stars if storage is empty array (edge case for manual clear)
  if (stars.length === 0 && localStorage.getItem('has_seeded') !== 'true') {
     localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultStars));
     localStorage.setItem('has_seeded', 'true');
     return defaultStars;
  }
  return stars;
};

export const saveStars = (stars: Star[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stars));
  localStorage.setItem('has_seeded', 'true');
};

export const updateStar = (updatedStar: Star) => {
  const stars = getStars();
  const index = stars.findIndex(s => s.id === updatedStar.id);
  if (index !== -1) {
    stars[index] = updatedStar;
    saveStars(stars);
  }
};

export const deleteStar = (id: string) => {
  const stars = getStars().filter(s => s.id !== id);
  saveStars(stars);
};

export const createStar = (star: Star) => {
  const stars = getStars();
  saveStars([...stars, star]);
};