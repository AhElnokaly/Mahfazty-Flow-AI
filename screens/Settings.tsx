
import React, { useState, useRef } from 'react';
import { useApp } from '../store';
import { cloudService } from '../services/cloud';
import { AuthModal } from '../components/AuthModal';
import { CustomDbModal } from '../components/CustomDbModal';
import { Link } from 'react-router-dom';
import { 
  Trash2, Edit3, Globe, Zap, Share2, Upload, Server, Info, ToggleLeft, ToggleRight, Check, CreditCard, ExternalLink, Key, Plus, MessageCircle, Mail, AlertTriangle, X, LogOut, ShieldCheck, Eye, EyeOff, RefreshCcw, Cloud, CloudOff, RefreshCw, TrendingUp, Sparkles, Target, Archive, Wallet, Database
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

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
  const [showAddKey, setShowAddKey] = useState(false);
  const [showCloudAuth, setShowCloudAuth] = useState(false);
  const [showCustomDbModal, setShowCustomDbModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Delete confirmation state
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');

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

  const confirmDeleteKey = () => {
    if (keyToDelete) {
      dispatch.deleteApiKey(keyToDelete);
      setKeyToDelete(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32 animate-in fade-in duration-700 px-2">
      
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
                 <div className="space-y-4">
                   <input 
                     value={profileForm.name} 
                     onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                     className="text-3xl md:text-5xl font-black bg-white/20 rounded-2xl px-4 py-2 text-white outline-none w-full text-center md:text-right" 
                     placeholder={language === 'ar' ? 'الاسم' : 'Name'}
                   />
                   <input 
                     type="email"
                     value={profileForm.email || ''} 
                     onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                     className="text-lg font-bold bg-white/20 rounded-2xl px-4 py-2 text-white outline-none w-full text-center md:text-right" 
                     placeholder={language === 'ar' ? 'البريد الإلكتروني (لاستعادة كلمة المرور)' : 'Email (for password reset)'}
                   />
                 </div>
              ) : (
                 <h2 className="text-3xl md:text-5xl font-black tracking-tight">{userProfile.name}</h2>
              )}
              
              {!isEditingProfile && (
                <div className="flex items-center justify-center md:justify-end gap-2 opacity-70">
                   <p className="text-blue-100 text-sm">{userProfile.email || (language === 'ar' ? 'لم يتم تسجيل بريد إلكتروني' : 'No email registered')}</p>
                </div>
              )}

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

      {showAvatarPicker && isEditingProfile && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 animate-in slide-in-from-top-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 text-center">
            {language === 'ar' ? 'اختر صورة شخصية' : 'Choose Avatar'}
          </h3>
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            {AVATARS.map((avatar, idx) => (
              <button 
                key={idx}
                onClick={() => setProfileForm({ ...profileForm, avatar })}
                className={`w-16 h-16 rounded-2xl overflow-hidden border-4 transition-all ${profileForm.avatar === avatar ? 'border-blue-500 scale-110 shadow-lg' : 'border-transparent hover:scale-105 opacity-70 hover:opacity-100'}`}
              >
                <img src={avatar} className="w-full h-full object-cover bg-slate-100 dark:bg-slate-700" />
              </button>
            ))}
          </div>
          <div className="flex justify-center">
            <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2">
              <Upload size={16} />
              {language === 'ar' ? 'رفع صورة' : 'Upload Picture'}
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setProfileForm({ ...profileForm, avatar: reader.result as string });
                    };
                    reader.readAsDataURL(file);
                  }
                }} 
              />
            </label>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
        {[
          { id: 'general', icon: <Info size={16} />, label: language === 'ar' ? 'عام' : 'General' },
          { id: 'security', icon: <ShieldCheck size={16} />, label: language === 'ar' ? 'الأمان' : 'Security' },
          { id: 'data', icon: <Database size={16} />, label: language === 'ar' ? 'البيانات' : 'Data' },
          { id: 'support', icon: <MessageCircle size={16} />, label: language === 'ar' ? 'الدعم' : 'Support' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {activeTab === 'general' && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[5px] px-6">{language === 'ar' ? 'إعدادات النظام' : 'System Management'}</h3>
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

              {/* Edit Starting Balance */}
              <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center transition-colors">
                      <Wallet size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">{language === 'ar' ? 'الرصيد الافتتاحي' : 'Starting Balance'}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{language === 'ar' ? 'تعديل الرصيد الحالي' : 'Edit current balance'}</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => {
                     const { isIncomeLike, isExpenseLike } = require('../store');
                     const totalIncome = state.transactions.filter(t => isIncomeLike(t)).reduce((sum, t) => sum + t.amount, 0);
                     const totalExpense = state.transactions.filter(t => isExpenseLike(t)).reduce((sum, t) => sum + t.amount, 0);
                     const totalInstallmentsPaid = state.installments.reduce((sum, i) => sum + (i.paidCount * i.monthlyAmount), 0);
                     const calculatedBalance = totalIncome - totalExpense - totalInstallmentsPaid;
                     const adjustment = state.walletBalance - calculatedBalance;

                     const newBalance = prompt(language === 'ar' ? 'أدخل الرصيد الافتتاحي الجديد:' : 'Enter new starting balance:', adjustment.toString());
                     if (newBalance !== null && !isNaN(parseFloat(newBalance))) {
                       dispatch.updateWalletBalance(calculatedBalance + parseFloat(newBalance));
                       dispatch.setNotification({ message: language === 'ar' ? 'تم تحديث الرصيد بنجاح' : 'Balance updated successfully', type: 'success' });
                     }
                   }}
                   className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all active:scale-95"
                 >
                   {language === 'ar' ? 'تعديل' : 'EDIT'}
                 </button>
              </div>

              {/* Push Notifications Toggle */}
              <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl">
                 <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl ${state.pushNotifications ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'} flex items-center justify-center transition-colors`}>
                      <MessageCircle size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">{language === 'ar' ? 'إشعارات الدفع' : 'Push Notifications'}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{language === 'ar' ? 'تلقي التنبيهات' : 'Receive Alerts'}</p>
                    </div>
                 </div>
                 <button onClick={() => dispatch.togglePushNotifications()} className="text-2xl">
                   {state.pushNotifications ? <ToggleRight size={32} className="text-amber-500" /> : <ToggleLeft size={32} className="text-slate-300" />}
                 </button>
              </div>

              {/* Archive Link */}
              <Link to="/archive" className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
                      <Archive size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">{language === 'ar' ? 'الأرشيف' : 'Archive'}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{language === 'ar' ? 'العملاء والمجموعات المؤرشفة' : 'Archived clients & groups'}</p>
                    </div>
                 </div>
                 <ExternalLink size={16} className="text-slate-400" />
              </Link>

              {/* Pro Version Toggle */}
              <div className="flex items-center justify-between p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-100 dark:border-amber-900/30 rounded-3xl col-span-1 md:col-span-2">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-lg">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-amber-900 dark:text-amber-500 uppercase flex items-center gap-2">
                        {language === 'ar' ? 'النسخة الاحترافية' : 'Pro Version'}
                        <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-[8px] tracking-widest">PRO</span>
                      </h4>
                      <p className="text-[9px] font-bold text-amber-700/70 dark:text-amber-500/70 uppercase">{language === 'ar' ? 'تفعيل الميزات المتقدمة' : 'Enable advanced features'}</p>
                    </div>
                 </div>
                 <button onClick={() => {
                   dispatch.setPro(!isPro);
                   dispatch.setNotification({
                     message: !isPro ? (language === 'ar' ? 'تم تفعيل النسخة الاحترافية' : 'Pro Version Activated') : (language === 'ar' ? 'تم إلغاء تفعيل النسخة الاحترافية' : 'Pro Version Deactivated'),
                     type: 'success'
                   });
                 }} className="text-2xl">
                   {isPro ? <ToggleRight size={32} className="text-amber-500" /> : <ToggleLeft size={32} className="text-amber-200 dark:text-amber-900/50" />}
                 </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'security' && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[5px] px-6">{language === 'ar' ? 'إعدادات الأمان' : 'Security Settings'}</h3>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Biometrics Toggle */}
              <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl">
                 <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl ${state.security.biometrics ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'} flex items-center justify-center transition-colors`}>
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">{language === 'ar' ? 'البصمة البيومترية' : 'Biometrics'}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{language === 'ar' ? 'تسجيل الدخول بالبصمة' : 'Login with Biometrics'}</p>
                    </div>
                 </div>
                 <button onClick={() => dispatch.toggleBiometrics()} className="text-2xl">
                   {state.security.biometrics ? <ToggleRight size={32} className="text-emerald-600" /> : <ToggleLeft size={32} className="text-slate-300" />}
                 </button>
              </div>

              {/* Decoy Password Setting */}
              <div className="flex flex-col gap-3 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl ${state.security.decoyPassword ? 'bg-rose-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'} flex items-center justify-center transition-colors`}>
                        <Key size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">{language === 'ar' ? 'كلمة المرور الوهمية' : 'Decoy Password'}</h4>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">{language === 'ar' ? 'لإخفاء البيانات عند الإجبار' : 'Hide data when forced'}</p>
                      </div>
                   </div>
                 </div>
                 <div className="flex items-center gap-2 mt-2">
                   <input 
                     type="password"
                     placeholder={language === 'ar' ? 'أدخل كلمة مرور وهمية' : 'Enter decoy password'}
                     className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-medium outline-none focus:border-rose-500"
                     id="decoyPasswordInput"
                   />
                   <button 
                     onClick={() => {
                       const input = document.getElementById('decoyPasswordInput') as HTMLInputElement;
                       if (input.value) {
                         dispatch.setDecoyPassword(input.value);
                         input.value = '';
                         dispatch.setNotification({ message: language === 'ar' ? 'تم تعيين كلمة المرور الوهمية' : 'Decoy password set', type: 'success' });
                       }
                     }}
                     className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all active:scale-95"
                   >
                     {language === 'ar' ? 'حفظ' : 'SAVE'}
                   </button>
                 </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-6 mt-8">
               <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[5px]">{language === 'ar' ? 'مفاتيح الذكاء الاصطناعي' : 'AI API Keys'}</h3>
               <button onClick={() => setShowAddKey(!showAddKey)} className="text-blue-500 text-xs font-bold uppercase tracking-wider hover:underline">
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
                                <span className="text-[8px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">{key.provider?.toUpperCase() || 'GEMINI'}</span>
                                {state.activeApiKeyId === key.id && <span className="text-[8px] bg-blue-500 text-white px-2 py-0.5 rounded-full">ACTIVE</span>}
                              </h4>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Used: {key.usageCount} / 1500</span>
                                {key.lastUsed && <span className="text-[9px] font-bold text-slate-400 uppercase">Last: {new Date(key.lastUsed).toLocaleDateString()}</span>}
                              </div>
                              <div className="mt-2 h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden max-w-[200px]">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${key.usageCount > 1400 ? 'bg-rose-500' : key.usageCount > 1000 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                  style={{ width: `${Math.min((key.usageCount / 1500) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                             {key.isBlocked && (
                               <button onClick={() => dispatch.blockApiKey(key.id)} className="p-2 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors" title="Unblock">
                                 <RefreshCcw size={16} />
                               </button>
                             )}
                             <button onClick={() => {
                               setKeyToDelete(key.id);
                             }} className="p-2 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors">
                               <Trash2 size={16} />
                             </button>
                          </div>
                        </div>
                     </div>
                   ))}
                 </div>
               )}

               {/* Add Key Form */}
               {(showAddKey || state.apiKeys.length === 0) && (
                 <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                   <div className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                       <select
                         id="newKeyProvider"
                         className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500"
                       >
                         <option value="gemini">Google Gemini</option>
                         <option value="xai">xAI (Grok)</option>
                         <option value="openai">OpenAI</option>
                         <option value="groq">Groq</option>
                       </select>
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
                             const providerInput = document.getElementById('newKeyProvider') as HTMLSelectElement;
                             const nameInput = document.getElementById('newKeyName') as HTMLInputElement;
                             const keyInput = document.getElementById('newKeyValue') as HTMLInputElement;
                             if (nameInput.value && keyInput.value) {
                               dispatch.addApiKey(nameInput.value, keyInput.value, providerInput.value);
                               if (state.apiKeys.length === 0) {
                                 dispatch.unlockAchievement('first_api_key');
                               }
                               nameInput.value = '';
                               keyInput.value = '';
                               providerInput.value = 'gemini';
                               setShowAddKey(false);
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
               )}
            </div>
          </section>
        )}

        {activeTab === 'data' && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[5px] px-6">{language === 'ar' ? 'إدارة البيانات والمزامنة' : 'Data & Sync'}</h3>
            
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
               {/* Cloud Sync */}
               <div className="flex flex-col md:flex-row items-center justify-between p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl gap-4">
                 <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl ${state.syncProvider === 'cloud' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'} flex items-center justify-center transition-colors`}>
                      {state.syncProvider === 'cloud' ? <Cloud size={18} /> : <CloudOff size={18} />}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">{language === 'ar' ? 'المزامنة السحابية' : 'Cloud Sync'}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{language === 'ar' ? 'مزامنة البيانات عبر الأجهزة' : 'Sync data across devices'}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                   {state.syncProvider === 'cloud' && (
                     <button onClick={() => dispatch.pullFromCloud()} className="text-[10px] font-bold text-blue-500 uppercase flex items-center gap-1 hover:underline">
                       <RefreshCw size={12} /> {language === 'ar' ? 'سحب البيانات' : 'Pull Data'}
                     </button>
                   )}
                   <button 
                     onClick={() => state.syncProvider === 'cloud' ? dispatch.disableCloudSync() : setShowCloudAuth(!showCloudAuth)} 
                     className="text-2xl"
                   >
                     {state.syncProvider === 'cloud' ? <ToggleRight size={32} className="text-blue-600" /> : <ToggleLeft size={32} className="text-slate-300" />}
                   </button>
                 </div>
               </div>

               {/* Custom DB Sync */}
               <div className="flex flex-col md:flex-row items-center justify-between p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl gap-4">
                 <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl ${state.syncProvider === 'custom_db' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'} flex items-center justify-center transition-colors`}>
                      <Server size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">{language === 'ar' ? 'قاعدة بيانات مخصصة' : 'Custom Database'}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{language === 'ar' ? 'مزامنة مع خادمك الخاص' : 'Sync with your own server'}</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => setShowCustomDbModal(true)} 
                   className="text-2xl"
                 >
                   {state.syncProvider === 'custom_db' ? <ToggleRight size={32} className="text-indigo-600" /> : <ToggleLeft size={32} className="text-slate-300" />}
                 </button>
               </div>

               {/* Backup & Restore */}
               <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                 <button onClick={handleExport} className="flex flex-col items-center justify-center gap-2 p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30 text-blue-600">
                   <Share2 size={24} />
                   <span className="text-[9px] font-black uppercase">Backup</span>
                 </button>
                 <button onClick={() => importFileRef.current?.click()} className="flex flex-col items-center justify-center gap-2 p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/30 text-emerald-600">
                   <Upload size={24} />
                   <span className="text-[9px] font-black uppercase">Restore</span>
                 </button>
                 <button onClick={() => setShowDeleteConfirm(true)} className="flex flex-col items-center justify-center gap-2 p-6 bg-rose-50 dark:bg-rose-900/10 rounded-3xl border border-rose-100 dark:border-rose-900/30 text-rose-600">
                   <Trash2 size={24} />
                   <span className="text-[9px] font-black uppercase">{language === 'ar' ? 'مسح البيانات' : 'Delete Data'}</span>
                 </button>
                 <input type="file" ref={importFileRef} className="hidden" />
               </div>
            </div>
          </section>
        )}

        {activeTab === 'support' && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[5px] px-6">{language === 'ar' ? 'الدعم والملاحظات' : 'Support & Feedback'}</h3>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
               <div className="space-y-4">
                 <textarea 
                   id="feedbackText"
                   className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm outline-none focus:border-blue-500 resize-none h-32"
                   placeholder={language === 'ar' ? 'أخبرنا برأيك أو اقترح ميزة جديدة...' : 'Tell us what you think or suggest a feature...'}
                 />
                 <div className="flex flex-col sm:flex-row gap-3">
                   <button 
                     onClick={() => {
                       const el = document.getElementById('feedbackText') as HTMLTextAreaElement;
                       const feedback = el.value.trim();
                       if (feedback) {
                         const subject = encodeURIComponent('Mahfazty App Feedback');
                         const body = encodeURIComponent(feedback);
                         window.location.href = `mailto:support@mahfazty.app?subject=${subject}&body=${body}`;
                         el.value = '';
                         dispatch.setNotification({ message: language === 'ar' ? 'شكراً لملاحظاتك!' : 'Thank you for your feedback!', type: 'success' });
                       }
                     }}
                     className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                   >
                     <Mail size={16} /> {language === 'ar' ? 'إرسال عبر البريد' : 'Send via Email'}
                   </button>
                   <button 
                     onClick={() => {
                       const el = document.getElementById('feedbackText') as HTMLTextAreaElement;
                       const feedback = el.value.trim();
                       if (feedback) {
                         const text = encodeURIComponent(`مرحباً، لدي استفسار/اقتراح بخصوص تطبيق محفظتي:

${feedback}`);
                         window.open(`https://wa.me/201000000000?text=${text}`, '_blank');
                         el.value = '';
                         dispatch.setNotification({ message: language === 'ar' ? 'شكراً لملاحظاتك!' : 'Thank you for your feedback!', type: 'success' });
                       }
                     }}
                     className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                   >
                     <MessageCircle size={16} /> {language === 'ar' ? 'واتساب' : 'WhatsApp'}
                   </button>
                 </div>
               </div>
            </div>
          </section>
        )}
      </div>

      {/* Modals */}
      {showCloudAuth && (
        <AuthModal 
          isOpen={showCloudAuth} 
          onClose={() => setShowCloudAuth(false)} 
        />
      )}

      {showCustomDbModal && (
        <CustomDbModal
          isOpen={showCustomDbModal}
          onClose={() => setShowCustomDbModal(false)}
        />
      )}

      {/* Delete Data Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
             <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
               <AlertTriangle size={32} />
             </div>
             <h3 className="text-xl font-black text-center mb-2">{language === 'ar' ? 'تأكيد مسح البيانات' : 'Confirm Data Deletion'}</h3>
             <p className="text-sm text-slate-500 text-center mb-8">
               {language === 'ar' 
                 ? 'هل أنت متأكد من رغبتك في مسح جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه.' 
                 : 'Are you sure you want to delete all data? This action cannot be undone.'}
             </p>
             <div className="flex gap-3">
               <button 
                 onClick={() => setShowDeleteConfirm(false)}
                 className="flex-1 py-3 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
               >
                 {language === 'ar' ? 'إلغاء' : 'Cancel'}
               </button>
               <button 
                 onClick={() => {
                   dispatch.resetData();
                   setShowDeleteConfirm(false);
                   dispatch.setNotification({ message: language === 'ar' ? 'تم مسح البيانات بنجاح' : 'Data deleted successfully', type: 'success' });
                 }}
                 className="flex-1 py-3 rounded-xl font-bold text-xs bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/30"
               >
                 {language === 'ar' ? 'مسح البيانات' : 'Delete Data'}
               </button>
             </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!keyToDelete}
        onClose={() => setKeyToDelete(null)}
        onConfirm={confirmDeleteKey}
        title={language === 'ar' ? 'تأكيد مسح المفتاح' : 'Confirm Key Deletion'}
        message={language === 'ar' ? 'هل أنت متأكد من مسح مفتاح الذكاء الاصطناعي هذا؟' : 'Are you sure you want to delete this AI API key?'}
        confirmText={language === 'ar' ? 'مسح' : 'Delete'}
        cancelText={language === 'ar' ? 'إلغاء' : 'Cancel'}
      />
    </div>
  );
};

export default Settings;
