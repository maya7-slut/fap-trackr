import { GoogleGenAI } from "@google/genai";
import { AspectRatio } from "../types";

// --- Error Parsing Helper ---
const mapGeminiError = (error: any): string => {
  const msg = error.toString().toLowerCase();
  
  if (msg.includes('403') || msg.includes('permission_denied')) {
    return "API Key lacks permission for this model. (403)";
  }
  if (msg.includes('400') || msg.includes('invalid_argument')) {
    return "Invalid request. Please check your prompt or settings. (400)";
  }
  if (msg.includes('401') || msg.includes('unauthenticated')) {
    return "Invalid API Key. Please check your settings. (401)";
  }
  if (msg.includes('429') || msg.includes('resource_exhausted')) {
    return "Quota exceeded. You are generating too fast. (429)";
  }
  if (msg.includes('500') || msg.includes('internal')) {
    return "Google AI servers are having a moment. Try again. (500)";
  }
  return error.message || "An unexpected connection error occurred.";
};

// Helper to safely get env vars
const getEnvVar = (key: string): string | undefined => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      return (import.meta as any).env[key];
    }
  } catch (e) { }
  return undefined;
};

// Helper to get client with dynamic key
const getClient = (apiKey?: string) => {
  // Check passed key, then environment
  const key = apiKey || getEnvVar('VITE_GEMINI_API_KEY');
  
  if (!key) throw new Error("API Key not provided. Please add it in Settings.");
  return new GoogleGenAI({ apiKey: key });
};

export const generateBio = async (apiKey: string, name: string, nickname: string, tags: string[], imageBase64?: string) => {
  try {
    const ai = getClient(apiKey);
    
    let userPrompt = `Analyze the star named "${name}"`;
    if (nickname) userPrompt += ` (known as ${nickname})`;
    if (tags.length) userPrompt += ` who is tagged with: ${tags.join(', ')}.`;
    
    userPrompt += `
    Return a valid JSON object with the following fields:
    - "bio": A short, seductive, and alluring description (max 60 words). Focus on captivating features, mystery, and why she is worshipped.
    - "nationality": Her likely country of origin INCLUDING the flag emoji at the start (e.g., "🇺🇸 USA", "🇫🇷 France").
    - "dob": Her date of birth in YYYY-MM-DD format (estimate year if unknown).
    `;

    const parts: any[] = [];
    
    if (imageBase64) {
        // Remove header if present
        const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
        let mimeType = 'image/jpeg';
        const match = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
        if (match) mimeType = match[1];
        
        parts.push({
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64
            }
        });
        userPrompt += " Base the details on the visual appearance in the attached image if specific data isn't known.";
    }

    parts.push({ text: userPrompt });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts },
      config: {
        responseMimeType: 'application/json'
      }
    });
    
    return JSON.parse(response.text || '{}');
  } catch (error) {
    throw new Error(mapGeminiError(error));
  }
};

export const generateSultryPromptFromBio = async (apiKey: string, bio: string) => {
  try {
    const ai = getClient(apiKey);
    const prompt = `Based on this description of a woman: "${bio}", write a high-quality, photorealistic text-to-image prompt. 
    Focus on visual details, lighting (e.g. cinematic, candlelight), and a sultry atmosphere. 
    Return ONLY the prompt text, no explanations.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
    });

    return response.text;
  } catch (error) {
    throw new Error(mapGeminiError(error));
  }
};

export const analyzeImage = async (apiKey: string, base64Data: string) => {
  try {
    const ai = getClient(apiKey);
    
    let mimeType = 'image/jpeg';
    const match = base64Data.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    if (match) mimeType = match[1];

    const cleanBase64 = base64Data.split(',')[1] || base64Data;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: cleanBase64 } },
          { text: "Analyze this image. Suggest 5 short tags describing her appearance (e.g. hair color, style, vibe) and a one-sentence compliment emphasizing her allure." }
        ]
      }
    });

    return response.text;
  } catch (error) {
    throw new Error(mapGeminiError(error));
  }
};

// Returns object with { image: string, modelUsed: string }
export const generateFantasyImage = async (apiKey: string, prompt: string, aspectRatio: AspectRatio): Promise<{ image: string, modelUsed: string }> => {
  const ai = getClient(apiKey);
  
  // Strategy: Try Pro first. If 403/404 (Permission/Not Found), fallback to Flash.
  
  // 1. Attempt Pro Model
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: '1K' 
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return { 
          image: `data:image/png;base64,${part.inlineData.data}`,
          modelUsed: 'Pro (High Quality)'
        };
      }
    }
  } catch (error: any) {
    const errorMsg = error.toString();
    // Check for permission/existence errors to trigger fallback
    if (errorMsg.includes('403') || errorMsg.includes('404') || errorMsg.includes('PERMISSION_DENIED') || errorMsg.includes('NOT_FOUND')) {
      console.warn("Pro model failed, falling back to Flash:", errorMsg);
      
      // 2. Fallback to Flash Model
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: prompt }] },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio
              // imageSize not supported in flash
            }
          }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            return { 
              image: `data:image/png;base64,${part.inlineData.data}`,
              modelUsed: 'Flash (Fast)'
            };
          }
        }
      } catch (flashError) {
        throw new Error(`Fallback failed: ${mapGeminiError(flashError)}`);
      }
    } else {
      // If it's another error (like 401 Invalid Key), throw immediately
      throw new Error(mapGeminiError(error));
    }
  }

  throw new Error("No image generated from either model.");
};