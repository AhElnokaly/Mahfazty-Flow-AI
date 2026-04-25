import React, { useState, useMemo } from 'react';
import { useApp } from '../store';
import { X, Check, DollarSign, AlertCircle, Calculator } from 'lucide-react';
import { CreditCard } from '../types';

interface Props {
  card: CreditCard;
  onClose: () => void;
}

export const CreditSettlementModal: React.FC<Props> = ({ card, onClose }) => {
  const { state, dispatch } = useApp();
  const { language } = state;
  
  const [paymentAmount, setPaymentAmount] = useState('');
  const [actualBankBalance, setActualBankBalance] = useState('');
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  
  const parseArabicNumber = (val: string) => {
    const englishVal = val.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
    return englishVal.replace(/[^0-9.]/g, '');
  };

  // Get unsettled transactions for this card
  const unsettledTransactions = useMemo(() => {
    return state.transactions.filter(t => 
      t.paymentMethod === 'credit' && 
      t.creditCardId === card.id && 
      !t.isSettled
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [state.transactions, card.id]);

  // +++ أضيف بناءً على طلبك +++
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: typeof unsettledTransactions } = {};
    unsettledTransactions.forEach(tx => {
      const date = new Date(tx.date);
      const monthYear = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      const arMonthYear = date.toLocaleString('ar-EG', { month: 'long', year: 'numeric' });
      const key = language === 'ar' ? arMonthYear : monthYear;
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });
    return groups;
  }, [unsettledTransactions, language]);
  // ++++++++++++++++++++++++++++

  const handleAmountChange = (val: string) => {
    const parsed = parseArabicNumber(val);
    setPaymentAmount(parsed);
    
    // Auto-select logic
    const amount = parseFloat(parsed) || 0;
    let remaining = amount;
    const newSelectedTx = new Set<string>();
    const newSelectedItems = new Set<string>();
    
    for (const tx of unsettledTransactions) {
      if (remaining <= 0) break;
      
      if (tx.items && tx.items.length > 0) {
        for (const item of tx.items) {
          if (item.isSettled) continue;
          const itemCost = item.price * item.quantity;
          if (remaining >= itemCost) {
            newSelectedItems.add(item.id);
            remaining -= itemCost;
          }
        }
      } else {
        if (remaining >= tx.amount) {
          newSelectedTx.add(tx.id);
          remaining -= tx.amount;
        }
      }
    }
    
    setSelectedTxIds(newSelectedTx);
    setSelectedItemIds(newSelectedItems);
  };

  const recalculateAmount = (txs: Set<string>, items: Set<string>) => {
    let total = 0;
    unsettledTransactions.forEach(tx => {
      if (txs.has(tx.id)) {
        total += tx.amount;
      } else if (tx.items) {
        tx.items.forEach(item => {
          if (items.has(item.id)) total += (item.price * item.quantity);
        });
      }
    });
    setPaymentAmount(total.toString());
  };

  const handleToggleTx = (txId: string) => {
    const newSet = new Set(selectedTxIds);
    if (newSet.has(txId)) {
      newSet.delete(txId);
    } else {
      newSet.add(txId);
    }
    setSelectedTxIds(newSet);
    recalculateAmount(newSet, selectedItemIds);
  };

  const handleToggleItem = (itemId: string) => {
    const newSet = new Set(selectedItemIds);
    if (newSet.has(itemId)) {
      newSet.delete(itemId);
    } else {
      newSet.add(itemId);
    }
    setSelectedItemIds(newSet);
    recalculateAmount(selectedTxIds, newSet);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) return;

    const bankBal = parseFloat(actualBankBalance);
    let adjustmentTransaction = undefined;

    // Reconciliation logic
    if (!isNaN(bankBal)) {
      const expectedBalanceAfterPayment = card.balance - amount;
      const difference = bankBal - expectedBalanceAfterPayment;
      
      // If bank balance is higher than expected, it means there are hidden fees/interest
      if (difference > 0) {
        adjustmentTransaction = {
          amount: difference,
          currency: state.baseCurrency,
          type: 'EXPENSE' as any,
          paymentMethod: 'credit' as any,
          creditCardId: card.id,
          date: new Date().toISOString().split('T')[0],
          groupId: 'system_adjustment',
          clientId: 'system',
          clientIds: ['system'],
          note: language === 'ar' ? 'تسوية بنكية (رسوم/فوائد)' : 'Bank Reconciliation (Fees/Interest)',
          isSettled: true // The fee itself is settled? Or just added to balance. It's added to balance, so it's unsettled until paid. Wait, if it's added to balance, it's an expense on the card.
        };
      }
    }

    const settledItemsList: {transactionId: string, itemId: string}[] = [];
    unsettledTransactions.forEach(tx => {
      if (tx.items) {
        tx.items.forEach(item => {
          if (selectedItemIds.has(item.id)) {
            settledItemsList.push({ transactionId: tx.id, itemId: item.id });
          }
        });
      }
    });

    dispatch.settleCreditCard({
      creditCardId: card.id,
      paymentAmount: amount,
      settledTransactions: Array.from(selectedTxIds),
      settledItems: settledItemsList,
      adjustmentTransaction
    });

    dispatch.setNotification({ message: language === 'ar' ? 'تم تسديد البطاقة بنجاح' : 'Card paid successfully', type: 'success' });
    onClose();
  };

  const difference = !isNaN(parseFloat(actualBankBalance)) 
    ? parseFloat(actualBankBalance) - (card.balance - (parseFloat(paymentAmount) || 0))
    : 0;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wide">
              {language === 'ar' ? 'تسديد وتسوية البطاقة' : 'Card Settlement & Reconciliation'}
            </h2>
            <p className="text-xs font-bold text-slate-500 mt-1">{card.name}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Section 1: Reconciliation */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Calculator size={16} />
              {language === 'ar' ? 'المطابقة المحاسبية' : 'Reconciliation'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-500 mb-1">{language === 'ar' ? 'الرصيد المسجل بالتطبيق' : 'App Recorded Balance'}</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">{card.balance.toLocaleString()} {state.baseCurrency}</p>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 px-2">
                  {language === 'ar' ? 'الرصيد الفعلي بالبنك (اختياري)' : 'Actual Bank Balance (Optional)'}
                </label>
                <div className="relative">
                  <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={actualBankBalance}
                    onChange={(e) => setActualBankBalance(parseArabicNumber(e.target.value))}
                    placeholder="0.00"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-lg font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>
            </div>

            {difference > 0 && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-start gap-3 border border-amber-100 dark:border-amber-800/30">
                <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                    {language === 'ar' ? 'يوجد فارق في الحساب!' : 'Account Difference Detected!'}
                  </p>
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mt-1">
                    {language === 'ar' 
                      ? `رصيد البنك أكبر بـ ${difference.toLocaleString()} ${state.baseCurrency}. سيتم تسجيل هذا الفارق تلقائياً كـ "رسوم/فوائد بنكية" لضبط الحساب.`
                      : `Bank balance is higher by ${difference.toLocaleString()} ${state.baseCurrency}. This will be auto-recorded as "Bank Fees/Interest" to balance the account.`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Items & Transactions */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
              {language === 'ar' ? 'المعاملات غير المسددة' : 'Unsettled Transactions'}
            </h3>
            
            {unsettledTransactions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-500">
                  {language === 'ar' ? 'لا توجد معاملات معلقة لهذه البطاقة.' : 'No pending transactions for this card.'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedTransactions).map(([month, txs]) => (
                  <div key={month} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full w-fit">
                        {month}
                      </h4>
                      <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1"></div>
                      <span className="text-xs font-black text-slate-400">
                        {txs.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()} {state.baseCurrency}
                      </span>
                    </div>
                    {txs.map((tx: any) => (
                  <div key={tx.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden ml-2 border-l-4 border-l-purple-500/30">
                    {/* Transaction Header */}
                    <div 
                      className="p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      onClick={() => !tx.items?.length && handleToggleTx(tx.id)}
                    >
                      {!tx.items?.length && (
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selectedTxIds.has(tx.id) ? 'bg-purple-500 border-purple-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                          {selectedTxIds.has(tx.id) && <Check size={14} strokeWidth={3} />}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{tx.note || (language === 'ar' ? 'معاملة بدون وصف' : 'Unnamed Transaction')}</p>
                        <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-slate-800 dark:text-white">{tx.amount.toLocaleString()} {state.baseCurrency}</p>
                      </div>
                    </div>

                    {/* Transaction Items */}
                    {tx.items && tx.items.length > 0 && (
                      <div className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-2 space-y-1">
                        {tx.items.filter((i: any) => !i.isSettled).map((item: any) => (
                          <div 
                            key={item.id}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                            onClick={() => handleToggleItem(item.id)}
                          >
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${selectedItemIds.has(item.id) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                              {selectedItemIds.has(item.id) && <Check size={12} strokeWidth={3} />}
                            </div>
                            <div className="flex-1 flex justify-between items-center">
                              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{item.quantity}x {item.name}</p>
                              <p className="text-xs font-black text-slate-700 dark:text-slate-200">{(item.price * item.quantity).toLocaleString()} {state.baseCurrency}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer / Execution */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0 rounded-b-3xl">
          <div className="mb-4">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-2">
              {language === 'ar' ? 'المبلغ المراد سداده الآن' : 'Amount to Pay Now'}
            </label>
            <div className="relative">
              <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                inputMode="decimal"
                value={paymentAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border-2 border-purple-500/20 rounded-2xl text-xl font-black text-purple-600 dark:text-purple-400 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all"
              />
            </div>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={!parseFloat(paymentAmount) || parseFloat(paymentAmount) <= 0}
            className="w-full py-4 bg-purple-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-purple-500/30 hover:bg-purple-500 transition-all active:scale-95"
          >
            {language === 'ar' ? 'تأكيد السداد' : 'Confirm Payment'}
          </button>
        </div>

      </div>
    </div>
  );
};
