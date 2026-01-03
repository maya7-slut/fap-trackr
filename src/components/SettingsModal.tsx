import React, { useState } from 'react';
import { Settings, Key, Sparkles, X, ChevronRight, Save, Layout, Smartphone, Palette, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useSettings, BorderStyle, CardShape } from '../context/SettingsContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveKey: (key: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, apiKey, onSaveKey }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'appearance'>('general');
  const [keyInput, setKeyInput] = useState(apiKey);
  const { settings, updateSettings, updateMargin } = useSettings();
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveKey(keyInput);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5 shrink-0">
          <h2 className="text-xl font-serif text-white flex items-center gap-2">
            <Settings size={20} className="text-stone-400" /> Settings
          </h2>
          <button onClick={onClose} className="text-stone-400 hover:text-white"><X size={20}/></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 shrink-0">
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'general' ? 'bg-white/10 text-white border-b-2 border-rose-500' : 'text-stone-500 hover:text-stone-300'}`}
          >
            General
          </button>
          <button 
            onClick={() => setActiveTab('appearance')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'appearance' ? 'bg-white/10 text-white border-b-2 border-rose-500' : 'text-stone-500 hover:text-stone-300'}`}
          >
            Appearance
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
          
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-rose-300 text-sm font-bold uppercase tracking-wider">
                  <Sparkles size={14} /> Neural Link (Gemini API)
                </div>
                <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-3">
                   <p className="text-xs text-stone-500">Required for AI Bios and Image Generation.</p>
                   <div className="flex items-center gap-2 bg-black/50 border border-white/5 rounded-lg px-3 py-2">
                     <Key size={14} className="text-stone-500" />
                     <input 
                       type="password" 
                       value={keyInput}
                       onChange={(e) => setKeyInput(e.target.value)}
                       placeholder="Enter Google API Key"
                       className="bg-transparent w-full text-sm text-white outline-none placeholder:text-stone-700 font-mono"
                     />
                   </div>
                   <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[10px] text-rose-500 hover:underline flex items-center gap-1">
                     Get API Key <ChevronRight size={10} />
                   </a>
                </div>
              </div>

              <div className="space-y-2">
                 <div className="flex items-center gap-2 text-stone-300 text-sm font-bold uppercase tracking-wider">
                   Info
                 </div>
                 <p className="text-xs text-stone-500 leading-relaxed">
                   Fap Tracker v1.1.0. All data stored locally. 
                   The "Pop-Out" 3D effect uses local ML.
                 </p>
              </div>
            </>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <div className="space-y-8">
              
              {/* Manual Margins */}
              <div className="space-y-4">
                 <div className="flex items-center gap-2 text-blue-300 text-sm font-bold uppercase tracking-wider">
                    <Layout size={14} /> Card Spacing Fix
                 </div>
                 <p className="text-[10px] text-stone-500">Adjust margins to prevent overlapping on your specific device.</p>
                 
                 <div className="bg-black/40 border border-white/10 rounded-xl p-6 flex flex-col items-center gap-4">
                    {/* Top */}
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-stone-500 w-8 text-right">Top</span>
                       <input 
                         type="number" 
                         value={settings.margins.top}
                         onChange={(e) => updateMargin('top', Number(e.target.value))}
                         className="w-16 bg-white/5 border border-white/10 rounded-lg p-2 text-center text-sm text-white outline-none focus:border-rose-500"
                       />
                       <span className="text-[10px] text-stone-600">px</span>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        {/* Left */}
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-stone-500">Left</span>
                          <input 
                            type="number" 
                            value={settings.margins.left}
                            onChange={(e) => updateMargin('left', Number(e.target.value))}
                            className="w-16 bg-white/5 border border-white/10 rounded-lg p-2 text-center text-sm text-white outline-none focus:border-rose-500"
                          />
                        </div>
                        
                        {/* Visual D-Pad Center */}
                        <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center">
                           <Smartphone size={20} className="text-stone-600" />
                        </div>

                        {/* Right */}
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-stone-500">Right</span>
                          <input 
                            type="number" 
                            value={settings.margins.right}
                            onChange={(e) => updateMargin('right', Number(e.target.value))}
                            className="w-16 bg-white/5 border border-white/10 rounded-lg p-2 text-center text-sm text-white outline-none focus:border-rose-500"
                          />
                        </div>
                    </div>

                    {/* Bottom */}
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-stone-500 w-8 text-right">Bot</span>
                       <input 
                         type="number" 
                         value={settings.margins.bottom}
                         onChange={(e) => updateMargin('bottom', Number(e.target.value))}
                         className="w-16 bg-white/5 border border-white/10 rounded-lg p-2 text-center text-sm text-white outline-none focus:border-rose-500"
                       />
                       <span className="text-[10px] text-stone-600">px</span>
                    </div>
                 </div>
              </div>

              {/* Card Shape */}
              <div className="space-y-4">
                 <div className="flex items-center gap-2 text-purple-300 text-sm font-bold uppercase tracking-wider">
                    <Smartphone size={14} /> Card Shape
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => updateSettings({ cardShape: 'rectangle' })}
                      className={`p-4 border rounded-2xl flex flex-col items-center gap-2 transition-all ${settings.cardShape === 'rectangle' ? 'bg-purple-900/20 border-purple-500 text-white' : 'bg-black/40 border-white/10 text-stone-500'}`}
                    >
                       <div className="w-8 h-10 border-2 border-current rounded-lg" />
                       <span className="text-[10px] uppercase font-bold">Rectangle</span>
                    </button>
                    <button 
                      onClick={() => updateSettings({ cardShape: 'pill' })}
                      className={`p-4 border rounded-2xl flex flex-col items-center gap-2 transition-all ${settings.cardShape === 'pill' ? 'bg-purple-900/20 border-purple-500 text-white' : 'bg-black/40 border-white/10 text-stone-500'}`}
                    >
                       <div className="w-8 h-10 border-2 border-current rounded-[1rem]" />
                       <span className="text-[10px] uppercase font-bold">Pill / Round</span>
                    </button>
                 </div>
              </div>

              {/* Border Styles */}
              <div className="space-y-4">
                 <div className="flex items-center gap-2 text-amber-300 text-sm font-bold uppercase tracking-wider">
                    <Palette size={14} /> Border Aura
                 </div>
                 <div className="grid grid-cols-3 gap-2">
                    {['glass', 'neon', 'glow', 'gold', 'minimal'].map((style) => (
                      <button 
                        key={style}
                        onClick={() => updateSettings({ borderStyle: style as BorderStyle })}
                        className={`py-3 px-2 rounded-xl text-[10px] uppercase font-bold border transition-all ${settings.borderStyle === style ? 'bg-white text-black border-white' : 'bg-black/40 border-white/10 text-stone-500 hover:bg-white/5'}`}
                      >
                        {style}
                      </button>
                    ))}
                 </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-white/5 flex justify-end shrink-0">
          <button 
            onClick={handleSave}
            className="px-6 py-3 bg-white text-black font-bold rounded-xl text-sm hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
          >
            <Save size={16} /> Save Changes
          </button>
        </div>

      </div>
    </div>
  );
};