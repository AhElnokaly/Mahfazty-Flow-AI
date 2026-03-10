

import React, { useState, useRef, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './store';
import Dashboard from './screens/Dashboard';
import AddFlow from './screens/AddFlow';
import GroupsManager from './screens/GroupsManager';
import History from './screens/History';
import Analytics from './screens/Analytics';
import AIInsights from './screens/AIInsights';
import Settings from './screens/Settings';
import ProUpgrade from './screens/ProUpgrade';
import ClientsManager from './screens/ClientsManager';
import Installments from './screens/Installments';
import Onboarding from './screens/Onboarding';
import { 
  LayoutDashboard, BarChart3, Layers, User, 
  Bell, Plus, History as HistoryIcon,
  CheckCircle2, AlertCircle, Sun, Moon,
  RefreshCw, CloudOff, Check, Zap, Crown, Star, Sparkles, CreditCard, X, LogIn, Eye, EyeOff, Key, ShieldCheck
} from 'lucide-react';

// Helper to decode JWT without external library
const decodeJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

// --- New Welcome Screen Component ---
const WelcomeScreen = () => {
  const { state, dispatch } = useApp();
  const [view, setView] = useState<'landing' | 'login' | 'signup'>('landing');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setLoading(true);
    setTimeout(() => {
      if (view === 'signup') {
        dispatch.signup(username, password);
      } else {
        dispatch.login(username, password);
      }
      setLoading(false);
    }, 800);
  };

  const handleGuest = () => {
    setLoading(true);
    setTimeout(() => {
      dispatch.guestLogin();
      setLoading(false);
    }, 500);
  };

  if (view === 'landing') {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950 overflow-hidden text-white">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-950 to-slate-950 opacity-80"></div>
        <div className="absolute w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
        
        <div className="relative z-10 max-w-md w-full px-6 text-center space-y-10 animate-in fade-in zoom-in-95 duration-1000">
          
          {/* Logo & Hero */}
          <div className="space-y-6">
            <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/30 mb-8 transform hover:scale-105 transition-transform duration-500">
               <CreditCard size={56} className="text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none">
              Mahfazty<span className="text-blue-500">.</span>Flow
            </h1>
            <p className="text-slate-400 text-sm md:text-base font-medium tracking-wide max-w-xs mx-auto leading-relaxed">
              {state.language === 'ar' 
                ? 'تحكم في أموالك بذكاء اصطناعي حقيقي وخصوصية تامة.' 
                : 'Master your finances with real AI and complete privacy.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 pt-4">
            <button 
              onClick={() => setView('login')}
              className="w-full py-4 rounded-2xl bg-white text-slate-950 font-black uppercase tracking-widest hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
            >
              {state.language === 'ar' ? 'تسجيل الدخول' : 'Login'}
            </button>
            
            <button 
              onClick={() => setView('signup')}
              className="w-full py-4 rounded-2xl bg-white/10 border border-white/10 text-white font-black uppercase tracking-widest hover:bg-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all backdrop-blur-md"
            >
              {state.language === 'ar' ? 'إنشاء حساب جديد' : 'Create Account'}
            </button>

            <div className="pt-4">
              <button 
                onClick={handleGuest}
                className="text-slate-500 text-xs font-bold uppercase tracking-[2px] hover:text-blue-400 transition-colors flex items-center justify-center gap-2 mx-auto group"
              >
                {state.language === 'ar' ? 'تخطى و جرب كضيف' : 'Skip & Try as Guest'}
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </div>

          {/* Footer Info */}
          <div className="pt-12 flex justify-center gap-6 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            <span className="flex items-center gap-1"><ShieldCheck size={12} /> Local Storage</span>
            <span className="flex items-center gap-1"><Zap size={12} /> AI Powered</span>
          </div>
        </div>
      </div>
    );
  }

  // Login / Signup Form View
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950 overflow-hidden">
       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950"></div>
       
       <div className="relative z-10 w-full max-w-md p-8 animate-in slide-in-from-bottom-8 duration-500">
          <button 
            onClick={() => setView('landing')}
            className="absolute top-8 left-8 text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
          >
            ← {state.language === 'ar' ? 'عودة' : 'Back'}
          </button>

          <div className="text-center mb-10 space-y-2">
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">
              {view === 'login' 
                ? (state.language === 'ar' ? 'مرحباً بعودتك' : 'Welcome Back') 
                : (state.language === 'ar' ? 'انضم إلينا' : 'Join Us')}
            </h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
              {view === 'login' ? 'Enter your credentials' : 'Start your journey'}
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] space-y-6 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">
                  {state.language === 'ar' ? 'اسم المستخدم' : 'Username'}
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-slate-900 transition-all font-medium"
                    placeholder="username"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">
                  {state.language === 'ar' ? 'كلمة المرور' : 'Password'}
                </label>
                <div className="relative group">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-slate-900 transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all mt-4 ${
                  view === 'signup' 
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                } shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {loading && <RefreshCw className="animate-spin" size={16} />}
                {view === 'signup' 
                  ? (state.language === 'ar' ? 'إنشاء حساب' : 'Create Account') 
                  : (state.language === 'ar' ? 'تسجيل الدخول' : 'Sign In')}
              </button>
            </form>
          </div>
       </div>
    </div>
  );
};

const HeaderActions = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = state.notificationHistory.filter(n => !n.read).length;

  const handleToggleLanguage = () => {
    if (navigator.vibrate) navigator.vibrate(15);
    dispatch.toggleLanguage();
  };

  const handleToggleTheme = () => {
    if (navigator.vibrate) navigator.vibrate(15);
    dispatch.toggleDarkMode();
  };
  
  const handleTogglePrivacy = () => {
    if (navigator.vibrate) navigator.vibrate(15);
    dispatch.togglePrivacyMode();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 h-16 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-sm px-4">
      <div className="w-full max-w-screen-xl flex items-center justify-between">
        
        <div className="flex items-center gap-2">
           <button onClick={handleToggleLanguage} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700 hover:bg-blue-50 transition-colors">
             <span className="text-[10px] font-black">{state.language.toUpperCase()}</span>
           </button>
           <button onClick={handleToggleTheme} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700 hover:bg-amber-50 transition-colors">
             {state.isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
           </button>
           <button onClick={handleTogglePrivacy} className={`w-8 h-8 flex items-center justify-center rounded-xl border transition-colors ${state.isPrivacyMode ? 'bg-blue-500 text-white border-blue-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700'}`}>
             {state.isPrivacyMode ? <EyeOff size={15} /> : <Eye size={15} />}
           </button>
        </div>

        <div className="flex flex-col items-center">
          <h1 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-[4px] cursor-pointer" onClick={() => navigate('/')}>
            {state.language === 'ar' ? 'محفظتي' : 'Mahfazty'}
          </h1>
          {state.isPro && (
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-[7px] font-black text-amber-500 uppercase tracking-widest leading-none">Pro Active</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={() => state.isPro ? navigate('/settings') : navigate('/upgrade')}
            className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-2xl transition-all duration-300 ${
              state.isPro 
                ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/30' 
                : 'bg-white dark:bg-slate-800 border-2 border-amber-400/30 text-amber-600 dark:text-amber-400 hover:border-amber-400'
            }`}
          >
            {state.isPro ? <Crown size={14} className="animate-bounce" fill="currentColor" /> : <Zap size={14} className="animate-pulse" />}
            <span className="text-[9px] font-black uppercase tracking-tighter hidden sm:block">
              {state.isPro ? 'Pro Member' : 'Get Pro'}
            </span>
          </button>

          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => { if (!showNotifications) dispatch.markNotificationsRead(); setShowNotifications(!showNotifications); }}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 relative"
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>}
            </button>
          </div>
          
          <Link to="/settings" className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-700 shadow-lg hover:scale-105 transition-transform">
            <img src={state.userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
          </Link>
        </div>
      </div>
    </header>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  if (!state.hasSeenOnboarding) {
    return <Onboarding />;
  }

  if (!state.userProfile.isAuthenticated) {
     return <WelcomeScreen />;
  }

  const navItems = [
    { path: '/', label: state.language === 'ar' ? 'الرئيسية' : 'Home', icon: LayoutDashboard },
    { path: '/installments', label: state.language === 'ar' ? 'أقساط' : 'Debt', icon: CreditCard }, 
    { path: '/history', label: state.language === 'ar' ? 'السجل' : 'Logs', icon: HistoryIcon },
    { path: '/analytics', label: state.language === 'ar' ? 'التحليلات' : 'Stats', icon: BarChart3 },
    { path: '/ai', label: state.language === 'ar' ? 'الذكاء' : 'AI Hub', icon: Sparkles },
  ];

  return (
    <div 
      className={`min-h-screen flex flex-col transition-colors duration-500 ${state.isDarkMode ? 'dark bg-slate-950' : 'bg-[#F0F4FA]'}`}
      style={{
        backgroundImage: state.isDarkMode 
          ? 'radial-gradient(circle at 50% 0%, #1e293b 0%, #020617 100%)' 
          : 'radial-gradient(circle at 50% 0%, #E2E8F0 0%, #F8FAFC 100%)'
      }}
    >
      <HeaderActions />
        {/* +++ تم تعديل المسافات السفلية (mb-28) لضمان عدم تغطية المحتوى بناءً على طلبك +++ */}
        <main className={`flex-1 w-full max-w-screen-xl mx-auto px-4 py-6 md:px-8 mb-28 relative ${state.language === 'ar' ? 'text-right' : 'text-left'}`}>
        {state.notification && (
          <div className="absolute top-0 left-0 right-0 z-[60] flex justify-center px-4 pointer-events-none">
            <div className={`mt-2 px-6 py-4 rounded-3xl shadow-2xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 w-full max-w-md border border-white/10 backdrop-blur-xl pointer-events-auto transform hover:scale-[1.02] transition-transform ${state.notification.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'}`}>
              <div className="flex items-center gap-3">
                 {state.notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                 <span className="text-sm font-black tracking-wide">{state.notification.message}</span>
              </div>
              <button onClick={() => dispatch.setNotification(null)} className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"><X size={14}/></button>
            </div>
          </div>
        )}
        {children}
      </main>
      <div className="fixed bottom-0 sm:bottom-6 left-0 right-0 flex justify-center z-40 sm:px-4">
        {/* +++ تم تعديل شريط التنقل ليكون بعرض الشاشة على الموبايل مع تحسين الخطوط بناءً على طلبك +++ */}
        <nav className="h-16 md:h-18 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t sm:border border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 sm:px-4 sm:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] sm:shadow-[0_20px_40px_rgba(0,0,0,0.1)] w-full sm:w-[480px]">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-1 p-2 transition-all ${location.pathname === item.path ? 'text-blue-600 dark:text-blue-400 -translate-y-1' : 'text-slate-400 hover:text-slate-600'}`}>
              <item.icon size={22} strokeWidth={location.pathname === item.path ? 2.5 : 2} />
              <span className={`text-[10px] font-bold ${location.pathname === item.path ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
      <Link to="/add" className="fixed bottom-20 sm:bottom-24 right-6 sm:right-[calc(50%-230px)] w-14 h-14 bg-blue-600 text-white rounded-[22px] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 border-4 border-white dark:border-slate-800">
        <Plus size={28} />
      </Link>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<AddFlow />} />
            <Route path="/history" element={<History />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/groups" element={<GroupsManager />} />
            <Route path="/clients" element={<ClientsManager />} />
            <Route path="/installments" element={<Installments />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/ai" element={<AIInsights />} />
            <Route path="/upgrade" element={<ProUpgrade />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppProvider>
  );
};

export default App;
