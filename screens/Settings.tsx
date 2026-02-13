

import React, { useState, useRef } from 'react';
import { useApp } from '../store';
import { 
  Trash2, Edit3, Globe, Zap, Share2, Upload, Server, Info, ToggleLeft, ToggleRight, Check, CreditCard, ExternalLink, Key, Plus, MessageCircle, Mail, AlertTriangle, X, LogOut, ShieldCheck
} from 'lucide-react';

const AVATARS = [
  'Ahmed', 'Sara', 'Mohamed', 'Mona', 'Zaid', 'Noor', 'Adam', 'Eva', 'Leo', 'Mia'
].map(s => `https://api.dicebear.com/7.x/open-peeps/svg?seed=${s}&backgroundColor=b6e3f4,c0aede,d1d4f9`);

const Settings: React.FC = () => {
  const { state, dispatch } = useApp();
  const importFileRef = useRef<HTMLInputElement>(null);
  const { language, autoSync, userProfile, isPro, cloudEndpoint } = state;

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState(userProfile);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

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
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-[3rem] border-4 border-white/20 shadow-2xl overflow-hidden cursor-pointer bg-white/10" onClick={() => setShowAvatarPicker(!showAvatarPicker)}>
              <img src={profileForm.avatar} className="w-full h-full object-cover" />
            </div>
            <button onClick={() => isEditingProfile ? handleSaveProfile() : setIsEditingProfile(true)} className="absolute -bottom-2 -right-2 w-11 h-11 bg-white text-blue-600 rounded-2xl flex items-center justify-center shadow-2xl">
              {isEditingProfile ? <Check size={22} /> : <Edit3 size={18} />}
            </button>
          </div>
          <div className="text-center md:text-right flex-1 space-y-3">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">{userProfile.name}</h2>
              <div className="flex items-center justify-center md:justify-end gap-2 opacity-70">
                 <img src="https://www.google.com/favicon.ico" className="w-3 h-3" />
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
        {/* System Settings & Backup */}
        <section className="space-y-6 lg:col-span-2">
          <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[5px] px-6">System Management</h3>
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <div className="grid grid-cols-2 gap-3">
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
