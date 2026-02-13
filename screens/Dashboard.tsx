
import React, { useMemo } from 'react';
import { useApp } from '../store';
import { 
  Plus, MoreHorizontal, ArrowUpRight, Sparkles, Zap, ShieldCheck,
  ArrowDownLeft, ArrowUpLeft, Wallet, ArrowDownRight, TrendingUp, TrendingDown,
  Target, ChevronRight, PieChart as PieIcon
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
  const { language, walletBalance, transactions, groups, isPro, baseCurrency } = state;

  // --- Calculations ---
  const totalExpenses = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((s, t) => s + t.amount, 0);

  const totalIncome = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((s, t) => s + t.amount, 0);

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

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

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* 1. AI Quick Audit Card */}
      <section>
        <div 
          onClick={() => navigate('/ai')}
          className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 rounded-[32px] p-8 md:p-10 text-white shadow-xl shadow-blue-500/20 cursor-pointer group transition-all hover:scale-[1.01]"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Sparkles size={20} className="text-amber-300 animate-pulse" />
                </div>
                <h3 className="text-lg md:text-xl font-black uppercase tracking-widest">{language === 'ar' ? 'فحص مالي ذكي' : 'AI Financial Audit'}</h3>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/20 ${isPro ? 'bg-amber-400 text-amber-950' : 'bg-white/10 text-white/60'}`}>
                {isPro ? <Zap size={12} fill="currentColor" /> : <ShieldCheck size={12} />}
                <span className="text-[9px] font-black uppercase tracking-widest">
                  {isPro ? 'Pro Powered' : 'Standard'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-xs md:text-sm font-bold text-blue-100/80 leading-relaxed max-w-[400px]">
                {isPro 
                  ? (language === 'ar' ? 'تم تفعيل Gemini Pro لتحليل عميق لتوجهات السوق والأسعار الحقيقية.' : 'Gemini Pro active: Deep analysis of market trends and real-time prices.')
                  : (language === 'ar' ? 'احصل على تحليل فوري لنفقاتك وتوصيات لتحسين ادخارك.' : 'Get instant analysis of your spending and tips to boost savings.')}
              </p>
              <ArrowUpRight size={28} className="group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Global Stats Bar (Dedicated Income/Expense Cards) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
         {/* Income Stat */}
         <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-emerald-100 dark:border-emerald-900/30 shadow-sm flex items-center justify-between group hover:shadow-lg transition-all">
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{language === 'ar' ? 'إجمالي الدخل' : 'Total Income'}</p>
               <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">
                 ${totalIncome.toLocaleString()}
               </p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
               <TrendingUp size={24} strokeWidth={3} />
            </div>
         </div>

         {/* Expense Stat */}
         <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-rose-100 dark:border-rose-900/30 shadow-sm flex items-center justify-between group hover:shadow-lg transition-all">
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{language === 'ar' ? 'إجمالي المصاريف' : 'Total Expenses'}</p>
               <p className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tighter">
                 ${totalExpenses.toLocaleString()}
               </p>
            </div>
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
               <TrendingDown size={24} strokeWidth={3} />
            </div>
         </div>

         {/* Savings Stat */}
         <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-blue-100 dark:border-blue-900/30 shadow-sm flex items-center justify-between group hover:shadow-lg transition-all">
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{language === 'ar' ? 'معدل الادخار' : 'Savings Rate'}</p>
               <p className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">
                 {savingsRate.toFixed(1)}%
               </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
               <Target size={24} strokeWidth={3} />
            </div>
         </div>
      </section>

      {/* 3. Group Accounts Slider/Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">{language === 'ar' ? 'مجموعات الحسابات' : 'Group Portfolios'}</h3>
          <button onClick={() => navigate('/groups')} className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-1">
            {language === 'ar' ? 'إدارة' : 'Manage'} <MoreHorizontal size={14} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accountCards.map(account => (
            <div key={account.id} className={`${account.style.bg} ${account.style.shadow} p-6 rounded-[32px] text-white relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer`}>
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
               <div className="relative z-10">
                 <div className="flex justify-between items-start mb-6">
                    <span className="text-3xl">{account.icon || '📁'}</span>
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                      <Wallet size={16} />
                    </div>
                 </div>
                 <h4 className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">{account.name}</h4>
                 <p className="text-2xl font-black tracking-tighter">${account.balance.toLocaleString()}</p>
                 
                 <div className="mt-6 pt-4 border-t border-white/10 flex justify-between">
                    <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-300">
                      <ArrowUpLeft size={10} /> ${account.income.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-rose-300">
                      <ArrowDownLeft size={10} /> ${account.expense.toLocaleString()}
                    </div>
                 </div>
               </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Mini Insights Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-[4px] text-slate-400 mb-6">{language === 'ar' ? 'توزيع المصاريف' : 'Spending Mix'}</h3>
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

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
           <h3 className="text-[10px] font-black uppercase tracking-[4px] text-slate-400 mb-6">{language === 'ar' ? 'التدفق المالي' : 'Financial Velocity'}</h3>
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
