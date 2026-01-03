import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface ApiKeyModalProps { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (key: string) => void; 
  currentKey: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, currentKey }) => {
  const [inputKey, setInputKey] = useState(currentKey);
  useEffect(() => { setInputKey(currentKey); }, [currentKey, isOpen]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md glass-card rounded-3xl p-8 border border-rose-500/20 shadow-[0_0_50px_rgba(225,29,72,0.15)] animate-in zoom-in-95 duration-300">
        <h2 className="font-serif text-2xl text-rose-100 flex items-center gap-3 mb-6">
          <Sparkles className="text-rose-500" /> Neural Link
        </h2>
        <input 
          type="password" 
          value={inputKey}
          onChange={(e) => setInputKey(e.target.value)}
          placeholder="Paste API Key..."
          className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-rose-50 focus:border-rose-500/50 focus:bg-black/60 outline-none transition-all font-mono text-sm mb-6"
        />
        <button 
          onClick={() => { onSave(inputKey); onClose(); }}
          className="w-full py-4 bg-gradient-to-r from-rose-700 to-rose-900 hover:from-rose-600 hover:to-rose-800 text-white font-bold rounded-xl shadow-lg shadow-rose-900/20 tracking-wider uppercase text-xs"
        >
          Establish Connection
        </button>
      </div>
    </div>
  );
};