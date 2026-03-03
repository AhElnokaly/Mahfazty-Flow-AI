

import React, { useState, useRef } from 'react';
import { useApp } from '../store';
import { cloudService } from '../services/cloud';
import { AuthModal } from '../components/AuthModal';
import { 
  Trash2, Edit3, Globe, Zap, Share2, Upload, Server, Info, ToggleLeft, ToggleRight, Check, CreditCard, ExternalLink, Key, Plus, MessageCircle, Mail, AlertTriangle, X, LogOut, ShieldCheck, Eye, EyeOff, RefreshCcw, Cloud, CloudOff, RefreshCw
} from 'lucide-react';

const AVATARS = [
  'Ahmed', 'Sara', 'Mohamed', 'Mona', 'Zaid', 'Noor', 'Adam', 'Eva', 'Leo', 'Mia'
].map(s => `https://api.dicebear.com/7.x/open-peeps/svg?seed=${s}&backgroundColor=b6e3f4,c0aede,d1d4f9`);

const Settings: React.FC = () => {
  const { state, dispatch } = useApp();
  const importFileRef = useRef<HTMLInputElement>(null);
  const { language, autoSync, userProfile, isPro, cloudEndpoint, isPrivacyMode } = state;

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState(userProfile);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showCloudAuth, setShowCloudAuth] = useState(false);

  const handleSaveProfile = () => {
    dispatch.updateProfile(profileForm);
    setIsEditingProfile(false);
    setShowAvatarPicker(false);
    dispatch.setNotification({ message: 'Profile Updated', type: 'success' });
  };

  const handleLogout = () => {
     if (navigator.vibrate) navigator.vibrate(50);
     dispatch.logout();
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `mahfazty_backup.json`);
    linkElement.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-32 animate-in fade-in duration-700 px-2">
      
      {/* Profile Card */}
      <div className="bg-gradient-to-br from-[#0055CC] to-blue-800 p-8 md:p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="relative group">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-[3rem] border-4 border-white/20 shadow-2xl overflow-hidden cursor-pointer bg-white/10" onClick={() => isEditingProfile && setShowAvatarPicker(!showAvatarPicker)}>
              <img src={isEditingProfile ? profileForm.avatar : userProfile.avatar} className="w-full h-full object-cover" />
            </div>
            <button onClick={() => isEditingProfile ? handleSaveProfile() : setIsEditingProfile(true)} className="absolute -bottom-2 -right-2 w-11 h-11 bg-white text-blue-600 rounded-2xl flex items-center justify-center shadow-2xl z-20 hover:scale-110 transition-transform">
              {isEditingProfile ? <Check size={22} /> : <Edit3 size={18} />}
            </button>
          </div>
          <div className="text-center md:text-right flex-1 space-y-3">
              {isEditingProfile ? (
                 <input 
                   value={profileForm.name} 
                   onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                   className="text-3xl md:text-5xl font-black bg-white/20 rounded-2xl px-4 py-2 text-white outline-none w-full text-center md:text-right" 
                 />
              ) : (
                 <h2 className="text-3xl md:text-5xl font-black tracking-tight">{userProfile.name}</h2>
              )}
              
              <div className="flex items-center justify-center md:justify-end gap-2 opacity-70">
                 <p className="text-blue-100 text-sm">{userProfile.email}</p>
              </div>

              <div className="flex items-center justify-center md:justify-end gap-3 mt-4">
                <button onClick={handleLogout} className="px-4 py-2 bg-white/10 hover:bg-rose-500/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/10 transition-colors">
                  <LogOut size={12} /> {language === 'ar' ? 'خروج' : 'Logout'}
                </button>
                {isPro && (
                  <div className="bg-amber-400 text-amber-900 px-4 py-1.5 rounded-full text-[9px] font-black tracking-[2px] uppercase shadow-lg flex items-center gap-2"> 
                    <Zap size={10} fill="currentColor" /> PRO
                  </div>
                )}
              </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* API Key Management */}
        <section className="space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between px-6">
             <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[5px]">{language === 'ar' ? 'مفاتيح الذكاء الاصطناعي' : 'AI API Keys'}</h3>
             <button onClick={() => setShowAvatarPicker(!showAvatarPicker)} className="text-blue-500 text-xs font-bold uppercase tracking-wider hover:underline">
               {language === 'ar' ? '+ إضافة مفتاح' : '+ Add Key'}
             </button>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
             {state.apiKeys.length === 0 ? (
               <div className="text-center py-8 opacity-50 space-y-2">
                 <Key className="mx-auto text-slate-400" size={32} />
                 <p className="text-xs font-bold text-slate-500 uppercase">{language === 'ar' ? 'لا توجد مفاتيح محفوظة' : 'No API Keys Found'}</p>
                 <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                   {language === 'ar' ? 'أضف مفتاح Gemini API الخاص بك لتفعيل الميزات الذكية.' : 'Add your Gemini API key to enable AI features.'}
                 </p>
               </div>
             ) : (
               <div className="grid gap-4">
                 {state.apiKeys.map(key => (
                   <div key={key.id} className={`relative p-5 rounded-3xl border transition-all ${key.isBlocked ? 'bg-rose-50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-900/30' : (state.activeApiKeyId === key.id ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/30 shadow-md' : 'bg-slate-50 border-slate-100 dark:bg-slate-900/50 dark:border-slate-800')}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${key.isBlocked ? 'bg-rose-100 text-rose-500' : 'bg-white dark:bg-slate-800 text-blue-500 shadow-sm'}`}>
                            {key.isBlocked ? <AlertTriangle size={18} /> : <Key size={18} />}
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
                              {key.name}
                              {state.activeApiKeyId === key.id && <span className="text-[8px] bg-blue-500 text-white px-2 py-0.5 rounded-full">ACTIVE</span>}
                            </h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[9px] font-bold text-slate-400 uppercase">Used: {key.usageCount} times</span>
                              {key.lastUsed && <span className="text-[9px] font-bold text-slate-400 uppercase">Last: {new Date(key.lastUsed).toLocaleDateString()}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                           {key.isBlocked && (
                             <button onClick={() => dispatch.blockApiKey(key.id)} className="p-2 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors" title="Unblock">
                               <RefreshCcw size={16} />
                             </button>
                           )}
                           <button onClick={() => dispatch.deleteApiKey(key.id)} className="p-2 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors">
                             <Trash2 size={16} />
                           </button>
                        </div>
                      </div>
                   </div>
                 ))}
               </div>
             )}

             {/* Add Key Form (Toggleable or always visible if empty) */}
             <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
               <div className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <input 
                     placeholder={language === 'ar' ? 'اسم المفتاح (مثلاً: الشخصي)' : 'Key Name (e.g. Personal)'}
                     className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500"
                     id="newKeyName"
                   />
                   <div className="md:col-span-2 flex gap-2">
                     <input 
                       placeholder="AIzaSy..."
                       className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-mono outline-none focus:border-blue-500"
                       id="newKeyValue"
                       type="password"
                     />
                     <button 
                       onClick={() => {
                         const nameInput = document.getElementById('newKeyName') as HTMLInputElement;
                         const keyInput = document.getElementById('newKeyValue') as HTMLInputElement;
                         if (nameInput.value && keyInput.value) {
                           dispatch.addApiKey(nameInput.value, keyInput.value);
                           nameInput.value = '';
                           keyInput.value = '';
                         }
                       }}
                       className="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all active:scale-95"
                     >
                       {language === 'ar' ? 'إضافة' : 'ADD'}
                     </button>
                   </div>
                 </div>
                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide text-center">
                   {language === 'ar' 
                     ? 'يتم تخزين المفاتيح محلياً ومشفرة. سيقوم التطبيق بالتبديل تلقائياً إذا فشل أحد المفاتيح.' 
                     : 'Keys are stored locally & encrypted. App auto-switches if a key fails.'}
                 </p>
               </div>
             </div>
          </div>
        </section>

        {/* System Settings & Backup */}
        <section className="space-y-6 lg:col-span-2">
          <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[5px] px-6">System Management</h3>
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Privacy Toggle */}
            <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl">
               <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${isPrivacyMode ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'} flex items-center justify-center transition-colors`}>
                    {isPrivacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">{language === 'ar' ? 'وضع الخصوصية' : 'Privacy Mode'}</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{language === 'ar' ? 'إخفاء الأرقام المالية' : 'Blur Financial Amounts'}</p>
                  </div>
               </div>
               <button onClick={() => dispatch.togglePrivacyMode()} className="text-2xl">
                 {isPrivacyMode ? <ToggleRight size={32} className="text-indigo-600" /> : <ToggleLeft size={32} className="text-slate-300" />}
               </button>
            </div>

            {/* Cloud Sync Toggle */}
            <div className="flex flex-col p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl gap-4">
               <div className="flex items-center justify-between w-full">
                 <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl ${state.syncProvider === 'cloud' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'} flex items-center justify-center transition-colors`}>
                      {state.syncProvider === 'cloud' ? <Cloud size={18} /> : <CloudOff size={18} />}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">{language === 'ar' ? 'المزامنة السحابية' : 'Cloud Sync'}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">
                        {state.syncProvider === 'cloud' 
                          ? (state.isSyncing ? 'Syncing...' : `Last: ${state.lastSyncTimestamp ? new Date(state.lastSyncTimestamp).toLocaleTimeString() : 'Never'}`) 
                          : (language === 'ar' ? 'غير مفعل' : 'Disabled')}
                      </p>
                    </div>
                 </div>
                 <button 
                   onClick={() => state.syncProvider === 'cloud' ? dispatch.disableCloudSync() : setShowCloudAuth(!showCloudAuth)} 
                   className="text-2xl"
                 >
                   {state.syncProvider === 'cloud' ? <ToggleRight size={32} className="text-blue-600" /> : <ToggleLeft size={32} className="text-slate-300" />}
                 </button>
               </div>
               
               {state.syncProvider === 'cloud' && (
                 <div className="flex justify-end">
                   <button onClick={() => dispatch.pullFromCloud()} className="text-[10px] font-bold text-blue-500 uppercase flex items-center gap-1 hover:underline">
                     <RefreshCw size={12} /> {language === 'ar' ? 'سحب البيانات' : 'Pull Data'}
                   </button>
                 </div>
               )}

               {/* Cloud Auth Modal */}
               <AuthModal isOpen={showCloudAuth} onClose={() => setShowCloudAuth(false)} />
            </div>

            <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                    <Globe size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">Cloud Identity</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Synchronized</p>
                  </div>
               </div>
               <Check className="text-emerald-500" />
            </div>

            {/* Sync History (Audit Log) */}
            {state.syncProvider === 'cloud' && state.syncHistory.length > 0 && (
              <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">{language === 'ar' ? 'سجل المزامنة' : 'Sync Audit Log'}</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">End-to-End Encrypted</p>
                  </div>
                </div>
                
                <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {state.syncHistory.map(log => (
                    <div key={log.id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">
                          {log.type === 'push' ? (language === 'ar' ? 'رفع' : 'PUSH') : (language === 'ar' ? 'سحب' : 'PULL')}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-mono text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</p>
                        {log.details && <p className="text-[8px] text-slate-300 truncate max-w-[120px]">{log.details}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 md:col-span-2">
              <button onClick={handleExport} className="flex flex-col items-center justify-center gap-2 p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 text-blue-600">
                <Share2 size={24} />
                <span className="text-[9px] font-black uppercase">Backup</span>
              </button>
              <button onClick={() => importFileRef.current?.click()} className="flex flex-col items-center justify-center gap-2 p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 text-emerald-600">
                <Upload size={24} />
                <span className="text-[9px] font-black uppercase">Restore</span>
              </button>
              <input type="file" ref={importFileRef} className="hidden" />
            </div>
          </div>
        </section>
      </div>

      <div className="p-16 text-center space-y-6 opacity-30">
        <p className="text-[8px] font-black uppercase tracking-[8px] text-slate-400">Mahfazty Flow v12.1 Security Cloud Edition</p>
      </div>
    </div>
  );
};

export default Settings;
