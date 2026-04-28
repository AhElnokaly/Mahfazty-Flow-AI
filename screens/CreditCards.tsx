import React, { useState } from 'react';
import { useApp } from '../store';
import { CreditCard as CreditCardIcon, Plus, Trash2, Edit3, ArrowLeft, Calendar, DollarSign, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CreditSettlementModal } from '../components/CreditSettlementModal';

export const CreditCards: React.FC = () => {
  const { state, dispatch } = useApp();
  const { language } = state;
  const navigate = useNavigate();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [balanceInputType, setBalanceInputType] = useState<'spent'|'remaining'>('spent'); // +++ أضيف بناءً على طلبك +++
  const [balance, setBalance] = useState('');
  const [billingDate, setBillingDate] = useState('1');
  const [dueDate, setDueDate] = useState('15');

  const [payingCardId, setPayingCardId] = useState<string | null>(null);

  const activeCards = (state.creditCards || []).filter(c => !c.isArchived);

  const resetForm = () => {
    setName('');
    setLimit('');
    setBalance('');
    setBalanceInputType('spent');
    setBillingDate('1');
    setDueDate('15');
    setIsAdding(false);
    setEditingId(null);
  };

  const parseArabicNumber = (val: string) => {
    const englishVal = val.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
    return englishVal.replace(/[^0-9.]/g, '');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !limit) return;
    
    const parsedLimit = parseFloat(limit) || 0;
    const inputValue = parseFloat(balance) || 0;
    
    let actualBalance = 0;
    if (balanceInputType === 'spent') {
      actualBalance = inputValue;
    } else {
      actualBalance = parsedLimit - inputValue;
    }
    actualBalance = Math.max(0, actualBalance);

    if (editingId) {
      dispatch.updateCreditCard(editingId, {
        name,
        limit: parsedLimit,
        balance: actualBalance,
        billingDate: parseInt(billingDate),
        dueDate: parseInt(dueDate)
      });
      dispatch.setNotification({ message: language === 'ar' ? 'تم تحديث البطاقة' : 'Card updated', type: 'success' });
    } else {
      dispatch.addCreditCard({
        name,
        limit: parsedLimit,
        balance: actualBalance,
        billingDate: parseInt(billingDate),
        dueDate: parseInt(dueDate),
        color: 'bg-slate-800',
        icon: 'CreditCard'
      });
      dispatch.setNotification({ message: language === 'ar' ? 'تمت إضافة البطاقة' : 'Card added', type: 'success' });
    }
    resetForm();
  };

  const handleEdit = (card: any) => {
    setName(card.name);
    setLimit(card.limit.toString());
    setBalance(card.balance.toString());
    setBalanceInputType('spent');
    setBillingDate(card.billingDate.toString());
    setDueDate(card.dueDate.toString());
    setEditingId(card.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه البطاقة؟' : 'Are you sure you want to delete this card?')) {
      dispatch.deleteCreditCard(id);
      dispatch.setNotification({ message: language === 'ar' ? 'تم حذف البطاقة' : 'Card deleted', type: 'success' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      <div className="bg-white dark:bg-slate-900 pt-12 pb-6 px-4 md:px-8 shadow-sm border-b border-slate-100 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <ArrowLeft size={20} className={language === 'ar' ? 'rotate-180' : ''} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {language === 'ar' ? 'البطاقات الائتمانية' : 'Credit Cards'}
              </h1>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                {language === 'ar' ? 'إدارة بطاقاتك ومتابعة الرصيد' : 'Manage cards & track balance'}
              </p>
            </div>
          </div>
          {!isAdding && (
            <button 
              onClick={() => setIsAdding(true)}
              className="w-12 h-12 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 transition-all active:scale-95"
            >
              <Plus size={24} />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
        {isAdding && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 dark:border-slate-800 mb-8 animate-in fade-in slide-in-from-top-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wide mb-6">
              {editingId ? (language === 'ar' ? 'تعديل بطاقة' : 'Edit Card') : (language === 'ar' ? 'إضافة بطاقة جديدة' : 'Add New Card')}
            </h2>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-2">
                  {language === 'ar' ? 'اسم البطاقة' : 'Card Name'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: فيزا المشتريات' : 'e.g., Shopping Visa'}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/50"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-2">
                    {language === 'ar' ? 'الحد الائتماني (Limit)' : 'Credit Limit'}
                  </label>
                  <div className="relative">
                    <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      inputMode="decimal"
                      value={limit}
                      onChange={(e) => setLimit(parseArabicNumber(e.target.value))}
                      placeholder="0.00"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/50"
                      required
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2 px-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">
                      {language === 'ar' ? 'الرصيد' : 'Balance'}
                    </label>
                    <select
                      value={balanceInputType}
                      onChange={(e) => setBalanceInputType(e.target.value as 'spent' | 'remaining')}
                      className="text-[10px] font-bold bg-transparent text-purple-600 outline-none cursor-pointer"
                    >
                      <option value="spent">{language === 'ar' ? 'المبلغ المصروف' : 'Spent Amount'}</option>
                      <option value="remaining">{language === 'ar' ? 'المبلغ المتبقي متاح' : 'Remaining Available'}</option>
                    </select>
                  </div>
                  <div className="relative">
                    <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      inputMode="decimal"
                      value={balance}
                      onChange={(e) => setBalance(parseArabicNumber(e.target.value))}
                      placeholder="0.00"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-2">
                    {language === 'ar' ? 'يوم كشف الحساب' : 'Statement Day'}
                  </label>
                  <div className="relative">
                    <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={billingDate}
                      onChange={(e) => {
                        const val = parseArabicNumber(e.target.value);
                        if (!val || (parseInt(val) >= 1 && parseInt(val) <= 31)) setBillingDate(val);
                      }}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/50"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-2">
                    {language === 'ar' ? 'يوم الاستحقاق' : 'Due Day'}
                  </label>
                  <div className="relative">
                    <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={dueDate}
                      onChange={(e) => {
                        const val = parseArabicNumber(e.target.value);
                        if (!val || (parseInt(val) >= 1 && parseInt(val) <= 31)) setDueDate(val);
                      }}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/50"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-purple-500/30 hover:bg-purple-500 transition-colors"
                >
                  {language === 'ar' ? 'حفظ' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {activeCards.length === 0 && !isAdding ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 dark:text-slate-600">
                <CreditCardIcon size={48} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wide mb-2">
                {language === 'ar' ? 'لا توجد بطاقات' : 'No Cards Yet'}
              </h3>
              <p className="text-slate-500 font-medium">
                {language === 'ar' ? 'أضف بطاقتك الائتمانية الأولى لتتبع مصروفاتها' : 'Add your first credit card to track its expenses'}
              </p>
            </div>
          ) : (
            activeCards.map(card => {
              const utilization = Math.min(100, (card.balance / card.limit) * 100);
              const available = card.limit - card.balance;
              
              return (
                <div key={card.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-2 h-full bg-purple-500"></div>
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center">
                        <CreditCardIcon size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">{card.name}</h3>
                        <p className="text-xs font-bold text-slate-500">
                          {language === 'ar' ? 'الحد:' : 'Limit:'} ${card.limit.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(card)} className="p-2 text-slate-400 hover:text-blue-500 bg-slate-50 dark:bg-slate-800 rounded-xl transition-colors">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => handleDelete(card.id)} className="p-2 text-slate-400 hover:text-rose-500 bg-slate-50 dark:bg-slate-800 rounded-xl transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        {language === 'ar' ? 'الرصيد المستخدم' : 'Used Balance'}
                      </p>
                      <p className="text-xl font-black text-slate-900 dark:text-white">
                        ${card.balance.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        {language === 'ar' ? 'المتاح' : 'Available'}
                      </p>
                      <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                        ${available.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">{language === 'ar' ? 'الاستخدام' : 'Utilization'}</span>
                      <span className={utilization > 80 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}>
                        {utilization.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          utilization > 80 ? 'bg-rose-500' : utilization > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${utilization}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{language === 'ar' ? 'الكشف:' : 'Stmt:'} {card.billingDate}</span>
                      </div>
                      <div className="flex items-center gap-1 text-rose-500">
                        <Calendar size={14} />
                        <span>{language === 'ar' ? 'الاستحقاق:' : 'Due:'} {card.dueDate}</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setPayingCardId(card.id)}
                        className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wide hover:underline"
                      >
                        {language === 'ar' ? 'تسديد' : 'Pay'}
                      </button>
                      <button 
                        onClick={() => navigate('/add', { state: { type: 'expense', paymentMethod: 'credit' } })}
                        className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wide hover:underline"
                      >
                        {language === 'ar' ? '+ إضافة مصروف' : '+ Add Expense'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {payingCardId && (
        <CreditSettlementModal 
          card={state.creditCards.find(c => c.id === payingCardId)!} 
          onClose={() => setPayingCardId(null)} 
        />
      )}
    </div>
  );
};
