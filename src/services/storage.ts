
import { Star, GalleryItem } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEY = 'star_mastery_data_v1';

// --- Helper: UUID Generator (Compatible with Supabase uuid columns) ---
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// UUID Validation Regex
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Seed data with valid UUIDs to prevent database errors
const defaultStars: Star[] = [
  {
    id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', // Valid UUID
    name: 'Kriti Sanon',
    nickname: 'Param Sundari',
    gallery: [
      {
        id: generateId(),
        url: 'https://images.unsplash.com/photo-1616091093747-478045110903?q=80&w=600&auto=format&fit=crop',
        cutout: null,
        dateAdded: new Date().toISOString()
      }
    ],
    xp: 100,
    logs: [
       { id: generateId(), date: new Date().toISOString(), amount: 100, note: "Initial worship" }
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
    id: '109156be-c4fb-41ea-b1b4-efe1678cfa88', // Valid UUID
    name: 'Alia Bhatt',
    nickname: 'Aloo',
    gallery: [
      {
        id: generateId(),
        url: 'https://images.unsplash.com/photo-1621784563330-caee0b138a00?q=80&w=600&auto=format&fit=crop',
        cutout: null,
        dateAdded: new Date().toISOString()
      }
    ],
    xp: 10,
    logs: [
       { id: generateId(), date: new Date().toISOString(), amount: 10, note: "Quick spark" }
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

// --- Helper: Standardized Error Handler ---
const handleStorageError = (operation: string, error: any): never => {
  console.error(`[Storage] ${operation} failed:`, error);
  const msg = error?.message || error?.error_description || "Unknown error occurred";
  
  if (msg.includes('fetch') || msg.includes('network')) {
    throw new Error(`Network error during ${operation}. Check your connection.`);
  }
  if (msg.includes('JWT') || msg.includes('auth')) {
    throw new Error(`Authentication error during ${operation}. Please re-login.`);
  }
  // Handle Schema Mismatches (e.g., missing columns) gracefully
  if (msg.includes('PGRST204') || msg.includes('column')) {
    throw new Error(`Database schema mismatch. Please run the migration scripts in Supabase.`);
  }
  
  throw new Error(`Failed to ${operation}: ${msg}`);
};

// --- Helper: Base64 to Blob for Supabase Upload ---
const base64ToBlob = (base64: string): Blob => {
  try {
    const parts = base64.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  } catch (e) {
    console.error("Blob conversion failed", e);
    return new Blob([]);
  }
};

// --- Helper: Upload Image to Supabase ---
const uploadToSupabase = async (userId: string, starId: string, base64: string, prefix: string = 'img'): Promise<string> => {
  if (!base64 || !base64.startsWith('data:')) return base64;
  
  try {
    const blob = base64ToBlob(base64);
    if (blob.size === 0) throw new Error("Invalid image data");

    const ext = blob.type.split('/')[1] || 'jpg';
    const fileName = `${userId}/${starId}/${prefix}_${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('star-gallery')
      .upload(fileName, blob, { contentType: blob.type, upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('star-gallery')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error("Image upload failed, using local base64:", error);
    return base64; 
  }
};

// --- Primary API ---

export const getStars = async (userId?: string): Promise<Star[]> => {
  // 1. Cloud Mode
  if (userId && userId !== 'guest' && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('stars')
        .select(`*, logs(*)`)
        .eq('user_id', userId)
        .is('deleted_at', null) // Filter out soft-deleted stars
        .order('xp', { ascending: false });

      if (error) throw error;
      
      return (data || []).map((s: any) => {
        // Migration Logic: Convert legacy structure to new Gallery structure if needed
        let gallery: GalleryItem[] = s.gallery || [];
        
        // Fallback: If gallery is empty but legacy columns exist
        if (gallery.length === 0 && s.images && s.images.length > 0) {
          gallery = s.images.map((img: string, i: number) => ({
            id: generateId(),
            url: img,
            cutout: (i === 0 && s.image_cutout) ? s.image_cutout : null,
            dateAdded: new Date().toISOString()
          }));
        }

        const activeLogs = (s.logs || [])
          .filter((l: any) => !l.deleted_at) 
          .map((l: any) => ({
             id: l.id,
             date: l.date,
             amount: l.amount,
             note: l.note
          }))
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return {
          id: s.id,
          name: s.name,
          nickname: s.nickname,
          gallery: gallery,
          images: [], 
          xp: s.xp,
          tags: s.tags || [],
          bio: s.bio,
          nationality: s.nationality,
          dob: s.dob,
          favorite: s.favorite,
          streak: s.streak,
          lastActiveDate: s.last_active_date,
          logs: activeLogs
        };
      });
    } catch (e) {
      console.error("Cloud fetch failed, falling back to local:", e);
    }
  }

  // 2. Local Mode
  try {
    const localData = localStorage.getItem(STORAGE_KEY);
    
    // If no local data, seed it
    if (!localData) {
       localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultStars));
       return defaultStars;
    }
    
    const parsed = JSON.parse(localData);
    
    return parsed
      .filter((s: any) => !s.deletedAt) 
      .map((s: any) => {
        if (!s.gallery && s.images) {
            s.gallery = s.images.map((img: string, i: number) => ({
              id: generateId(),
              url: img,
              cutout: i === 0 ? s.imageCutout : null,
              dateAdded: new Date().toISOString()
            }));
        }
        return s;
    });
  } catch (e) {
    console.error("Local storage read error", e);
    return [];
  }
};

export const createStar = async (star: Star, userId?: string): Promise<Star> => {
  if (userId && userId !== 'guest' && isSupabaseConfigured) {
    try {
      // Validate ID: If it's a legacy Timestamp ID, generate a new UUID
      let finalStarId = star.id;
      if (!uuidRegex.test(finalStarId)) {
        finalStarId = generateId();
        console.log("Migrating legacy ID to UUID:", finalStarId);
      }

      // Process Gallery
      const processedGallery = await Promise.all(star.gallery.map(async (item, i) => {
        const url = await uploadToSupabase(userId, finalStarId, item.url, `main_${i}`);
        const cutout = item.cutout ? await uploadToSupabase(userId, finalStarId, item.cutout, `cutout_${i}`) : null;
        return { ...item, url, cutout };
      }));

      // Strictly map only columns that exist in schema
      const dbPayload = {
        id: finalStarId,
        user_id: userId,
        name: star.name,
        nickname: star.nickname || null,
        gallery: processedGallery,
        xp: star.xp,
        tags: star.tags,
        bio: star.bio || null,
        nationality: star.nationality || null,
        dob: star.dob || null,
        favorite: star.favorite,
        streak: star.streak,
        last_active_date: star.lastActiveDate || null,
        deleted_at: null 
      };

      const { data, error } = await supabase.from('stars').insert(dbPayload).select().single();
      if (error) throw error;
      
      return { ...star, ...data, gallery: processedGallery };
    } catch (e) {
      handleStorageError("create star", e);
    }
  }

  // Local Save
  try {
    const stars = await getStars();
    const updated = [...stars, star];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return star;
  } catch (e) {
    handleStorageError("save locally", e);
  }
  return star;
};

export const updateStar = async (star: Star, userId?: string): Promise<void> => {
  if (userId && userId !== 'guest' && isSupabaseConfigured) {
    try {
      // Auto-Migration Check: 
      // If we try to update a star with a legacy timestamp ID, it won't exist in Supabase (because valid IDs are UUIDs).
      // We must divert to 'create' (insert) logic with a fresh UUID.
      if (!uuidRegex.test(star.id)) {
        console.warn("Attempting to update a legacy ID in cloud. Diverting to CREATE migration.");
        await createStar(star, userId);
        return;
      }

      const processedGallery = await Promise.all(star.gallery.map(async (item, i) => {
        const url = item.url.startsWith('data:') ? await uploadToSupabase(userId, star.id, item.url, `main_${i}_${Date.now()}`) : item.url;
        const cutout = (item.cutout && item.cutout.startsWith('data:')) ? await uploadToSupabase(userId, star.id, item.cutout, `cutout_${i}_${Date.now()}`) : item.cutout;
        return { ...item, url, cutout };
      }));

      const { error } = await supabase
        .from('stars')
        .update({
          name: star.name,
          nickname: star.nickname || null,
          gallery: processedGallery,
          xp: star.xp,
          tags: star.tags,
          bio: star.bio || null,
          nationality: star.nationality || null,
          dob: star.dob || null,
          favorite: star.favorite,
          streak: star.streak,
          last_active_date: star.lastActiveDate || null
        })
        .eq('id', star.id)
        .eq('user_id', userId);

      if (error) throw error;

      if (star.logs && star.logs.length > 0) {
        const latest = star.logs[0];
        
        // Ensure Log ID is UUID
        let logId = latest.id;
        if (!uuidRegex.test(logId)) {
             logId = generateId();
        }

        const logPayload = {
            id: logId, 
            user_id: userId,
            star_id: star.id,
            amount: latest.amount,
            note: latest.note,
            date: latest.date
        };
        
        const { error: logError } = await supabase.from('logs')
           .upsert(logPayload, { onConflict: 'id', ignoreDuplicates: false });

        if (logError) console.warn("Log upsert failed (non-fatal):", logError);
      }
    } catch (e) {
      handleStorageError("update star", e);
    }
    return;
  }

  // Local Save
  try {
    const stars = await getStars();
    const allData = localStorage.getItem(STORAGE_KEY) ? JSON.parse(localStorage.getItem(STORAGE_KEY)!) : [];
    
    const index = allData.findIndex((s: any) => s.id === star.id);
    if (index !== -1) {
      allData[index] = star;
    } else {
      allData.push(star);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
  } catch (e) {
    handleStorageError("update locally", e);
  }
};

export const deleteStar = async (id: string, userId?: string): Promise<void> => {
  if (!id) return;

  if (userId && userId !== 'guest' && isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('stars')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId);
        
      if (error) throw error;
      return;
    } catch (e) {
      handleStorageError("delete star", e);
    }
  }

  try {
    const localData = localStorage.getItem(STORAGE_KEY);
    if (localData) {
      const allStars = JSON.parse(localData);
      const updated = allStars.map((s: any) => {
        if (s.id === id) return { ...s, deletedAt: new Date().toISOString() };
        return s;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    handleStorageError("delete locally", e);
  }
};

export const bulkDeleteStars = async (ids: string[], userId?: string): Promise<void> => {
  if (!ids || ids.length === 0) return;

  if (userId && userId !== 'guest' && isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('stars')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', ids)
        .eq('user_id', userId);

      if (error) throw error;
      return;
    } catch (e) {
      handleStorageError("bulk delete stars", e);
    }
  }

  try {
    const localData = localStorage.getItem(STORAGE_KEY);
    if (localData) {
      const allStars = JSON.parse(localData);
      const updated = allStars.map((s: any) => {
        if (ids.includes(s.id)) return { ...s, deletedAt: new Date().toISOString() };
        return s;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    handleStorageError("bulk delete locally", e);
  }
};

export const deleteLog = async (logId: string, userId?: string): Promise<void> => {
  if (!logId) return;

  if (userId && userId !== 'guest' && isSupabaseConfigured) {
     try {
       const { error } = await supabase
        .from('logs')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', logId)
        .eq('user_id', userId);
       
       if (error) {
          console.warn("Soft delete failed for log, attempting hard delete...", error.message);
          const { error: hardError } = await supabase
            .from('logs')
            .delete()
            .eq('id', logId)
            .eq('user_id', userId);
          if (hardError) throw hardError;
       }
     } catch (e) {
       handleStorageError("delete log", e);
     }
  }
};
