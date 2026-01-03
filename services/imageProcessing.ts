import { removeBackground } from "@imgly/background-removal";

// Configuration for the removal tool
// We are removing the explicit publicPath to rely on the library's default.
// The user's working test case demonstrated that the default path (usually static.img.ly) 
// works correctly with version 1.7.0.
const CONFIG = {
  model: 'isnet_fp16', // The default high-quality model
  debug: true
};

// Helper to convert Base64 Data URI to Blob safely
const dataURItoBlob = (dataURI: string): Blob => {
  try {
    const cleanURI = dataURI.replace(/\s/g, '');
    if (!cleanURI.startsWith('data:')) {
      throw new Error("String is not a valid Data URI");
    }
    const splitData = cleanURI.split(',');
    if (splitData.length < 2) {
      throw new Error("Data URI is empty");
    }
    const byteString = atob(splitData[1]);
    const mimeString = splitData[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], {type: mimeString});
  } catch (e: any) {
    console.error("Blob conversion failed:", e);
    throw new Error("Could not process image data. File might be corrupted.");
  }
};

export const generateCutout = async (
  imageSource: string, 
  onProgress?: (message: string, progress: number) => void
): Promise<string> => {
  try {
    let input: Blob | string = imageSource;

    // 1. Prepare Input (Handle URLs vs Data URIs)
    if (imageSource.startsWith('data:')) {
      input = dataURItoBlob(imageSource);
    } else if (imageSource.startsWith('http')) {
       try {
         const response = await fetch(imageSource, { mode: 'cors' });
         if (response.ok) {
           input = await response.blob();
         } else {
           throw new Error(`Failed to access image URL: ${response.status}`);
         }
       } catch (e) {
         console.warn("Pre-fetch failed, passing URL to library:", e);
         input = imageSource;
       }
    }

    // 2. Run Background Removal
    const transparentBlob = await removeBackground(input, {
      ...CONFIG,
      progress: (key: string, current: number, total: number) => {
          if (onProgress) {
             let percent = 0;
             let message = "Initializing...";
             if (total === 0) total = 1;

             if (key.includes('fetch')) {
                message = `Downloading AI Model... (${Math.round((current/total)*100)}%)`;
                percent = Math.round((current / total) * 40);
             } else if (key.includes('compute') || key.includes('inference')) {
                message = `Processing Image...`;
                percent = 40 + Math.round((current / total) * 60);
             } else {
                message = `Loading ${key}...`;
                percent = Math.round((current / total) * 100);
             }
             
             onProgress(message, Math.min(percent, 99));
          }
      }
    });

    // 3. Resize & Optimize for Storage
    if (onProgress) onProgress("Finalizing...", 100);
    return resizeImageBlob(transparentBlob, 600); // Max height 600px

  } catch (error: any) {
    console.error("Background Removal Error:", error);
    
    const msg = error?.message || error?.toString();
    
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('NetworkError')) {
       throw new Error("Network Error: Failed to download AI resources. Check internet.");
    }
    // Handle the specific metadata error if it still occurs despite using default
    if (msg.includes('Resource metadata not found')) {
       throw new Error("AI Model Error: Resource metadata missing. Try disabling AdBlock.");
    }
    
    throw new Error(`Failed to generate 3D cutout: ${msg.substring(0, 60)}...`);
  }
};

const resizeImageBlob = (blob: Blob, maxHeight: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
        if (height > maxHeight) {
          width = width * (maxHeight / height);
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
             reject(new Error("Canvas context failed"));
             return;
        }

        // High quality downscaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as PNG to preserve transparency
        resolve(canvas.toDataURL('image/png')); 
      };
      img.onerror = () => reject(new Error("Failed to load image for resizing"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read blob"));
    reader.readAsDataURL(blob);
  });
};