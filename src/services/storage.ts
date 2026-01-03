import { Star } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEY = 'star_mastery_data_v1';

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
  // If it's already a URL (http/https) or generic path, skip upload
  if (!base64 || !base64.startsWith('data:')) return base64;
  
  try {
    const blob = base64ToBlob(base64);
    const ext = blob.type.split('/')[1] || 'jpg';
    const fileName = `${userId}/${starId}/${prefix}_${Date.now()}.${ext}`;

    // Upload to 'star-gallery' bucket
    const { error } = await supabase.storage
      .from('star-gallery')
      .upload(fileName, blob, { contentType: blob.type, upsert: true });

    if (error) {
      console.error("[Storage] Upload Error:", error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('star-gallery')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error("Image upload failed:", error);
    return base64; // Fallback to keeping the base64 string if upload fails
  }
};

// --- Primary API ---

export const getStars = async (userId?: string): Promise<Star[]> => {
  // 1. Cloud Mode (Only if ID is valid and NOT 'guest')
  if (userId && userId !== 'guest' && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('stars')
        .select(`*, logs(*)`)
        .eq('user_id', userId)
        .order('xp', { ascending: false });

      if (error) throw error;
      
      // Transform DB snake_case to app camelCase
      return (data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        nickname: s.nickname,
        images: s.images || [],
        imageCutout: s.image_cutout, 
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
      }));
    } catch (e) {
      console.error("Cloud fetch failed, falling back to local:", e);
    }
  }

  // 2. Local Mode
  const localData = localStorage.getItem(STORAGE_KEY);
  return localData ? JSON.parse(localData) : [];
};

export const createStar = async (star: Star, userId?: string): Promise<Star> => {
  if (userId && userId !== 'guest' && isSupabaseConfigured) {
    console.log("[Storage] Starting CreateStar...");
    
    // A. Upload images to Cloud first
    const uploadedImages = await Promise.all(
      star.images.map((img, i) => uploadToSupabase(userId, star.id, img, `main_${i}`))
    );
    
    let cutoutUrl = star.imageCutout;
    if (star.imageCutout) {
      cutoutUrl = await uploadToSupabase(userId, star.id, star.imageCutout, 'cutout');
    }

    // B. Insert into DB
    const dbPayload = {
      id: star.id, // Must be UUID if DB column is uuid
      user_id: userId,
      name: star.name,
      nickname: star.nickname || null,
      images: uploadedImages,
      image_cutout: cutoutUrl || null,
      xp: star.xp,
      tags: star.tags,
      bio: star.bio || null,
      nationality: star.nationality || null,
      dob: star.dob || null,
      favorite: star.favorite,
      streak: star.streak,
      last_active_date: star.lastActiveDate || null
    };

    console.log("[Storage] DB Payload prepared:", JSON.stringify(dbPayload, null, 2));

    const { data, error } = await supabase.from('stars').insert(dbPayload).select().single();
    
    if (error) {
        console.error("----- Supabase Insert Error -----");
        console.error("Message:", error.message);
        console.error("Details:", error.details);
        console.error("Hint:", error.hint);
        console.error("Code:", error.code);
        console.error("Payload ID Type:", typeof star.id);
        console.error("Payload ID Value:", star.id);
        throw error;
    }
    
    return { ...star, ...data, images: uploadedImages, imageCutout: cutoutUrl };
  }

  // Local Fallback
  const stars = await getStars();
  const updated = [...stars, star];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return star;
};

export const updateStar = async (star: Star, userId?: string): Promise<void> => {
  if (userId && userId !== 'guest' && isSupabaseConfigured) {
    // 1. Check for new Base64 images to upload
    const processedImages = await Promise.all(
      star.images.map(img => img.startsWith('data:') ? uploadToSupabase(userId, star.id, img) : img)
    );

    let cutoutUrl = star.imageCutout;
    if (star.imageCutout && star.imageCutout.startsWith('data:')) {
      cutoutUrl = await uploadToSupabase(userId, star.id, star.imageCutout, 'cutout');
    }

    // 2. Update Star Table
    const { error } = await supabase
      .from('stars')
      .update({
        name: star.name,
        nickname: star.nickname || null,
        images: processedImages,
        image_cutout: cutoutUrl || null,
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

    if (error) {
        console.error("[Storage] Update Failed:", error.message, error.details);
        throw error;
    }

    // 3. Sync Logs
    if (star.logs && star.logs.length > 0) {
       const latest = star.logs[0];
       // Only upsert the latest log to save bandwidth/calls, assumes older logs don't change often
       const { error: logError } = await supabase.from('logs').upsert({
          id: latest.id, 
          user_id: userId,
          star_id: star.id,
          amount: latest.amount,
          note: latest.note,
          date: latest.date
       }, { onConflict: 'id', ignoreDuplicates: true });

       if (logError) console.error("[Storage] Log Sync Failed:", logError.message, logError.details);
    }
    return;
  }

  // Local Fallback
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
    if (error) {
         console.error("[Storage] Delete Failed:", error);
         throw error;
    }
    return;
  }

  const stars = (await getStars()).filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stars));
};