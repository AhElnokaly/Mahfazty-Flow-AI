

import React, { useState, useRef, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './store';
import Dashboard from './screens/Dashboard';
import AddFlow from './screens/AddFlow';
import History from './screens/History';
import Analytics from './screens/Analytics';
import GraphMaker from './screens/GraphMaker';
import AIInsights from './screens/AIInsights';
import Settings from './screens/Settings';
import ProUpgrade from './screens/ProUpgrade';
import Archive from './screens/Archive';
import Installments from './screens/Installments';
import { CreditCards } from './screens/CreditCards';
import { Subscriptions } from './screens/Subscriptions';
import { Investments } from './screens/Investments';
import Onboarding from './screens/Onboarding';
import Goals from './screens/Goals';
import { SmartNotifications } from './components/SmartNotifications';
import { HelpModal } from './components/HelpModal';
import { 
  LayoutDashboard, BarChart3, Layers, User, 
  Bell, Plus, History as HistoryIcon,
  CheckCircle2, AlertCircle, Sun, Moon,
  RefreshCw, CloudOff, Check, Zap, Crown, Star, Sparkles, CreditCard, X, LogIn, Eye, EyeOff, Key, ShieldCheck, Mail, Gift, Menu
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
const NotificationToast = ({ notification, onClose }: { notification: any, onClose: () => void }) => {
  useEffect(() => {
    if (notification.type === 'update') return; // Persistent notification
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  const getStyle = () => {
    switch (notification.type) {
      case 'success': return 'bg-emerald-500/90 text-white border-emerald-400/20';
      case 'error': return 'bg-rose-500/90 text-white border-rose-400/20';
      case 'info': return 'bg-blue-600/90 text-white border-blue-400/20';
      case 'update': return 'bg-gradient-to-r from-indigo-600/95 to-purple-600/95 text-white border-indigo-400/30 shadow-indigo-500/20';
      default: return 'bg-slate-800/90 text-white border-slate-700/50';
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return <CheckCircle2 size={24} className="shrink-0" />;
      case 'error': return <AlertCircle size={24} className="shrink-0" />;
      case 'info': return <Zap size={24} className="shrink-0" />;
      case 'update': return <Sparkles size={24} className="shrink-0 text-yellow-300 animate-pulse" />;
      default: return <Bell size={24} className="shrink-0" />;
    }
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-[60] flex justify-center px-4 pointer-events-none">
      <div className={`mt-4 px-6 py-4 rounded-2xl shadow-2xl flex items-start justify-between gap-4 animate-in fade-in slide-in-from-top-4 w-full max-w-md border backdrop-blur-xl pointer-events-auto transform hover:scale-[1.02] transition-transform ${getStyle()}`}>
        <div className="flex items-start gap-3 mt-0.5">
           {getIcon()}
           <div className="flex flex-col gap-1">
             {notification.title && <span className="text-sm font-black tracking-wide">{notification.title}</span>}
             <span className={`text-sm ${notification.title ? 'font-medium opacity-90' : 'font-black tracking-wide'} leading-relaxed`}>{notification.message}</span>
           </div>
        </div>
        <button onClick={onClose} className="w-6 h-6 shrink-0 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors mt-0.5"><X size={14}/></button>
      </div>
    </div>
  );
};

const WelcomeScreen = () => {
  const { state, dispatch } = useApp();
  const [view, setView] = useState<'landing' | 'login' | 'signup' | 'forgot-password' | 'biometric'>(
    state.userProfile.username && state.userProfile.username !== 'guest' && state.security.biometrics ? 'biometric' : 'landing'
  );
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (view === 'forgot-password') {
      if (!username || !password) return; // password here acts as recovery key
      setLoading(true);
      setTimeout(() => {
        const savedData = localStorage.getItem(`mahfazty_user_${username}`);
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            if (parsed.userProfile?.recoveryKey === password) {
              // Reset password to a default or ask for new one. For simplicity, reset to '123456'
              parsed.userProfile.password = '123456';
              localStorage.setItem(`mahfazty_user_${username}`, JSON.stringify(parsed));
              dispatch.setNotification({ 
                title: state.language === 'ar' ? 'تم الاسترداد' : 'Recovered',
                message: state.language === 'ar' ? 'تم إعادة تعيين كلمة المرور إلى: 123456' : 'Password reset to: 123456', 
                type: 'success' 
              });
              setView('login');
              setPassword('');
            } else {
              dispatch.setNotification({ 
                title: state.language === 'ar' ? 'خطأ' : 'Error',
                message: state.language === 'ar' ? 'مفتاح الاسترداد غير صحيح' : 'Invalid recovery key', 
                type: 'error' 
              });
            }
          } catch (e) {}
        } else {
          dispatch.setNotification({ 
            title: state.language === 'ar' ? 'خطأ' : 'Error',
            message: state.language === 'ar' ? 'المستخدم غير موجود' : 'User not found', 
            type: 'error' 
          });
        }
        setLoading(false);
      }, 800);
      return;
    }

    if (!username || !password) return;
    if (view === 'signup' && !email) return;
    
    setLoading(true);
    setTimeout(() => {
      if (view === 'signup') {
        dispatch.signup(username, password, email);
      } else {
        dispatch.login(username, password);
      }
      setLoading(false);
      navigate('/');
    }, 800);
  };

  const [pin, setPin] = useState('');
  const [showPinPad, setShowPinPad] = useState(false);

  const handleGuest = () => {
    setLoading(true);
    setTimeout(() => {
      dispatch.guestLogin();
      setLoading(false);
      navigate('/');
    }, 500);
  };

  const handlePinEntry = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        setLoading(true);
        setTimeout(() => {
          dispatch.biometricLogin(state.userProfile.username!);
          setLoading(false);
          navigate('/');
        }, 500);
      }
    }
  };

  if (view === 'biometric') {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950 overflow-hidden text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900 via-slate-950 to-slate-950 opacity-80"></div>
        <div className="absolute w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
        
        <div className="relative z-10 max-w-md w-full px-6 text-center space-y-12 animate-in fade-in zoom-in-95 duration-1000">
          <div className="space-y-4">
            <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-slate-800 shadow-2xl">
              <img src={state.userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tight">{state.language === 'ar' ? 'مرحباً بعودتك' : 'Welcome Back'}</h2>
              <p className="text-slate-400 font-medium text-lg">{state.userProfile.username}</p>
            </div>
          </div>

          {!showPinPad ? (
            <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <button 
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => {
                    dispatch.biometricLogin(state.userProfile.username!);
                    setLoading(false);
                    navigate('/');
                  }, 800);
                }}
                disabled={loading}
                className="relative group w-32 h-32 flex items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all duration-500"
              >
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/50 animate-ping opacity-20 group-hover:opacity-40"></div>
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.4)] group-hover:shadow-[0_0_60px_rgba(16,185,129,0.6)] transition-all duration-500 group-hover:scale-110">
                  <ShieldCheck size={40} className="text-emerald-950" />
                </div>
              </button>
              <div className="flex flex-col gap-3 items-center">
                <p className="text-emerald-400/80 text-sm font-bold uppercase tracking-widest animate-pulse">
                  {state.language === 'ar' ? 'اضغط للفتح بالبصمة' : 'Tap to unlock'}
                </p>
                <button onClick={() => setShowPinPad(true)} className="text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">
                  {state.language === 'ar' ? 'أو استخدم الرمز السري' : 'Or use PIN'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex gap-4 justify-center mb-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pin.length ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-slate-800'}`} />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4 max-w-[240px] mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button key={num} onClick={() => handlePinEntry(num.toString())} className="w-16 h-16 rounded-full bg-slate-800/50 hover:bg-slate-700 flex items-center justify-center text-2xl font-black transition-all active:scale-95">
                    {num}
                  </button>
                ))}
                <button onClick={() => setShowPinPad(false)} className="w-16 h-16 rounded-full bg-slate-800/50 hover:bg-slate-700 flex items-center justify-center text-sm font-black transition-all active:scale-95 text-slate-400">
                  {state.language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button onClick={() => handlePinEntry('0')} className="w-16 h-16 rounded-full bg-slate-800/50 hover:bg-slate-700 flex items-center justify-center text-2xl font-black transition-all active:scale-95">
                  0
                </button>
                <button onClick={() => {
                  setPin(pin.slice(0, -1));
                }} className="w-16 h-16 rounded-full bg-slate-800/50 hover:bg-slate-700 flex items-center justify-center text-xl font-black transition-all active:scale-95 text-slate-400">
                  ⌫
                </button>
              </div>
            </div>
          )}

          <div className="pt-8">
            <button 
              onClick={() => setView('login')}
              className="text-slate-500 text-xs font-bold uppercase tracking-[2px] hover:text-white transition-colors"
            >
              {state.language === 'ar' ? 'تسجيل الدخول بكلمة المرور' : 'Login with password'}
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            onClick={() => setView(state.userProfile.username && state.userProfile.username !== 'guest' && state.security.biometrics ? 'biometric' : 'landing')}
            className="absolute top-8 left-8 text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
          >
            ← {state.language === 'ar' ? 'عودة' : 'Back'}
          </button>

          <div className="text-center mb-10 space-y-2">
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">
              {view === 'login' 
                ? (state.language === 'ar' ? 'مرحباً بعودتك' : 'Welcome Back') 
                : view === 'forgot-password'
                ? (state.language === 'ar' ? 'استعادة كلمة المرور' : 'Reset Password')
                : (state.language === 'ar' ? 'انضم إلينا' : 'Join Us')}
            </h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
              {view === 'login' ? 'Enter your credentials' : view === 'forgot-password' ? 'Enter your email' : 'Start your journey'}
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
                    autoFocus={true}
                  />
                </div>
              </div>

              {view === 'signup' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">
                    {state.language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-slate-900 transition-all font-medium"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              )}

              {view === 'forgot-password' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">
                    {state.language === 'ar' ? 'مفتاح الاسترداد' : 'Recovery Key'}
                  </label>
                  <div className="relative group">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                      type="text" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-slate-900 transition-all font-medium"
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                    />
                  </div>
                </div>
              )}

              {view !== 'forgot-password' && (
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
                  {view === 'login' && (
                    <div className="flex justify-end mt-2">
                      <button 
                        type="button"
                        onClick={() => { setView('forgot-password'); setPassword(''); }}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
                      >
                        {state.language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all mt-4 ${
                  view === 'signup' 
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950' 
                    : view === 'forgot-password'
                    ? 'bg-amber-500 hover:bg-amber-400 text-amber-950'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                } shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {loading && <RefreshCw className="animate-spin" size={16} />}
                {view === 'signup' 
                  ? (state.language === 'ar' ? 'إنشاء حساب' : 'Create Account') 
                  : view === 'forgot-password'
                  ? (state.language === 'ar' ? 'استرداد الحساب' : 'Recover Account')
                  : (state.language === 'ar' ? 'تسجيل الدخول' : 'Sign In')}
              </button>
            </form>
          </div>
       </div>
    </div>
  );
};

import { Sidebar } from './components/Sidebar';
import { NotificationsModal } from './components/NotificationsModal';

const HeaderActions = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false); // +++ أضيف بناءً على طلبك +++
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 h-16 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-sm px-4">
        <div className="w-full max-w-screen-xl flex items-center justify-between">
          
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>

          <div className="flex flex-col items-center absolute left-1/2 -translate-x-1/2">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-[4px] cursor-pointer" onClick={() => navigate('/')}>
              {state.language === 'ar' ? 'محفظتي' : 'Mahfazty'}
            </h1>
            {state.isPro && (
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest leading-none">Pro Active</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* +++ أضيف بناءً على طلبك +++ (Sync Status Indicator) */}
            {state.syncProvider !== 'local' && (
              <button 
                onClick={() => navigate('/settings')}
                className={`flex items-center gap-1 px-2 py-1 rounded-full border ${
                  state.isSyncing 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-500' 
                    : state.isOnline 
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-500' 
                      : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-500'
                } transition-colors`}
              >
                {state.isSyncing ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : state.isOnline ? (
                  <Check size={14} />
                ) : (
                  <CloudOff size={14} />
                )}
                <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">
                  {state.isSyncing 
                    ? (state.language === 'ar' ? 'جاري المزامنة' : 'Syncing') 
                    : state.isOnline 
                      ? (state.language === 'ar' ? 'متصل' : 'Synced') 
                      : (state.language === 'ar' ? 'غير متصل' : 'Offline')}
                </span>
              </button>
            )}
            
            <button 
              onClick={() => setIsNotificationsOpen(true)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            >
              <Bell size={24} />
              {state.notificationHistory.filter(n => !n.read).length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
              )}
            </button>
            
            <button 
              onClick={() => setIsHelpOpen(true)}
              className="p-2 -mr-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
            </button>
            {/* +++ نهاية الإضافة +++ */}
          </div>
        </div>
      </header>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onOpenNotifications={() => setIsNotificationsOpen(true)} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} /> {/* +++ أضيف بناءً على طلبك +++ */}
      {isNotificationsOpen && <NotificationsModal onClose={() => setIsNotificationsOpen(false)} />}
    </>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showEidGreeting, setShowEidGreeting] = useState(false);

  useEffect(() => {
    dispatch.processRecurringTransactions();
  }, []);

  useEffect(() => {
    // Check for Eid greeting (Pro only, once per year during Eid al-Fitr)
    // Assuming Eid al-Fitr 2026 is around March 19-22
    if (state.isPro) {
      const today = new Date();
      const isEidTime = today.getMonth() === 2 && today.getDate() >= 19 && today.getDate() <= 22; // March is 2
      const hasSeenGreeting = localStorage.getItem(`eid_greeting_${today.getFullYear()}`);
      
      if (isEidTime && !hasSeenGreeting) {
        setShowEidGreeting(true);
        localStorage.setItem(`eid_greeting_${today.getFullYear()}`, 'true');
      }
    }
  }, [state.isPro]);

  useEffect(() => {
    if (state.userProfile.isAuthenticated) {
      const updateMessage = state.language === 'ar' 
        ? 'تم إضافة ميزات جديدة: دمج ونقل العملاء، إضافة مجموعات وعملاء أثناء تسجيل المعاملات، وتفعيل النسخة الاحترافية!' 
        : 'New features added: Merge/Move clients, inline group/client creation, and Pro Version activation!';
      
      const hasSeenUpdate = state.notificationHistory.some(n => n.message === updateMessage);
      if (!hasSeenUpdate) {
        dispatch.setNotification({
          title: state.language === 'ar' ? '✨ تحديث جديد' : '✨ New Update',
          message: updateMessage,
          type: 'update'
        });
      }
    }
  }, [state.userProfile.isAuthenticated, state.language]);

  if (!state.hasSeenOnboarding) {
    return <Onboarding />;
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
          <NotificationToast notification={state.notification} onClose={() => dispatch.setNotification(null)} />
        )}
        {children}
      </main>

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-24 right-4 sm:right-8 z-50 flex flex-col items-end gap-3">
        {showFabMenu && (
          <div className="flex flex-col gap-3 mb-2 animate-in slide-in-from-bottom-4 fade-in duration-200">
            <button 
              onClick={() => { setShowFabMenu(false); navigate('/ai'); }}
              className="flex items-center gap-3 bg-indigo-500 text-white px-4 py-3 rounded-full shadow-lg hover:bg-indigo-600 transition-colors"
            >
              <span className="text-xs font-bold uppercase tracking-wide">{state.language === 'ar' ? 'الذكاء الاصطناعي' : 'AI Insights'}</span>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles size={16} />
              </div>
            </button>
            <button 
              onClick={() => { setShowFabMenu(false); navigate('/add', { state: { type: 'income' } }); }}
              className="flex items-center gap-3 bg-emerald-500 text-white px-4 py-3 rounded-full shadow-lg hover:bg-emerald-600 transition-colors"
            >
              <span className="text-xs font-bold uppercase tracking-wide">{state.language === 'ar' ? 'دخل جديد' : 'Add Income'}</span>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Plus size={16} />
              </div>
            </button>
            <button 
              onClick={() => { setShowFabMenu(false); navigate('/add', { state: { type: 'expense' } }); }}
              className="flex items-center gap-3 bg-rose-500 text-white px-4 py-3 rounded-full shadow-lg hover:bg-rose-600 transition-colors"
            >
              <span className="text-xs font-bold uppercase tracking-wide">{state.language === 'ar' ? 'مصروف جديد' : 'Add Expense'}</span>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Plus size={16} />
              </div>
            </button>
          </div>
        )}
        <button 
          onClick={() => setShowFabMenu(!showFabMenu)}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-500/30 transition-transform duration-300 ${showFabMenu ? 'bg-slate-800 rotate-45' : 'bg-blue-600 hover:scale-110'}`}
        >
          <Plus size={24} />
        </button>
      </div>

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

      {/* Eid Greeting Modal */}
      {showEidGreeting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in fade-in duration-500">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 max-w-sm w-full shadow-2xl relative overflow-hidden text-center animate-in zoom-in-95 duration-500">
            <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-br from-amber-400 to-orange-500 opacity-20"></div>
            <button onClick={() => setShowEidGreeting(false)} className="absolute top-6 right-6 w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors z-10">
              <X size={16} />
            </button>
            <div className="relative z-10 flex flex-col items-center mt-4">
              <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-amber-500/30 mb-6">
                <Gift size={48} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                {state.language === 'ar' ? 'عيد سعيد!' : 'Happy Eid!'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                {state.language === 'ar' 
                  ? 'كل عام وأنتم بخير بمناسبة عيد الفطر المبارك. نتمنى لكم أوقاتاً سعيدة!' 
                  : 'Wishing you a blessed Eid al-Fitr. May your days be filled with joy!'}
              </p>
              <button 
                onClick={() => setShowEidGreeting(false)}
                className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                {state.language === 'ar' ? 'شكراً' : 'Thank You'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, dispatch } = useApp();
  const location = useLocation();
  
  // +++ أضيف بناءً على طلبك +++ (Bypass Login if no biometrics/lock)
  useEffect(() => {
    if (!state.security.biometrics && !state.userProfile.isAuthenticated) {
      // Auto-login as guest if no security is enabled
      dispatch.login('guest', 'guest');
    }
  }, [state.security.biometrics, state.userProfile.isAuthenticated, dispatch]);

  if (state.security.biometrics && !state.userProfile.isAuthenticated && location.pathname !== '/auth') {
    return <Navigate to="/auth" replace />;
  }
  
  if (state.userProfile.isAuthenticated && location.pathname === '/auth') {
    return <Navigate to="/" replace />;
  }
  // +++ نهاية الإضافة +++
  
  return <>{children}</>;
};

const AutoLock: React.FC = () => {
  const { state, dispatch } = useApp();
  
  useEffect(() => {
    if (!state.userProfile.isAuthenticated || !state.security.biometrics) return;

    let timeoutId: NodeJS.Timeout;
    const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        dispatch.lockApp();
      }, INACTIVITY_LIMIT);
    };

    // Listen to user activity
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer));

    // Initial start
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [state.userProfile.isAuthenticated, state.security.biometrics, dispatch]);

  return null;
};

const NetworkStatus: React.FC = () => {
  const { dispatch } = useApp();

  useEffect(() => {
    const handleOnline = () => dispatch.setOnlineStatus(true);
    const handleOffline = () => dispatch.setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch]);

  return null;
};

const AutoDeleteArchived: React.FC = () => {
  const { state, dispatch } = useApp();

  useEffect(() => {
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    state.clients.forEach(client => {
      if (client.isArchived && client.deletedAt) {
        const deletedTime = new Date(client.deletedAt).getTime();
        if (now - deletedTime > SEVEN_DAYS_MS) {
          dispatch.permanentDeleteClient(client.id);
        }
      }
    });
  }, [state.clients, dispatch]);

  return null;
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <SmartNotifications />
      <AutoLock />
      <NetworkStatus />
      <AutoDeleteArchived />
      <HashRouter>
        <AuthGuard>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/auth" element={<WelcomeScreen />} />
              <Route path="/add" element={<AddFlow />} />
              <Route path="/history" element={<History />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/graph-maker" element={<GraphMaker />} />
              <Route path="/installments" element={<Installments />} />
              <Route path="/credit-cards" element={<CreditCards />} />
              <Route path="/investments" element={<Investments />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/archive" element={<Archive />} />
              <Route path="/ai" element={<AIInsights />} />
              <Route path="/upgrade" element={<ProUpgrade />} />
              <Route path="/goals" element={<Goals />} />
            </Routes>
          </Layout>
        </AuthGuard>
      </HashRouter>
    </AppProvider>
  );
};

export default App;
