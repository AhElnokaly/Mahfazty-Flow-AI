import React, { useState } from 'react';
import { useApp } from '../store';
import { X, ArrowRight, Wallet, Target, Layers } from 'lucide-react';
import { CalculatorInput } from './CalculatorInput';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({ isOpen, onClose }) => {
  const { state, dispatch } = useApp();
  const { language, groups, goals, walletBalance, baseCurrency } = state;
  
  const [amount, setAmount] = useState('');
  const [destinationType, setDestinationType] = useState<'group' | 'goal'>('group');
  const [destinationId, setDestinationId] = useState('');

  if (!isOpen) return null;

  const activeGroups = groups.filter(g => !g.isArchived);
  const activeGoals = goals.filter(g => g.currentAmount < g.targetAmount);

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const transferAmount = parseFloat(amount);
    
    if (!transferAmount || transferAmount <= 0) {
      dispatch.setNotification({ message: language === 'ar' ? 'يرجى إدخال مبلغ صحيح' : 'Please enter a valid amount', type: 'error' });
      return;
    }

    if (transferAmount > walletBalance) {
      dispatch.setNotification({ message: language === 'ar' ? 'الرصيد غير كافٍ' : 'Insufficient balance', type: 'error' });
      return;
    }

    if (!destinationId) {
      dispatch.setNotification({ message: language === 'ar' ? 'يرجى اختيار الوجهة' : 'Please select a destination', type: 'error' });
      return;
    }

    if (destinationType === 'group') {
      dispatch.transferToGroup(destinationId, transferAmount);
      dispatch.setNotification({ message: language === 'ar' ? 'تم تحويل المبلغ للمجموعة بنجاح' : 'Amount transferred to group successfully', type: 'success' });
    } else {
      dispatch.transferToSavings(destinationId, transferAmount);
      dispatch.setNotification({ message: language === 'ar' ? 'تم تحويل المبلغ للادخار بنجاح' : 'Amount transferred to savings successfully', type: 'success' });
    }

    setAmount('');
    setDestinationId('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            {language === 'ar' ? 'تحويل أموال' : 'Transfer Funds'}
          </h3>
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleTransfer} className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              {language === 'ar' ? 'المبلغ' : 'Amount'}
            </label>
            <div className="relative">
              <CalculatorInput
                value={amount}
                onChange={setAmount}
                placeholder="0.00"
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-2xl font-black text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-12 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                {baseCurrency}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-500 mt-2">
              {language === 'ar' ? 'الرصيد المتاح:' : 'Available Balance:'} <span className="text-blue-600">{walletBalance.toLocaleString()} {baseCurrency}</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              {language === 'ar' ? 'الوجهة' : 'Destination Type'}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setDestinationType('group'); setDestinationId(''); }}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl font-bold text-sm transition-all ${destinationType === 'group' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <Layers size={16} />
                {language === 'ar' ? 'مجموعة' : 'Group'}
              </button>
              <button
                type="button"
                onClick={() => { setDestinationType('goal'); setDestinationId(''); }}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl font-bold text-sm transition-all ${destinationType === 'goal' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <Target size={16} />
                {language === 'ar' ? 'هدف ادخار' : 'Savings Goal'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              {language === 'ar' ? 'اختر الوجهة' : 'Select Destination'}
            </label>
            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-black text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
            >
              <option value="" disabled>{language === 'ar' ? 'اختر...' : 'Select...'}</option>
              {destinationType === 'group' 
                ? activeGroups.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)
                : activeGoals.map(g => <option key={g.id} value={g.id}>{g.icon} {g.title}</option>)
              }
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {language === 'ar' ? 'تأكيد التحويل' : 'Confirm Transfer'}
            <ArrowRight size={20} className={language === 'ar' ? 'rotate-180' : ''} />
          </button>
        </form>
      </div>
    </div>
  );
};
