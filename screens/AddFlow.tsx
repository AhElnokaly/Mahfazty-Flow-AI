
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../store';
import { TransactionType, TransactionItem } from '../types';
import { ArrowLeft, Save, TrendingUp, TrendingDown, Calendar, User, FileText, ChevronRight, Layers, Sparkles, Loader2, Camera, Scan, Plus, Trash2, ShoppingCart, Tag, Barcode, Wallet, X } from 'lucide-react';
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

  const [mainTab, setMainTab] = useState<'expense' | 'income' | 'credit_card' | 'debt' | 'investment'>(
    location.state?.type === 'income' ? 'income' : 
    location.state?.type === 'investment' ? 'investment' : 
    'expense'
  );
  const [ccAction, setCcAction] = useState<'purchase' | 'repayment'>('purchase');

  const handleMainTabChange = (tab: 'expense' | 'income' | 'credit_card' | 'debt' | 'investment') => {
    setMainTab(tab);
    if (tab === 'expense') {
      setType(TransactionType.EXPENSE);
      setPaymentMethod('cash');
      setIsDebt(false);
    } else if (tab === 'income') {
      setType(TransactionType.INCOME);
      setPaymentMethod('cash');
      setIsDebt(false);
    } else if (tab === 'credit_card') {
      setIsDebt(false);
      if (ccAction === 'purchase') {
        setType(TransactionType.EXPENSE);
        setPaymentMethod('credit');
      } else {
        setType(TransactionType.TRANSFER);
        setPaymentMethod('cash');
      }
    } else if (tab === 'debt') {
      setIsDebt(true);
      setType(debtAction === 'BORROW' || debtAction === 'REPAY_LEND' ? TransactionType.INCOME : TransactionType.EXPENSE);
      setPaymentMethod('cash');
    } else if (tab === 'investment') {
      setType(TransactionType.INVESTMENT);
      setIsDebt(false);
      setPaymentMethod('cash');
    }
  };

  const handleCcActionChange = (action: 'purchase' | 'repayment') => {
    setCcAction(action);
    if (action === 'purchase') {
      setType(TransactionType.EXPENSE);
      setPaymentMethod('credit');
    } else {
      setType(TransactionType.TRANSFER);
      setPaymentMethod('cash');
    }
  };

  const [type, setType] = useState<TransactionType>(
    location.state?.type === 'income' ? TransactionType.INCOME : 
    location.state?.type === 'investment' ? TransactionType.INVESTMENT : 
    TransactionType.EXPENSE
  );
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash');
  const [creditCardId, setCreditCardId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [referenceTotal, setReferenceTotal] = useState('');
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [isDebt, setIsDebt] = useState(false); // +++ أضيف بناءً على طلبك +++
  const [debtAction, setDebtAction] = useState<'BORROW' | 'LEND' | 'REPAY_BORROW' | 'REPAY_LEND'>('BORROW'); // +++ أضيف بناءً على طلبك +++
  const [investmentType, setInvestmentType] = useState<'stock' | 'deposit'>('stock'); // +++ أضيف بناءً على طلبك +++
  const [investmentAction, setInvestmentAction] = useState<'BUY' | 'SELL' | 'RETURN'>('BUY'); // +++ أضيف بناءً على طلبك +++
  const [stockSymbol, setStockSymbol] = useState(''); // +++ أضيف بناءً على طلبك +++
  const [shares, setShares] = useState(''); // +++ أضيف بناءً على طلبك +++
  const [pricePerShare, setPricePerShare] = useState(''); // +++ أضيف بناءً على طلبك +++
  const [interestRate, setInterestRate] = useState(''); // +++ أضيف بناءً على طلبك +++
  const [duration, setDuration] = useState(''); // +++ أضيف بناءً على طلبك +++
  const [currency, setCurrency] = useState(baseCurrency);
  const [groupId, setGroupId] = useState(groups[0]?.id || '');
  const [clientId, setClientId] = useState('');
  const [clientIds, setClientIds] = useState<string[]>([]); // +++ أضيف بناءً على طلبك +++
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
        if (tToEdit.type === TransactionType.INCOME) setMainTab('income');
        else if (tToEdit.type === TransactionType.EXPENSE) {
          if (tToEdit.paymentMethod === 'credit') {
            setMainTab('credit_card');
            setCcAction('purchase');
          } else {
            setMainTab('expense');
          }
        } else if (tToEdit.type === TransactionType.TRANSFER && tToEdit.creditCardId) {
          setMainTab('credit_card');
          setCcAction('repayment');
        } else if (tToEdit.type === TransactionType.INVESTMENT) {
          setMainTab('investment');
        }
        
        setAmount(tToEdit.amount.toString());
        setCurrency(tToEdit.currency);
        setGroupId(tToEdit.groupId);
        setClientId(tToEdit.clientId);
        if (tToEdit.clientIds) setClientIds(tToEdit.clientIds); // +++ أضيف بناءً على طلبك +++
        setNote(tToEdit.note || '');
        setDate(tToEdit.date);
        if (tToEdit.paymentMethod) setPaymentMethod(tToEdit.paymentMethod);
        if (tToEdit.creditCardId) setCreditCardId(tToEdit.creditCardId);
        if (tToEdit.dueDate) setDueDate(tToEdit.dueDate);
        if (tToEdit.isDebt) {
          setMainTab('debt');
          setIsDebt(tToEdit.isDebt); // +++ أضيف بناءً على طلبك +++
          if (tToEdit.debtAction) setDebtAction(tToEdit.debtAction); // +++ أضيف بناءً على طلبك +++
        }
        if (tToEdit.referenceTotal) {
          setIsPartialPayment(true);
          setReferenceTotal(tToEdit.referenceTotal.toString());
        }
        if (tToEdit.items && tToEdit.items.length > 0) {
          setItems(tToEdit.items);
          setShowItems(true);
        }
        if (tToEdit.type === TransactionType.INVESTMENT) {
          if (tToEdit.investmentAction) setInvestmentAction(tToEdit.investmentAction); // +++ أضيف بناءً على طلبك +++
          if (tToEdit.investmentType) setInvestmentType(tToEdit.investmentType);
          if (tToEdit.stockSymbol) setStockSymbol(tToEdit.stockSymbol);
          if (tToEdit.shares) setShares(tToEdit.shares.toString());
          if (tToEdit.pricePerShare) setPricePerShare(tToEdit.pricePerShare.toString());
          if (tToEdit.interestRate) setInterestRate(tToEdit.interestRate.toString());
          if (tToEdit.duration) setDuration(tToEdit.duration.toString());
        }
      }
    }
  }, [isEditMode, editTransactionId, state.transactions]);

  const filteredClients = clients.filter(c => c.groupId === groupId);

  useEffect(() => {
    // +++ أضيف بناءً على طلبك +++
    // Only auto-select if none of the current clientIds are in the new filteredClients
    const hasValidClient = clientIds.some(id => clients.some(c => c.groupId === groupId && c.id === id));
    if (!hasValidClient) {
      const newFiltered = clients.filter(c => c.groupId === groupId);
      setClientId(newFiltered.length > 0 ? newFiltered[0].id : '');
      setClientIds(newFiltered.length > 0 ? [newFiltered[0].id] : []); // +++ أضيف بناءً على طلبك +++
    }
  }, [groupId, clients]);

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
    setClientIds([newId]); // +++ أضيف بناءً على طلبك +++
    setNewClientName('');
    setIsAddingClient(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    vibrate();
    
    if (!amount || !groupId || (clientIds.length === 0 && !clientId)) { // +++ أضيف بناءً على طلبك +++
      dispatch.setNotification({ message: language === 'ar' ? 'يرجى إكمال كافة البيانات المطلوبة' : 'Please complete all fields', type: 'error' });
      return;
    }

    if (type === TransactionType.INVESTMENT) {
      if (investmentType === 'stock' && (!stockSymbol || !shares || !pricePerShare)) {
        dispatch.setNotification({ message: language === 'ar' ? 'يرجى إكمال بيانات السهم' : 'Please complete stock details', type: 'error' });
        return;
      }
      if (investmentType === 'deposit' && (!interestRate || !duration)) {
        dispatch.setNotification({ message: language === 'ar' ? 'يرجى إكمال بيانات الوديعة' : 'Please complete deposit details', type: 'error' });
        return;
      }
    }

    // Filter out empty items
    const validItems = items.filter(item => item.name.trim() !== '' && item.price > 0);

    const transactionData: any = {
      amount: parseFloat(amount),
      currency,
      type,
      paymentMethod,
      creditCardId: mainTab === 'credit_card' ? creditCardId : undefined,
      dueDate: mainTab === 'credit_card' && ccAction === 'purchase' ? dueDate : undefined,
      isSettled: mainTab === 'credit_card' && ccAction === 'purchase' ? false : undefined,
      isDebt: isDebt, // +++ أضيف بناءً على طلبك +++
      debtAction: isDebt ? debtAction : undefined, // +++ أضيف بناءً على طلبك +++
      groupId,
      clientId: clientIds.length > 0 ? clientIds[0] : clientId, // +++ أضيف بناءً على طلبك +++
      clientIds: clientIds.length > 0 ? clientIds : [clientId], // +++ أضيف بناءً على طلبك +++
      note,
      date,
      items: validItems.length > 0 ? validItems : undefined,
      referenceTotal: isPartialPayment && referenceTotal ? parseFloat(referenceTotal) : undefined
    };

    if (type === TransactionType.INVESTMENT) { // +++ أضيف بناءً على طلبك +++
      transactionData.investmentAction = investmentAction; // +++ أضيف بناءً على طلبك +++
      transactionData.investmentType = investmentType;
      if (investmentType === 'stock') {
        transactionData.stockSymbol = stockSymbol;
        transactionData.shares = parseFloat(shares) || 0;
        transactionData.pricePerShare = parseFloat(pricePerShare) || 0;
      } else {
        transactionData.interestRate = parseFloat(interestRate) || 0;
        transactionData.duration = parseFloat(duration) || 0;
      }
    }

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
            
            {/* +++ أضيف بناءً على طلبك +++ */}
            <div className="mb-8 md:mb-12">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button
                  type="button" onClick={() => handleMainTabChange('expense')}
                  className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-black transition-all ${mainTab === 'expense' ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/20' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <TrendingDown size={18} />
                  <span className="text-xs uppercase tracking-widest">{language === 'ar' ? 'مصروف' : 'Expense'}</span>
                </button>
                <button
                  type="button" onClick={() => handleMainTabChange('income')}
                  className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-black transition-all ${mainTab === 'income' ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <TrendingUp size={18} />
                  <span className="text-xs uppercase tracking-widest">{language === 'ar' ? 'دخل' : 'Income'}</span>
                </button>
                <button
                  type="button" onClick={() => handleMainTabChange('credit_card')}
                  className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-black transition-all ${mainTab === 'credit_card' ? 'bg-blue-500 text-white shadow-xl shadow-blue-500/20' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <Layers size={18} />
                  <span className="text-xs uppercase tracking-widest">{language === 'ar' ? 'بطاقة ائتمان' : 'Credit Card'}</span>
                </button>
                <button
                  type="button" onClick={() => handleMainTabChange('debt')}
                  className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-black transition-all ${mainTab === 'debt' ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/20' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <Wallet size={18} />
                  <span className="text-xs uppercase tracking-widest">{language === 'ar' ? 'دين / سلفة' : 'Debt / Loan'}</span>
                </button>
                <button
                  type="button" onClick={() => handleMainTabChange('investment')}
                  className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-black transition-all ${mainTab === 'investment' ? 'bg-purple-500 text-white shadow-xl shadow-purple-500/20' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <TrendingUp size={18} />
                  <span className="text-xs uppercase tracking-widest">{language === 'ar' ? 'استثمار' : 'Invest'}</span>
                </button>
              </div>
            </div>

            {mainTab === 'credit_card' && (
              <div className="mb-8 md:mb-12 animate-in fade-in slide-in-from-top-4">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-6">
                  <button
                    type="button"
                    onClick={() => handleCcActionChange('purchase')}
                    className={`flex-1 py-3 text-sm font-black uppercase tracking-widest rounded-xl transition-all ${ccAction === 'purchase' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    {language === 'ar' ? 'شراء' : 'Purchase'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCcActionChange('repayment')}
                    className={`flex-1 py-3 text-sm font-black uppercase tracking-widest rounded-xl transition-all ${ccAction === 'repayment' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    {language === 'ar' ? 'تسديد' : 'Repayment'}
                  </button>
                </div>
                
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
                
                {ccAction === 'purchase' && (
                  <div className="mt-4">
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
                )}
              </div>
            )}

            {mainTab === 'debt' && (
              <div className="mb-8 md:mb-12 flex flex-col gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl animate-in fade-in slide-in-from-top-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setDebtAction('BORROW'); setType(TransactionType.INCOME); }}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${debtAction === 'BORROW' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    {language === 'ar' ? 'استلفت (أخذت)' : 'Borrowed (Received)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDebtAction('LEND'); setType(TransactionType.EXPENSE); }}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${debtAction === 'LEND' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    {language === 'ar' ? 'سلّفت (أعطيت)' : 'Lent (Given)'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setDebtAction('REPAY_BORROW'); setType(TransactionType.EXPENSE); }}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${debtAction === 'REPAY_BORROW' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    {language === 'ar' ? 'سددت ديني' : 'Repaid my debt'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDebtAction('REPAY_LEND'); setType(TransactionType.INCOME); }}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${debtAction === 'REPAY_LEND' ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    {language === 'ar' ? 'استرددت مالي' : 'Got my money back'}
                  </button>
                </div>
              </div>
            )}
            {/* +++ أضيف بناءً على طلبك +++ */}

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
                    disabled={items.length > 0 || type === TransactionType.INVESTMENT}
                    className="w-full py-6 md:py-8 bg-transparent border-b-4 border-slate-100 dark:border-slate-800 text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 transition-all disabled:opacity-50"
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

            {type !== TransactionType.INVESTMENT && (
            <div className="mb-8 md:mb-12">
              <label className="flex items-center gap-3 cursor-pointer mb-4">
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
            )}

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
                  <User className="inline-block mr-2" size={14} /> {language === 'ar' ? 'جهة التعامل (يمكن اختيار أكثر من عميل)' : 'Entity (Multiple allowed)'}
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
                    <div className="w-full min-h-[56px] p-4 md:p-5 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-black text-slate-800 dark:text-white flex flex-wrap gap-2 items-center">
                      {clientIds.map(id => {
                        const client = clients.find(c => c.id === id);
                        if (!client) return null;
                        return (
                          <span key={id} className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full flex items-center gap-1">
                            {client.name}
                            <button type="button" onClick={() => setClientIds(clientIds.filter(cId => cId !== id))} className="hover:text-rose-500">
                              <X size={14} />
                            </button>
                          </span>
                        );
                      })}
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value === 'ADD_NEW') {
                            setIsAddingClient(true);
                          } else if (e.target.value && !clientIds.includes(e.target.value)) {
                            setClientIds([...clientIds, e.target.value]);
                            setClientId(e.target.value); // Keep backward compatibility
                          }
                        }}
                        className="flex-1 bg-transparent border-none outline-none min-w-[120px] cursor-pointer disabled:opacity-30"
                        disabled={!groupId}
                      >
                        <option value="" disabled>{language === 'ar' ? 'اختر عميل...' : 'Select client...'}</option>
                        {filteredClients.filter(c => !clientIds.includes(c.id)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        {groupId && (
                          <option value="ADD_NEW" className="font-bold text-blue-500">
                            + {language === 'ar' ? 'إضافة عميل جديد' : 'Add New Client'}
                          </option>
                        )}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 space-y-4">
            </div>

            {type === TransactionType.INVESTMENT && (
              <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800/50 animate-in fade-in slide-in-from-top-4">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-6">
                  <button
                    type="button"
                    onClick={() => setInvestmentAction('BUY')}
                    className={`flex-1 py-3 text-sm font-black uppercase tracking-widest rounded-xl transition-all ${investmentAction === 'BUY' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    {language === 'ar' ? 'شراء' : 'Buy'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvestmentAction('SELL')}
                    className={`flex-1 py-3 text-sm font-black uppercase tracking-widest rounded-xl transition-all ${investmentAction === 'SELL' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    {language === 'ar' ? 'بيع' : 'Sell'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvestmentAction('RETURN')}
                    className={`flex-1 py-3 text-sm font-black uppercase tracking-widest rounded-xl transition-all ${investmentAction === 'RETURN' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    {language === 'ar' ? 'عائد' : 'Return'}
                  </button>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-6">
                  <button
                    type="button"
                    onClick={() => setInvestmentType('stock')}
                    className={`flex-1 py-3 text-sm font-black uppercase tracking-widest rounded-xl transition-all ${investmentType === 'stock' ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    {language === 'ar' ? 'سهم / صندوق' : 'Stock / Fund'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvestmentType('deposit')}
                    className={`flex-1 py-3 text-sm font-black uppercase tracking-widest rounded-xl transition-all ${investmentType === 'deposit' ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    {language === 'ar' ? 'شهادة / وديعة' : 'Certificate / Deposit'}
                  </button>
                </div>

                {investmentType === 'stock' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-2">
                        {language === 'ar' ? 'رمز السهم (مثال: COMI.CA)' : 'Stock Symbol (e.g. COMI.CA)'}
                      </label>
                      <input
                        type="text"
                        value={stockSymbol}
                        onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
                        placeholder={language === 'ar' ? 'أدخل رمز السهم' : 'Enter stock symbol'}
                        className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/50"
                        required={type === TransactionType.INVESTMENT && investmentType === 'stock'}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-2">
                          {language === 'ar' ? 'عدد الأسهم' : 'Number of Shares'}
                        </label>
                        <CalculatorInput
                          value={shares}
                          onChange={(val) => {
                            setShares(val);
                            if (val && pricePerShare) setAmount((parseFloat(val) * parseFloat(pricePerShare)).toString());
                          }}
                          placeholder="0"
                          className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-2">
                          {language === 'ar' ? 'سعر السهم' : 'Price per Share'}
                        </label>
                        <CalculatorInput
                          value={pricePerShare}
                          onChange={(val) => {
                            setPricePerShare(val);
                            if (val && shares) setAmount((parseFloat(val) * parseFloat(shares)).toString());
                          }}
                          placeholder="0.00"
                          className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-2">
                          {language === 'ar' ? 'نسبة الفائدة السنوية %' : 'Annual Interest Rate %'}
                        </label>
                        <CalculatorInput
                          value={interestRate}
                          onChange={setInterestRate}
                          placeholder="0.00"
                          className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-2">
                          {language === 'ar' ? 'المدة (بالشهور)' : 'Duration (Months)'}
                        </label>
                        <CalculatorInput
                          value={duration}
                          onChange={setDuration}
                          placeholder="12"
                          className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Itemized Transaction Section */}
            {type !== TransactionType.INVESTMENT && (
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
                                  onMouseDown={(e) => {
                                    e.preventDefault(); // +++ أضيف بناءً على طلبك +++
                                    selectSuggestion(item.id, suggestion);
                                  }}
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
            )}
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
