

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useApp, isIncomeLike, isExpenseLike, getClientShare } from '../store';
import { 
  Plus, MoreHorizontal, ArrowUpRight, Sparkles, Zap, ShieldCheck,
  ArrowDownLeft, ArrowUpLeft, Wallet, ArrowDownRight, TrendingUp, TrendingDown,
  Target, ChevronRight, PieChart as PieIcon, Calendar, Clock, ArrowRight, Info, X, Edit2, AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Tooltip 
} from 'recharts';
import { TransactionType } from '../types';
import { useNavigate } from 'react-router-dom';
import { TransferModal } from '../components/TransferModal';

// Dashboard component for financial overview
const Dashboard: React.FC = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const { language, walletBalance, installments, goals, isPro, baseCurrency, isPrivacyMode } = state;
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  
  const groups = useMemo(() => state.groups.filter(g => !g.isArchived), [state.groups]);
  const clients = useMemo(() => state.clients.filter(c => !c.isArchived), [state.clients]);
  
  const transactions = useMemo(() => {
    return state.transactions.filter(t => {
      const g = state.groups.find(g => g.id === t.groupId);
      // Check if ANY of the clients associated with the transaction are archived
      const hasArchivedClient = t.clientIds 
        ? t.clientIds.some(cId => state.clients.find(c => c.id === cId)?.isArchived)
        : state.clients.find(c => c.id === t.clientId)?.isArchived;
      
      return (!g || !g.isArchived) && !hasArchivedClient;
    });
  }, [state.transactions, state.groups, state.clients]);

  // --- Calculations ---
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthStr = lastMonthDate.toISOString().slice(0, 7);

  const currentMonthIncome = transactions
    .filter(t => isIncomeLike(t) && t.date && t.date.startsWith(currentMonthStr))
    .reduce((s, t) => s + t.amount, 0);
  const lastMonthIncome = transactions
    .filter(t => isIncomeLike(t) && t.date && t.date.startsWith(lastMonthStr))
    .reduce((s, t) => s + t.amount, 0);
  const incomeChange = lastMonthIncome === 0 ? 0 : ((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100;

  const currentMonthExpense = transactions
    .filter(t => isExpenseLike(t) && t.date && t.date.startsWith(currentMonthStr))
    .reduce((s, t) => s + t.amount, 0);
  const lastMonthExpense = transactions
    .filter(t => isExpenseLike(t) && t.date && t.date.startsWith(lastMonthStr))
    .reduce((s, t) => s + t.amount, 0);
  const expenseChange = lastMonthExpense === 0 ? 0 : ((currentMonthExpense - lastMonthExpense) / lastMonthExpense) * 100;

  const totalExpenses = transactions
    .filter(t => isExpenseLike(t))
    .reduce((s, t) => s + t.amount, 0);

  const totalIncome = transactions
    .filter(t => isIncomeLike(t))
    .reduce((s, t) => s + t.amount, 0);

  const savingsRate = currentMonthIncome > 0 ? ((currentMonthIncome - currentMonthExpense) / currentMonthIncome) * 100 : 0;

  // --- Debt Position ---
  const debtTransactions = transactions.filter(t => t.isDebt);
  const partialPayments = transactions.filter(t => t.referenceTotal && t.referenceTotal > t.amount);
  
  let totalDebtsIOwe = 0;
  let totalDebtsOwedToMe = 0;

  debtTransactions.forEach(t => {
    if (t.debtAction === 'BORROW') totalDebtsIOwe += t.amount;
    else if (t.debtAction === 'REPAY_BORROW') totalDebtsIOwe -= t.amount;
    else if (t.debtAction === 'LEND') totalDebtsOwedToMe += t.amount;
    else if (t.debtAction === 'REPAY_LEND') totalDebtsOwedToMe -= t.amount;
    else {
      if (isIncomeLike(t)) totalDebtsIOwe += t.amount;
      else if (isExpenseLike(t)) totalDebtsOwedToMe += t.amount;
    }
  });

  partialPayments.forEach(t => {
    const remaining = (t.referenceTotal || 0) - t.amount;
    if (isExpenseLike(t)) totalDebtsIOwe += remaining;
    else if (isIncomeLike(t)) totalDebtsOwedToMe += remaining;
  });

  installments.filter(i => i.status === 'active').forEach(i => {
    const remaining = (i.totalAmount || (i.monthlyAmount * i.installmentCount)) - (i.paidCount * i.monthlyAmount);
    if (remaining > 0) totalDebtsIOwe += remaining;
  });

  totalDebtsIOwe = Math.max(0, totalDebtsIOwe);
  totalDebtsOwedToMe = Math.max(0, totalDebtsOwedToMe);

  // --- Investment Portfolio ---
  const investmentTransactions = transactions.filter(t => t.type === TransactionType.INVESTMENT);
  const investedCapital = investmentTransactions
    .filter(t => t.investmentAction !== 'SELL' && t.investmentAction !== 'RETURN')
    .reduce((s, t) => s + t.amount, 0);
  const investmentReturns = investmentTransactions
    .filter(t => t.investmentAction === 'SELL' || t.investmentAction === 'RETURN')
    .reduce((s, t) => s + t.amount, 0);

  const recentTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 5);
  }, [transactions]);

  const upcomingInstallments = useMemo(() => {
    return installments.filter(i => i.status === 'active').slice(0, 3);
  }, [installments]);

  const accountCards = useMemo(() => {
    // Elegant Gradients instead of flat colors
    const cardStyles = [
      { bg: 'bg-gradient-to-br from-slate-800 to-slate-900', shadow: 'shadow-slate-500/10' }, // Dark/Classic
      { bg: 'bg-gradient-to-br from-indigo-600 to-blue-700', shadow: 'shadow-indigo-500/20' }, // Indigo
      { bg: 'bg-gradient-to-br from-violet-600 to-purple-700', shadow: 'shadow-violet-500/20' }, // Purple
      { bg: 'bg-gradient-to-br from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' }, // Amber
      { bg: 'bg-gradient-to-br from-cyan-600 to-teal-700', shadow: 'shadow-cyan-500/20' }, // Cyan
    ];

    return groups.map((group, index) => {
      const groupTransactions = transactions.filter(t => t.groupId === group.id);
      
      const income = groupTransactions
        .filter(t => isIncomeLike(t))
        .reduce((sum, t) => sum + t.amount, 0);
        
      const expense = groupTransactions
        .filter(t => isExpenseLike(t))
        .reduce((sum, t) => sum + t.amount, 0);

      const balance = income - expense;
      
      return {
        id: group.id,
        name: group.name,
        balance,
        income,
        expense,
        icon: group.icon,
        monthlyBudget: group.monthlyBudget || 0,
        allocatedAmount: group.allocatedAmount || 0,
        style: cardStyles[index % cardStyles.length],
        isVirtual: false
      };
    });
  }, [groups, transactions]);

  const expenseBreakdown = useMemo(() => {
    const data = groups.map(g => ({
      name: g.name,
      value: transactions
        .filter(t => t.groupId === g.id && t.type === TransactionType.EXPENSE)
        .reduce((s, t) => s + t.amount, 0)
    })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

    if (data.length === 0) return [];
    
    const topCategory = data[0];
    const otherTotal = data.slice(1).reduce((s, i) => s + i.value, 0);
    
    return [
      { name: topCategory.name, value: topCategory.value, color: '#F43F5E' }, 
      { name: 'Other', value: otherTotal, color: '#E2E8F0' } 
    ];
  }, [groups, transactions]);

  const topExpenseCategory = expenseBreakdown.length > 0 ? expenseBreakdown[0] : null;

  const trendData = useMemo(() => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const dailyNet = transactions
        .filter(t => t.date && t.date === dayStr)
        .reduce((s, t) => isIncomeLike(t) ? s + t.amount : s - t.amount, 0);
      data.push({ name: i, value: Math.abs(dailyNet + (Math.random() * 50)) });
    }
    return data;
  }, [transactions]);

  const [showBalanceBreakdown, setShowBalanceBreakdown] = useState(false);
  const [isBalanceExpanded, setIsBalanceExpanded] = useState(false);
  const [balanceAnimation, setBalanceAnimation] = useState<'up' | 'down' | null>(null);
  const [balanceDiff, setBalanceDiff] = useState<number | null>(null);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'insights'>('overview');
  const prevBalanceRef = useRef(walletBalance);

  useEffect(() => {
    if (walletBalance !== prevBalanceRef.current) {
      const diff = walletBalance - prevBalanceRef.current;
      setBalanceDiff(diff);
      if (walletBalance > prevBalanceRef.current) {
        setBalanceAnimation('up');
      } else {
        setBalanceAnimation('down');
      }
      prevBalanceRef.current = walletBalance;
      
      const timer = setTimeout(() => {
        setBalanceAnimation(null);
        setBalanceDiff(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [walletBalance]);

  // Calculate Balance Breakdown
  const breakdown = useMemo(() => {
    const isAdjustment = (t: any) => t.groupId === 'system_adjustment' && t.clientId === 'system_adjustment';
    
    const totalIncome = transactions
      .filter(t => isIncomeLike(t) && !isAdjustment(t))
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalExpense = transactions
      .filter(t => isExpenseLike(t) && !isAdjustment(t))
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalInstallmentsPaid = installments.reduce((sum, i) => sum + (i.paidCount * i.monthlyAmount), 0);
    const calculatedBalance = totalIncome - totalExpense - totalInstallmentsPaid;
    const adjustment = walletBalance - calculatedBalance;

    // Calculate Investments
    const totalInvestments = transactions
      .filter(t => t.type === TransactionType.INVESTMENT)
      .reduce((sum, t) => {
        if (t.investmentAction?.startsWith('BUY_')) return sum + t.amount;
        if (t.investmentAction?.startsWith('SELL_')) return sum - t.amount;
        return sum;
      }, 0);

    // Calculate Debts
    const debtTransactions = transactions.filter(t => t.isDebt);
    const partialPayments = transactions.filter(t => t.referenceTotal && t.referenceTotal > t.amount);
    
    const clientDebts: Record<string, number> = {};
    
    debtTransactions.forEach(t => {
      const clientsForTx = t.clientIds || [t.clientId];
      const amountPerClient = t.amount / clientsForTx.length;
      
      clientsForTx.forEach(cId => {
        if (!clientDebts[cId]) clientDebts[cId] = 0;
        if (t.debtAction === 'BORROW') clientDebts[cId] += amountPerClient;
        else if (t.debtAction === 'REPAY_BORROW') clientDebts[cId] -= amountPerClient;
        else if (t.debtAction === 'LEND') clientDebts[cId] -= amountPerClient;
        else if (t.debtAction === 'REPAY_LEND') clientDebts[cId] += amountPerClient;
      });
    });

    partialPayments.forEach(t => {
      const clientsForTx = t.clientIds || [t.clientId];
      const share = t.amount / clientsForTx.length;
      const refTotalPerClient = (t.referenceTotal || 0) / clientsForTx.length;
      const remaining = refTotalPerClient - share;
      
      clientsForTx.forEach(cId => {
        if (!clientDebts[cId]) clientDebts[cId] = 0;
        if (t.type === 'EXPENSE') clientDebts[cId] += remaining;
        else if (t.type === 'INCOME') clientDebts[cId] -= remaining;
      });
    });

    let totalDebtsOwedByMe = 0;
    let totalDebtsOwedToMe = 0;
    Object.values(clientDebts).forEach(balance => {
      if (balance > 0) totalDebtsOwedByMe += balance;
      else if (balance < 0) totalDebtsOwedToMe += Math.abs(balance);
    });

    return { totalIncome, totalExpense, totalInstallmentsPaid, calculatedBalance, adjustment, totalInvestments, totalDebtsOwedByMe, totalDebtsOwedToMe };
  }, [transactions, installments, walletBalance]);

  // Privacy Blur Helper
  const privacyClass = isPrivacyMode ? 'blur-sm select-none' : '';

  // +++ أضيف بناءً على طلبك +++ (Budget Alert Logic)
  const isOverBudget = currentMonthIncome > 0 && currentMonthExpense > currentMonthIncome * 0.8;
  const budgetPercentage = currentMonthIncome > 0 ? Math.round((currentMonthExpense / currentMonthIncome) * 100) : 0;
  // +++ نهاية الإضافة +++

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20 px-2 max-w-5xl mx-auto">
      
      {/* +++ أضيف بناءً على طلبك +++ (Budget Alert Banner) */}
      {isOverBudget && (
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-3xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertCircle size={20} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-black text-rose-900 dark:text-rose-100 uppercase tracking-tight">
              {language === 'ar' ? 'تنبيه الميزانية' : 'Budget Alert'}
            </h4>
            <p className="text-xs text-rose-700 dark:text-rose-300 font-medium mt-1 leading-relaxed">
              {language === 'ar' 
                ? `لقد استهلكت ${budgetPercentage}% من دخلك لهذا الشهر. حاول تقليل نفقاتك لتجنب العجز المالي.` 
                : `You have consumed ${budgetPercentage}% of your income this month. Try to reduce expenses to avoid a deficit.`}
            </p>
          </div>
        </div>
      )}
      {/* +++ نهاية الإضافة +++ */}

      {/* Total Balance Section */}
      <section 
        onClick={() => setIsBalanceExpanded(!isBalanceExpanded)}
        className={`bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden cursor-pointer hover:shadow-md transition-all duration-500 group ${balanceAnimation === 'up' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 scale-[1.02] shadow-[0_0_30px_rgba(16,185,129,0.2)]' : balanceAnimation === 'down' ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 scale-[0.98] shadow-[0_0_30px_rgba(244,63,94,0.2)]' : ''}`}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{language === 'ar' ? 'إجمالي الرصيد' : 'Total Balance'}</p>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowBalanceBreakdown(true); }}
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Info size={14} className="text-slate-400" />
          </button>
        </div>
        <h2 className={`text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter transition-all duration-300 ${balanceAnimation === 'up' ? 'text-emerald-500' : balanceAnimation === 'down' ? 'text-rose-500' : ''} ${privacyClass}`}>
          {baseCurrency} {walletBalance.toLocaleString()}
        </h2>
        
        {isBalanceExpanded && (
          <div className="mt-6 w-full max-w-sm space-y-3 animate-in fade-in slide-in-from-top-4 duration-300 border-t border-slate-100 dark:border-slate-800/50 pt-6">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-500">{language === 'ar' ? 'الكاش' : 'Cash'}</span>
              <span className={`text-sm font-black ${privacyClass}`}>{baseCurrency} {walletBalance.toLocaleString()}</span>
            </div>
            
            {breakdown.totalDebtsOwedByMe > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500">{language === 'ar' ? 'ديون مستحقة عليك' : 'Debts Owed By You'}</span>
                <span className={`text-sm font-black text-rose-500 ${privacyClass}`}>-{baseCurrency} {breakdown.totalDebtsOwedByMe.toLocaleString()}</span>
              </div>
            )}
            
            {breakdown.totalDebtsOwedToMe > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500">{language === 'ar' ? 'ديون مستحقة لك' : 'Debts Owed To You'}</span>
                <span className={`text-sm font-black text-emerald-500 ${privacyClass}`}>+{baseCurrency} {breakdown.totalDebtsOwedToMe.toLocaleString()}</span>
              </div>
            )}
            
            {breakdown.totalInvestments > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500">{language === 'ar' ? 'الاستثمارات' : 'Investments'}</span>
                <span className={`text-sm font-black text-indigo-500 ${privacyClass}`}>{baseCurrency} {breakdown.totalInvestments.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        {balanceDiff !== null && (
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl font-black pointer-events-none animate-in slide-in-from-bottom-4 fade-in duration-500 slide-out-to-top-8 fade-out ${balanceDiff > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {balanceDiff > 0 ? '+' : ''}{balanceDiff.toLocaleString()}
          </div>
        )}
      </section>

      {showBalanceBreakdown && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white">
                {language === 'ar' ? 'تفاصيل الرصيد' : 'Balance Breakdown'}
              </h3>
              <button onClick={() => setShowBalanceBreakdown(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/50">
                <span className="text-sm font-bold text-slate-500">{language === 'ar' ? 'إجمالي الدخل' : 'Total Income'}</span>
                <span className="text-sm font-black text-emerald-600">+{baseCurrency} {breakdown.totalIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/50">
                <span className="text-sm font-bold text-slate-500">{language === 'ar' ? 'إجمالي المصروفات' : 'Total Expenses'}</span>
                <span className="text-sm font-black text-rose-600">-{baseCurrency} {breakdown.totalExpense.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/50">
                <span className="text-sm font-bold text-slate-500">{language === 'ar' ? 'أقساط مدفوعة' : 'Paid Installments'}</span>
                <span className="text-sm font-black text-rose-600">-{baseCurrency} {breakdown.totalInstallmentsPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-500">{language === 'ar' ? 'رصيد افتتاحي / تسويات' : 'Starting / Adjustments'}</span>
                  <button 
                    onClick={() => {
                      const newBalance = prompt(language === 'ar' ? 'أدخل الرصيد الافتتاحي الجديد:' : 'Enter new starting balance:', breakdown.adjustment.toString());
                      if (newBalance !== null && !isNaN(parseFloat(newBalance))) {
                        const newAdjustment = parseFloat(newBalance);
                        const diff = newAdjustment - breakdown.adjustment;
                        if (diff !== 0) {
                          dispatch.addTransaction({
                            amount: Math.abs(diff),
                            currency: baseCurrency,
                            type: diff > 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
                            date: new Date().toISOString().split('T')[0],
                            groupId: 'system_adjustment',
                            clientId: 'system_adjustment',
                            clientIds: ['system_adjustment'],
                            note: language === 'ar' ? 'تسوية رصيد' : 'Balance Adjustment'
                          });
                        }
                      }
                    }}
                    className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-500"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
                <span className={`text-sm font-black ${breakdown.adjustment >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {breakdown.adjustment > 0 ? '+' : ''}{baseCurrency} {breakdown.adjustment.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 mt-2">
                <span className="text-base font-black uppercase tracking-widest text-slate-900 dark:text-white">{language === 'ar' ? 'الرصيد النهائي' : 'Final Balance'}</span>
                <span className="text-xl font-black text-blue-600">{baseCurrency} {walletBalance.toLocaleString()}</span>
              </div>
              {/* +++ أضيف بناءً على طلبك +++ */}
              {(() => {
                const debtTransactions = transactions.filter(t => t.isDebt);
                const partialPayments = transactions.filter(t => t.referenceTotal && t.referenceTotal > t.amount);
                
                if (debtTransactions.length === 0 && partialPayments.length === 0) return null;

                // Calculate net debt per client
                const clientDebts: Record<string, number> = {};
                
                debtTransactions.forEach(t => {
                  const clientsForTx = t.clientIds || [t.clientId];
                  const amountPerClient = t.amount / clientsForTx.length;
                  
                  clientsForTx.forEach(cId => {
                    if (!clientDebts[cId]) clientDebts[cId] = 0;
                    if (t.debtAction === 'BORROW') clientDebts[cId] += amountPerClient;
                    else if (t.debtAction === 'REPAY_BORROW') clientDebts[cId] -= amountPerClient;
                    else if (t.debtAction === 'LEND') clientDebts[cId] -= amountPerClient;
                    else if (t.debtAction === 'REPAY_LEND') clientDebts[cId] += amountPerClient;
                    else {
                      clientDebts[cId] += t.type === 'INCOME' ? amountPerClient : -amountPerClient;
                    }
                  });
                });

                let totalDebtsIOwe = 0;
                let totalDebtsOwedToMe = 0;

                Object.values(clientDebts).forEach(balance => {
                  if (balance > 0) totalDebtsIOwe += balance;
                  else if (balance < 0) totalDebtsOwedToMe += Math.abs(balance);
                });

                partialPayments.forEach(t => {
                  const remaining = (t.referenceTotal || 0) - t.amount;
                  if (t.type === 'EXPENSE') totalDebtsIOwe += remaining;
                  else if (t.type === 'INCOME') totalDebtsOwedToMe += remaining;
                });

                if (totalDebtsIOwe === 0 && totalDebtsOwedToMe === 0) return null;

                return (
                  <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/50 space-y-2">
                    {totalDebtsIOwe > 0 && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs font-bold text-slate-500">{language === 'ar' ? 'إجمالي ديون عليك' : 'Total Debts You Owe'}</span>
                        <span className="text-sm font-black text-rose-600">{baseCurrency} {totalDebtsIOwe.toLocaleString()}</span>
                      </div>
                    )}
                    {totalDebtsOwedToMe > 0 && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs font-bold text-slate-500">{language === 'ar' ? 'إجمالي ديون لك' : 'Total Debts Owed To You'}</span>
                        <span className="text-sm font-black text-emerald-600">{baseCurrency} {totalDebtsOwedToMe.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                );
              })()}
              
              {(() => {
                const investmentTransactions = transactions.filter(t => t.type === 'INVESTMENT');
                if (investmentTransactions.length === 0) return null;

                const totalInvestments = investmentTransactions.reduce((acc, t) => acc + t.amount, 0);

                return (
                  <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/50 space-y-2">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs font-bold text-slate-500">{language === 'ar' ? 'إجمالي الاستثمارات' : 'Total Investments'}</span>
                      <span className="text-sm font-black text-purple-600">{baseCurrency} {totalInvestments.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })()}
              {/* ++++++++++++++++++++++++++++ */}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions & AI Card */}
      {/* +++ تم تعديل حواف البطاقات والمسافات الداخلية بناءً على طلبك +++ */}
      <section className="flex flex-col md:flex-row gap-4">
        <div 
          onClick={() => navigate('/ai')}
          className="flex-1 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 rounded-3xl p-5 md:p-6 text-white shadow-lg shadow-blue-500/20 cursor-pointer group transition-all hover:scale-[1.01]"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Sparkles size={16} className="text-amber-300 animate-pulse" />
                </div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold uppercase tracking-wide">{language === 'ar' ? 'فحص مالي ذكي' : 'AI Financial Audit'}</h3>
                  <div className="group/ai relative flex items-center">
                    <Info size={12} className="text-white/50 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-white text-slate-900 text-[10px] font-bold rounded-xl opacity-0 invisible group-hover/ai:opacity-100 group-hover/ai:visible transition-all z-50 text-center pointer-events-none shadow-xl">
                      {language === 'ar' ? 'يقوم الذكاء الاصطناعي بتحليل مصاريفك وتقديم نصائح مخصصة لتقليل النفقات وزيادة المدخرات.' : 'AI analyzes your spending and provides personalized tips to reduce expenses and increase savings.'}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border border-white/20 ${isPro ? 'bg-amber-400 text-amber-950' : 'bg-white/10 text-white/60'}`}>
                {isPro ? <Zap size={10} fill="currentColor" /> : <ShieldCheck size={10} />}
                <span className="text-[10px] font-bold uppercase tracking-wide">
                  {isPro ? 'Pro Powered' : 'Standard'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-blue-100/80 leading-relaxed max-w-[300px]">
                {isPro 
                  ? (language === 'ar' ? 'تم تفعيل Gemini Pro لتحليل عميق لتوجهات السوق والأسعار الحقيقية.' : 'Gemini Pro active: Deep analysis of market trends and real-time prices.')
                  : (language === 'ar' ? 'احصل على تحليل فوري لنفقاتك وتوصيات لتحسين ادخارك.' : 'Get instant analysis of your spending and tips to boost savings.')}
              </p>
              <ArrowUpRight size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
          </div>
        </div>

        <div className="flex gap-4 md:w-auto">
          <button 
            onClick={() => setIsTransferModalOpen(true)}
            className="flex-1 md:w-32 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-3xl p-5 md:p-6 flex flex-col items-center justify-center gap-2 shadow-lg shadow-slate-500/20 transition-all hover:scale-[1.02]"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <ArrowRight size={24} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wide text-center">
              {language === 'ar' ? 'تحويل' : 'Transfer'}
            </span>
          </button>
          <button 
            onClick={() => navigate('/add')}
            className="flex-1 md:w-32 bg-emerald-500 hover:bg-emerald-600 text-white rounded-3xl p-5 md:p-6 flex flex-col items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Plus size={24} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wide text-center">
              {language === 'ar' ? 'إضافة' : 'Quick Add'}
            </span>
          </button>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          {language === 'ar' ? 'نظرة عامة' : 'Overview'}
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all ${activeTab === 'accounts' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          {language === 'ar' ? 'الحسابات' : 'Accounts'}
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all ${activeTab === 'insights' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          {language === 'ar' ? 'رؤى' : 'Insights'}
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* 2. Global Stats Bar (Dedicated Income/Expense Cards) */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         {/* Cashflow Stat */}
         <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
               <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{language === 'ar' ? 'السيولة النقدية' : 'Cashflow'}</p>
               <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Wallet size={16} strokeWidth={3} />
               </div>
            </div>
            <div className="space-y-2">
               <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold text-slate-400 uppercase">{language === 'ar' ? 'الدخل' : 'Income'}</span>
                 <span className={`text-sm font-black text-emerald-600 dark:text-emerald-400 ${privacyClass}`}>+{baseCurrency} {currentMonthIncome.toLocaleString()}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold text-slate-400 uppercase">{language === 'ar' ? 'المنصرف' : 'Expense'}</span>
                 <span className={`text-sm font-black text-rose-600 dark:text-rose-400 ${privacyClass}`}>-{baseCurrency} {currentMonthExpense.toLocaleString()}</span>
               </div>
               <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                 <span className="text-[10px] font-bold text-slate-500 uppercase">{language === 'ar' ? 'الصافي' : 'Net'}</span>
                 <span className={`text-base font-black ${currentMonthIncome - currentMonthExpense >= 0 ? 'text-emerald-600' : 'text-rose-600'} ${privacyClass}`}>
                   {baseCurrency} {(currentMonthIncome - currentMonthExpense).toLocaleString()}
                 </span>
               </div>
            </div>
         </div>

         {/* Debt Position Stat */}
         <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-orange-100 dark:border-orange-900/30 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
               <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{language === 'ar' ? 'موقف الديون' : 'Debt Position'}</p>
               <div className="w-8 h-8 bg-orange-50 dark:bg-orange-900/20 text-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowDownLeft size={16} strokeWidth={3} />
               </div>
            </div>
            <div className="space-y-2">
               <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold text-slate-400 uppercase">{language === 'ar' ? 'ديون لك' : 'Owed to You'}</span>
                 <span className={`text-sm font-black text-emerald-600 dark:text-emerald-400 ${privacyClass}`}>{baseCurrency} {totalDebtsOwedToMe.toLocaleString()}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold text-slate-400 uppercase">{language === 'ar' ? 'ديون وأقساط عليك' : 'You Owe'}</span>
                 <span className={`text-sm font-black text-rose-600 dark:text-rose-400 ${privacyClass}`}>{baseCurrency} {totalDebtsIOwe.toLocaleString()}</span>
               </div>
               <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                 <span className="text-[10px] font-bold text-slate-500 uppercase">{language === 'ar' ? 'الصافي' : 'Net'}</span>
                 <span className={`text-base font-black ${totalDebtsOwedToMe - totalDebtsIOwe >= 0 ? 'text-emerald-600' : 'text-rose-600'} ${privacyClass}`}>
                   {baseCurrency} {(totalDebtsOwedToMe - totalDebtsIOwe).toLocaleString()}
                 </span>
               </div>
            </div>
         </div>

         {/* Investment Portfolio Stat */}
         <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-blue-100 dark:border-blue-900/30 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
               <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{language === 'ar' ? 'المحفظة الاستثمارية' : 'Investment Portfolio'}</p>
               <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp size={16} strokeWidth={3} />
               </div>
            </div>
            <div className="space-y-2">
               <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold text-slate-400 uppercase">{language === 'ar' ? 'رأس المال المستثمر' : 'Invested Capital'}</span>
                 <span className={`text-sm font-black text-blue-600 dark:text-blue-400 ${privacyClass}`}>{baseCurrency} {investedCapital.toLocaleString()}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold text-slate-400 uppercase">{language === 'ar' ? 'عوائد ومبيعات' : 'Returns & Sales'}</span>
                 <span className={`text-sm font-black text-emerald-600 dark:text-emerald-400 ${privacyClass}`}>{baseCurrency} {investmentReturns.toLocaleString()}</span>
               </div>
               <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                 <span className="text-[10px] font-bold text-slate-500 uppercase">{language === 'ar' ? 'الصافي' : 'Net'}</span>
                 <span className={`text-base font-black ${investmentReturns - investedCapital >= 0 ? 'text-emerald-600' : 'text-rose-600'} ${privacyClass}`}>
                   {baseCurrency} {(investmentReturns - investedCapital).toLocaleString()}
                 </span>
               </div>
            </div>
         </div>

         {/* Credit Card Summary Stat */}
         {(() => {
           const creditCards = state.creditCards || [];
           if (creditCards.length === 0) return null;

           const totalLimit = creditCards.reduce((sum, card) => sum + card.limit, 0);
           const totalUsed = creditCards.reduce((sum, card) => sum + card.balance, 0);
           const totalAvailable = totalLimit - totalUsed;
           
           // Calculate amount to be collected this month (simplified logic for now)
           // In a real app, this would be based on statement dates and minimum payments
           const amountDueThisMonth = creditCards.reduce((sum, card) => {
             // For simplicity, let's just say a portion is due, or we could just show total used
             return sum + (card.balance > 0 ? card.balance : 0);
           }, 0);

           return (
             <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-purple-100 dark:border-purple-900/30 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                   <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{language === 'ar' ? 'ملخص البطاقات الائتمانية' : 'Credit Cards Summary'}</p>
                   <div className="w-8 h-8 bg-purple-50 dark:bg-purple-900/20 text-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Wallet size={16} strokeWidth={3} />
                   </div>
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between items-center">
                     <span className="text-[10px] font-bold text-slate-400 uppercase">{language === 'ar' ? 'الرصيد المتاح' : 'Available Credit'}</span>
                     <span className={`text-sm font-black text-emerald-600 dark:text-emerald-400 ${privacyClass}`}>{baseCurrency} {totalAvailable.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-[10px] font-bold text-slate-400 uppercase">{language === 'ar' ? 'المستحق هذا الشهر' : 'Due This Month'}</span>
                     <span className={`text-sm font-black text-rose-600 dark:text-rose-400 ${privacyClass}`}>{baseCurrency} {amountDueThisMonth.toLocaleString()}</span>
                   </div>
                   <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                     <span className="text-[10px] font-bold text-slate-500 uppercase">{language === 'ar' ? 'إجمالي المستحق' : 'Total Due'}</span>
                     <span className={`text-base font-black text-rose-600 dark:text-rose-400 ${privacyClass}`}>
                       {baseCurrency} {totalUsed.toLocaleString()}
                     </span>
                   </div>
                </div>
             </div>
           );
         })()}
      </section>
      </>
      )}

      {/* 3. Group Accounts Slider/Grid */}
      {activeTab === 'accounts' && (
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">{language === 'ar' ? 'مجموعات الحسابات' : 'Group Portfolios'}</h3>
            <div className="group relative flex items-center">
              <Info size={12} className="text-slate-300 dark:text-slate-600 cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-slate-800 dark:bg-slate-700 text-white text-[10px] font-medium rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-center pointer-events-none shadow-xl">
                {language === 'ar' ? 'المجموعات تساعدك في تقسيم أموالك (مثل: حساب البنك، الكاش، المدخرات) وتحديد ميزانية لكل منها.' : 'Portfolios help you divide your money (e.g., Bank, Cash, Savings) and set budgets for each.'}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700"></div>
              </div>
            </div>
          </div>
          <button onClick={() => navigate('/installments')} className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wide hover:underline flex items-center gap-1">
            {language === 'ar' ? 'إدارة' : 'Manage'} <MoreHorizontal size={14} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accountCards.length > 0 ? accountCards.map(account => {
            const isExpanded = expandedGroupId === account.id;
            const groupClients = clients.filter(c => c.groupId === account.id);
            const clientStats = groupClients.map(client => {
              // Find transactions where this client is involved (either as primary clientId or in clientIds array)
              const clientTxs = transactions.filter(t => 
                t.groupId === account.id && 
                (t.clientId === client.id || (t.clientIds && t.clientIds.includes(client.id)))
              );
              
              const income = clientTxs.filter(t => isIncomeLike(t)).reduce((s, t) => {
                return s + getClientShare(t, client.id); // +++ أضيف بناءً على طلبك +++
              }, 0);
              
              const expense = clientTxs.filter(t => isExpenseLike(t)).reduce((s, t) => {
                return s + getClientShare(t, client.id); // +++ أضيف بناءً على طلبك +++
              }, 0);
              
              const items = clientTxs.flatMap(t => t.items || []);
              return { ...client, income, expense, items, txs: clientTxs };
            });

            return (
            <div key={account.id} className="flex flex-col gap-2">
              <div 
                onClick={() => setExpandedGroupId(isExpanded ? null : account.id)}
                className={`${account.style.bg} ${account.style.shadow} p-5 rounded-3xl text-white relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer`}
              >
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
                 <div className="relative z-10">
                   <div className="flex justify-between items-start mb-4">
                      <span className="text-2xl">{account.icon || '📁'}</span>
                      <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-md">
                        <Wallet size={14} />
                      </div>
                   </div>
                   <h4 className="text-xs font-bold uppercase tracking-wide opacity-80 mb-1">{account.name}</h4>
                   <p className={`text-xl font-black tracking-tighter ${privacyClass}`}>${account.balance.toLocaleString()}</p>
                   
                   {account.allocatedAmount > 0 && (
                     <div className="mt-2 inline-block bg-white/20 backdrop-blur-md px-2 py-1 rounded-md">
                       <p className="text-[10px] font-bold uppercase tracking-wide">
                         {language === 'ar' ? 'الرصيد المخصص:' : 'Allocated:'} ${account.allocatedAmount.toLocaleString()}
                       </p>
                     </div>
                   )}

                   {account.monthlyBudget > 0 && (
                     <div className="mt-3">
                       <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide opacity-90 mb-1">
                         <span>{Math.min((account.expense / account.monthlyBudget) * 100).toFixed(0)}% Used</span>
                         <span>${account.monthlyBudget.toLocaleString()}</span>
                       </div>
                       <div className="h-1 bg-black/20 rounded-full overflow-hidden">
                         <div 
                           className={`h-full ${account.expense > account.monthlyBudget ? 'bg-rose-400' : 'bg-white/90'}`} 
                           style={{ width: `${Math.min((account.expense / account.monthlyBudget) * 100, 100)}%` }}
                         />
                       </div>
                     </div>
                   )}

                   <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center">
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                          <ArrowUpLeft size={12} /> <span className={privacyClass}>${account.income.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-rose-300">
                          <ArrowDownLeft size={12} /> <span className={privacyClass}>${account.expense.toLocaleString()}</span>
                        </div>
                      </div>
                      <ChevronRight size={16} className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                   </div>
                 </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm animate-in slide-in-from-top-4 fade-in duration-300">
                  <div className="flex justify-between items-center mb-4">
                    <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {language === 'ar' ? 'العملاء / التفاصيل' : 'Clients / Details'}
                    </h5>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        account.isVirtual ? navigate('/assets') : navigate('/history', { state: { filterGroup: account.id } });
                      }}
                      className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                    >
                      {language === 'ar' ? 'سجل المعاملات' : 'Transaction History'} <ArrowUpRight size={12} />
                    </button>
                  </div>
                  
                  {clientStats.length > 0 ? (
                    <div className="space-y-3">
                      {clientStats.map(client => {
                        const isClientExpanded = expandedClientId === client.id;
                        return (
                        <div key={client.id} className="border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden">
                          <div 
                            onClick={() => setExpandedClientId(isClientExpanded ? null : client.id)}
                            className="p-3 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-sm shadow-sm">
                                {client.icon || '👤'}
                              </div>
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{client.name}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-bold">
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-emerald-500 flex items-center gap-1"><ArrowUpLeft size={10}/> ${client.income.toLocaleString()}</span>
                                <span className="text-rose-500 flex items-center gap-1"><ArrowDownLeft size={10}/> ${client.expense.toLocaleString()}</span>
                              </div>
                              <ChevronRight size={16} className={`text-slate-400 transition-transform ${isClientExpanded ? 'rotate-90' : ''}`} />
                            </div>
                          </div>
                          
                          {/* Expanded Client Details (Items) */}
                          {isClientExpanded && (
                            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700">
                              {client.items.length > 0 ? (
                                <div className="space-y-2">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                    {language === 'ar' ? 'المشتريات / التفاصيل' : 'Purchases / Details'}
                                  </p>
                                  {client.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                      <span className="font-medium text-slate-700 dark:text-slate-300">{item.name} <span className="text-slate-400 ml-1">x{item.quantity}</span></span>
                                      <span className="font-bold text-slate-900 dark:text-white">${(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-500 text-center py-2">
                                  {language === 'ar' ? 'لا توجد تفاصيل مشتريات' : 'No purchase details'}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )})}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-4">
                      {language === 'ar' ? 'لا يوجد عملاء في هذه المجموعة' : 'No clients in this group'}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}) : (
            <div className="col-span-full bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-8 flex flex-col items-center justify-center text-center group hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => navigate('/installments')}>
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Wallet size={32} />
              </div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide mb-2">
                {language === 'ar' ? 'لا توجد مجموعات حسابات' : 'No Portfolios Yet'}
              </h4>
              <p className="text-xs text-slate-500 font-medium max-w-xs mb-6">
                {language === 'ar' ? 'قم بإنشاء مجموعة حسابات (مثل: المحفظة، البنك، مدخرات) لتنظيم أموالك.' : 'Create a portfolio (e.g., Wallet, Bank, Savings) to organize your money.'}
              </p>
              <button className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform">
                {language === 'ar' ? 'إنشاء مجموعة' : 'Create Portfolio'}
              </button>
            </div>
          )}
        </div>
      </section>
      )}

      {/* 4. Recent & Upcoming Section */}
      {activeTab === 'overview' && (
      <>
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Transactions */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">{language === 'ar' ? 'أحدث المعاملات' : 'Recent Transactions'}</h3>
            <button onClick={() => navigate('/history')} className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-1">
              {language === 'ar' ? 'عرض الكل' : 'View All'} <ArrowRight size={12} className={language === 'ar' ? 'rotate-180' : ''} />
            </button>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {recentTransactions.length > 0 ? recentTransactions.map(t => {
              const group = groups.find(g => g.id === t.groupId);
              const primaryClient = clients.find(c => c.id === (t.clientIds && t.clientIds.length > 0 ? t.clientIds[0] : t.clientId));
              const clientNameDisplay = t.clientIds && t.clientIds.length > 1 
                ? `${primaryClient?.name} +${t.clientIds.length - 1}` 
                : primaryClient?.name;
              const isIncome = isIncomeLike(t);
              const isCredit = t.paymentMethod === 'credit';
              return (
                <div key={t.id} className={`flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer relative overflow-hidden ${group?.color ? group.color.replace('bg-', 'border-l-4 border-l-') : ''}`} onClick={() => navigate('/history')}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isIncome ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : isCredit ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30'}`}>
                      {group?.icon || '💰'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{clientNameDisplay || t.note || 'Transaction'}</p>
                      <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                        <span>{t.date}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span>{group?.name}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className={`text-sm font-black ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : isCredit ? 'text-purple-600 dark:text-purple-400' : 'text-rose-600 dark:text-rose-400'} ${privacyClass}`}>
                      {isIncome ? '+' : '-'}{baseCurrency} {t.amount.toLocaleString()}
                    </p>
                    {t.referenceTotal && (
                      <span className="text-[10px] text-slate-400 font-bold mt-0.5">
                        {language === 'ar' ? 'من أصل' : 'out of'} {baseCurrency} {t.referenceTotal.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            }) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-3">
                  <ArrowRight size={20} />
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-1">
                  {language === 'ar' ? 'لا توجد معاملات بعد' : 'No transactions yet'}
                </p>
                <p className="text-[10px] text-slate-500 font-medium mb-4">
                  {language === 'ar' ? 'أضف أول دخل أو مصروف لك.' : 'Add your first income or expense.'}
                </p>
                <button onClick={() => navigate('/add')} className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                  {language === 'ar' ? 'إضافة معاملة' : 'Add Transaction'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Installments */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">{language === 'ar' ? 'الالتزامات القادمة' : 'Upcoming Bills'}</h3>
            <button onClick={() => navigate('/installments')} className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-1">
              {language === 'ar' ? 'إدارة' : 'Manage'} <ArrowRight size={12} className={language === 'ar' ? 'rotate-180' : ''} />
            </button>
          </div>
          <div className="space-y-3">
            {upcomingInstallments.length > 0 ? upcomingInstallments.map(inst => {
              const progress = (inst.paidCount / inst.installmentCount) * 100;
              return (
                <div key={inst.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-amber-500" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{inst.title || 'Installment'}</span>
                    </div>
                    <span className={`text-xs font-black text-slate-900 dark:text-white ${privacyClass}`}>${(inst.monthlyAmount || 0).toLocaleString()}/mo</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-widest">
                    <span>{inst.paidCount || 0} of {inst.installmentCount || 1} Paid</span>
                    <span>{(progress || 0).toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              );
            }) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center text-amber-500 mb-3">
                  <Clock size={20} />
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-1">
                  {language === 'ar' ? 'لا توجد التزامات قادمة' : 'No upcoming bills'}
                </p>
                <p className="text-[10px] text-slate-500 font-medium mb-4">
                  {language === 'ar' ? 'أضف أقساطك أو ديونك لتتبعها هنا.' : 'Add your installments or debts to track them here.'}
                </p>
                <button onClick={() => navigate('/installments')} className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors">
                  {language === 'ar' ? 'إضافة التزام' : 'Add Liability'}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Saving Goals Section */}
      <section className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">{language === 'ar' ? 'أهداف الادخار' : 'Saving Goals'}</h3>
          <button onClick={() => navigate('/goals')} className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-1">
            {language === 'ar' ? 'إدارة' : 'Manage'} <ArrowRight size={12} className={language === 'ar' ? 'rotate-180' : ''} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.slice(0, 3).map(goal => {
            const progress = Math.min(((goal.currentAmount || 0) / (goal.targetAmount || 1)) * 100, 100);
            return (
              <div key={goal.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors" onClick={() => navigate('/goals')}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${goal.color} bg-opacity-10 dark:bg-opacity-20`}>
                    {goal.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{goal.title || 'Goal'}</h4>
                    <p className={`text-[10px] font-bold text-slate-500 ${privacyClass}`}>
                      {baseCurrency} {(goal.currentAmount || 0).toLocaleString()} / {(goal.targetAmount || 1).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full ${goal.color} rounded-full`} style={{ width: `${progress}%` }} />
                </div>
              </div>
            );
          })}
          {goals.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-6 text-center">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-500 mb-3">
                <Target size={20} />
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-1">
                {language === 'ar' ? 'لا توجد أهداف' : 'No Goals'}
              </p>
              <button onClick={() => navigate('/goals')} className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline">
                {language === 'ar' ? 'إضافة هدف' : 'Add Goal'}
              </button>
            </div>
          )}
        </div>
      </section>
      </>
      )}

      {/* 5. Mini Insights Section */}
      {activeTab === 'insights' && (
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-[4px] text-slate-400 mb-4">{language === 'ar' ? 'توزيع المصاريف' : 'Spending Mix'}</h3>
          {topExpenseCategory ? (
            <div className="flex items-center gap-8">
               <div className="w-32 h-32">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={expenseBreakdown} cx="50%" cy="50%" innerRadius={35} outerRadius={45} paddingAngle={5} dataKey="value">
                       {expenseBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                     </Pie>
                     <Tooltip />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
               <div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mb-1">{topExpenseCategory.name}</p>
                  <p className="text-[10px] font-black uppercase text-rose-500 tracking-widest mb-3">{language === 'ar' ? 'أعلى فئة صرف' : 'Top Category'}</p>
                  <button onClick={() => navigate('/analytics')} className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-1 hover:underline">
                    {language === 'ar' ? 'التفاصيل' : 'Analytics'} <ChevronRight size={12} className={language === 'ar' ? 'rotate-180' : ''} />
                  </button>
               </div>
            </div>
          ) : (
            <div className="h-32 flex flex-col items-center justify-center text-center">
               <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 mb-2">
                 <PieIcon size={20} />
               </div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{language === 'ar' ? 'لا توجد بيانات كافية' : 'Not enough data'}</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
           <h3 className="text-[10px] font-black uppercase tracking-[4px] text-slate-400 mb-4">{language === 'ar' ? 'التدفق المالي' : 'Financial Velocity'}</h3>
           <div className="h-32 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={trendData}>
                 <defs>
                   <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
           <p className="text-[9px] font-bold text-slate-400 text-center mt-4 uppercase tracking-widest">{language === 'ar' ? 'محاكاة آخر 30 يوم' : 'Last 30 Days Volatility'}</p>
        </div>
      </section>
      )}

      <TransferModal 
        isOpen={isTransferModalOpen} 
        onClose={() => setIsTransferModalOpen(false)} 
      />
    </div>
  );
};

export default Dashboard;
