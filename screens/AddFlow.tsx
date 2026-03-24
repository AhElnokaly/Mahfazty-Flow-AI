
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../store';
import { TransactionType, TransactionItem } from '../types';
import { ArrowLeft, Save, TrendingUp, TrendingDown, Calendar, User, FileText, ChevronRight, Layers, Sparkles, Loader2, Camera, Scan, Plus, Trash2, ShoppingCart, Tag, Barcode } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { suggestTransactionNote, sendChatMessage } from '../geminiService';
import { CalculatorInput } from '../components/CalculatorInput';

const CURRENCIES = ['EGP', 'USD', 'EUR', 'GBP', 'SAR', 'AED'];

const ITEM_CATEGORIES = ['Groceries', 'Electronics', 'Clothing', 'Home', 'Health', 'Entertainment', 'Transport', 'Other'];

const AddFlow: React.FC = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { language, baseCurrency } = state;
  const groups = useMemo(() => state.groups.filter(g => !g.isArchived), [state.groups]);
  const clients = useMemo(() => state.clients.filter(c => !c.isArchived), [state.clients]);
  const transactions = useMemo(() => {
    return state.transactions.filter(t => {
      const g = state.groups.find(g => g.id === t.groupId);
      const c = state.clients.find(c => c.id === t.clientId);
      return (!g || !g.isArchived) && (!c || !c.isArchived);
    });
  }, [state.transactions, state.groups, state.clients]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<TransactionType>(
    location.state?.type === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE
  );
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash');
  const [creditCardId, setCreditCardId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [referenceTotal, setReferenceTotal] = useState('');
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [currency, setCurrency] = useState(baseCurrency);
  const [groupId, setGroupId] = useState(groups[0]?.id || '');
  const [clientId, setClientId] = useState('');
  const [note, setNote] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isScanningBarcode, setIsScanningBarcode] = useState(false);
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [showItems, setShowItems] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  
  const [date, setDate] = useState(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  });

  const editTransactionId = location.state?.editTransactionId;
  const isEditMode = !!editTransactionId;

  useEffect(() => {
    if (isEditMode) {
      const tToEdit = state.transactions.find(t => t.id === editTransactionId);
      if (tToEdit) {
        setType(tToEdit.type);
        setAmount(tToEdit.amount.toString());
        setCurrency(tToEdit.currency);
        setGroupId(tToEdit.groupId);
        setClientId(tToEdit.clientId);
        setNote(tToEdit.note || '');
        setDate(tToEdit.date);
        if (tToEdit.paymentMethod) setPaymentMethod(tToEdit.paymentMethod);
        if (tToEdit.creditCardId) setCreditCardId(tToEdit.creditCardId);
        if (tToEdit.dueDate) setDueDate(tToEdit.dueDate);
        if (tToEdit.referenceTotal) {
          setIsPartialPayment(true);
          setReferenceTotal(tToEdit.referenceTotal.toString());
        }
        if (tToEdit.items && tToEdit.items.length > 0) {
          setItems(tToEdit.items);
          setShowItems(true);
        }
      }
    }
  }, [isEditMode, editTransactionId, state.transactions]);

  const filteredClients = clients.filter(c => c.groupId === groupId);

  useEffect(() => {
    if (!isEditMode) {
      if (filteredClients.length > 0) {
        setClientId(filteredClients[0].id);
      } else {
        setClientId('');
      }
    } else {
      // In edit mode, ensure the client is still valid for the group, otherwise reset
      if (!filteredClients.find(c => c.id === clientId)) {
        if (filteredClients.length > 0) {
          setClientId(filteredClients[0].id);
        } else {
          setClientId('');
        }
      }
    }
  }, [groupId, isEditMode]);

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

  const handleAddItem = () => {
    setItems([...items, { id: Date.now().toString(), name: '', price: 0, quantity: 1, category: 'Other' }]);
  };

  const handleUpdateItem = (id: string, field: keyof TransactionItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleItemNameChange = (id: string, value: string, index: number) => {
    handleUpdateItem(id, 'name', value);
    
    // Auto-complete logic
    if (value.length > 1) {
      const allItemNames = transactions.flatMap(t => t.items?.map(i => i.name) || []).filter(Boolean) as string[];
      const uniqueNames = Array.from(new Set(allItemNames));
      const matches = uniqueNames.filter(name => name.toLowerCase().includes(value.toLowerCase())).slice(0, 5);
      setSuggestions(matches);
      setActiveItemIndex(index);
    } else {
      setSuggestions([]);
      setActiveItemIndex(null);
    }
  };

  const selectSuggestion = (id: string, suggestion: string) => {
    handleUpdateItem(id, 'name', suggestion);
    
    // Try to auto-fill category and price based on past transactions
    const pastItem = transactions.flatMap(t => t.items || []).find(i => i.name === suggestion);
    if (pastItem) {
      if (pastItem.category) handleUpdateItem(id, 'category', pastItem.category);
      if (pastItem.price) handleUpdateItem(id, 'price', pastItem.price);
    }
    
    setSuggestions([]);
    setActiveItemIndex(null);
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
        const response = await sendChatMessage(state, dispatch, "Analyze this receipt. Extract ONLY a JSON: { 'amount': number, 'date': 'YYYY-MM-DD', 'note': 'string summary', 'type': 'EXPENSE'|'INCOME', 'items': [{'name': 'string', 'price': number, 'quantity': number, 'category': 'string'}] }. If not a receipt, return empty JSON.", false, { data: base64, mimeType: file.type });
        
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
              quantity: Number(item.quantity) || 1,
              category: item.category || 'Other'
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

  const handleBarcodeScan = async (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningBarcode(true);
    vibrate();

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const response = await sendChatMessage(state, dispatch, "Analyze this barcode image. If it's a product barcode, identify the product name and a general category. Return ONLY a JSON: { 'name': 'string', 'category': 'string', 'barcode': 'string' }. If not a barcode, return empty JSON.", false, { data: base64, mimeType: file.type });
        
        const jsonMatch = response.text.match(/\{.*\}/s);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          if (data.name) handleUpdateItem(itemId, 'name', data.name);
          if (data.category) handleUpdateItem(itemId, 'category', data.category);
          if (data.barcode) handleUpdateItem(itemId, 'barcode', data.barcode);
          
          dispatch.setNotification({ message: language === 'ar' ? 'تم مسح الباركود بنجاح' : 'Barcode scanned successfully', type: 'success' });
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      dispatch.setNotification({ message: 'Barcode Scan Failed', type: 'error' });
    } finally {
      setIsScanningBarcode(false);
    }
  };

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    const newId = Date.now().toString();
    dispatch.addGroup(newGroupName, undefined, undefined, newId);
    setGroupId(newId);
    setNewGroupName('');
    setIsAddingGroup(false);
  };

  const handleAddClient = () => {
    if (!newClientName.trim() || !groupId) return;
    const newId = Date.now().toString();
    dispatch.addClient(newClientName, groupId, undefined, newId);
    setClientId(newId);
    setNewClientName('');
    setIsAddingClient(false);
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

    const transactionData = {
      amount: parseFloat(amount),
      currency,
      type,
      paymentMethod,
      creditCardId: paymentMethod === 'credit' ? creditCardId : undefined,
      dueDate: paymentMethod === 'credit' ? dueDate : undefined,
      isSettled: paymentMethod === 'credit' ? false : undefined,
      groupId,
      clientId,
      note,
      date,
      items: validItems.length > 0 ? validItems : undefined,
      referenceTotal: isPartialPayment && referenceTotal ? parseFloat(referenceTotal) : undefined
    };

    if (isEditMode && editTransactionId) {
      dispatch.updateTransaction(editTransactionId, transactionData);
      dispatch.setNotification({ message: language === 'ar' ? 'تم تحديث المعاملة بنجاح' : 'Transaction updated successfully', type: 'success' });
    } else {
      dispatch.addTransaction(transactionData);
      if (transactions.length === 0) {
        dispatch.unlockAchievement('first_transaction');
      }
    }
    
    navigate(-1); // Go back to the previous screen (History or Dashboard)
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
              {isEditMode 
                ? (language === 'ar' ? 'تعديل تدفق مالي' : 'Edit Flow Entry') 
                : (language === 'ar' ? 'إضافة تدفق مالي' : 'New Flow Entry')}
            </h2>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
              {isEditMode ? (language === 'ar' ? 'تحديث البيانات' : 'Update Data') : 'Financial Wizard'}
            </p>
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
          <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">{language === 'ar' ? 'مسح إيصال' : 'Scan Receipt'}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-8 pb-32">
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white dark:bg-slate-800 p-8 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800/50">
            
            <div className="mb-8 md:mb-12">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-2">
                {language === 'ar' ? 'قيمة التدفق المالي' : 'Transaction Value'}
              </label>
              <div className="relative flex items-center">
                <div className="flex-1">
                  <CalculatorInput
                    value={amount}
                    onChange={setAmount}
                    placeholder="0.00"
                    disabled={items.length > 0}
                    className="w-full py-6 md:py-8 bg-transparent border-b-4 border-slate-100 dark:border-slate-800 text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 transition-all"
                  />
                </div>
                <div className="absolute right-12 top-1/2 -translate-y-1/2">
                  <select 
                    value={currency} onChange={(e) => setCurrency(e.target.value)}
                    className="text-lg md:text-xl font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-2xl appearance-none cursor-pointer outline-none"
                  >
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="mb-8 md:mb-12">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPartialPayment}
                  onChange={(e) => setIsPartialPayment(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {language === 'ar' ? 'هذه دفعة جزئية من حساب' : 'This is a partial payment of a bill'}
                </span>
              </label>
              
              {isPartialPayment && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-2">
                    {language === 'ar' ? 'إجمالي الحساب (للمرجعية)' : 'Total Bill Amount (Reference)'}
                  </label>
                  <CalculatorInput
                    value={referenceTotal}
                    onChange={setReferenceTotal}
                    placeholder="0.00"
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-lg font-black text-slate-800 dark:text-white outline-none"
                  />
                </div>
              )}
            </div>

            <div className="mb-8 md:mb-12">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-2">
                {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex-1 py-4 rounded-2xl font-bold transition-all ${paymentMethod === 'cash' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  {language === 'ar' ? 'كاش' : 'Cash'}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit')}
                  className={`flex-1 py-4 rounded-2xl font-bold transition-all ${paymentMethod === 'credit' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  {language === 'ar' ? 'فيزا / ائتمان' : 'Credit / Visa'}
                </button>
              </div>
              
              {paymentMethod === 'credit' && (
                <div className="mt-6 animate-in fade-in slide-in-from-top-2 space-y-4">
                  {state.creditCards && state.creditCards.length > 0 ? (
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-2">
                        {language === 'ar' ? 'اختر البطاقة' : 'Select Card'}
                      </label>
                      <select
                        value={creditCardId}
                        onChange={(e) => setCreditCardId(e.target.value)}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-lg font-black text-slate-800 dark:text-white outline-none appearance-none"
                        required
                      >
                        <option value="" disabled>{language === 'ar' ? 'اختر بطاقة ائتمان...' : 'Select a credit card...'}</option>
                        {state.creditCards.filter(c => !c.isArchived).map(card => (
                          <option key={card.id} value={card.id}>{card.name} ({card.balance.toLocaleString()} / {card.limit.toLocaleString()})</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl text-sm font-bold">
                      {language === 'ar' ? 'لا توجد بطاقات ائتمان مضافة. يرجى إضافة بطاقة أولاً من القائمة الجانبية.' : 'No credit cards added. Please add a card first from the sidebar.'}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-2">
                      {language === 'ar' ? 'تاريخ الاستحقاق (للتذكير)' : 'Due Date (For Reminder)'}
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-lg font-black text-slate-800 dark:text-white outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-4">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-2">
                  <Layers className="inline-block mr-2" size={14} /> {language === 'ar' ? 'المجموعة' : 'Group'}
                </label>
                {isAddingGroup ? (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newGroupName} 
                      onChange={(e) => setNewGroupName(e.target.value)} 
                      placeholder={language === 'ar' ? 'اسم المجموعة...' : 'Group name...'}
                      className="flex-1 p-4 md:p-5 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-black text-slate-800 dark:text-white outline-none"
                      autoFocus
                    />
                    <button type="button" onClick={handleAddGroup} className="px-4 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-500">
                      {language === 'ar' ? 'حفظ' : 'Save'}
                    </button>
                    <button type="button" onClick={() => setIsAddingGroup(false)} className="px-4 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-sm hover:bg-slate-300">
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={groupId} onChange={(e) => {
                        if (e.target.value === 'ADD_NEW') {
                          setIsAddingGroup(true);
                        } else {
                          setGroupId(e.target.value);
                        }
                      }}
                      className="w-full p-4 md:p-5 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-black text-slate-800 dark:text-white appearance-none cursor-pointer"
                    >
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      <option value="ADD_NEW" className="font-bold text-blue-500">
                        + {language === 'ar' ? 'إضافة مجموعة جديدة' : 'Add New Group'}
                      </option>
                    </select>
                    <ChevronRight size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-2">
                  <User className="inline-block mr-2" size={14} /> {language === 'ar' ? 'جهة التعامل' : 'Entity'}
                </label>
                {isAddingClient ? (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newClientName} 
                      onChange={(e) => setNewClientName(e.target.value)} 
                      placeholder={language === 'ar' ? 'اسم العميل...' : 'Client name...'}
                      className="flex-1 p-4 md:p-5 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-black text-slate-800 dark:text-white outline-none"
                      autoFocus
                    />
                    <button type="button" onClick={handleAddClient} className="px-4 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-500">
                      {language === 'ar' ? 'حفظ' : 'Save'}
                    </button>
                    <button type="button" onClick={() => setIsAddingClient(false)} className="px-4 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-sm hover:bg-slate-300">
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={clientId} onChange={(e) => {
                        if (e.target.value === 'ADD_NEW') {
                          setIsAddingClient(true);
                        } else {
                          setClientId(e.target.value);
                        }
                      }}
                      className="w-full p-4 md:p-5 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-black text-slate-800 dark:text-white appearance-none cursor-pointer disabled:opacity-30"
                      disabled={!groupId}
                    >
                      {filteredClients.length === 0 ? <option value="" disabled>-</option> : filteredClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      {groupId && (
                        <option value="ADD_NEW" className="font-bold text-blue-500">
                          + {language === 'ar' ? 'إضافة عميل جديد' : 'Add New Client'}
                        </option>
                      )}
                    </select>
                    <ChevronRight size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button" onClick={() => setType(TransactionType.EXPENSE)}
                  className={`flex flex-col items-center justify-center py-6 rounded-3xl font-black transition-all ${type === TransactionType.EXPENSE ? 'bg-rose-500 text-white shadow-xl' : 'bg-slate-50 dark:bg-slate-900 text-slate-400'}`}
                >
                  <TrendingDown size={28} className="mb-2" />
                  <span className="text-xs uppercase tracking-widest">{language === 'ar' ? 'مصروف' : 'Expense'}</span>
                </button>
                <button
                  type="button" onClick={() => setType(TransactionType.INCOME)}
                  className={`flex flex-col items-center justify-center py-6 rounded-3xl font-black transition-all ${type === TransactionType.INCOME ? 'bg-emerald-500 text-white shadow-xl' : 'bg-slate-50 dark:bg-slate-900 text-slate-400'}`}
                >
                  <TrendingUp size={28} className="mb-2" />
                  <span className="text-xs uppercase tracking-widest">{language === 'ar' ? 'دخل' : 'Income'}</span>
                </button>
              </div>
            </div>

            {/* Itemized Transaction Section */}
            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2">
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
                  className="text-xs font-bold text-blue-500 uppercase flex items-center gap-1 hover:underline"
                >
                  {showItems ? (language === 'ar' ? 'إخفاء' : 'Hide') : (language === 'ar' ? 'إضافة سلع' : 'Add Items')}
                </button>
              </div>

              {showItems && (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                  {items.map((item, index) => (
                    <div key={item.id} className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 relative group">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemNameChange(item.id, e.target.value, index)}
                            placeholder={language === 'ar' ? 'اسم السلعة...' : 'Item name...'}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                          />
                          {activeItemIndex === index && suggestions.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
                              {suggestions.map((suggestion, sIndex) => (
                                <button
                                  key={sIndex}
                                  type="button"
                                  onClick={() => selectSuggestion(item.id, suggestion)}
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
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
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3 items-center">
                        <div className="flex-1 w-full relative">
                          <select
                            value={item.category || 'Other'}
                            onChange={(e) => handleUpdateItem(item.id, 'category', e.target.value)}
                            className="w-full px-4 py-3 pl-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-blue-500 appearance-none"
                          >
                            {ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                        <div className="flex-1 w-full relative flex items-center gap-2">
                           <div className="relative flex-1">
                             <input
                                type="text"
                                value={item.barcode || ''}
                                onChange={(e) => handleUpdateItem(item.id, 'barcode', e.target.value)}
                                placeholder={language === 'ar' ? 'الباركود...' : 'Barcode...'}
                                className="w-full px-4 py-3 pl-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                              />
                              <Barcode size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                           </div>
                           <button
                             type="button"
                             disabled={isScanningBarcode}
                             onClick={() => {
                               const input = document.getElementById(`barcode-scan-${item.id}`);
                               if (input) input.click();
                             }}
                             className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                           >
                             {isScanningBarcode ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                             <input 
                               id={`barcode-scan-${item.id}`}
                               type="file" 
                               accept="image/*" 
                               capture="environment" 
                               className="hidden" 
                               onChange={(e) => handleBarcodeScan(e, item.id)}
                             />
                           </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center hover:text-rose-600 transition-colors shadow-sm"
                      >
                        <Trash2 size={14} />
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
           <div className="bg-white dark:bg-slate-800 p-8 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800/50 space-y-8">
             <div className="space-y-4">
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-5 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-black text-slate-800 dark:text-white outline-none" />
             </div>
             <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={language === 'ar' ? 'ملاحظات...' : 'Notes...'} className="w-full p-6 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-black text-slate-800 dark:text-white min-h-[140px] resize-none outline-none" />
             <button type="submit" className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black text-xl shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all">
              <Save size={28} className="inline mr-3" /> 
              {isEditMode 
                ? (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes') 
                : (language === 'ar' ? 'تأكيد وحفظ' : 'Confirm & Save')}
            </button>
           </div>
        </div>
      </form>
    </div>
  );
};

export default AddFlow;
