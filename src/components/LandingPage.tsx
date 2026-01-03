import React, { useState, useEffect } from 'react';
import { Flame, ArrowRight, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../services/supabase';

// Custom 3D Google Icon Component
const GoogleIcon3D = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26-.19-.58z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export const LandingPage: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
  const { user, signInWithGoogle, signInAsGuest } = useAuth();
  const [authStage, setAuthStage] = useState<'initial' | 'authenticating' | 'ready' | 'entering'>('initial');
  const [splash, setSplash] = useState(false);

  // If user is already logged in (or guest), skip to "ready"
  useEffect(() => {
    if (user && authStage === 'initial') {
      setAuthStage('ready');
    }
  }, [user, authStage]);

  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured) {
      setAuthStage('authenticating');
      setTimeout(() => setAuthStage('ready'), 1500);
      return;
    }
    try {
      setAuthStage('authenticating');
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
      setAuthStage('initial');
    }
  };

  const handleGuestEntry = () => {
    setAuthStage('authenticating');
    setTimeout(() => {
      signInAsGuest();
      setAuthStage('ready');
    }, 800);
  };

  const handleEnterApp = () => {
    setAuthStage('entering');
    setSplash(true);
    setTimeout(() => {
        onEnter(); 
    }, 1000);
  };

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center landing-bg text-white transition-all duration-1000 overflow-hidden ${authStage === 'entering' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className={`splash-ring ${splash ? 'animate-splash' : ''}`}></div>
      <div className={`flex flex-col items-center p-8 transition-all duration-700 w-full max-w-md ${authStage === 'entering' ? 'scale-110' : 'scale-100'}`}>
        
        <div className="mb-8 relative group cursor-default">
          <div className="absolute inset-0 bg-rose-500 blur-3xl opacity-20 rounded-full animate-pulse"></div>
          <Flame size={80} className="text-rose-500 relative z-10 drop-shadow-[0_0_25px_rgba(225,29,72,0.6)] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" />
        </div>
        
        <h1 className="font-serif text-5xl md:text-6xl font-bold tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-rose-200 via-white to-purple-200 drop-shadow-2xl text-center leading-tight">
          Fap Tracker
        </h1>
        
        <p className="font-calligraphy text-4xl text-rose-300/80 mb-12 text-center drop-shadow-lg transform -rotate-2">
          Personal Harem Tracker
        </p>

        <div className="w-full relative min-h-[120px] grid place-items-center">
          
          {/* Phase 1: Authentication Options */}
          <div className={`w-full flex flex-col gap-4 items-center transition-all duration-700 col-start-1 row-start-1 ${authStage === 'initial' || authStage === 'authenticating' ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-8 scale-95 pointer-events-none'}`}>
            
             <button 
               onClick={handleGoogleLogin}
               disabled={authStage === 'authenticating'}
               className="group relative w-full max-w-xs h-14 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center gap-4 transition-all hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] active:scale-95 shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
             >
               {authStage === 'authenticating' ? (
                 <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium text-stone-300 tracking-wide">Connecting...</span>
                 </div>
               ) : (
                 <>
                   <div className="p-1.5 bg-white rounded-full shadow-lg transition-transform duration-500 group-hover:rotate-[360deg]">
                     <GoogleIcon3D />
                   </div>
                   <span className="font-serif text-sm font-bold tracking-wider text-white group-hover:text-rose-200 transition-colors">
                     Sign in with Google
                   </span>
                 </>
               )}
             </button>

            <button 
              onClick={handleGuestEntry}
              disabled={authStage === 'authenticating'}
              className="text-xs text-stone-500 hover:text-white transition-colors uppercase tracking-widest border-b border-transparent hover:border-stone-500 pb-0.5 mt-2"
            >
              Continue as Guest
            </button>
          </div>

          {/* Phase 2: Welcome & Enter */}
          <div className={`w-full flex flex-col gap-6 items-center transition-all duration-1000 delay-200 col-start-1 row-start-1 ${authStage === 'ready' ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-8 scale-95 pointer-events-none'}`}>
            <div className="text-center space-y-2">
               <div className="w-16 h-16 mx-auto bg-gradient-to-br from-rose-500 to-purple-600 rounded-full p-[2px] shadow-[0_0_20px_rgba(225,29,72,0.5)]">
                 <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                    <UserIcon size={24} className="text-rose-200" />
                 </div>
               </div>
               <h2 className="font-serif text-2xl text-white">
                 Welcome back, <span className="text-rose-400 font-bold">{user?.user_metadata?.full_name?.split(' ')[0] || 'Master'}</span>
               </h2>
               <p className="text-xs text-stone-400 tracking-wide">Your collection awaits.</p>
            </div>
            <button 
              onClick={handleEnterApp}
              className="group relative px-10 py-4 bg-transparent border border-rose-500/30 rounded-full overflow-hidden transition-all hover:border-rose-400 hover:shadow-[0_0_30px_rgba(225,29,72,0.4)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-rose-900/0 via-rose-500/20 to-rose-900/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <span className="relative z-10 font-serif text-xl tracking-widest uppercase flex items-center gap-3 text-rose-100">
                Enter <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};