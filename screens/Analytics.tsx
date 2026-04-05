import React, { useState, useMemo } from 'react';
import { useApp, isIncomeLike, isExpenseLike } from '../store';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, CartesianGrid,
  PieChart as RePieChart, Pie, Cell, AreaChart, Area, BarChart, LabelList, Legend
} from 'recharts';
import { 
  Activity, Target, PieChart, ArrowUpRight, ArrowDownRight, Zap, Star,
  Trash2, Plus, X, BarChart3, TrendingUp, Users, BrainCircuit, Sparkles,
  Filter, Calendar, ChevronDown, Tag, Edit2
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
    id: 'debt_position',
    icon: ArrowDownRight,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    titleEn: 'Debt Position',
    titleAr: 'موقف الديون',
    descEn: 'Debts you owe vs owed to you.',
    descAr: 'مقارنة بين الديون التي لك وعليك.',
    pro: false
  },
  {
    id: 'investment_portfolio',
    icon: TrendingUp,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    titleEn: 'Investment Portfolio',
    titleAr: 'المحفظة الاستثمارية',
    descEn: 'Invested capital vs returns.',
    descAr: 'رأس المال المستثمر مقابل العوائد.',
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
  },
  {
    id: 'item_price_tracker',
    icon: BarChart3,
    color: 'text-teal-500',
    bgColor: 'bg-teal-50 dark:bg-teal-900/20',
    titleEn: 'Item Price Tracker',
    titleAr: 'متتبع أسعار السلع',
    descEn: 'Track price changes of frequently bought items.',
    descAr: 'تتبع تغير أسعار السلع المشتراة بشكل متكرر.',
    pro: false
  },
  {
    id: 'price_comparison',
    icon: Tag,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    titleEn: 'Store Price Comparison',
    titleAr: 'مقارنة الأسعار بين المتاجر',
    descEn: 'Compare item prices across different stores.',
    descAr: 'مقارنة أسعار السلع بين المتاجر المختلفة.',
    pro: true
  },
  // +++ أضيف بناءً على طلبك +++ (Subscription Detection)
  {
    id: 'subscription_detector',
    icon: Calendar,
    color: 'text-pink-500',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20',
    titleEn: 'Subscription Detector',
    titleAr: 'مكتشف الاشتراكات',
    descEn: 'Automatically detects recurring payments.',
    descAr: 'اكتشاف المدفوعات المتكررة والاشتراكات تلقائياً.',
    pro: false
  }
  // +++ نهاية الإضافة +++
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
  dispatch: any,
  onEditCustomWidget?: (widget: CustomWidget) => void
}> = ({ 
  widgetId, 
  globalState, 
  dispatch,
  onEditCustomWidget
}) => {
  const { language, isPro, customWidgets } = globalState;
  const groups = useMemo(() => globalState.groups.filter((g: any) => !g.isArchived), [globalState.groups]);
  const clients = useMemo(() => globalState.clients.filter((c: any) => !c.isArchived), [globalState.clients]);
  const transactions = useMemo(() => {
    return globalState.transactions.filter((t: any) => {
      const g = globalState.groups.find((g: any) => g.id === t.groupId);
      const hasArchivedClient = t.clientIds 
        ? t.clientIds.some((cId: string) => globalState.clients.find((c: any) => c.id === cId)?.isArchived)
        : globalState.clients.find((c: any) => c.id === t.clientId)?.isArchived;
      return (!g || !g.isArchived) && !hasArchivedClient;
    });
  }, [globalState.transactions, globalState.groups, globalState.clients]);
  
  // Local Filtering State
  const [timeRange, setTimeRange] = useState<'1W' | '1M' | '1Y' | 'ALL'>('1M');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [detailedItem, setDetailedItem] = useState<string | null>(null);

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
      txs = txs.filter(t => {
        try {
          return new Date(t.date) >= cutoff;
        } catch (e) {
          return false;
        }
      });
    }

    // Entity Filter
    if (filterEntity !== 'all') {
      // Check if it's a group ID
      const isGroup = groups.some((g: any) => g.id === filterEntity);
      if (isGroup) {
        txs = txs.filter(t => t.groupId === filterEntity);
      } else {
        // Assume Client ID
        txs = txs.filter(t => t.clientId === filterEntity || (t.clientIds && t.clientIds.includes(filterEntity)));
      }
    }

    return txs;
  }, [transactions, timeRange, filterEntity, groups]);

  // 2. Identify Configuration
  const standardConfig = WIDGET_LIBRARY.find(w => w.id === widgetId);
  const customConfig = customWidgets.find((w: CustomWidget) => w.id === widgetId);
  
  const getTailwindClasses = (theme?: string) => {
    switch (theme) {
      case 'emerald': return { color: 'text-emerald-500', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20' };
      case 'rose': return { color: 'text-rose-500', bgColor: 'bg-rose-50 dark:bg-rose-900/20' };
      case 'amber': return { color: 'text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-900/20' };
      case 'purple': return { color: 'text-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-900/20' };
      default: return { color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20' };
    }
  };

  const customThemeClasses = customConfig ? getTailwindClasses(customConfig.colorTheme) : { color: '', bgColor: '' };

  const config = standardConfig || (customConfig ? {
    id: customConfig.id,
    icon: BrainCircuit,
    color: customThemeClasses.color,
    bgColor: customThemeClasses.bgColor,
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
        else if (customConfig.groupBy === 'client') {
          const primaryClientId = t.clientIds && t.clientIds.length > 0 ? t.clientIds[0] : t.clientId;
          key = clients.find((c: any) => c.id === primaryClientId)?.name || 'Unknown';
        }
        else if (customConfig.groupBy === 'date') key = new Date(t.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });

        const val = (customConfig.dataSource === 'net' && t.type?.toUpperCase() === 'EXPENSE') ? -t.amount : t.amount;
        dataMap[key] = (dataMap[key] || 0) + val;
      });
      return Object.entries(dataMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
    }

    // --- Standard Widget Logic ---
    switch (widgetId) {
      case 'cash_flow': {
        const dataMap: Record<string, { name: string, income: number, expense: number, net: number, dateObj: Date }> = {};
        filteredTransactions.forEach((t: Transaction) => {
          if (!isIncomeLike(t) && !isExpenseLike(t)) return; // Exclude transfers and pure investments
          const tDate = new Date(t.date);
          // Group by Day if range is Week/Month, else Group by Month
          const isShortTerm = timeRange === '1W' || timeRange === '1M';
          const key = tDate.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', isShortTerm ? { month: 'short', day: 'numeric' } : { month: 'short', year: '2-digit' });
          
          if (!dataMap[key]) dataMap[key] = { name: key, income: 0, expense: 0, net: 0, dateObj: tDate };
          if (isIncomeLike(t)) {
            dataMap[key].income += t.amount;
            dataMap[key].net += t.amount;
          } else if (isExpenseLike(t)) {
            dataMap[key].expense += t.amount;
            dataMap[key].net -= t.amount;
          }
        });
        return Object.values(dataMap).sort((a, b) => {
          const timeA = a.dateObj.getTime();
          const timeB = b.dateObj.getTime();
          return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
        });
      }
      case 'debt_position': {
        const debtTransactions = filteredTransactions.filter((t: Transaction) => t.isDebt);
        let totalDebtsIOwe = 0;
        let totalDebtsOwedToMe = 0;
        debtTransactions.forEach((t: Transaction) => {
          if (t.debtAction?.toUpperCase() === 'BORROW') totalDebtsIOwe += t.amount;
          else if (t.debtAction?.toUpperCase() === 'REPAY_BORROW') totalDebtsIOwe -= t.amount;
          else if (t.debtAction?.toUpperCase() === 'LEND') totalDebtsOwedToMe += t.amount;
          else if (t.debtAction?.toUpperCase() === 'REPAY_LEND') totalDebtsOwedToMe -= t.amount;
          else {
            // Fallback for old transactions
            if (isIncomeLike(t)) totalDebtsIOwe += t.amount;
            else if (isExpenseLike(t)) totalDebtsOwedToMe += t.amount;
          }
        });

        const partialPayments = filteredTransactions.filter((t: Transaction) => t.referenceTotal && t.referenceTotal > t.amount);
        partialPayments.forEach((t: Transaction) => {
          const remaining = (t.referenceTotal || 0) - t.amount;
          if (isExpenseLike(t)) totalDebtsIOwe += remaining;
          else if (isIncomeLike(t)) totalDebtsOwedToMe += remaining;
        });

        globalState.installments.filter((i: any) => i.status === 'active').forEach((i: any) => {
          const remaining = (i.totalAmount || (i.monthlyAmount * i.installmentCount)) - (i.paidCount * i.monthlyAmount);
          if (remaining > 0) totalDebtsIOwe += remaining;
        });

        return [
          { name: language === 'ar' ? 'ديون عليك' : 'You Owe', value: Math.max(0, totalDebtsIOwe), fill: '#F43F5E' },
          { name: language === 'ar' ? 'ديون لك' : 'Owed to You', value: Math.max(0, totalDebtsOwedToMe), fill: '#10B981' }
        ].filter(d => d.value > 0);
      }
      case 'investment_portfolio': {
        const investmentTransactions = filteredTransactions.filter((t: Transaction) => t.type?.toUpperCase() === 'INVESTMENT');
        const investedCapital = investmentTransactions
          .filter((t: Transaction) => t.investmentAction?.toUpperCase() !== 'SELL' && t.investmentAction?.toUpperCase() !== 'RETURN')
          .reduce((s: number, t: Transaction) => s + t.amount, 0);
        const investmentReturns = investmentTransactions
          .filter((t: Transaction) => t.investmentAction?.toUpperCase() === 'SELL' || t.investmentAction?.toUpperCase() === 'RETURN')
          .reduce((s: number, t: Transaction) => s + t.amount, 0);
        return [
          { name: language === 'ar' ? 'رأس المال' : 'Capital', value: investedCapital, fill: '#3B82F6' },
          { name: language === 'ar' ? 'عوائد' : 'Returns', value: investmentReturns, fill: '#10B981' }
        ].filter(d => d.value > 0);
      }
      case 'lifestyle_radar': {
        const spendingByGroup = groups.map((g: any) => {
          const value = filteredTransactions
            .filter((t: Transaction) => t.groupId === g.id && isExpenseLike(t))
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
            .filter((t: Transaction) => t.groupId === g.id && isExpenseLike(t))
            .reduce((s: number, t: Transaction) => s + t.amount, 0)
        })).filter((d: any) => d.value > 0).sort((a: any, b: any) => b.value - a.value);
        const COLORS = ['#F43F5E', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#64748B'];
        return data.map((d: any, i: number) => ({ ...d, fill: COLORS[i % COLORS.length] }));
      }
      case 'top_clients': {
        return clients.map((c: any) => ({
          name: c.name,
          amount: filteredTransactions
            .filter((t: Transaction) => (t.clientId === c.id || (t.clientIds && t.clientIds.includes(c.id))) && isExpenseLike(t))
            .reduce((s: number, t: Transaction) => s + t.amount, 0)
        })).filter((d: any) => d.amount > 0).sort((a: any, b: any) => b.amount - a.amount).slice(0, 5);
      }
      case 'balance_trend': {
        // Trend is tricky with filters. We simulate a trend based on filtered set.
        const data: any[] = [];
        let runningBalance = 0; 
        const dailyNetMap: Record<string, number> = {};
        
        filteredTransactions.forEach((t: Transaction) => {
           dailyNetMap[t.date] = (dailyNetMap[t.date] || 0) + (isIncomeLike(t) ? t.amount : -t.amount);
           runningBalance += (isIncomeLike(t) ? t.amount : -t.amount); // Simple accumulation for visual
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
      case 'item_price_tracker': {
        // Find items that appear multiple times to track their price
        const itemHistory: Record<string, { date: string, price: number }[]> = {};
        
        filteredTransactions.forEach((t: Transaction) => {
          if (isExpenseLike(t) && t.items && t.items.length > 0) {
            t.items.forEach(item => {
              const name = (item.name || '').trim().toLowerCase();
              if (!name) return;
              if (!itemHistory[name]) itemHistory[name] = [];
              itemHistory[name].push({
                date: new Date(t.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {month:'short', day:'numeric'}),
                price: item.price
              });
            });
          }
        });

        // Filter for items with at least 2 purchases to show a trend
        const trackedItems = Object.entries(itemHistory)
          .filter(([_, history]) => history.length >= 2)
          .sort((a, b) => b[1].length - a[1].length) // Sort by most frequently bought
          .slice(0, 3); // Take top 3 items to avoid cluttering the chart

        if (trackedItems.length === 0) return [];

        // Transform into Recharts format: { date: 'Jan 1', 'Milk': 2.5, 'Bread': 1.5 }
        const chartDataMap: Record<string, any> = {};
        trackedItems.forEach(([itemName, history]) => {
          history.forEach(({ date, price }) => {
            if (!chartDataMap[date]) chartDataMap[date] = { date };
            // Capitalize first letter for display
            const displayName = itemName.charAt(0).toUpperCase() + itemName.slice(1);
            chartDataMap[date][displayName] = price;
          });
        });

        return Object.values(chartDataMap).sort((a, b) => {
          const timeA = new Date(a.date).getTime();
          const timeB = new Date(b.date).getTime();
          return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
        });
      }
      case 'price_comparison': {
        // Find items bought from different stores
        const itemStorePrices: Record<string, Record<string, number[]>> = {};
        
        filteredTransactions.forEach((t: Transaction) => {
          const primaryClientId = t.clientIds && t.clientIds.length > 0 ? t.clientIds[0] : t.clientId;
          if (isExpenseLike(t) && t.items && t.items.length > 0 && primaryClientId) {
            const clientName = clients.find((c: any) => c.id === primaryClientId)?.name || 'Unknown';
            t.items.forEach(item => {
              const name = (item.name || '').trim().toLowerCase();
              if (!name) return;
              if (!itemStorePrices[name]) itemStorePrices[name] = {};
              if (!itemStorePrices[name][clientName]) itemStorePrices[name][clientName] = [];
              itemStorePrices[name][clientName].push(item.price);
            });
          }
        });

        // Filter items bought from at least 2 different stores
        const comparedItems = Object.entries(itemStorePrices)
          .filter(([_, stores]) => Object.keys(stores).length >= 2)
          .sort((a, b) => Object.keys(b[1]).length - Object.keys(a[1]).length)
          .slice(0, 5); // Top 5 items

        if (comparedItems.length === 0) return [];

        // Transform into Recharts format: { name: 'Milk', 'Store A': 2.5, 'Store B': 2.8 }
        return comparedItems.map(([itemName, stores]) => {
          const dataPoint: any = { name: itemName.charAt(0).toUpperCase() + itemName.slice(1) };
          Object.entries(stores).forEach(([storeName, prices]) => {
            // Calculate average price for the store
            const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
            dataPoint[storeName] = Number(avgPrice.toFixed(2));
          });
          return dataPoint;
        });
      }
      // +++ أضيف بناءً على طلبك +++ (Subscription Detection Logic)
      case 'subscription_detector': {
        const potentialSubs: Record<string, { count: number, total: number, dates: string[], client: string }> = {};
        
        filteredTransactions.forEach((t: Transaction) => {
          if (isExpenseLike(t)) {
            const primaryClientId = t.clientIds && t.clientIds.length > 0 ? t.clientIds[0] : t.clientId;
            const key = `${t.amount}_${primaryClientId}`;
            if (!potentialSubs[key]) {
              potentialSubs[key] = { count: 0, total: 0, dates: [], client: clients.find((c: any) => c.id === primaryClientId)?.name || 'Unknown' };
            }
            potentialSubs[key].count += 1;
            potentialSubs[key].total += t.amount;
            potentialSubs[key].dates.push(t.date);
          }
        });

        // Filter for recurring (same amount, same client, > 1 time)
        return Object.entries(potentialSubs)
          .filter(([_, data]) => data.count > 1)
          .map(([key, data]) => ({
            name: data.client,
            amount: parseFloat(key.split('_')[0]),
            count: data.count,
            total: data.total,
            lastDate: data.dates.sort().pop()
          }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 5);
      }
      // +++ نهاية الإضافة +++
      default:
        return [];
    }
  }, [filteredTransactions, widgetId, groups, clients, language, timeRange]);

  const totalFilteredExpense = useMemo(() => {
     return filteredTransactions.filter((t: Transaction) => isExpenseLike(t)).reduce((s: number, t: Transaction) => s + t.amount, 0);
  }, [filteredTransactions]);

  const totalDebt = useMemo(() => {
     if (widgetId !== 'debt_position') return 0;
     return chartData.reduce((sum: number, item: any) => sum + item.value, 0);
  }, [chartData, widgetId]);

  const totalInvestment = useMemo(() => {
     if (widgetId !== 'investment_portfolio') return 0;
     return chartData.reduce((sum: number, item: any) => sum + item.value, 0);
  }, [chartData, widgetId]);

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
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 relative group animate-in zoom-in-95 duration-300">
       <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
         {customConfig && onEditCustomWidget && (
           <button 
             onClick={() => onEditCustomWidget(customConfig)}
             className="p-2 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-blue-500 rounded-full"
           >
             <Edit2 size={16} />
           </button>
         )}
         <button 
           onClick={() => dispatch.removeAnalyticsWidget(widgetId)}
           className="p-2 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-rose-500 rounded-full"
         >
           <Trash2 size={16} />
         </button>
       </div>

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
          {widgetId === 'expense_distribution' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
              <span className="text-xl font-black text-slate-800 dark:text-white">{totalFilteredExpense.toLocaleString()}</span>
            </div>
          )}
          {widgetId === 'debt_position' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{language === 'ar' ? 'إجمالي الدين' : 'Total Debt'}</span>
              <span className="text-xl font-black text-slate-800 dark:text-white">{totalDebt.toLocaleString()}</span>
            </div>
          )}
          {widgetId === 'investment_portfolio' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{language === 'ar' ? 'إجمالي الاستثمار' : 'Total Inv.'}</span>
              <span className="text-xl font-black text-slate-800 dark:text-white">{totalInvestment.toLocaleString()}</span>
            </div>
          )}
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
                      <RePieChart>
                        <Pie 
                          data={chartData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value" labelLine={true} label={renderCustomizedLabel}
                        >
                          {chartData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />)}
                        </Pie>
                      </RePieChart>
                  );
               }

               // --- Debt Position ---
               if (widgetId === 'debt_position') {
                  return (
                      <RePieChart>
                        <Pie 
                          data={chartData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value" labelLine={true} label={renderCustomizedLabel}
                        >
                          {chartData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />)}
                        </Pie>
                      </RePieChart>
                  );
               }

               // --- Investment Portfolio ---
               if (widgetId === 'investment_portfolio') {
                  return (
                      <RePieChart>
                        <Pie 
                          data={chartData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value" labelLine={true} label={renderCustomizedLabel}
                        >
                          {chartData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />)}
                        </Pie>
                      </RePieChart>
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

               // --- Item Price Tracker ---
               if (widgetId === 'item_price_tracker') {
                 if (chartData.length === 0) {
                   return (
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                       <BarChart3 size={32} className="mb-2 opacity-50" />
                       <p className="text-xs font-bold text-center px-4">
                         {language === 'ar' 
                           ? 'لا توجد بيانات كافية. قم بإضافة سلع متكررة في عملياتك لتتبع أسعارها.' 
                           : 'Not enough data. Add recurring items to your transactions to track their prices.'}
                       </p>
                     </div>
                   );
                 }

                 // Extract item names (keys other than 'date')
                 const itemNames = Object.keys(chartData[0] || {}).filter(k => k !== 'date');
                 const COLORS = ['#14b8a6', '#f59e0b', '#ec4899']; // Teal, Amber, Pink

                 return (
                   <ComposedChart data={chartData}>
                     <CartesianGrid stroke="#f1f5f9" vertical={false} strokeDasharray="3 3" />
                     <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 'bold'}} axisLine={false} tickLine={false} dy={10} />
                     <YAxis tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 'bold'}} axisLine={false} tickLine={false} dx={-10} />
                     <Tooltip content={<CustomTooltip />} />
                     {itemNames.map((name, idx) => (
                       <Line 
                         key={name} 
                         type="monotone" 
                         dataKey={name} 
                         name={name} 
                         stroke={COLORS[idx % COLORS.length]} 
                         strokeWidth={3} 
                         dot={{r: 4, strokeWidth: 2, fill: '#fff'}} 
                         activeDot={{r: 6, strokeWidth: 0, onClick: () => setDetailedItem(name)}}
                         style={{ cursor: 'pointer' }}
                       />
                     ))}
                   </ComposedChart>
                 );
               }

               // --- Store Price Comparison ---
               if (widgetId === 'price_comparison') {
                 if (chartData.length === 0) {
                   return (
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                       <Tag size={32} className="mb-2 opacity-50" />
                       <p className="text-xs font-bold text-center px-4">
                         {language === 'ar' 
                           ? 'لا توجد بيانات كافية. قم بشراء نفس السلعة من متاجر مختلفة للمقارنة.' 
                           : 'Not enough data. Buy the same item from different stores to compare.'}
                       </p>
                     </div>
                   );
                 }

                 // Extract store names (keys other than 'name')
                 const storeNames = Object.keys(chartData[0] || {}).filter(k => k !== 'name');
                 const COLORS = ['#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6'];

                 return (
                   <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                     <CartesianGrid stroke="#f1f5f9" vertical={false} strokeDasharray="3 3" />
                     <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} axisLine={false} tickLine={false} dy={10} />
                     <YAxis tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} axisLine={false} tickLine={false} dx={-10} />
                     <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                     <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                     {storeNames.map((store, idx) => (
                       <Bar 
                         key={store} 
                         dataKey={store} 
                         name={store} 
                         fill={COLORS[idx % COLORS.length]} 
                         radius={[4, 4, 0, 0]}
                         barSize={20}
                       />
                     ))}
                   </BarChart>
                 );
               }

               // +++ أضيف بناءً على طلبك +++ (Subscription Detector Render)
               if (widgetId === 'subscription_detector') {
                 if (chartData.length === 0) {
                   return (
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                       <Calendar size={32} className="mb-2 opacity-50" />
                       <p className="text-xs font-bold text-center px-4">
                         {language === 'ar' 
                           ? 'لم يتم اكتشاف اشتراكات أو مدفوعات متكررة.' 
                           : 'No subscriptions or recurring payments detected.'}
                       </p>
                     </div>
                   );
                 }
                 
                 return (
                   <div className="h-full overflow-y-auto pr-2 space-y-3">
                     {chartData.map((sub: any, idx: number) => (
                       <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-900/30 text-pink-600 flex items-center justify-center shrink-0">
                             <Calendar size={18} />
                           </div>
                           <div>
                             <h4 className="text-sm font-black text-slate-900 dark:text-white">{sub.name}</h4>
                             <p className="text-[10px] text-slate-500 font-bold">{sub.count} {language === 'ar' ? 'مرات' : 'times'} • {language === 'ar' ? 'آخر مرة' : 'Last:'} {sub.lastDate}</p>
                           </div>
                         </div>
                         <div className="text-right">
                           <div className="text-sm font-black text-slate-900 dark:text-white">{sub.amount.toLocaleString()}</div>
                           <div className="text-[10px] text-slate-500 font-bold">{language === 'ar' ? 'الإجمالي' : 'Total'}: {sub.total.toLocaleString()}</div>
                         </div>
                       </div>
                     ))}
                   </div>
                 );
               }
               // +++ نهاية الإضافة +++

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

               return <ComposedChart data={[]} />;
             })()}
          </ResponsiveContainer>
       </div>

       {/* Detailed Item Modal */}
       {detailedItem && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setDetailedItem(null)}></div>
           <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden relative flex flex-col animate-in zoom-in-95 duration-300">
             <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center">
                   <Tag size={24} />
                 </div>
                 <div>
                   <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{detailedItem}</h3>
                   <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">
                     {language === 'ar' ? 'سجل الأسعار المفصل' : 'Detailed Price History'}
                   </p>
                 </div>
               </div>
               <button onClick={() => setDetailedItem(null)} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-rose-500 shadow-sm"><X size={20}/></button>
             </div>
             
             <div className="overflow-y-auto p-6">
               {/* Extract all transactions for this item */}
               {(() => {
                 const itemTransactions = transactions.filter((t: Transaction) => 
                   t.items && t.items.some(i => i.name === detailedItem)
                 ).map((t: Transaction) => {
                   const item = t.items!.find(i => i.name === detailedItem)!;
                   return {
                     date: t.date,
                     price: item.price,
                     quantity: item.quantity,
                     category: item.category,
                     note: t.note,
                     clientId: t.clientId
                   };
                 }).sort((a: any, b: any) => {
                   const timeA = new Date(a.date).getTime();
                   const timeB = new Date(b.date).getTime();
                   return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
                 });

                 if (itemTransactions.length === 0) return null;

                 const latestPrice = itemTransactions[0].price;
                 const oldestPrice = itemTransactions[itemTransactions.length - 1].price;
                 const priceChange = latestPrice - oldestPrice;
                 const priceChangePercent = oldestPrice > 0 ? (priceChange / oldestPrice) * 100 : 0;

                 return (
                   <div className="space-y-6">
                     {/* Stats Row */}
                     <div className="grid grid-cols-3 gap-4">
                       <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{language === 'ar' ? 'أحدث سعر' : 'Latest Price'}</p>
                         <p className="text-2xl font-black text-slate-900 dark:text-white">${latestPrice.toLocaleString()}</p>
                       </div>
                       <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{language === 'ar' ? 'التغير' : 'Change'}</p>
                         <div className="flex items-center gap-2">
                           <p className={`text-2xl font-black ${priceChange > 0 ? 'text-rose-500' : priceChange < 0 ? 'text-emerald-500' : 'text-slate-500'}`}>
                             {priceChange > 0 ? '+' : ''}{priceChange.toLocaleString()}
                           </p>
                           <span className={`text-xs font-bold px-2 py-1 rounded-lg ${priceChange > 0 ? 'bg-rose-100 text-rose-700' : priceChange < 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                             {priceChangePercent > 0 ? '+' : ''}{priceChangePercent.toFixed(1)}%
                           </span>
                         </div>
                       </div>
                       <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{language === 'ar' ? 'مرات الشراء' : 'Purchases'}</p>
                         <p className="text-2xl font-black text-slate-900 dark:text-white">{itemTransactions.length}</p>
                       </div>
                     </div>

                     {/* Detailed List */}
                     <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                       <table className="w-full text-left border-collapse">
                         <thead>
                           <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                             <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                             <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'السعر' : 'Price'}</th>
                             <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'الكمية' : 'Qty'}</th>
                             <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'المتجر/العميل' : 'Store/Client'}</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                           {itemTransactions.map((t: any, idx: number) => {
                             const client = clients.find((c: any) => c.id === t.clientId);
                             return (
                               <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                                 <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-300">
                                   {new Date(t.date).toLocaleDateString()}
                                 </td>
                                 <td className="px-6 py-4 text-sm font-black text-slate-900 dark:text-white">
                                   ${t.price.toLocaleString()}
                                 </td>
                                 <td className="px-6 py-4 text-xs font-bold text-slate-500">
                                   {t.quantity}
                                 </td>
                                 <td className="px-6 py-4">
                                   <div className="flex items-center gap-2">
                                     <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px]">
                                       {client?.icon || '🏪'}
                                     </span>
                                     <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{client?.name || '-'}</span>
                                   </div>
                                 </td>
                               </tr>
                             )
                           })}
                         </tbody>
                       </table>
                     </div>
                   </div>
                 );
               })()}
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

const Analytics: React.FC = () => {
  const { state, dispatch } = useApp();
  const { language, transactions, isPro, activeWidgets, baseCurrency } = state;
  const [showAddModal, setShowAddModal] = useState(false);
  
  // +++ أضيف بناءً على طلبك +++ (Custom Chart State)
  const [showCustomChartModal, setShowCustomChartModal] = useState(false);
  const [customChartConfig, setCustomChartConfig] = useState<Partial<CustomWidget>>({
    title: '',
    description: '',
    chartType: 'bar',
    dataSource: 'expense',
    groupBy: 'group',
    colorTheme: 'blue'
  });

  const handleCreateCustomChart = () => {
    if (!customChartConfig.title) return;
    
    if (customChartConfig.id) {
      // Edit existing
      dispatch.updateCustomWidget(customChartConfig.id, {
        title: customChartConfig.title,
        description: customChartConfig.description || 'Custom User Chart',
        chartType: customChartConfig.chartType as any,
        dataSource: customChartConfig.dataSource as any,
        groupBy: customChartConfig.groupBy as any,
        colorTheme: customChartConfig.colorTheme as any
      });
    } else {
      // Create new
      const newWidget: CustomWidget = {
        id: `custom_${Date.now()}`,
        title: customChartConfig.title,
        description: customChartConfig.description || 'Custom User Chart',
        chartType: customChartConfig.chartType as any,
        dataSource: customChartConfig.dataSource as any,
        groupBy: customChartConfig.groupBy as any,
        colorTheme: customChartConfig.colorTheme as any
      };
      dispatch.addCustomWidget(newWidget);
      dispatch.addAnalyticsWidget(newWidget.id);
    }
    
    setShowCustomChartModal(false);
    setShowAddModal(false);
  };

  const handleEditCustomChart = (widget: CustomWidget) => {
    setCustomChartConfig(widget);
    setShowCustomChartModal(true);
  };
  // +++ نهاية الإضافة +++

  // --- Total KPI Calculations (Global - not affected by widget filters) ---
  const totalIncome = transactions.reduce((s, t) => isIncomeLike(t) ? s + t.amount : s, 0);
  const totalExpense = transactions.reduce((s, t) => isExpenseLike(t) ? s + t.amount : s, 0);
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
         <div className="bg-emerald-500 text-white p-5 rounded-3xl shadow-lg shadow-emerald-500/20">
            <ArrowUpRight size={24} className="mb-2 opacity-80" />
            <p className="text-[9px] font-black uppercase tracking-widest opacity-80">{language === 'ar' ? 'الدخل' : 'In'}</p>
            <p className="text-sm font-black">${totalIncome.toLocaleString()}</p>
         </div>
         <div className="bg-rose-500 text-white p-5 rounded-3xl shadow-lg shadow-rose-500/20">
            <ArrowDownRight size={24} className="mb-2 opacity-80" />
            <p className="text-[9px] font-black uppercase tracking-widest opacity-80">{language === 'ar' ? 'المصاريف' : 'Out'}</p>
            <p className="text-sm font-black">${totalExpense.toLocaleString()}</p>
         </div>
         <div className="bg-blue-600 text-white p-5 rounded-3xl shadow-lg shadow-blue-500/20">
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
             onEditCustomWidget={handleEditCustomChart}
           />
         ))}
         
         {/* Add Widget Button */}
         <button 
           onClick={() => setShowAddModal(true)}
           className="min-h-[350px] rounded-3xl border-4 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all group"
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
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden relative flex flex-col animate-in zoom-in-95 duration-300">
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
                    <div key={widget.id} className={`p-6 rounded-3xl border transition-all relative ${isActive ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-300'}`}>
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
                         <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[1px] rounded-3xl flex items-center justify-center">
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
                                <div key={widget.id} className={`p-6 rounded-3xl border transition-all relative group ${isActive ? 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-purple-300'}`}>
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
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditCustomChart(widget)} className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-blue-500 rounded-lg shadow-sm">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => dispatch.deleteCustomWidget(widget.id)} className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-lg shadow-sm">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <h4 className="font-black text-slate-900 dark:text-white text-sm mb-1">{widget.title}</h4>
                                    <p className="text-[10px] font-bold text-slate-500 leading-relaxed">{widget.description}</p>
                                </div>
                            );
                        })}
                     </div>
                  </div>
                )}

                {/* +++ أضيف بناءً على طلبك +++ (Create Custom Chart Button) */}
                <div className="col-span-full mt-4">
                   <button 
                     onClick={() => {
                       setCustomChartConfig({
                         title: '',
                         description: '',
                         chartType: 'bar',
                         dataSource: 'expense',
                         groupBy: 'group',
                         colorTheme: 'blue'
                       });
                       setShowCustomChartModal(true);
                     }}
                     className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl text-slate-500 hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                   >
                     <Plus size={16} />
                     {language === 'ar' ? 'إنشاء رسم بياني مخصص' : 'Create Custom Chart'}
                   </button>
                </div>
                {/* +++ نهاية الإضافة +++ */}
             </div>
          </div>
        </div>
      )}

      {/* +++ أضيف بناءً على طلبك +++ (Custom Chart Modal) */}
      {showCustomChartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowCustomChartModal(false)}></div>
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative flex flex-col animate-in zoom-in-95 duration-300">
             <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
               <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase">{customChartConfig.id ? (language === 'ar' ? 'تعديل الرسم البياني' : 'Edit Custom Chart') : (language === 'ar' ? 'رسم بياني جديد' : 'New Custom Chart')}</h3>
               <button onClick={() => setShowCustomChartModal(false)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 hover:text-rose-500"><X size={16}/></button>
             </div>
             
             <div className="p-6 space-y-4">
               <div>
                 <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">{language === 'ar' ? 'عنوان الرسم' : 'Chart Title'}</label>
                 <input 
                   type="text" 
                   value={customChartConfig.title} 
                   onChange={e => setCustomChartConfig({...customChartConfig, title: e.target.value})}
                   className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                   placeholder={language === 'ar' ? 'مثال: مصاريف السفر' : 'e.g., Travel Expenses'}
                 />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">{language === 'ar' ? 'نوع الرسم' : 'Chart Type'}</label>
                   <select 
                     value={customChartConfig.chartType} 
                     onChange={e => setCustomChartConfig({...customChartConfig, chartType: e.target.value as any})}
                     className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none"
                   >
                     <option value="bar">{language === 'ar' ? 'أعمدة' : 'Bar Chart'}</option>
                     <option value="line">{language === 'ar' ? 'خط' : 'Line Chart'}</option>
                     <option value="pie">{language === 'ar' ? 'دائري' : 'Pie Chart'}</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">{language === 'ar' ? 'مصدر البيانات' : 'Data Source'}</label>
                   <select 
                     value={customChartConfig.dataSource} 
                     onChange={e => setCustomChartConfig({...customChartConfig, dataSource: e.target.value as any})}
                     className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none"
                   >
                     <option value="expense">{language === 'ar' ? 'المصاريف' : 'Expenses'}</option>
                     <option value="income">{language === 'ar' ? 'الدخل' : 'Income'}</option>
                   </select>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">{language === 'ar' ? 'تجميع حسب' : 'Group By'}</label>
                   <select 
                     value={customChartConfig.groupBy} 
                     onChange={e => setCustomChartConfig({...customChartConfig, groupBy: e.target.value as any})}
                     className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none"
                   >
                     <option value="group">{language === 'ar' ? 'المجموعة' : 'Category/Group'}</option>
                     <option value="client">{language === 'ar' ? 'الجهة' : 'Client/Store'}</option>
                     <option value="date">{language === 'ar' ? 'التاريخ' : 'Date'}</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">{language === 'ar' ? 'اللون' : 'Color Theme'}</label>
                   <select 
                     value={customChartConfig.colorTheme} 
                     onChange={e => setCustomChartConfig({...customChartConfig, colorTheme: e.target.value as any})}
                     className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none"
                   >
                     <option value="blue">{language === 'ar' ? 'أزرق' : 'Blue'}</option>
                     <option value="emerald">{language === 'ar' ? 'أخضر' : 'Emerald'}</option>
                     <option value="rose">{language === 'ar' ? 'أحمر' : 'Rose'}</option>
                     <option value="amber">{language === 'ar' ? 'أصفر' : 'Amber'}</option>
                     <option value="purple">{language === 'ar' ? 'بنفسجي' : 'Purple'}</option>
                   </select>
                 </div>
               </div>

               <button 
                 onClick={handleCreateCustomChart}
                 disabled={!customChartConfig.title}
                 className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:shadow-xl hover:bg-blue-500 transition-all disabled:opacity-50 mt-4"
               >
                 {customChartConfig.id ? (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes') : (language === 'ar' ? 'إنشاء وإضافة' : 'Create & Add')}
               </button>
             </div>
          </div>
        </div>
      )}
      {/* +++ نهاية الإضافة +++ */}

    </div>
  );
};

export default Analytics;