import React, { useState } from 'react';
import { useApp } from '../store';
import { Plus, Trash2, CalendarClock, Edit2, X, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { RecurrenceInterval, RecurringTransaction, TransactionType } from '../types';

export const Subscriptions: React.FC = () => {
  const { state, dispatch } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<RecurringTransaction>>({
    title: '',
    amount: 0,
    type: TransactionType.EXPENSE,
    groupId: state.groups[0]?.id || '',
    clientId: '',
    interval: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    isActive: true
  });

  const handleSave = () => {
    if (!formData.title || !formData.amount || !formData.groupId || !formData.startDate) return;

    const rtData: Omit<RecurringTransaction, 'id'> = {
      title: formData.title,
      amount: Number(formData.amount),
      type: formData.type as TransactionType,
      groupId: formData.groupId,
      clientId: formData.clientId || undefined,
      interval: formData.interval as RecurrenceInterval,
      startDate: formData.startDate,
      nextDate: formData.startDate,
      isActive: formData.isActive ?? true
    };

    if (editingId) {
      dispatch.updateRecurringTransaction(editingId, rtData);
    } else {
      dispatch.addRecurringTransaction(rtData);
    }

    setIsAdding(false);
    setEditingId(null);
    setFormData({
      title: '',
      amount: 0,
      type: TransactionType.EXPENSE,
      groupId: state.groups[0]?.id || '',
      clientId: '',
      interval: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      isActive: true
    });
  };

  const handleEdit = (rt: RecurringTransaction) => {
    setFormData(rt);
    setEditingId(rt.id);
    setIsAdding(true);
  };

  const getIntervalLabel = (interval: RecurrenceInterval) => {
    const labels = {
      daily: state.language === 'ar' ? 'يومياً' : 'Daily',
      weekly: state.language === 'ar' ? 'أسبوعياً' : 'Weekly',
      monthly: state.language === 'ar' ? 'شهرياً' : 'Monthly',
      yearly: state.language === 'ar' ? 'سنوياً' : 'Yearly'
    };
    return labels[interval];
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <CalendarClock className="text-indigo-500" />
            {state.language === 'ar' ? 'المعاملات المتكررة' : 'Recurring Transactions'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {state.language === 'ar' 
              ? 'أضف اشتراكاتك ومصروفاتك الثابتة ليتم تسجيلها تلقائياً' 
              : 'Add your subscriptions and fixed expenses to be recorded automatically'}
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">{state.language === 'ar' ? 'إضافة معاملة' : 'Add Transaction'}</span>
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              {editingId 
                ? (state.language === 'ar' ? 'تعديل المعاملة' : 'Edit Transaction')
                : (state.language === 'ar' ? 'معاملة متكررة جديدة' : 'New Recurring Transaction')}
            </h3>
            <button 
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {state.language === 'ar' ? 'العنوان' : 'Title'}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                placeholder={state.language === 'ar' ? 'مثال: إيجار الشقة، اشتراك نتفليكس' : 'e.g., Rent, Netflix'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {state.language === 'ar' ? 'المبلغ' : 'Amount'}
              </label>
              <input
                type="number"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {state.language === 'ar' ? 'النوع' : 'Type'}
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as TransactionType })}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value={TransactionType.EXPENSE}>{state.language === 'ar' ? 'مصروف' : 'Expense'}</option>
                <option value={TransactionType.INCOME}>{state.language === 'ar' ? 'دخل' : 'Income'}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {state.language === 'ar' ? 'التكرار' : 'Interval'}
              </label>
              <select
                value={formData.interval}
                onChange={(e) => setFormData({ ...formData, interval: e.target.value as RecurrenceInterval })}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="daily">{state.language === 'ar' ? 'يومياً' : 'Daily'}</option>
                <option value="weekly">{state.language === 'ar' ? 'أسبوعياً' : 'Weekly'}</option>
                <option value="monthly">{state.language === 'ar' ? 'شهرياً' : 'Monthly'}</option>
                <option value="yearly">{state.language === 'ar' ? 'سنوياً' : 'Yearly'}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {state.language === 'ar' ? 'المجموعة' : 'Group'}
              </label>
              <select
                value={formData.groupId}
                onChange={(e) => setFormData({ ...formData, groupId: e.target.value, clientId: '' })}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                {state.groups.map(g => (
                  <option key={g.id} value={g.id}>{g.icon} {g.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {state.language === 'ar' ? 'العميل (اختياري)' : 'Client (Optional)'}
              </label>
              <select
                value={formData.clientId || ''}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="">{state.language === 'ar' ? 'بدون عميل' : 'No Client'}</option>
                {state.clients.filter(c => c.groupId === formData.groupId && !c.isArchived).map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {state.language === 'ar' ? 'تاريخ البدء' : 'Start Date'}
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center mt-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {state.language === 'ar' ? 'مفعل' : 'Active'}
                </span>
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
              }}
              className="px-6 py-3 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {state.language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.title || !formData.amount || !formData.groupId || !formData.startDate}
              className="px-6 py-3 rounded-xl font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Check size={20} />
              {state.language === 'ar' ? 'حفظ' : 'Save'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.recurringTransactions?.map(rt => {
          const group = state.groups.find(g => g.id === rt.groupId);
          const client = state.clients.find(c => c.id === rt.clientId);
          const isExpense = rt.type?.toUpperCase() === 'EXPENSE';

          return (
            <div 
              key={rt.id} 
              className={`bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border ${
                rt.isActive ? 'border-slate-100 dark:border-slate-700/50' : 'border-dashed border-slate-300 dark:border-slate-600 opacity-75'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                    isExpense ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                  }`}>
                    {group?.icon || '💰'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">{rt.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      {group?.name} {client && <><ArrowLeft size={10} className={state.language === 'ar' ? '' : 'rotate-180'} /> {client.name}</>}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleEdit(rt)}
                    className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm(state.language === 'ar' ? 'هل أنت متأكد من حذف هذه المعاملة المتكررة؟' : 'Are you sure you want to delete this recurring transaction?')) {
                        dispatch.deleteRecurringTransaction(rt.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{state.language === 'ar' ? 'المبلغ' : 'Amount'}</span>
                  <span className={`font-bold ${isExpense ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {rt.amount.toLocaleString()} {state.baseCurrency}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{state.language === 'ar' ? 'التكرار' : 'Interval'}</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                    {getIntervalLabel(rt.interval)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{state.language === 'ar' ? 'تاريخ الاستحقاق القادم' : 'Next Due Date'}</span>
                  <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    {new Date(rt.nextDate).toLocaleDateString(state.language === 'ar' ? 'ar-EG' : 'en-US')}
                  </span>
                </div>
              </div>

              {!rt.isActive && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 text-center">
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md">
                    {state.language === 'ar' ? 'متوقف مؤقتاً' : 'Paused'}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {(!state.recurringTransactions || state.recurringTransactions.length === 0) && !isAdding && (
          <div className="col-span-full bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-100 dark:border-slate-700/50">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarClock size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              {state.language === 'ar' ? 'لا توجد معاملات متكررة' : 'No Recurring Transactions'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {state.language === 'ar' 
                ? 'قم بإضافة اشتراكاتك ومصروفاتك الثابتة (مثل الإيجار، فواتير الإنترنت) ليتم تسجيلها تلقائياً في موعدها.' 
                : 'Add your subscriptions and fixed expenses (like rent, internet bills) to be recorded automatically on time.'}
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl inline-flex items-center gap-2 transition-colors"
            >
              <Plus size={20} />
              {state.language === 'ar' ? 'إضافة معاملة متكررة' : 'Add Recurring Transaction'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
