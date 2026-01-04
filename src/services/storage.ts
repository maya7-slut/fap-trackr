
import { Star, GalleryItem } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEY = 'star_mastery_data_v1';

// --- Helper: Generate ID ---
const generateId = () => Math.random().toString(36).substring(2, 9);

// --- Helper: Base64 to Blob for Supabase Upload ---
const base64ToBlob = (base64: string): Blob => {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
};

// --- Helper: Upload Image to Supabase ---
const uploadToSupabase = async (userId: string, starId: string, base64: string, prefix: string = 'img'): Promise<string> => {
  if (!base64 || !base64.startsWith('data:')) return base64;
  
  try {
    const blob = base64ToBlob(base64);
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
        .order('xp', { ascending: false });

      if (error) throw error;
      
      return (data || []).map((s: any) => {
        // Migration Logic: If gallery is empty but images exist, map them
        let gallery: GalleryItem[] = s.gallery || [];
        
        if (gallery.length === 0 && s.images && s.images.length > 0) {
          gallery = s.images.map((img: string, i: number) => ({
            id: generateId(),
            url: img,
            cutout: (i === 0) ? s.image_cutout : null,
            dateAdded: new Date().toISOString()
          }));
        }

        return {
          id: s.id,
          name: s.name,
          nickname: s.nickname,
          gallery: gallery,
          images: [], // Deprecated
          xp: s.xp,
          tags: s.tags || [],
          bio: s.bio,
          nationality: s.nationality,
          dob: s.dob,
          favorite: s.favorite,
          streak: s.streak,
          lastActiveDate: s.last_active_date,
          logs: (s.logs || []).map((l: any) => ({
             id: l.id,
             date: l.date,
             amount: l.amount,
             note: l.note
          })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        };
      });
    } catch (e) {
      console.error("Cloud fetch failed, falling back to local:", e);
    }
  }

  // 2. Local Mode
  const localData = localStorage.getItem(STORAGE_KEY);
  const parsed = localData ? JSON.parse(localData) : [];
  
  // Local Migration
  return parsed.map((s: any) => {
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
};

export const createStar = async (star: Star, userId?: string): Promise<Star> => {
  if (userId && userId !== 'guest' && isSupabaseConfigured) {
    
    // Process Gallery Images (Upload main + cutouts)
    const processedGallery = await Promise.all(star.gallery.map(async (item, i) => {
       const url = await uploadToSupabase(userId, star.id, item.url, `main_${i}`);
       const cutout = item.cutout ? await uploadToSupabase(userId, star.id, item.cutout, `cutout_${i}`) : null;
       return { ...item, url, cutout };
    }));

    // Backward compatibility for old columns
    const legacyImages = processedGallery.map(g => g.url);
    const legacyCutout = processedGallery[0]?.cutout || null;

    const dbPayload = {
      id: star.id,
      user_id: userId,
      name: star.name,
      nickname: star.nickname || null,
      
      // New Column
      gallery: processedGallery,
      
      // Old Columns (Sync for safety)
      images: legacyImages,
      image_cutout: legacyCutout,

      xp: star.xp,
      tags: star.tags,
      bio: star.bio || null,
      nationality: star.nationality || null,
      dob: star.dob || null,
      favorite: star.favorite,
      streak: star.streak,
      last_active_date: star.lastActiveDate || null
    };

    const { data, error } = await supabase.from('stars').insert(dbPayload).select().single();
    if (error) throw error;
    
    return { ...star, ...data, gallery: processedGallery };
  }

  // Local Save
  const stars = await getStars();
  const updated = [...stars, star];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return star;
};

export const updateStar = async (star: Star, userId?: string): Promise<void> => {
  if (userId && userId !== 'guest' && isSupabaseConfigured) {
    
    // Process Gallery Uploads
    const processedGallery = await Promise.all(star.gallery.map(async (item, i) => {
       // Only upload if it looks like base64
       const url = item.url.startsWith('data:') ? await uploadToSupabase(userId, star.id, item.url, `main_${i}_${Date.now()}`) : item.url;
       const cutout = (item.cutout && item.cutout.startsWith('data:')) ? await uploadToSupabase(userId, star.id, item.cutout, `cutout_${i}_${Date.now()}`) : item.cutout;
       return { ...item, url, cutout };
    }));

    const legacyImages = processedGallery.map(g => g.url);
    const legacyCutout = processedGallery[0]?.cutout || null;

    const { error } = await supabase
      .from('stars')
      .update({
        name: star.name,
        nickname: star.nickname || null,
        gallery: processedGallery, // Update Gallery JSONB
        images: legacyImages,
        image_cutout: legacyCutout,
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
       await supabase.from('logs').upsert({
          id: latest.id, 
          user_id: userId,
          star_id: star.id,
          amount: latest.amount,
          note: latest.note,
          date: latest.date
       }, { onConflict: 'id', ignoreDuplicates: true });
    }
    return;
  }

  // Local Save
  const stars = await getStars();
  const index = stars.findIndex(s => s.id === star.id);
  if (index !== -1) {
    stars[index] = star;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stars));
  }
};

export const deleteStar = async (id: string, userId?: string): Promise<void> => {
  if (userId && userId !== 'guest' && isSupabaseConfigured) {
    const { error } = await supabase.from('stars').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
    return;
  }
  const stars = (await getStars()).filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stars));
};
