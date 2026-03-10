
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../store';
import { TransactionType, TransactionItem } from '../types';
import { ArrowLeft, Save, TrendingUp, TrendingDown, Calendar, User, FileText, ChevronRight, Layers, Sparkles, Loader2, Camera, Scan, Plus, Trash2, ShoppingCart } from 'lucide-react';
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
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [showItems, setShowItems] = useState(false);
  
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

  // Recalculate total amount when items change
  useEffect(() => {
    if (items.length > 0) {
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      setAmount(total.toString());
    }
  }, [items]);

  const vibrate = () => {
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (items.length > 0) return; // Prevent manual edit if items exist
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

  const handleAddItem = () => {
    setItems([...items, { id: Date.now().toString(), name: '', price: 0, quantity: 1 }]);
  };

  const handleUpdateItem = (id: string, field: keyof TransactionItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleRemoveItem = (id: string) => {
    const newItems = items.filter(item => item.id !== id);
    setItems(newItems);
    if (newItems.length === 0) {
      setShowItems(false);
    }
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
        const response = await sendChatMessage(state, dispatch, "Analyze this receipt. Extract ONLY a JSON: { 'amount': number, 'date': 'YYYY-MM-DD', 'note': 'string summary', 'type': 'EXPENSE'|'INCOME', 'items': [{'name': 'string', 'price': number, 'quantity': number}] }. If not a receipt, return empty JSON.", false, { data: base64, mimeType: file.type });
        
        // Find JSON in response text
        const jsonMatch = response.text.match(/\{.*\}/s);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          if (data.amount) setAmount(data.amount.toString());
          if (data.date) setDate(data.date);
          if (data.note) setNote(data.note);
          if (data.type) setType(data.type === 'INCOME' ? TransactionType.INCOME : TransactionType.EXPENSE);
          if (data.items && Array.isArray(data.items) && data.items.length > 0) {
            setItems(data.items.map((item: any) => ({
              id: Date.now().toString() + Math.random().toString(),
              name: item.name || 'Item',
              price: Number(item.price) || 0,
              quantity: Number(item.quantity) || 1
            })));
            setShowItems(true);
          }
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

    // Filter out empty items
    const validItems = items.filter(item => item.name.trim() !== '' && item.price > 0);

    dispatch.addTransaction({
      amount: parseFloat(amount),
      currency,
      type,
      groupId,
      clientId,
      note,
      date,
      items: validItems.length > 0 ? validItems : undefined
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

            {/* Itemized Transaction Section */}
            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[4px] px-2 flex items-center gap-2">
                  <ShoppingCart size={14} />
                  {language === 'ar' ? 'تفاصيل السلع (اختياري)' : 'Itemized Details (Optional)'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const newShowItems = !showItems;
                    setShowItems(newShowItems);
                    if (newShowItems && items.length === 0) {
                      handleAddItem();
                    }
                  }}
                  className="text-[10px] font-bold text-blue-500 uppercase flex items-center gap-1 hover:underline"
                >
                  {showItems ? (language === 'ar' ? 'إخفاء' : 'Hide') : (language === 'ar' ? 'إضافة سلع' : 'Add Items')}
                </button>
              </div>

              {showItems && (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                  {items.map((item, index) => (
                    <div key={item.id} className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 relative group">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                          placeholder={language === 'ar' ? 'اسم السلعة...' : 'Item name...'}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="flex gap-3">
                        <div className="w-24">
                          <input
                            type="number"
                            value={item.price || ''}
                            onChange={(e) => handleUpdateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                            placeholder={language === 'ar' ? 'السعر' : 'Price'}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="w-20">
                          <input
                            type="number"
                            value={item.quantity || ''}
                            onChange={(e) => handleUpdateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            placeholder={language === 'ar' ? 'الكمية' : 'Qty'}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="absolute -top-2 -right-2 sm:static sm:top-auto sm:right-auto w-8 h-8 sm:w-auto sm:h-auto bg-rose-100 sm:bg-transparent text-rose-500 rounded-full sm:rounded-none flex items-center justify-center hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    {language === 'ar' ? 'إضافة سلعة أخرى' : 'Add another item'}
                  </button>
                </div>
              )}
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
