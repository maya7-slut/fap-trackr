import React, { useState } from 'react';
import { Wand2, Sparkles } from 'lucide-react';
import { generateFantasyImage, generateSultryPromptFromBio } from '../../services/geminiService';
import { useToast } from '../context/ToastContext';

interface AIGeneratorProps { 
  onImageGenerated: (url: string) => void; 
  description?: string;
  apiKey: string;
  onRequestKey: () => void;
}

export const AIGenerator: React.FC<AIGeneratorProps> = ({ onImageGenerated, description, apiKey, onRequestKey }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleGenerate = async () => {
    if (!prompt) return;
    if (!apiKey) { showToast("API Key Required", 'error'); return; }
    setLoading(true);
    try {
      const fullPrompt = `A high quality, photorealistic, alluring portrait of a woman, ${prompt}, cinematic lighting, 8k`;
      const result = await generateFantasyImage(apiKey, fullPrompt, '3:4');
      onImageGenerated(result.image);
      showToast("Manifested successfully.", 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed.', 'error');
    } finally { setLoading(false); }
  };

  const handleMagicPrompt = async () => {
    if (!description || !apiKey) {
      if(!apiKey) showToast("API Key Required", 'error');
      else showToast("Bio required for magic prompt", 'error');
      return;
    }
    setLoading(true);
    try {
      const magic = await generateSultryPromptFromBio(apiKey, description);
      setPrompt(magic);
      showToast("Prompt inspired by essence.", 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to generate prompt.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-4 rounded-2xl relative overflow-hidden group border border-purple-500/20">
      <div className="flex justify-between items-center mb-2">
        <h3 className="flex items-center gap-2 text-purple-300 font-serif text-sm">
          <Wand2 size={14} /> Dream Weaver
        </h3>
        {!apiKey && <button onClick={onRequestKey} className="text-[10px] text-stone-400 bg-white/5 px-2 py-1 rounded hover:bg-white/10">Add Key</button>}
      </div>
      <div className="relative mb-8">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the fantasy..."
          className="w-full bg-black/40 border border-white/5 rounded-xl p-3 pr-10 text-xs text-purple-100 placeholder-purple-900/40 min-h-[60px] focus:border-purple-500/50 outline-none resize-none transition-all"
        />
        <div className="absolute right-2 bottom-[-2.5rem] flex gap-2">
          {description && (
            <button
              onClick={handleMagicPrompt}
              disabled={loading || !apiKey}
              className="p-2 bg-rose-600/20 text-rose-300 rounded-lg disabled:opacity-50 hover:bg-rose-600 hover:text-white transition-all text-[10px] flex items-center gap-1"
              title="Enhance Prompt from Bio"
            >
              <Sparkles size={12} /> Enhance
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt || !apiKey}
            className="p-2 bg-purple-600 rounded-lg text-white disabled:opacity-50 disabled:bg-stone-700 hover:bg-purple-500 transition-colors flex items-center gap-1 text-[10px]"
          >
            {loading ? <Sparkles size={12} className="animate-spin" /> : <>Generate <Sparkles size={12} /></>}
          </button>
        </div>
      </div>
    </div>
  );
};