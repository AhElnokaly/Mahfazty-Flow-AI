
import React, { useState, useMemo } from 'react';
import { useApp } from '../store';
import { TransactionType } from '../types';
import { 
  Search, Download, History as HistoryIcon,
  Filter, Check, Trash2, Edit3, X, Layers, Users,
  ArrowUpRight, ArrowDownRight, Calendar as CalendarIcon, 
  List, ChevronLeft, ChevronRight, Calculator, PieChart, LayoutList
} from 'lucide-react';

type TimeRange = 'weekly' | 'monthly' | 'yearly' | 'all';
type ViewMode = 'list' | 'calendar';

const History: React.FC = () => {
  const { state, dispatch } = useApp();
  const { language, transactions, clients, groups, baseCurrency } = state;

  // View State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Filter State
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');

  // Editing logic
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');

  const vibrate = () => {
    if (navigator.vibrate) navigator.vibrate(15);
  };

  // --- CALENDAR LOGIC ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  // Aggregated Data for Calendar
  const calendarData = useMemo(() => {
    const data: Record<string, { income: number, expense: number, count: number }> = {};
    
    transactions.forEach(t => {
      const tDate = t.date.split('T')[0]; 
      if (!data[tDate]) data[tDate] = { income: 0, expense: 0, count: 0 };
      if (t.type === TransactionType.INCOME) data[tDate].income += t.amount;
      else data[tDate].expense += t.amount;
      data[tDate].count += 1;
    });
    return data;
  }, [transactions]);


  // --- FILTER LOGIC ---
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];
    
    if (viewMode === 'calendar' && selectedDate) {
       return result.filter(t => t.date.startsWith(selectedDate));
    }

    if (searchQuery) {
      result = result.filter(t => {
        const client = clients.find(c => c.id === t.clientId);
        return t.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
               client?.name.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    const now = new Date();
    if (viewMode === 'list' && timeRange !== 'all') {
      result = result.filter(t => {
        const tDate = new Date(t.date);
        const diffDays = Math.ceil(Math.abs(now.getTime() - tDate.getTime()) / (1000 * 60 * 60 * 24));
        if (timeRange === 'weekly') return diffDays <= 7;
        if (timeRange === 'monthly') return diffDays <= 30;
        if (timeRange === 'yearly') return diffDays <= 365;
        return true;
      });
    }

    if (viewMode === 'calendar' && !selectedDate) {
        const y = currentDate.getFullYear();
        const m = currentDate.getMonth() + 1;
        const mStr = m < 10 ? `0${m}` : `${m}`;
        result = result.filter(t => t.date.startsWith(`${y}-${mStr}`));
    }

    if (selectedGroupId !== 'all') {
      result = result.filter(t => t.groupId === selectedGroupId);
    }

    if (selectedClientId !== 'all') {
      result = result.filter(t => t.clientId === selectedClientId);
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, timeRange, searchQuery, clients, selectedGroupId, selectedClientId, viewMode, currentDate, selectedDate]);

  const totals = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      if (t.type === TransactionType.INCOME) acc.income += t.amount;
      else acc.expense += t.amount;
      return acc;
    }, { income: 0, expense: 0 });
  }, [filteredTransactions]);

  const handleUpdate = (id: string) => {
    const val = parseFloat(editAmount);
    if (!isNaN(val)) {
      vibrate();
      dispatch.updateTransaction(id, { amount: val, date: editDate });
    }
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    vibrate();
    dispatch.deleteTransaction(id);
  };

  const filteredClients = useMemo(() => {
    if (selectedGroupId === 'all') return clients;
    return clients.filter(c => c.groupId === selectedGroupId);
  }, [clients, selectedGroupId]);

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysCount = getDaysInMonth(year, month);
    const startDay = getFirstDayOfMonth(year, month); 
    
    const days = [];
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 md:h-28 bg-transparent"></div>);
    }

    for (let d = 1; d <= daysCount; d++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      const dayData = calendarData[dateStr];
      const isSelected = selectedDate === dateStr;
      const isToday = new Date().toISOString().startsWith(dateStr);
      
      let bgColor = 'transparent';
      let borderColor = 'border-slate-100 dark:border-slate-800';
      
      if (dayData) {
        const net = dayData.income - dayData.expense;
        if (net > 0) {
           bgColor = 'bg-emerald-50 dark:bg-emerald-900/20'; 
           borderColor = 'border-emerald-200 dark:border-emerald-900/50';
        } else if (net < 0) {
           bgColor = 'bg-rose-50 dark:bg-rose-900/20';
           borderColor = 'border-rose-200 dark:border-rose-900/50';
        } else {
           bgColor = 'bg-blue-50 dark:bg-blue-900/10'; 
           borderColor = 'border-blue-200 dark:border-blue-900/50';
        }
      }

      if (isSelected) {
         bgColor = 'bg-blue-600 dark:bg-blue-600 text-white'; 
         borderColor = 'border-blue-600';
      }

      days.push(
        <div 
          key={dateStr}
          onClick={() => setSelectedDate(isSelected ? null : dateStr)}
          className={`
            h-24 md:h-28 rounded-2xl p-2 border transition-all cursor-pointer relative flex flex-col justify-between group
            ${bgColor} ${borderColor}
            ${isSelected ? 'shadow-lg ring-2 ring-blue-500/20 z-10 scale-[1.02]' : 'hover:border-blue-300 dark:hover:border-slate-600'}
          `}
        >
          <div className="flex justify-between items-start">
            <span className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-full ${isToday && !isSelected ? 'bg-blue-600 text-white' : isSelected ? 'text-white' : 'text-slate-400'}`}>
              {d}
            </span>
            {dayData && (
              <span className={`text-[9px] font-black px-1.5 rounded-md ${isSelected ? 'text-blue-100 bg-blue-700' : 'text-slate-400 bg-white/50 dark:bg-black/20'}`}>
                {dayData.count}
              </span>
            )}
          </div>

          {dayData ? (
            <div className="flex flex-col gap-0.5 mt-1">
              {dayData.income > 0 && (
                <div className={`flex items-center justify-between px-1.5 py-1 rounded-md ${isSelected ? 'bg-white/10' : 'bg-emerald-100/50 dark:bg-emerald-900/40'}`}>
                   <ArrowUpRight size={8} className={isSelected ? "text-emerald-200" : "text-emerald-600 dark:text-emerald-400"} />
                   <span className={`text-[9px] font-black truncate ${isSelected ? "text-emerald-100" : "text-emerald-700 dark:text-emerald-400"}`}>
                     {dayData.income >= 1000 ? (dayData.income/1000).toFixed(1) + 'k' : dayData.income}
                   </span>
                </div>
              )}
              {dayData.expense > 0 && (
                <div className={`flex items-center justify-between px-1.5 py-1 rounded-md ${isSelected ? 'bg-white/10' : 'bg-rose-100/50 dark:bg-rose-900/40'}`}>
                   <ArrowDownRight size={8} className={isSelected ? "text-rose-200" : "text-rose-600 dark:text-rose-400"} />
                   <span className={`text-[9px] font-black truncate ${isSelected ? "text-rose-100" : "text-rose-700 dark:text-rose-400"}`}>
                     {dayData.expense >= 1000 ? (dayData.expense/1000).toFixed(1) + 'k' : dayData.expense}
                   </span>
                </div>
              )}
              {/* Tooltip on hover for exact numbers */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-slate-900 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 hidden md:block">
                 <div className="font-bold text-emerald-400">In: {dayData.income.toLocaleString()}</div>
                 <div className="font-bold text-rose-400">Out: {dayData.expense.toLocaleString()}</div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-blue-400' : 'bg-slate-200 dark:bg-slate-700'}`}></span>
            </div>
          )}
        </div>
      );
    }
    return days;
  };

  const weekDays = language === 'ar' 
    ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500 pb-20 px-2">
      
      {/* 1. New Split Header: Two Large Cards */}
      <div className="grid grid-cols-2 gap-4">
         {/* List View Card */}
         <div 
           onClick={() => setViewMode('list')}
           className={`p-6 rounded-[32px] border cursor-pointer transition-all relative overflow-hidden group ${
             viewMode === 'list' 
               ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 border-blue-500' 
               : 'bg-white dark:bg-slate-800 text-slate-500 hover:border-blue-200 border-slate-100 dark:border-slate-800'
           }`}
         >
            <div className="relative z-10 flex flex-col items-center justify-center h-full gap-2">
               <LayoutList size={28} className={viewMode === 'list' ? 'text-white' : 'text-slate-400 group-hover:text-blue-500 transition-colors'} />
               <h3 className="text-sm font-black uppercase tracking-widest">{language === 'ar' ? 'عرض القائمة' : 'List View'}</h3>
            </div>
            {viewMode === 'list' && <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>}
         </div>

         {/* Calendar View Card */}
         <div 
           onClick={() => { setViewMode('calendar'); setSelectedDate(null); }}
           className={`p-6 rounded-[32px] border cursor-pointer transition-all relative overflow-hidden group ${
             viewMode === 'calendar' 
               ? 'bg-purple-600 text-white shadow-xl shadow-purple-500/20 border-purple-500' 
               : 'bg-white dark:bg-slate-800 text-slate-500 hover:border-purple-200 border-slate-100 dark:border-slate-800'
           }`}
         >
            <div className="relative z-10 flex flex-col items-center justify-center h-full gap-2">
               <CalendarIcon size={28} className={viewMode === 'calendar' ? 'text-white' : 'text-slate-400 group-hover:text-purple-500 transition-colors'} />
               <h3 className="text-sm font-black uppercase tracking-widest">{language === 'ar' ? 'التقويم المالي' : 'Calendar View'}</h3>
            </div>
             {viewMode === 'calendar' && <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>}
         </div>
      </div>

      {/* --- CALENDAR VIEW --- */}
      {viewMode === 'calendar' && (
        <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
           {/* Calendar Header with Centered Arrows */}
           <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-50 dark:border-slate-800 flex flex-col items-center justify-center gap-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                 {language === 'ar' ? 'نظرة عامة شهرية' : 'Monthly Overview'}
              </p>
              <div className="flex items-center gap-6">
                 <button onClick={handlePrevMonth} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors shadow-sm text-slate-600 dark:text-slate-300">
                   {language === 'ar' ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                 </button>

                 <h3 className="text-2xl font-black text-slate-900 dark:text-white min-w-[150px] text-center">
                    {currentDate.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' })}
                 </h3>

                 <button onClick={handleNextMonth} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors shadow-sm text-slate-600 dark:text-slate-300">
                   {language === 'ar' ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                 </button>
              </div>
           </div>

           {/* Calendar Grid */}
           <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-[2.5rem] shadow-sm border border-slate-50 dark:border-slate-800">
              <div className="grid grid-cols-7 mb-4 text-center">
                 {weekDays.map(d => (
                   <div key={d} className="text-[10px] font-black text-slate-400 uppercase tracking-widest py-2">
                     {d.slice(0, 3)}
                   </div>
                 ))}
              </div>
              <div className="grid grid-cols-7 gap-2 md:gap-3">
                 {renderCalendar()}
              </div>
           </div>

           {/* Selected Day Summary Card */}
           {selectedDate && (
             <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-[2.5rem] text-white shadow-xl shadow-blue-500/20 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                         <CalendarIcon size={20} className="text-white" />
                      </div>
                      <div>
                         <h3 className="text-lg font-black">{new Date(selectedDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                         <p className="text-[10px] uppercase tracking-widest opacity-70 font-bold">{language === 'ar' ? 'ملخص اليوم' : 'Daily Summary'}</p>
                      </div>
                   </div>
                   <button onClick={() => setSelectedDate(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                     <X size={16} />
                   </button>
                </div>
                
                {calendarData[selectedDate] ? (
                  <div className="grid grid-cols-3 gap-4">
                     <div className="bg-emerald-500/20 rounded-2xl p-3 border border-emerald-400/20">
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-200 mb-1">{language === 'ar' ? 'دخل' : 'Income'}</p>
                        <p className="text-lg font-black">${calendarData[selectedDate].income.toLocaleString()}</p>
                     </div>
                     <div className="bg-rose-500/20 rounded-2xl p-3 border border-rose-400/20">
                        <p className="text-[9px] font-black uppercase tracking-widest text-rose-200 mb-1">{language === 'ar' ? 'صرف' : 'Expense'}</p>
                        <p className="text-lg font-black">${calendarData[selectedDate].expense.toLocaleString()}</p>
                     </div>
                     <div className="bg-blue-500/20 rounded-2xl p-3 border border-blue-400/20">
                        <p className="text-[9px] font-black uppercase tracking-widest text-blue-200 mb-1">{language === 'ar' ? 'صافي' : 'Net'}</p>
                        <p className="text-lg font-black">${(calendarData[selectedDate].income - calendarData[selectedDate].expense).toLocaleString()}</p>
                     </div>
                  </div>
                ) : (
                  <p className="text-center opacity-60 text-xs font-bold py-2">{language === 'ar' ? 'لا توجد عمليات' : 'No transactions recorded'}</p>
                )}
             </div>
           )}
        </div>
      )}

      {/* --- LIST VIEW FILTERS (Only visible in List Mode) --- */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[3rem] shadow-sm border border-slate-50 dark:border-slate-800 space-y-6">
          <div className="flex flex-wrap gap-2 p-1.5 bg-slate-50 dark:bg-slate-900 rounded-3xl">
            {(['weekly', 'monthly', 'yearly', 'all'] as const).map(range => (
              <button key={range} onClick={() => setTimeRange(range)} className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-2xl transition-all ${timeRange === range ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:text-blue-500'}`}>
                {language === 'ar' ? (range === 'weekly' ? 'أسبوع' : range === 'monthly' ? 'شهر' : range === 'yearly' ? 'سنة' : 'الكل') : range}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder={language === 'ar' ? 'بحث...' : 'Search records...'} 
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-[11px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400" 
              />
            </div>
            
            <div className="relative">
              <Layers size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                value={selectedGroupId} onChange={(e) => { setSelectedGroupId(e.target.value); setSelectedClientId('all'); }} 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-[11px] font-bold text-slate-900 dark:text-white appearance-none cursor-pointer"
              >
                <option value="all">{language === 'ar' ? 'كل المجموعات' : 'All Groups'}</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
              </select>
            </div>

            <div className="relative">
              <Users size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-[11px] font-bold text-slate-900 dark:text-white appearance-none cursor-pointer"
              >
                <option value="all">{language === 'ar' ? 'كل العملاء' : 'All Clients'}</option>
                {filteredClients.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* --- SHARED: Summary Totals & Transaction List --- */}
      
      {/* Summary Totals Bar - Hide in calendar mode unless no date selected to avoid clutter */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-2 gap-4 px-2">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 p-5 rounded-[2.5rem] flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">{language === 'ar' ? 'إجمالي الدخل' : 'Total Income'}</p>
              <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">${totals.income.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50 p-5 rounded-[2.5rem] flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">{language === 'ar' ? 'إجمالي الإنفاق' : 'Total Expenses'}</p>
              <p className="text-xl font-black text-rose-700 dark:text-rose-300">${totals.expense.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
              <ArrowDownRight size={20} />
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-50 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-50 dark:border-slate-800">
                <th className="px-6 py-5 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'التفاصيل' : 'Details'}</th>
                <th className="px-6 py-5 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                <th className="px-6 py-5 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">{language === 'ar' ? 'الملاحظة' : 'Note'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredTransactions.map(t => {
                const client = clients.find(c => c.id === t.clientId);
                const group = groups.find(g => g.id === t.groupId);
                return (
                  <tr key={t.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10 group transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center text-lg shadow-sm">{client?.icon || '👤'}</div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-black dark:text-slate-100">{client?.name} <span className="text-[10px] text-slate-500 ml-1 font-bold">({group?.name})</span></span>
                          {editingId === t.id ? (
                             <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="text-[10px] font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-2 py-1 rounded-lg mt-1 outline-none ring-2 ring-blue-500/20" />
                          ) : (
                             <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter mt-1">{new Date(t.date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      {editingId === t.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <input value={editAmount} onChange={e => setEditAmount(e.target.value)} className="w-20 text-xs font-bold p-2 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl outline-none ring-2 ring-blue-500/20 text-right" />
                          <button onClick={() => handleUpdate(t.id)} className="text-emerald-500 p-2"><Check size={20}/></button>
                        </div>
                      ) : (
                        <span className={`text-sm font-black ${t.type === TransactionType.INCOME ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
                          ${t.amount.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right relative">
                       <div className="flex flex-col items-end">
                         <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 max-w-[150px] truncate" title={t.note}>
                           {t.note || (language === 'ar' ? '-' : '-')}
                         </span>
                         {/* Secondary hover actions to keep app functional but clean */}
                         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                           <button onClick={() => { setEditingId(t.id); setEditAmount(t.amount.toString()); setEditDate(t.date); }} className="p-1.5 text-slate-400 hover:text-blue-500"><Edit3 size={14}/></button>
                           <button onClick={() => handleDelete(t.id)} className="p-1.5 text-slate-400 hover:text-rose-500"><Trash2 size={14}/></button>
                         </div>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredTransactions.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center justify-center opacity-30 gap-4">
              <X size={48} />
              <p className="text-sm font-black uppercase tracking-[4px] text-black dark:text-white">{language === 'ar' ? 'لا توجد نتائج' : 'No Results Found'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
