
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
import { 
  LayoutDashboard, BarChart3, Layers, User, 
  Bell, Plus, History as HistoryIcon,
  CheckCircle2, AlertCircle, Sun, Moon,
  RefreshCw, CloudOff, Check, Zap, Crown, Star, Sparkles, CreditCard, X, LogIn
} from 'lucide-react';

const LoginScreen = () => {
  const { state, dispatch } = useApp();
  const [loading, setLoading] = useState(false);

  const handleFakeGoogleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      dispatch.loginWithGoogle({
        name: 'Ahmed Mahmoud',
        email: 'ahmed.m@gmail.com',
        avatar: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Ahmed&backgroundColor=b6e3f4',
        googleId: 'g-123456789'
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900 overflow-hidden">
       <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-900 opacity-50"></div>
       <div className="absolute w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -top-20 -left-20 animate-pulse"></div>
       <div className="absolute w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] -bottom-20 -right-20"></div>

       <div className="relative z-10 w-full max-w-md p-8 text-center space-y-8 animate-in zoom-in-95 duration-700">
          <div className="w-24 h-24 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl">
             <CreditCard size={48} className="text-blue-400" />
          </div>
          
          <div className="space-y-2">
             <h1 className="text-5xl font-black text-white tracking-tighter uppercase">Mahfazty<span className="text-blue-500">.</span>Flow</h1>
             <p className="text-slate-400 text-sm font-bold uppercase tracking-[4px]">AI Financial Intelligence</p>
          </div>

          <p className="text-slate-400 text-xs leading-relaxed max-w-xs mx-auto">
             {state.language === 'ar' 
               ? 'تحكم في مستقبلك المالي باستخدام أحدث تقنيات الذكاء الاصطناعي من Google.' 
               : 'Take control of your financial future using the latest Google AI technologies.'}
          </p>

          <button 
            onClick={handleFakeGoogleLogin}
            disabled={loading}
            className="w-full py-5 bg-white text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group"
          >
            {loading ? (
              <RefreshCw size={20} className="animate-spin text-blue-600" />
            ) : (
              <>
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5 group-hover:rotate-12 transition-transform" alt="Google" />
                {state.language === 'ar' ? 'تسجيل الدخول عبر Google' : 'Sign in with Google'}
              </>
            )}
          </button>
          
          <div className="pt-8 border-t border-white/5">
             <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Secured by Google Identity Services</p>
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
        </div>

        <div className="flex flex-col items-center">
          <h1 className="text-sm sm:text-lg font-black text-slate-950 dark:text-white uppercase tracking-[4px] cursor-pointer" onClick={() => navigate('/')}>
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

  if (!state.userProfile.isAuthenticated) {
     return <LoginScreen />;
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
      <main className={`flex-1 w-full max-w-screen-xl mx-auto px-4 py-8 md:px-8 mb-24 relative ${state.language === 'ar' ? 'text-right' : 'text-left'}`}>
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
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 px-4">
        <nav className="h-16 md:h-18 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 flex items-center justify-around px-2 sm:px-4 rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.1)] w-full sm:w-[480px]">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-1 p-2 transition-all ${location.pathname === item.path ? 'text-blue-600 dark:text-blue-400 -translate-y-1.5' : 'text-slate-400 hover:text-slate-600'}`}>
              <item.icon size={22} strokeWidth={location.pathname === item.path ? 2.5 : 2} />
              <span className={`text-[8px] font-black uppercase tracking-widest ${location.pathname === item.path ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
      <Link to="/add" className="fixed bottom-24 right-6 sm:right-[calc(50%-230px)] w-14 h-14 bg-blue-600 text-white rounded-[22px] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 border-4 border-white dark:border-slate-800">
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
