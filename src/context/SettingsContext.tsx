
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type BorderStyle = 'glass' | 'neon' | 'glow' | 'gold' | 'minimal';
export type CardShape = 'rectangle' | 'pill';

interface LayoutSettings {
  margins: { top: number; bottom: number; left: number; right: number };
  borderStyle: BorderStyle;
  cardShape: CardShape;
  enableHologram: boolean;
  enableAI: boolean; // New Setting
}

interface SettingsContextType {
  settings: LayoutSettings;
  updateSettings: (newSettings: Partial<LayoutSettings>) => void;
  updateMargin: (side: keyof LayoutSettings['margins'], value: number) => void;
}

const defaultSettings: LayoutSettings = {
  margins: { top: 0, bottom: 0, left: 0, right: 0 },
  borderStyle: 'glass',
  cardShape: 'rectangle',
  enableHologram: true,
  enableAI: false // Default to Hidden
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<LayoutSettings>(defaultSettings);

  // Load from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('star_tracker_layout_v1');
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  // Save to LocalStorage on change
  useEffect(() => {
    localStorage.setItem('star_tracker_layout_v1', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<LayoutSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const updateMargin = (side: keyof LayoutSettings['margins'], value: number) => {
    setSettings(prev => ({
      ...prev,
      margins: { ...prev.margins, [side]: value }
    }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, updateMargin }}>
      {children}
    </SettingsContext.Provider>
  );
};
