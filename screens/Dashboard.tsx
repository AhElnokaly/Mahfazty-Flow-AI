

import React, { useMemo } from 'react';
import { useApp } from '../store';
import { 
  Plus, MoreHorizontal, ArrowUpRight, Sparkles, Zap, ShieldCheck,
  ArrowDownLeft, ArrowUpLeft, Wallet, ArrowDownRight, TrendingUp, TrendingDown,
  Target, ChevronRight, PieChart as PieIcon, Calendar, Clock, ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Tooltip 
} from 'recharts';
import { TransactionType } from '../types';
import { useNavigate } from 'react-router-dom';

// Dashboard component for financial overview
const Dashboard: React.FC = () => {
  const { state } = useApp();
  const navigate = useNavigate();
  const { language, walletBalance, transactions, groups, installments, isPro, baseCurrency, isPrivacyMode } = state;

  // --- Calculations ---
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthStr = lastMonthDate.toISOString().slice(0, 7);

  const currentMonthIncome = transactions
    .filter(t => t.type === TransactionType.INCOME && t.date.startsWith(currentMonthStr))
    .reduce((s, t) => s + t.amount, 0);
  const lastMonthIncome = transactions
    .filter(t => t.type === TransactionType.INCOME && t.date.startsWith(lastMonthStr))
    .reduce((s, t) => s + t.amount, 0);
  const incomeChange = lastMonthIncome === 0 ? 0 : ((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100;

  const currentMonthExpense = transactions
    .filter(t => t.type === TransactionType.EXPENSE && t.date.startsWith(currentMonthStr))
    .reduce((s, t) => s + t.amount, 0);
  const lastMonthExpense = transactions
    .filter(t => t.type === TransactionType.EXPENSE && t.date.startsWith(lastMonthStr))
    .reduce((s, t) => s + t.amount, 0);
  const expenseChange = lastMonthExpense === 0 ? 0 : ((currentMonthExpense - lastMonthExpense) / lastMonthExpense) * 100;

  const totalExpenses = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((s, t) => s + t.amount, 0);

  const totalIncome = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((s, t) => s + t.amount, 0);

  const savingsRate = currentMonthIncome > 0 ? ((currentMonthIncome - currentMonthExpense) / currentMonthIncome) * 100 : 0;

  const recentTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
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
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + t.amount, 0);
        
      const expense = groupTransactions
        .filter(t => t.type === TransactionType.EXPENSE)
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
        style: cardStyles[index % cardStyles.length]
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
        .filter(t => t.date === dayStr)
        .reduce((s, t) => t.type === TransactionType.INCOME ? s + t.amount : s - t.amount, 0);
      data.push({ name: i, value: Math.abs(dailyNet + (Math.random() * 50)) });
    }
    return data;
  }, [transactions]);

  // Privacy Blur Helper
  const privacyClass = isPrivacyMode ? 'blur-sm select-none' : '';

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20 px-2 max-w-5xl mx-auto">
      
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
                <h3 className="text-sm font-bold uppercase tracking-wide">{language === 'ar' ? 'فحص مالي ذكي' : 'AI Financial Audit'}</h3>
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

        <button 
          onClick={() => navigate('/history')}
          className="md:w-32 bg-emerald-500 hover:bg-emerald-600 text-white rounded-3xl p-5 md:p-6 flex flex-col items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
        >
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Plus size={24} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wide text-center">
            {language === 'ar' ? 'إضافة' : 'Quick Add'}
          </span>
        </button>
      </section>

      {/* 2. Global Stats Bar (Dedicated Income/Expense Cards) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
         {/* Income Stat */}
         <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
               <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{language === 'ar' ? 'دخل الشهر' : 'Month Income'}</p>
               <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp size={16} strokeWidth={3} />
               </div>
            </div>
            <div>
               <p className={`text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter ${privacyClass}`}>
                 ${currentMonthIncome.toLocaleString()}
               </p>
               <p className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${incomeChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                 {incomeChange >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                 {Math.abs(incomeChange).toFixed(1)}% {language === 'ar' ? 'عن الشهر الماضي' : 'vs last month'}
               </p>
            </div>
         </div>

         {/* Expense Stat */}
         <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-rose-100 dark:border-rose-900/30 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
               <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{language === 'ar' ? 'مصاريف الشهر' : 'Month Expenses'}</p>
               <div className="w-8 h-8 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingDown size={16} strokeWidth={3} />
               </div>
            </div>
            <div>
               <p className={`text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tighter ${privacyClass}`}>
                 ${currentMonthExpense.toLocaleString()}
               </p>
               <p className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${expenseChange <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                 {expenseChange <= 0 ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
                 {Math.abs(expenseChange).toFixed(1)}% {language === 'ar' ? 'عن الشهر الماضي' : 'vs last month'}
               </p>
            </div>
         </div>

         {/* Savings Stat */}
         <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-blue-100 dark:border-blue-900/30 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
               <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{language === 'ar' ? 'معدل الادخار' : 'Savings Rate'}</p>
               <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Target size={16} strokeWidth={3} />
               </div>
            </div>
            <div>
               <p className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">
                 {savingsRate.toFixed(1)}%
               </p>
               <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(Math.max(savingsRate, 0), 100)}%` }} />
               </div>
            </div>
         </div>
      </section>

      {/* 3. Group Accounts Slider/Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">{language === 'ar' ? 'مجموعات الحسابات' : 'Group Portfolios'}</h3>
          <button onClick={() => navigate('/groups')} className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wide hover:underline flex items-center gap-1">
            {language === 'ar' ? 'إدارة' : 'Manage'} <MoreHorizontal size={14} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accountCards.map(account => (
            <div key={account.id} className={`${account.style.bg} ${account.style.shadow} p-5 rounded-3xl text-white relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer`}>
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

                 <div className="mt-3 pt-3 border-t border-white/10 flex justify-between">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                      <ArrowUpLeft size={12} /> <span className={privacyClass}>${account.income.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-rose-300">
                      <ArrowDownLeft size={12} /> <span className={privacyClass}>${account.expense.toLocaleString()}</span>
                    </div>
                 </div>
               </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Recent & Upcoming Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Transactions */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">{language === 'ar' ? 'أحدث المعاملات' : 'Recent Transactions'}</h3>
            <button onClick={() => navigate('/history')} className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-1">
              {language === 'ar' ? 'عرض الكل' : 'View All'} <ArrowRight size={12} className={language === 'ar' ? 'rotate-180' : ''} />
            </button>
          </div>
          <div className="space-y-3">
            {recentTransactions.length > 0 ? recentTransactions.map(t => {
              const group = groups.find(g => g.id === t.groupId);
              const isIncome = t.type === TransactionType.INCOME;
              return (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer" onClick={() => navigate('/history')}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isIncome ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30'}`}>
                      {group?.icon || '💰'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{t.title}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{t.date}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-black ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} ${privacyClass}`}>
                    {isIncome ? '+' : '-'}${t.amount.toLocaleString()}
                  </p>
                </div>
              );
            }) : (
              <div className="text-center py-6 text-slate-400 text-xs font-medium">
                {language === 'ar' ? 'لا توجد معاملات بعد' : 'No transactions yet'}
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
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{inst.name}</span>
                    </div>
                    <span className={`text-xs font-black text-slate-900 dark:text-white ${privacyClass}`}>${inst.monthlyAmount.toLocaleString()}/mo</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-widest">
                    <span>{inst.paidCount} of {inst.installmentCount} Paid</span>
                    <span>{progress.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-6 text-slate-400 text-xs font-medium">
                {language === 'ar' ? 'لا توجد التزامات قادمة' : 'No upcoming bills'}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. Mini Insights Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-[4px] text-slate-400 mb-4">{language === 'ar' ? 'توزيع المصاريف' : 'Spending Mix'}</h3>
          {topExpenseCategory ? (
            <div className="flex items-center gap-8">
               <div className="w-32 h-32">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={expenseBreakdown} cx="50%" cy="50%" innerRadius={35} outerRadius={45} paddingAngle={5} dataKey="value">
                       {expenseBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} cornerRadius={4} />)}
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
            <div className="h-32 flex flex-col items-center justify-center text-slate-300">
               <PieIcon size={40} className="mb-2 opacity-20" />
               <p className="text-[10px] font-black uppercase">{language === 'ar' ? 'لا توجد بيانات' : 'No Data'}</p>
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

    </div>
  );
};

export default Dashboard;
