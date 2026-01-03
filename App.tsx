import React, { useState, useEffect } from 'react';
import { LayoutGrid, Plus, BarChart2, Loader2 } from 'lucide-react';
import { Star, XPLog } from './types';
// Fix: Corrected import path to use the storage service that supports userId as an argument.
import { getStars, createStar, updateStar, deleteStar } from './src/services/storage';
import { useToast } from './src/context/ToastContext';
import { CursorProvider } from './src/context/CursorContext';
import { useAuth } from './src/context/AuthContext';

// View Components
import { Dashboard } from './src/views/Dashboard';
import { StarForm } from './src/views/StarForm';
import { StatsView } from './src/views/StatsView';

// UI Components
import { LandingPage } from './src/components/LandingPage';
import { SettingsModal } from './src/components/SettingsModal';
import { XPModal } from './src/components/XPModal';
import { ThreeCursorTrail } from './src/components/ThreeCursorTrail';

// --- Helper: UUID Generator ---
// Ensures compatibility with UUID database columns
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

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  
  // State
  const [showLanding, setShowLanding] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [view, setView] = useState<'dashboard' | 'add' | 'update' | 'stats'>('dashboard');
  const [stars, setStars] = useState<Star[]>([]);
  const [selectedStarId, setSelectedStarId] = useState<string | null>(null);
  const [xpModalStar, setXpModalStar] = useState<Star | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const { showToast } = useToast();

  // Load Data based on Auth State
  const loadData = async () => {
    setDataLoading(true);
    try {
      // getStars now correctly accepts userId from src/services/storage
      const data = await getStars(user?.id);
      setStars(data);
    } catch (e) {
      showToast("Sync Error", 'error');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) setApiKey(storedKey);
  }, [user]);

  const handleSaveKey = (key: string) => { 
    setApiKey(key); 
    localStorage.setItem('gemini_api_key', key); 
    showToast("Settings Saved", 'success'); 
  };

  // --- Actions ---

  const handleCreateStar = async (data: Partial<Star>) => {
    if (!data.name) return;
    setDataLoading(true);
    const newStar: Star = {
      id: generateId(), // Changed from Date.now() to UUID
      name: data.name,
      nickname: data.nickname || '',
      images: data.images || [],
      imageCutout: data.imageCutout,
      xp: 0,
      logs: [],
      tags: data.tags || [],
      bio: data.bio || '',
      dob: data.dob,
      nationality: data.nationality,
      favorite: false,
      streak: 0,
      lastActiveDate: ''
    };
    
    try {
      // createStar now correctly accepts userId from src/services/storage
      await createStar(newStar, user?.id);
      await loadData();
      setView('dashboard');
      showToast("Star added to Cloud.", 'success');
    } catch (e) {
      showToast("Save failed. Check console.", 'error');
    } finally {
      setDataLoading(false);
    }
  };

  const handleUpdateStar = async (data: Partial<Star>) => {
    if (!data.id) return;
    setDataLoading(true);
    try {
      // updateStar now correctly accepts userId from src/services/storage
      await updateStar(data as Star, user?.id);
      await loadData();
      setView('dashboard');
      showToast("Cloud synced.", 'success');
    } catch (e) {
      showToast("Update failed.", 'error');
    } finally {
      setDataLoading(false);
    }
  };

  const handleDeleteStar = async (id: string) => {
    if (confirm('Permanently banish this star?')) {
      setDataLoading(true);
      try {
        // deleteStar now correctly accepts userId from src/services/storage
        await deleteStar(id, user?.id);
        await loadData();
        setView('dashboard');
        showToast("Banished from cloud.", 'info');
      } catch (e) {
        showToast("Delete failed.", 'error');
      } finally {
        setDataLoading(false);
      }
    }
  };

  const handleAddXP = async (id: string, amount: number, note: string) => {
    const star = stars.find(s => s.id === id);
    if (star) {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      let newStreak = star.streak || 0;
      const lastActive = star.lastActiveDate ? star.lastActiveDate.split('T')[0] : null;

      if (lastActive !== todayStr) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        newStreak = (lastActive === yesterdayStr) ? newStreak + 1 : 1;
      }

      const newLog: XPLog = { 
        id: generateId(), // Changed from Date.now() to UUID
        date: new Date().toISOString(), 
        amount, 
        note 
      };
      
      const updatedStar = { 
        ...star, 
        xp: star.xp + amount, 
        logs: [newLog, ...star.logs],
        streak: newStreak,
        lastActiveDate: today.toISOString()
      };

      try {
        // updateStar now correctly accepts userId from src/services/storage
        await updateStar(updatedStar, user?.id);
        await loadData();
        setXpModalStar(null);
        showToast(`+${amount} XP Awarded`, 'success');
      } catch (e) {
        showToast("XP update failed.", 'error');
      }
    }
  };

  if (authLoading || (dataLoading && !showLanding)) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center flex-col gap-4">
        <Loader2 className="w-12 h-12 text-rose-500 animate-spin" />
        <p className="font-serif text-stone-500 text-xs tracking-widest uppercase animate-pulse">
          {authLoading ? 'Authenticating...' : 'Syncing with Cloud...'}
        </p>
      </div>
    );
  }

  return (
    <>
      <ThreeCursorTrail />
      {showLanding && <LandingPage onEnter={() => setShowLanding(false)} />}
      
      {view === 'dashboard' && (
        <Dashboard 
          stars={stars} 
          onAddXP={(id) => setXpModalStar(stars.find(st => st.id === id) || null)} 
          onEditStar={(st) => { setSelectedStarId(st.id); setView('update'); }} 
          onAddNew={() => setView('add')}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {(view === 'add' || view === 'update') && (
        <StarForm 
          mode={view === 'add' ? 'add' : 'update'}
          initialData={view === 'update' ? stars.find(s => s.id === selectedStarId) : undefined}
          apiKey={apiKey}
          onClose={() => setView('dashboard')}
          onSave={view === 'add' ? handleCreateStar : handleUpdateStar}
          onDelete={handleDeleteStar}
          onRequestKey={() => setShowSettings(true)}
        />
      )}

      {view === 'stats' && (
        <StatsView stars={stars} onClose={() => setView('dashboard')} />
      )}

      {xpModalStar && (
        <XPModal 
          star={xpModalStar} 
          onClose={() => setXpModalStar(null)} 
          onConfirm={(a,n) => handleAddXP(xpModalStar.id, a, n)} 
        />
      )}

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        onSaveKey={handleSaveKey} 
        apiKey={apiKey} 
      />
      
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 md:hidden">
        <div className="glass-panel rounded-full p-2 flex gap-1 shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/10">
          <button onClick={() => setView('dashboard')} className={`p-3 rounded-full transition-all ${view==='dashboard'?'bg-white text-black shadow-lg':'text-stone-400 hover:text-white'}`}><LayoutGrid size={20}/></button>
          <button onClick={() => setView('add')} className={`p-3 rounded-full transition-all ${view==='add'?'bg-rose-500 text-white shadow-lg':'text-rose-500 hover:bg-rose-500/10'}`}><Plus size={24} strokeWidth={3}/></button>
          <button onClick={() => setView('stats')} className={`p-3 rounded-full transition-all ${view==='stats'?'bg-white text-black shadow-lg':'text-stone-400 hover:text-white'}`}><BarChart2 size={20}/></button>
        </div>
      </div>
    </>
  );
};

const App: React.FC = () => (
  <CursorProvider>
    <AppContent />
  </CursorProvider>
);

export default App;