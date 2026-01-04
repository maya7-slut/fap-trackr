
import { removeBackground } from "@imgly/background-removal";

// Configuration for the removal tool
const CONFIG = {
  model: 'isnet_fp16', // The default high-quality model
  debug: false
};

// --- Helper: Convert Base64 Data URI to Blob safely ---
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

// --- Helper: Downscale Blob (Performance Optimization) ---
// Resizes large images to a manageable size (maxDim) BEFORE AI processing.
const downscaleBlob = (blob: Blob, maxDim: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                
                // Only resize if significantly larger to save processing
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height *= maxDim / width;
                        width = maxDim;
                    } else {
                        width *= maxDim / height;
                        height = maxDim;
                    }
                } else {
                    resolve(blob); // Return original if small enough
                    return;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) { reject(new Error("Canvas context failed")); return; }
                
                // Use high quality scaling
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((b) => {
                    if (b) resolve(b);
                    else reject(new Error("Resize failed"));
                }, 'image/jpeg', 0.9);
            };
            img.onerror = () => reject(new Error("Image load failed"));
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(blob);
    });
};

// --- Helper: Resize Output for Storage ---
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

// --- Public: Process Uploaded Image (Client Side Optimization) ---
export const processUploadedImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const MAX_DIM = 1200;
        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Canvas context failed"));
          return;
        }
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

// --- Main Function: Generate Cutout ---
export const generateCutout = async (
  imageSource: string, 
  onProgress?: (message: string, progress: number) => void
): Promise<string> => {
  try {
    let inputBlob: Blob;

    // 1. Prepare Input (Handle Data URI or URL)
    if (imageSource.startsWith('data:')) {
      inputBlob = dataURItoBlob(imageSource);
    } else if (imageSource.startsWith('http')) {
       try {
         const response = await fetch(imageSource, { mode: 'cors' });
         if (!response.ok) throw new Error(`HTTP ${response.status}`);
         inputBlob = await response.blob();
       } catch (e) {
         console.warn("Fetch failed, CORS might block external URLs.");
         throw new Error("Cannot process this image URL directly due to browser security. Please upload the file.");
       }
    } else {
        throw new Error("Invalid image source.");
    }

    // 2. Optimization: Downscale Source BEFORE AI
    // 1000px is sufficient for accurate edge detection but uses 10x less RAM than 4K.
    if (onProgress) onProgress("Optimizing...", 10);
    const optimizedBlob = await downscaleBlob(inputBlob, 1000);

    // 3. Run Background Removal
    const transparentBlob = await removeBackground(optimizedBlob, {
      ...CONFIG,
      progress: (key: string, current: number, total: number) => {
          if (onProgress) {
             let percent = 0;
             let message = "Processing...";
             if (total === 0) total = 1;

             if (key.includes('fetch')) {
                message = `Downloading AI Model... (${Math.round((current/total)*100)}%)`;
                percent = 10 + Math.round((current / total) * 30);
             } else if (key.includes('compute') || key.includes('inference')) {
                message = `Removing Background...`;
                percent = 40 + Math.round((current / total) * 50);
             } else {
                percent = Math.round((current / total) * 90);
             }
             
             onProgress(message, Math.min(percent, 95));
          }
      }
    });

    // 4. Resize Output & Convert to Base64
    if (onProgress) onProgress("Finalizing...", 98);
    return resizeImageBlob(transparentBlob, 600); // Max height 600px for storage efficiency

  } catch (error: any) {
    console.error("Background Removal Error:", error);
    const msg = error?.message || error?.toString();
    
    if (msg.includes('fetch') || msg.includes('network')) {
       throw new Error("Network Error: Failed to download AI resources. Check internet.");
    }
    
    throw new Error(`Failed to generate 3D cutout: ${msg.substring(0, 50)}...`);
  }
};
