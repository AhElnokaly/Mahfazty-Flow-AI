import React, { useState, useMemo } from 'react';
import { useApp } from '../store';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, CartesianGrid,
  PieChart as RePieChart, Pie, Cell, AreaChart, Area, BarChart, LabelList
} from 'recharts';
import { 
  Activity, Target, PieChart, ArrowUpRight, ArrowDownRight, Zap, Star,
  Trash2, Plus, X, BarChart3, TrendingUp, Users, BrainCircuit, Sparkles,
  Filter, Calendar, ChevronDown
} from 'lucide-react';
import { TransactionType, CustomWidget, Transaction } from '../types';

// --- Widget Definitions ---
const WIDGET_LIBRARY = [
  {
    id: 'cash_flow',
    icon: Activity,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    titleEn: 'Cash Flow Evolution',
    titleAr: 'تطور التدفق النقدي',
    descEn: 'Income vs Expense vs Net over time.',
    descAr: 'مقارنة الدخل والمصاريف وصافي الربح.',
    pro: false
  },
  {
    id: 'lifestyle_radar',
    icon: PieChart,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    titleEn: 'Lifestyle Radar',
    titleAr: 'رادار نمط الحياة',
    descEn: 'Focus area of your spending by group.',
    descAr: 'توزيع اهتمامات الإنفاق حسب المجموعات.',
    pro: false
  },
  {
    id: 'expense_distribution',
    icon: PieChart,
    color: 'text-rose-500',
    bgColor: 'bg-rose-50 dark:bg-rose-900/20',
    titleEn: 'Expense Distribution',
    titleAr: 'توزيع المصاريف',
    descEn: 'Breakdown of expenses with detailed %.',
    descAr: 'تحليل دقيق لنسب المصاريف.',
    pro: false
  },
  {
    id: 'top_clients',
    icon: Users,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    titleEn: 'Top Entities',
    titleAr: 'أعلى الجهات تعاملاً',
    descEn: 'Where most of your money goes (Top 5).',
    descAr: 'أكثر 5 جهات يتم الإنفاق عليها.',
    pro: true
  },
  {
    id: 'balance_trend',
    icon: TrendingUp,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    titleEn: '30-Day Balance Trend',
    titleAr: 'تطور الرصيد (30 يوم)',
    descEn: 'Daily cumulative balance simulation.',
    descAr: 'محاكاة لتطور الرصيد اليومي.',
    pro: true
  }
];

// --- Custom Components ---

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xl z-50">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label}</p>
        {payload.map((p: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs font-bold mb-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }}></span>
            <span className="text-slate-700 dark:text-slate-200">{p.name}:</span>
            <span className="font-black text-slate-900 dark:text-white">
              {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, fill }: any) => {
  const radius = outerRadius * 1.4; // Push label further out
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const sin = Math.sin(-midAngle * RADIAN);
  const cos = Math.cos(-midAngle * RADIAN);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = x > cx ? 'start' : 'end';

  if (percent < 0.05) return null; // Don't show labels for tiny slices

  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" strokeWidth={2} opacity={0.6} />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={-6} textAnchor={textAnchor} fill={fill} className="text-[10px] font-black" fontWeight="bold">
        {name}
      </text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={10} textAnchor={textAnchor} fill="#94a3b8" fontSize={10} fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
  );
};

// --- Single Chart Widget Component (With Internal Filtering) ---
const ChartWidget: React.FC<{ 
  widgetId: string, 
  globalState: any, 
  dispatch: any 
}> = ({ 
  widgetId, 
  globalState, 
  dispatch 
}) => {
  const { language, transactions, groups, clients, isPro, customWidgets } = globalState;
  
  // Local Filtering State
  const [timeRange, setTimeRange] = useState<'1W' | '1M' | '1Y' | 'ALL'>('1M');
  const [filterEntity, setFilterEntity] = useState<string>('all');

  // 1. Filter Transactions based on local state
  const filteredTransactions = useMemo(() => {
    let txs = [...transactions];

    // Date Filter
    const now = new Date();
    if (timeRange !== 'ALL') {
      const cutoff = new Date();
      if (timeRange === '1W') cutoff.setDate(now.getDate() - 7);
      if (timeRange === '1M') cutoff.setDate(now.getDate() - 30);
      if (timeRange === '1Y') cutoff.setDate(now.getDate() - 365);
      txs = txs.filter(t => new Date(t.date) >= cutoff);
    }

    // Entity Filter
    if (filterEntity !== 'all') {
      // Check if it's a group ID
      const isGroup = groups.some((g: any) => g.id === filterEntity);
      if (isGroup) {
        txs = txs.filter(t => t.groupId === filterEntity);
      } else {
        // Assume Client ID
        txs = txs.filter(t => t.clientId === filterEntity);
      }
    }

    return txs;
  }, [transactions, timeRange, filterEntity, groups]);

  // 2. Identify Configuration
  const standardConfig = WIDGET_LIBRARY.find(w => w.id === widgetId);
  const customConfig = customWidgets.find((w: CustomWidget) => w.id === widgetId);
  
  const config = standardConfig || (customConfig ? {
    id: customConfig.id,
    icon: BrainCircuit,
    color: `text-${customConfig.colorTheme}-500`,
    bgColor: `bg-${customConfig.colorTheme}-50 dark:bg-${customConfig.colorTheme}-900/20`,
    titleEn: customConfig.title,
    titleAr: customConfig.title,
    descEn: customConfig.description,
    descAr: customConfig.description,
    pro: false
  } : null);

  if (!config) return null;
  const Icon = config.icon;

  // 3. Prepare Chart Data based on Filtered Transactions
  const chartData = useMemo(() => {
    // --- Custom Widget Logic ---
    if (customConfig) {
      const dataMap: Record<string, number> = {};
      filteredTransactions.forEach((t: Transaction) => {
        if (customConfig.dataSource === 'income' && t.type !== TransactionType.INCOME) return;
        if (customConfig.dataSource === 'expense' && t.type !== TransactionType.EXPENSE) return;

        let key = '';
        if (customConfig.groupBy === 'group') key = groups.find((g: any) => g.id === t.groupId)?.name || 'Unknown';
        else if (customConfig.groupBy === 'client') key = clients.find((c: any) => c.id === t.clientId)?.name || 'Unknown';
        else if (customConfig.groupBy === 'date') key = new Date(t.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });

        const val = (customConfig.dataSource === 'net' && t.type === TransactionType.EXPENSE) ? -t.amount : t.amount;
        dataMap[key] = (dataMap[key] || 0) + val;
      });
      return Object.entries(dataMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
    }

    // --- Standard Widget Logic ---
    switch (widgetId) {
      case 'cash_flow': {
        const dataMap: Record<string, { name: string, income: number, expense: number, net: number, dateObj: Date }> = {};
        filteredTransactions.forEach((t: Transaction) => {
          const tDate = new Date(t.date);
          // Group by Day if range is Week/Month, else Group by Month
          const isShortTerm = timeRange === '1W' || timeRange === '1M';
          const key = tDate.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', isShortTerm ? { month: 'short', day: 'numeric' } : { month: 'short', year: '2-digit' });
          
          if (!dataMap[key]) dataMap[key] = { name: key, income: 0, expense: 0, net: 0, dateObj: tDate };
          if (t.type === TransactionType.INCOME) {
            dataMap[key].income += t.amount;
            dataMap[key].net += t.amount;
          } else {
            dataMap[key].expense += t.amount;
            dataMap[key].net -= t.amount;
          }
        });
        return Object.values(dataMap).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
      }
      case 'lifestyle_radar': {
        const spendingByGroup = groups.map((g: any) => {
          const value = filteredTransactions
            .filter((t: Transaction) => t.groupId === g.id && t.type === TransactionType.EXPENSE)
            .reduce((s: number, t: Transaction) => s + t.amount, 0);
          return { subject: g.name, A: value, fullMark: 100 };
        });
        const maxVal = Math.max(...spendingByGroup.map((i: any) => i.A)) || 100;
        return spendingByGroup.map((i: any) => ({ ...i, fullMark: maxVal * 1.2 })).sort((a: any, b: any) => b.A - a.A).slice(0, 5);
      }
      case 'expense_distribution': {
        const data = groups.map((g: any) => ({
          name: g.name,
          value: filteredTransactions
            .filter((t: Transaction) => t.groupId === g.id && t.type === TransactionType.EXPENSE)
            .reduce((s: number, t: Transaction) => s + t.amount, 0)
        })).filter((d: any) => d.value > 0).sort((a: any, b: any) => b.value - a.value);
        const COLORS = ['#F43F5E', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#64748B'];
        return data.map((d: any, i: number) => ({ ...d, fill: COLORS[i % COLORS.length] }));
      }
      case 'top_clients': {
        return clients.map((c: any) => ({
          name: c.name,
          amount: filteredTransactions
            .filter((t: Transaction) => t.clientId === c.id && t.type === TransactionType.EXPENSE)
            .reduce((s: number, t: Transaction) => s + t.amount, 0)
        })).filter((d: any) => d.amount > 0).sort((a: any, b: any) => b.amount - a.amount).slice(0, 5);
      }
      case 'balance_trend': {
        // Trend is tricky with filters. We simulate a trend based on filtered set.
        const data: any[] = [];
        let runningBalance = 0; 
        const dailyNetMap: Record<string, number> = {};
        
        filteredTransactions.forEach((t: Transaction) => {
           dailyNetMap[t.date] = (dailyNetMap[t.date] || 0) + (t.type === TransactionType.INCOME ? t.amount : -t.amount);
           runningBalance += (t.type === TransactionType.INCOME ? t.amount : -t.amount); // Simple accumulation for visual
        });
        
        // Generate trend points
        const sortedDates = Object.keys(dailyNetMap).sort();
        if(sortedDates.length === 0) return [];
        
        let acc = 0;
        sortedDates.forEach(date => {
            acc += dailyNetMap[date];
            data.push({ date: new Date(date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {month:'short', day:'numeric'}), value: acc });
        });
        return data;
      }
      default:
        return [];
    }
  }, [filteredTransactions, widgetId, groups, clients, language, timeRange]);

  const totalFilteredExpense = useMemo(() => {
     return filteredTransactions.filter((t: Transaction) => t.type === TransactionType.EXPENSE).reduce((s: number, t: Transaction) => s + t.amount, 0);
  }, [filteredTransactions]);

  const getThemeColor = (theme?: string) => {
    switch (theme) {
      case 'emerald': return '#10B981';
      case 'rose': return '#F43F5E';
      case 'amber': return '#F59E0B';
      case 'purple': return '#8B5CF6';
      default: return '#3B82F6';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 relative group animate-in zoom-in-95 duration-300">
       <button 
         onClick={() => dispatch.removeAnalyticsWidget(widgetId)}
         className="absolute top-4 right-4 p-2 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-rose-500 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
       >
         <Trash2 size={16} />
       </button>

       {/* Header with Filters */}
       <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${config.bgColor} rounded-xl flex items-center justify-center ${config.color}`}>
                    <Icon size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        {language === 'ar' ? config.titleAr : config.titleEn}
                    </h3>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">{language === 'ar' ? config.descAr : config.descEn}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                 {config.pro && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-400/10 text-amber-600 rounded-full border border-amber-400/20">
                      <Zap size={10} fill="currentColor" />
                      <span className="text-[8px] font-black uppercase tracking-widest">Pro</span>
                    </div>
                  )}
                  {customConfig && (
                     <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-400/10 text-purple-600 rounded-full border border-purple-400/20">
                     <Sparkles size={10} fill="currentColor" />
                     <span className="text-[8px] font-black uppercase tracking-widest">AI</span>
                   </div>
                  )}
              </div>
          </div>

          {/* Filters Toolbar */}
          <div className="flex flex-wrap gap-2 items-center">
             {/* Time Range */}
             <div className="flex p-1 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                {['1W', '1M', '1Y', 'ALL'].map((r) => (
                  <button 
                    key={r} 
                    onClick={() => setTimeRange(r as any)}
                    className={`px-3 py-1 rounded-lg text-[9px] font-black transition-all ${timeRange === r ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {r}
                  </button>
                ))}
             </div>

             {/* Entity Filter */}
             <div className="relative">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Filter size={10} />
                </div>
                <select 
                   value={filterEntity}
                   onChange={(e) => setFilterEntity(e.target.value)}
                   className="pl-7 pr-8 py-1.5 bg-slate-50 dark:bg-slate-900/50 border-none rounded-xl text-[9px] font-bold text-slate-600 dark:text-slate-300 outline-none appearance-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-full max-w-[120px]"
                >
                   <option value="all">{language === 'ar' ? 'الكل' : 'All Entities'}</option>
                   <optgroup label={language === 'ar' ? 'المجموعات' : 'Groups'}>
                     {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                   </optgroup>
                   <optgroup label={language === 'ar' ? 'العملاء' : 'Clients'}>
                     {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </optgroup>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <ChevronDown size={10} />
                </div>
             </div>
          </div>
       </div>
       
       <div className="h-[280px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
             {(() => {
               // Render based on widget type or custom config
               
               // --- Cash Flow ---
               if (widgetId === 'cash_flow') {
                  return (
                    <ComposedChart data={chartData} barGap={4}>
                      <defs>
                        <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="0%" stopColor="#10B981" stopOpacity={0.8}/>
                           <stop offset="100%" stopColor="#10B981" stopOpacity={0.4}/>
                        </linearGradient>
                        <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.8}/>
                           <stop offset="100%" stopColor="#F43F5E" stopOpacity={0.4}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#f1f5f9" vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 'bold'}} dy={10} />
                      <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                      <Bar dataKey="income" name={language === 'ar' ? 'دخل' : 'Income'} barSize={timeRange === '1Y' ? 12 : 20} fill="url(#incomeGrad)" radius={[6, 6, 6, 6]} />
                      <Bar dataKey="expense" name={language === 'ar' ? 'مصروف' : 'Expense'} barSize={timeRange === '1Y' ? 12 : 20} fill="url(#expenseGrad)" radius={[6, 6, 6, 6]} />
                      <Line type="monotone" dataKey="net" name={language === 'ar' ? 'الصافي' : 'Net'} stroke="#3B82F6" strokeWidth={3} dot={false} />
                    </ComposedChart>
                  );
               }

               // --- Radar ---
               if (widgetId === 'lifestyle_radar') {
                  return (
                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={chartData}>
                      <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                      <Radar name="Spending" dataKey="A" stroke="#8B5CF6" strokeWidth={3} fill="#8B5CF6" fillOpacity={0.3} />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  );
               }

               // --- Expense Distribution ---
               if (widgetId === 'expense_distribution') {
                  return (
                    <>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                        <span className="text-xl font-black text-slate-800 dark:text-white">{totalFilteredExpense.toLocaleString()}</span>
                      </div>
                      <RePieChart>
                        <Pie 
                          data={chartData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value" labelLine={true} label={renderCustomizedLabel}
                        >
                          {chartData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} cornerRadius={6} />)}
                        </Pie>
                      </RePieChart>
                    </>
                  );
               }

               // --- Top Clients ---
               if (widgetId === 'top_clients') {
                  return (
                    <BarChart layout="vertical" data={chartData} margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                       <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#10B981" />
                            <stop offset="100%" stopColor="#34D399" />
                          </linearGradient>
                       </defs>
                       <CartesianGrid stroke="#f1f5f9" horizontal={true} vertical={false} />
                       <XAxis type="number" hide />
                       <YAxis type="category" dataKey="name" width={80} tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                       <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                       <Bar dataKey="amount" barSize={24} radius={[0, 12, 12, 0]} fill="url(#barGradient)">
                          <LabelList dataKey="amount" position="right" formatter={(val: number) => val.toLocaleString()} style={{ fontSize: '10px', fontWeight: '900', fill: '#64748b' }} />
                       </Bar>
                    </BarChart>
                  );
               }

               // --- Trend ---
               if (widgetId === 'balance_trend') {
                  return (
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#f1f5f9" vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="date" hide />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={4} fill="url(#trendGrad)" />
                    </AreaChart>
                  );
               }

               // --- CUSTOM WIDGETS ---
               if (customConfig) {
                 const color = getThemeColor(customConfig.colorTheme);
                 if (customConfig.chartType === 'bar') {
                   return (
                    <BarChart data={chartData}>
                      <CartesianGrid stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 'bold'}} />
                      <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                      <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
                    </BarChart>
                   );
                 } else if (customConfig.chartType === 'line') {
                   return (
                    <ComposedChart data={chartData}>
                      <CartesianGrid stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 'bold'}} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={{r: 4, strokeWidth: 2, stroke: '#fff'}} />
                    </ComposedChart>
                   );
                 } else if (customConfig.chartType === 'area') {
                   return (
                      <AreaChart data={chartData}>
                        <CartesianGrid stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 'bold'}} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.3} />
                      </AreaChart>
                   );
                 } else if (customConfig.chartType === 'pie') {
                   return (
                      <RePieChart>
                         <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill={color} label={renderCustomizedLabel}>
                           {chartData.map((entry: any, index: number) => (
                             <Cell key={`cell-${index}`} fill={index % 2 === 0 ? color : '#cbd5e1'} />
                           ))}
                         </Pie>
                         <Tooltip content={<CustomTooltip />} />
                      </RePieChart>
                   );
                 }
               }

               return null;
             })()}
          </ResponsiveContainer>
       </div>
    </div>
  );
};

const Analytics: React.FC = () => {
  const { state, dispatch } = useApp();
  const { language, transactions, isPro, activeWidgets, baseCurrency } = state;
  const [showAddModal, setShowAddModal] = useState(false);

  // --- Total KPI Calculations (Global - not affected by widget filters) ---
  const totalIncome = transactions.reduce((s, t) => t.type === TransactionType.INCOME ? s + t.amount : s, 0);
  const totalExpense = transactions.reduce((s, t) => t.type === TransactionType.EXPENSE ? s + t.amount : s, 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24 px-2 relative">
      
      {/* Header */}
      <div className="flex flex-col gap-2 px-2">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            {language === 'ar' ? 'التحليلات' : 'Analytics Center'}
        </h2>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Detailed Financial Health Overview
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3">
         <div className="bg-emerald-500 text-white p-5 rounded-[24px] shadow-lg shadow-emerald-500/20">
            <ArrowUpRight size={24} className="mb-2 opacity-80" />
            <p className="text-[9px] font-black uppercase tracking-widest opacity-80">{language === 'ar' ? 'الدخل' : 'In'}</p>
            <p className="text-sm font-black">${totalIncome.toLocaleString()}</p>
         </div>
         <div className="bg-rose-500 text-white p-5 rounded-[24px] shadow-lg shadow-rose-500/20">
            <ArrowDownRight size={24} className="mb-2 opacity-80" />
            <p className="text-[9px] font-black uppercase tracking-widest opacity-80">{language === 'ar' ? 'المصاريف' : 'Out'}</p>
            <p className="text-sm font-black">${totalExpense.toLocaleString()}</p>
         </div>
         <div className="bg-blue-600 text-white p-5 rounded-[24px] shadow-lg shadow-blue-500/20">
            <Target size={24} className="mb-2 opacity-80" />
            <p className="text-[9px] font-black uppercase tracking-widest opacity-80">{language === 'ar' ? 'الادخار' : 'Savings'}</p>
            <p className="text-sm font-black">{savingsRate.toFixed(1)}%</p>
         </div>
      </div>

      {/* Active Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {activeWidgets.map(widgetId => (
           <ChartWidget 
             key={widgetId} 
             widgetId={widgetId} 
             globalState={state} 
             dispatch={dispatch} 
           />
         ))}
         
         {/* Add Widget Button */}
         <button 
           onClick={() => setShowAddModal(true)}
           className="min-h-[350px] rounded-[32px] border-4 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all group"
         >
           <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 group-hover:scale-110 transition-transform flex items-center justify-center">
             <Plus size={32} />
           </div>
           <span className="text-xs font-black uppercase tracking-widest">{language === 'ar' ? 'إضافة تحليل جديد' : 'Add Analytics Widget'}</span>
         </button>
      </div>

      {/* Add Widget Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-white dark:bg-slate-800 rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden relative flex flex-col animate-in zoom-in-95 duration-300">
             <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
               <div>
                 <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase">{language === 'ar' ? 'مكتبة التحليلات' : 'Analytics Library'}</h3>
                 <p className="text-xs text-slate-500 font-bold mt-1">{language === 'ar' ? 'اختر الرسوم البيانية لإضافتها' : 'Select charts to add to your dashboard'}</p>
               </div>
               <button onClick={() => setShowAddModal(false)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 hover:text-rose-500"><X size={20}/></button>
             </div>
             
             <div className="overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {WIDGET_LIBRARY.map(widget => {
                  const isActive = activeWidgets.includes(widget.id);
                  const isLocked = widget.pro && !isPro;
                  
                  return (
                    <div key={widget.id} className={`p-6 rounded-[32px] border transition-all relative ${isActive ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-300'}`}>
                       <div className="flex items-start justify-between mb-4">
                          <div className={`w-12 h-12 ${widget.bgColor} ${widget.color} rounded-2xl flex items-center justify-center`}>
                             <widget.icon size={24} />
                          </div>
                          {isLocked ? (
                             <div className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-full text-[9px] font-black uppercase flex items-center gap-1">
                               <Zap size={10} /> Pro
                             </div>
                          ) : isActive ? (
                             <div className="px-3 py-1 bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full text-[9px] font-black uppercase">
                               {language === 'ar' ? 'مضاف' : 'Added'}
                             </div>
                          ) : (
                             <button onClick={() => { dispatch.addAnalyticsWidget(widget.id); setShowAddModal(false); }} className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                               <Plus size={16} />
                             </button>
                          )}
                       </div>
                       <h4 className="font-black text-slate-900 dark:text-white text-sm mb-1">{language === 'ar' ? widget.titleAr : widget.titleEn}</h4>
                       <p className="text-[10px] font-bold text-slate-500 leading-relaxed">{language === 'ar' ? widget.descAr : widget.descEn}</p>
                       
                       {isLocked && (
                         <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[1px] rounded-[32px] flex items-center justify-center">
                            <button onClick={() => { setShowAddModal(false); window.location.hash = '#/upgrade'; }} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase shadow-xl hover:scale-105 transition-transform">
                               Unlock Pro
                            </button>
                         </div>
                       )}
                    </div>
                  );
                })}
                
                {/* Custom User Widgets */}
                {state.customWidgets && state.customWidgets.length > 0 && (
                  <div className="col-span-full mt-4">
                     <h4 className="text-xs font-black uppercase text-slate-400 mb-4">{language === 'ar' ? 'رسوماتك المخصصة' : 'Your Custom Charts'}</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {state.customWidgets.map((widget: CustomWidget) => {
                            const isActive = activeWidgets.includes(widget.id);
                            return (
                                <div key={widget.id} className={`p-6 rounded-[32px] border transition-all relative ${isActive ? 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-purple-300'}`}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-2xl flex items-center justify-center`}>
                                            <BrainCircuit size={24} />
                                        </div>
                                        {isActive ? (
                                            <div className="px-3 py-1 bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300 rounded-full text-[9px] font-black uppercase">
                                            {language === 'ar' ? 'مضاف' : 'Added'}
                                            </div>
                                        ) : (
                                            <button onClick={() => { dispatch.addAnalyticsWidget(widget.id); setShowAddModal(false); }} className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                            <Plus size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <h4 className="font-black text-slate-900 dark:text-white text-sm mb-1">{widget.title}</h4>
                                    <p className="text-[10px] font-bold text-slate-500 leading-relaxed">{widget.description}</p>
                                </div>
                            );
                        })}
                     </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Analytics;