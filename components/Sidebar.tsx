import React from 'react';
import { useApp } from '../store';
import { useNavigate } from 'react-router-dom';
import { X, Sun, Moon, Eye, EyeOff, Zap, Crown, Bell, LogIn, Settings, User, Share2, CreditCard } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

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

  const handleShareApp = async () => {
    if (navigator.vibrate) navigator.vibrate(15);
    const shareData = {
      title: state.language === 'ar' ? 'محفظتي - Mahfazty Flow' : 'Mahfazty Flow',
      text: state.language === 'ar' ? 'جرب تطبيق محفظتي لإدارة أموالك بذكاء!' : 'Check out Mahfazty Flow to manage your money smartly!',
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to copy to clipboard
        await navigator.clipboard.writeText(shareData.url);
        dispatch.setNotification({
          message: state.language === 'ar' ? 'تم نسخ الرابط بنجاح' : 'Link copied to clipboard',
          type: 'success'
        });
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div 
        className={`fixed top-0 ${state.language === 'ar' ? 'right-0' : 'left-0'} h-full w-72 bg-white dark:bg-slate-900 shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : (state.language === 'ar' ? 'translate-x-full' : '-translate-x-full')
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-[4px]">
              {state.language === 'ar' ? 'محفظتي' : 'Mahfazty'}
            </h1>
            {state.isPro && (
              <div className="flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest leading-none">Pro Active</span>
              </div>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* User Profile Section */}
          <div className="flex items-center gap-4">
            {state.userProfile.username === 'guest' ? (
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <User size={24} />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                <img src={state.userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {state.userProfile.username === 'guest' ? (state.language === 'ar' ? 'زائر' : 'Guest') : state.userProfile.name}
              </p>
              <p className="text-xs text-slate-500">
                {state.userProfile.username === 'guest' ? (state.language === 'ar' ? 'غير مسجل' : 'Not logged in') : state.userProfile.email}
              </p>
            </div>
          </div>

          {/* Quick Toggles */}
          <div className="grid grid-cols-3 gap-3">
            <button onClick={handleToggleLanguage} className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
              <span className="text-sm font-black">{state.language.toUpperCase()}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest">{state.language === 'ar' ? 'اللغة' : 'Lang'}</span>
            </button>
            <button onClick={handleToggleTheme} className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
              {state.isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span className="text-[9px] font-bold uppercase tracking-widest">{state.language === 'ar' ? 'المظهر' : 'Theme'}</span>
            </button>
            <button onClick={handleTogglePrivacy} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-colors ${state.isPrivacyMode ? 'bg-blue-500 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              {state.isPrivacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
              <span className="text-[9px] font-bold uppercase tracking-widest">{state.language === 'ar' ? 'الخصوصية' : 'Privacy'}</span>
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 mb-2">
              {state.language === 'ar' ? 'القائمة الرئيسية' : 'Main Menu'}
            </p>
            
            <button 
              onClick={() => { onClose(); state.isPro ? navigate('/settings') : navigate('/upgrade'); }}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                state.isPro 
                  ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/30' 
                  : 'bg-slate-50 dark:bg-slate-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
              }`}
            >
              <div className="flex items-center gap-3">
                {state.isPro ? <Crown size={20} className="animate-bounce" fill="currentColor" /> : <Zap size={20} className="animate-pulse" />}
                <span className="text-sm font-black uppercase tracking-wide">
                  {state.isPro ? (state.language === 'ar' ? 'عضوية برو' : 'Pro Member') : (state.language === 'ar' ? 'الترقية لبرو' : 'Get Pro')}
                </span>
              </div>
            </button>

            <button 
              onClick={() => { onClose(); navigate('/credit-cards'); }}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <CreditCard size={20} />
              <span className="text-sm font-bold">{state.language === 'ar' ? 'البطاقات الائتمانية' : 'Credit Cards'}</span>
            </button>

            <button 
              onClick={() => { onClose(); handleShareApp(); }}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Share2 size={20} />
              <span className="text-sm font-bold">{state.language === 'ar' ? 'مشاركة التطبيق' : 'Share App'}</span>
            </button>

            <button 
              onClick={() => { onClose(); navigate('/settings'); }}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Settings size={20} />
              <span className="text-sm font-bold">{state.language === 'ar' ? 'الإعدادات' : 'Settings'}</span>
            </button>

            <button 
              onClick={() => { onClose(); /* Handle notifications logic or navigate to a notifications screen */ }}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Bell size={20} />
                <span className="text-sm font-bold">{state.language === 'ar' ? 'الإشعارات' : 'Notifications'}</span>
              </div>
              {unreadCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800">
          {state.userProfile.username === 'guest' ? (
            <button 
              onClick={() => { onClose(); navigate('/auth'); }}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-lg shadow-blue-500/30"
            >
              <LogIn size={20} />
              <span className="text-sm font-black uppercase tracking-wide">
                {state.language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
              </span>
            </button>
          ) : (
            <button 
              onClick={() => { onClose(); dispatch.logout(); }}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
            >
              <LogIn size={20} className="rotate-180" />
              <span className="text-sm font-black uppercase tracking-wide">
                {state.language === 'ar' ? 'تسجيل الخروج' : 'Log Out'}
              </span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};
