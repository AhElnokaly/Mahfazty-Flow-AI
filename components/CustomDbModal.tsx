import React, { useState } from 'react';
import { useApp } from '../store';
import { X, Database, Check, AlertTriangle } from 'lucide-react';

interface CustomDbModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomDbModal: React.FC<CustomDbModalProps> = ({ isOpen, onClose }) => {
  const { state, dispatch } = useApp();
  const { language, customDbConfig } = state;
  
  const [provider, setProvider] = useState<'firebase' | 'supabase' | 'rest'>(customDbConfig?.provider || 'firebase');
  const [url, setUrl] = useState(customDbConfig?.url || '');
  const [apiKey, setApiKey] = useState(customDbConfig?.apiKey || '');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!url || !apiKey) {
      dispatch.setNotification({ message: language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields', type: 'error' });
      return;
    }
    dispatch.setCustomDbConfig({ provider, url, apiKey });
    dispatch.setNotification({ message: language === 'ar' ? 'تم حفظ إعدادات قاعدة البيانات' : 'Database settings saved', type: 'success' });
    onClose();
  };

  const handleDisconnect = () => {
    dispatch.setCustomDbConfig(undefined);
    dispatch.setNotification({ message: language === 'ar' ? 'تم قطع الاتصال' : 'Disconnected', type: 'success' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative flex flex-col animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Database size={20} />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase">
              {language === 'ar' ? 'قاعدة بيانات مخصصة' : 'Custom Database'}
            </h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 hover:text-rose-500 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl flex items-start gap-3 border border-amber-200 dark:border-amber-800/50">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
              {language === 'ar' 
                ? 'اربط تطبيقك بقاعدة بياناتك الخاصة (Firebase, Supabase, etc.) لمزامنة البيانات بين أجهزتك بدون الحاجة لإنشاء حساب.' 
                : 'Connect your app to your own database (Firebase, Supabase, etc.) to sync data across devices without needing an account.'}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">{language === 'ar' ? 'مزود الخدمة' : 'Provider'}</label>
              <div className="grid grid-cols-3 gap-2">
                {(['firebase', 'supabase', 'rest'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setProvider(p)}
                    className={`py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${provider === p ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">{language === 'ar' ? 'رابط قاعدة البيانات (URL)' : 'Database URL'}</label>
              <input 
                type="text" 
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">{language === 'ar' ? 'مفتاح الوصول (API Key)' : 'API Key'}</label>
              <input 
                type="password" 
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            {customDbConfig && (
              <button 
                onClick={handleDisconnect}
                className="flex-1 py-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl font-black uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all"
              >
                {language === 'ar' ? 'إلغاء الربط' : 'Disconnect'}
              </button>
            )}
            <button 
              onClick={handleSave}
              className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:shadow-xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
            >
              <Check size={18} />
              {language === 'ar' ? 'حفظ واتصال' : 'Save & Connect'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
