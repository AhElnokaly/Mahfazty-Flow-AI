
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../store';
import { TransactionType } from '../types';
import { ArrowLeft, Save, TrendingUp, TrendingDown, Calendar, User, FileText, ChevronRight, Layers, Sparkles, Loader2, Camera, Scan } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { suggestTransactionNote, sendChatMessage } from '../geminiService';

const CURRENCIES = ['EGP', 'USD', 'EUR', 'GBP', 'SAR', 'AED'];

const AddFlow: React.FC = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const { language, groups, clients, baseCurrency } = state;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(baseCurrency);
  const [groupId, setGroupId] = useState(groups[0]?.id || '');
  const [clientId, setClientId] = useState('');
  const [note, setNote] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  const [date, setDate] = useState(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  });

  const filteredClients = clients.filter(c => c.groupId === groupId);

  useEffect(() => {
    if (filteredClients.length > 0) {
      setClientId(filteredClients[0].id);
    } else {
      setClientId('');
    }
  }, [groupId]);

  const vibrate = () => {
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9.]/g, '');
    const parts = rawValue.split('.');
    if (parts.length > 2) return;
    setAmount(rawValue);
  };

  const formattedAmount = () => {
    if (!amount) return '';
    const parts = amount.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    vibrate();

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const response = await sendChatMessage(state, "Analyze this receipt. Extract ONLY a JSON: { 'amount': number, 'date': 'YYYY-MM-DD', 'note': 'string summary', 'type': 'EXPENSE'|'INCOME' }. If not a receipt, return empty JSON.", false, { data: base64, mimeType: file.type });
        
        // Find JSON in response text
        const jsonMatch = response.text.match(/\{.*\}/s);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          if (data.amount) setAmount(data.amount.toString());
          if (data.date) setDate(data.date);
          if (data.note) setNote(data.note);
          if (data.type) setType(data.type === 'INCOME' ? TransactionType.INCOME : TransactionType.EXPENSE);
          dispatch.setNotification({ message: language === 'ar' ? 'تم استخراج البيانات بنجاح' : 'Receipt scanned successfully', type: 'success' });
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      dispatch.setNotification({ message: 'OCR Failed', type: 'error' });
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    vibrate();
    
    if (!amount || !groupId || !clientId) {
      dispatch.setNotification({ message: language === 'ar' ? 'يرجى إكمال كافة البيانات المطلوبة' : 'Please complete all fields', type: 'error' });
      return;
    }

    dispatch.addTransaction({
      amount: parseFloat(amount),
      currency,
      type,
      groupId,
      clientId,
      note,
      date,
    });
    
    navigate('/');
  };

  return (
    <div className="max-w-screen-lg mx-auto animate-in fade-in slide-in-from-bottom-10 duration-700">
      <div className="flex items-center justify-between mb-8 md:mb-12">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="w-12 h-12 md:w-14 md:h-14 bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl hover:scale-110 transition-all">
            <ArrowLeft size={24} className={language === 'ar' ? 'rotate-180 text-slate-700 dark:text-slate-300' : 'text-slate-700 dark:text-slate-300'} />
          </button>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {language === 'ar' ? 'إضافة تدفق مالي' : 'New Flow Entry'}
            </h2>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[3px] mt-1">Financial Wizard</p>
          </div>
        </div>

        <button 
          type="button"
          disabled={isScanning}
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-1 group"
        >
          <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-all relative">
             {isScanning ? <Loader2 className="animate-spin" size={24} /> : <Scan size={24} />}
             <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" capture="environment" />
          </div>
          <span className="text-[8px] font-black uppercase text-blue-600 tracking-widest">{language === 'ar' ? 'مسح إيصال' : 'Scan Receipt'}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-8 pb-32">
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white dark:bg-slate-800 p-8 md:p-10 rounded-[40px] md:rounded-[56px] shadow-2xl border border-slate-100 dark:border-slate-800/50">
            
            <div className="mb-8 md:mb-12">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[4px] mb-4 px-2">
                {language === 'ar' ? 'قيمة التدفق المالي' : 'Transaction Value'}
              </label>
              <div className="relative">
                <input
                  type="text" inputMode="decimal" value={formattedAmount()} onChange={handleAmountChange} placeholder="0.00"
                  className="w-full py-6 md:py-8 bg-transparent border-b-4 border-slate-100 dark:border-slate-800 text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 transition-all"
                />
                <div className="absolute right-0 top-1/2 -translate-y-1/2">
                  <select 
                    value={currency} onChange={(e) => setCurrency(e.target.value)}
                    className="text-lg md:text-xl font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-2xl appearance-none cursor-pointer outline-none"
                  >
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-3px px-2">
                  <Layers className="inline-block mr-2" size={14} /> {language === 'ar' ? 'المجموعة' : 'Group'}
                </label>
                <div className="relative">
                  <select
                    value={groupId} onChange={(e) => setGroupId(e.target.value)}
                    className="w-full p-4 md:p-5 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-black text-slate-800 dark:text-white appearance-none cursor-pointer"
                  >
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  <ChevronRight size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-3px px-2">
                  <User className="inline-block mr-2" size={14} /> {language === 'ar' ? 'جهة التعامل' : 'Entity'}
                </label>
                <div className="relative">
                  <select
                    value={clientId} onChange={(e) => setClientId(e.target.value)}
                    className="w-full p-4 md:p-5 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-black text-slate-800 dark:text-white appearance-none cursor-pointer disabled:opacity-30"
                  >
                    {filteredClients.length === 0 ? <option value="">-</option> : filteredClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button" onClick={() => setType(TransactionType.EXPENSE)}
                  className={`flex flex-col items-center justify-center py-6 rounded-3xl font-black transition-all ${type === TransactionType.EXPENSE ? 'bg-rose-500 text-white shadow-xl' : 'bg-slate-50 dark:bg-slate-900 text-slate-400'}`}
                >
                  <TrendingDown size={28} className="mb-2" />
                  <span className="text-[10px] uppercase tracking-widest">{language === 'ar' ? 'مصروف' : 'Expense'}</span>
                </button>
                <button
                  type="button" onClick={() => setType(TransactionType.INCOME)}
                  className={`flex flex-col items-center justify-center py-6 rounded-3xl font-black transition-all ${type === TransactionType.INCOME ? 'bg-emerald-500 text-white shadow-xl' : 'bg-slate-50 dark:bg-slate-900 text-slate-400'}`}
                >
                  <TrendingUp size={28} className="mb-2" />
                  <span className="text-[10px] uppercase tracking-widest">{language === 'ar' ? 'دخل' : 'Income'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white dark:bg-slate-800 p-8 md:p-10 rounded-[40px] md:rounded-[56px] shadow-2xl border border-slate-100 dark:border-slate-800/50 space-y-8">
             <div className="space-y-4">
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-5 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-black text-slate-800 dark:text-white outline-none" />
             </div>
             <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={language === 'ar' ? 'ملاحظات...' : 'Notes...'} className="w-full p-6 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-black text-slate-800 dark:text-white min-h-[140px] resize-none outline-none" />
             <button type="submit" className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black text-xl shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all">
              <Save size={28} className="inline mr-3" /> {language === 'ar' ? 'تأكيد وحفظ' : 'Confirm & Save'}
            </button>
           </div>
        </div>
      </form>
    </div>
  );
};

export default AddFlow;
