
import React, { useState, useMemo } from 'react';
import { useApp } from '../store';
import { TransactionType, Transaction } from '../types';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Download, History as HistoryIcon,
  Filter, Check, Trash2, Edit3, X, Layers, Users,
  ArrowUpRight, ArrowDownRight, Calendar as CalendarIcon, 
  List, ChevronLeft, ChevronRight, Calculator, PieChart, LayoutList, Tag, FileText
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

type TimeRange = 'weekly' | 'monthly' | 'yearly' | 'all';
type ViewMode = 'list' | 'calendar';

const History: React.FC = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const { language, baseCurrency } = state;
  const groups = useMemo(() => state.groups.filter(g => !g.isArchived), [state.groups]);
  const clients = useMemo(() => state.clients.filter(c => !c.isArchived), [state.clients]);
  const transactions = useMemo(() => {
    return state.transactions.filter(t => {
      const g = state.groups.find(g => g.id === t.groupId);
      const c = state.clients.find(c => c.id === t.clientId);
      return (!g || !g.isArchived) && (!c || !c.isArchived);
    });
  }, [state.transactions, state.groups, state.clients]);

  // View State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Filter State
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | TransactionType>('all');

  const [detailedItem, setDetailedItem] = useState<string | null>(null);
  
  // Delete confirmation state
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

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
        return (t.note || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
               (client?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    const now = new Date();
    if (viewMode === 'list') {
      if (startDate) {
        result = result.filter(t => t.date >= startDate);
      }
      if (endDate) {
        result = result.filter(t => t.date <= endDate);
      }
      if (selectedType !== 'all') {
        result = result.filter(t => t.type === selectedType);
      }
      if (timeRange !== 'all' && !startDate && !endDate) {
        result = result.filter(t => {
          const tDate = new Date(t.date);
          const diffDays = Math.ceil(Math.abs(now.getTime() - tDate.getTime()) / (1000 * 60 * 60 * 24));
          if (timeRange === 'weekly') return diffDays <= 7;
          if (timeRange === 'monthly') return diffDays <= 30;
          if (timeRange === 'yearly') return diffDays <= 365;
          return true;
        });
      }
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
  }, [transactions, timeRange, searchQuery, clients, selectedGroupId, selectedClientId, viewMode, currentDate, selectedDate, startDate, endDate, selectedType]);

  const totals = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      if (t.type === TransactionType.INCOME) acc.income += t.amount;
      else acc.expense += t.amount;
      return acc;
    }, { income: 0, expense: 0 });
  }, [filteredTransactions]);

  const handleDelete = (id: string) => {
    setItemToDelete(id);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      vibrate();
      dispatch.deleteTransaction(itemToDelete);
      setItemToDelete(null);
    }
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      dispatch.setNotification({ message: language === 'ar' ? 'لا توجد بيانات للتصدير' : 'No data to export', type: 'error' });
      return;
    }

    const headers = ['Date', 'Type', 'Amount', 'Client', 'Group', 'Note', 'Items'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => {
        const client = clients.find(c => c.id === t.clientId);
        const group = groups.find(g => g.id === t.groupId);
        const itemsStr = t.items ? t.items.map(i => `${i.quantity}x ${i.name} (${i.price})`).join('; ') : '';
        return [
          new Date(t.date).toLocaleDateString(),
          t.type,
          t.amount,
          `"${client?.name || ''}"`,
          `"${group?.name || ''}"`,
          `"${t.note?.replace(/"/g, '""') || ''}"`,
          `"${itemsStr.replace(/"/g, '""')}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    dispatch.setNotification({ message: language === 'ar' ? 'تم تصدير التقرير بنجاح' : 'Report exported successfully', type: 'success' });
  };

  // +++ أضيف بناءً على طلبك +++
  const handleExportPDF = () => {
    if (filteredTransactions.length === 0) {
      dispatch.setNotification({ message: language === 'ar' ? 'لا توجد بيانات للتصدير' : 'No data to export', type: 'error' });
      return;
    }

    const doc = new jsPDF();
    const title = language === 'ar' ? 'تقرير المعاملات' : 'Transactions Report';
    
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    const headers = [['Date', 'Type', 'Amount', 'Client', 'Group', 'Note']];
    const data = filteredTransactions.map(t => {
      const client = clients.find(c => c.id === t.clientId);
      const group = groups.find(g => g.id === t.groupId);
      return [
        new Date(t.date).toLocaleDateString(),
        t.type === TransactionType.INCOME ? '+' : '-',
        `${t.amount} ${baseCurrency}`,
        client?.name || '-',
        group?.name || '-',
        t.note || '-'
      ];
    });

    (doc as any).autoTable({
      startY: 30,
      head: headers,
      body: data,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`transactions_${new Date().toISOString().split('T')[0]}.pdf`);
    dispatch.setNotification({ message: language === 'ar' ? 'تم تصدير التقرير بنجاح' : 'Report exported successfully', type: 'success' });
  };
  // ++++++++++++++++++++++++++++

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
            h-24 md:h-28 rounded-3xl p-2 md:p-3 border transition-all cursor-pointer relative flex flex-col justify-between group
            ${bgColor} ${borderColor}
            ${isSelected ? 'shadow-lg ring-4 ring-blue-500/20 z-10 scale-[1.02]' : 'hover:border-blue-300 dark:hover:border-slate-600'}
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
            <div className="flex flex-col gap-1 mt-1">
              {dayData.income > 0 && (
                <div className={`flex items-center justify-between px-1.5 py-1 rounded-md ${isSelected ? 'bg-white/10' : 'bg-emerald-100/50 dark:bg-emerald-900/40'}`}>
                   <ArrowUpRight size={10} className={isSelected ? "text-emerald-200" : "text-emerald-600 dark:text-emerald-400"} />
                   <span className={`text-[9px] font-black truncate ${isSelected ? "text-emerald-100" : "text-emerald-700 dark:text-emerald-400"}`}>
                     {dayData.income >= 1000 ? (dayData.income/1000).toFixed(1) + 'k' : dayData.income}
                   </span>
                </div>
              )}
              {dayData.expense > 0 && (
                <div className={`flex items-center justify-between px-1.5 py-1 rounded-md ${isSelected ? 'bg-white/10' : 'bg-rose-100/50 dark:bg-rose-900/40'}`}>
                   <ArrowDownRight size={10} className={isSelected ? "text-rose-200" : "text-rose-600 dark:text-rose-400"} />
                   <span className={`text-[9px] font-black truncate ${isSelected ? "text-rose-100" : "text-rose-700 dark:text-rose-400"}`}>
                     {dayData.expense >= 1000 ? (dayData.expense/1000).toFixed(1) + 'k' : dayData.expense}
                   </span>
                </div>
              )}
              {/* Tooltip on hover for exact numbers */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-slate-900 text-white text-[10px] p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 hidden md:block shadow-xl">
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
           className={`p-5 md:p-6 rounded-3xl border cursor-pointer transition-all relative overflow-hidden group ${
             viewMode === 'list' 
               ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 border-blue-500' 
               : 'bg-white dark:bg-slate-800 text-slate-500 hover:border-blue-200 border-slate-100 dark:border-slate-800'
           }`}
         >
            <div className="relative z-10 flex flex-col items-center justify-center h-full gap-2">
               <LayoutList size={28} className={viewMode === 'list' ? 'text-white' : 'text-slate-400 group-hover:text-blue-500 transition-colors'} />
               <h3 className="text-xs font-bold uppercase tracking-wide">{language === 'ar' ? 'عرض القائمة' : 'List View'}</h3>
            </div>
            {viewMode === 'list' && <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>}
         </div>

         {/* Calendar View Card */}
         <div 
           onClick={() => { setViewMode('calendar'); setSelectedDate(null); }}
           className={`p-5 md:p-6 rounded-3xl border cursor-pointer transition-all relative overflow-hidden group ${
             viewMode === 'calendar' 
               ? 'bg-purple-600 text-white shadow-xl shadow-purple-500/20 border-purple-500' 
               : 'bg-white dark:bg-slate-800 text-slate-500 hover:border-purple-200 border-slate-100 dark:border-slate-800'
           }`}
         >
            <div className="relative z-10 flex flex-col items-center justify-center h-full gap-2">
               <CalendarIcon size={28} className={viewMode === 'calendar' ? 'text-white' : 'text-slate-400 group-hover:text-purple-500 transition-colors'} />
               <h3 className="text-xs font-bold uppercase tracking-wide">{language === 'ar' ? 'التقويم المالي' : 'Calendar View'}</h3>
            </div>
             {viewMode === 'calendar' && <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>}
         </div>
      </div>

      {/* --- CALENDAR VIEW --- */}
      {viewMode === 'calendar' && (
        <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
           {/* Calendar Header with Centered Arrows */}
           <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-50 dark:border-slate-800 flex flex-col items-center justify-center gap-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
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
           <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-3xl shadow-sm border border-slate-50 dark:border-slate-800">
              <div className="grid grid-cols-7 mb-4 text-center">
                 {weekDays.map(d => (
                   <div key={d} className="text-[10px] font-black text-slate-400 uppercase tracking-wide py-2">
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
             <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-3xl text-white shadow-xl shadow-blue-500/20 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                         <CalendarIcon size={20} className="text-white" />
                      </div>
                      <div>
                         <h3 className="text-lg font-black">{new Date(selectedDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                         <p className="text-xs uppercase tracking-wide opacity-70 font-bold">{language === 'ar' ? 'ملخص اليوم' : 'Daily Summary'}</p>
                      </div>
                   </div>
                   <button onClick={() => setSelectedDate(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                     <X size={16} />
                   </button>
                </div>
                
                {calendarData[selectedDate] ? (
                  <div className="grid grid-cols-3 gap-4">
                     <div className="bg-emerald-500/20 rounded-2xl p-3 border border-emerald-400/20">
                        <p className="text-[10px] font-black uppercase tracking-wide text-emerald-200 mb-1">{language === 'ar' ? 'دخل' : 'Income'}</p>
                        <p className="text-lg font-black">${calendarData[selectedDate].income.toLocaleString()}</p>
                     </div>
                     <div className="bg-rose-500/20 rounded-2xl p-3 border border-rose-400/20">
                        <p className="text-[10px] font-black uppercase tracking-wide text-rose-200 mb-1">{language === 'ar' ? 'صرف' : 'Expense'}</p>
                        <p className="text-lg font-black">${calendarData[selectedDate].expense.toLocaleString()}</p>
                     </div>
                     <div className="bg-blue-500/20 rounded-2xl p-3 border border-blue-400/20">
                        <p className="text-[10px] font-black uppercase tracking-wide text-blue-200 mb-1">{language === 'ar' ? 'صافي' : 'Net'}</p>
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
        <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-3xl shadow-sm border border-slate-50 dark:border-slate-800 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-50 dark:bg-slate-900 rounded-2xl w-full md:w-auto flex-1">
              {(['weekly', 'monthly', 'yearly', 'all'] as const).map(range => (
                <button key={range} onClick={() => setTimeRange(range)} className={`flex-1 py-2 px-4 text-xs font-bold uppercase tracking-wide rounded-xl transition-all ${timeRange === range ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-blue-500'}`}>
                  {language === 'ar' ? (range === 'weekly' ? 'أسبوع' : range === 'monthly' ? 'شهر' : range === 'yearly' ? 'سنة' : 'الكل') : range}
                </button>
              ))}
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button 
                onClick={handleExportCSV}
                className="flex flex-1 items-center justify-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-wide shadow-lg hover:scale-105 transition-transform"
              >
                <Download size={16} />
                {language === 'ar' ? 'تصدير CSV' : 'Export CSV'}
              </button>
              {/* +++ أضيف بناءً على طلبك +++ */}
              <button 
                onClick={handleExportPDF}
                className="flex flex-1 items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-wide shadow-lg hover:scale-105 transition-transform"
              >
                <FileText size={16} />
                {language === 'ar' ? 'تصدير PDF' : 'Export PDF'}
              </button>
              {/* ++++++++++++++++++++++++++++ */}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder={language === 'ar' ? 'بحث...' : 'Search records...'} 
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400" 
              />
            </div>
            
            <div className="relative">
              <Layers size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                value={selectedGroupId} onChange={(e) => { setSelectedGroupId(e.target.value); setSelectedClientId('all'); }} 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-xs font-bold text-slate-900 dark:text-white appearance-none cursor-pointer"
              >
                <option value="all">{language === 'ar' ? 'كل المجموعات' : 'All Groups'}</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
              </select>
            </div>

            <div className="relative">
              <Users size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-xs font-bold text-slate-900 dark:text-white appearance-none cursor-pointer"
              >
                <option value="all">{language === 'ar' ? 'كل العملاء' : 'All Clients'}</option>
                {filteredClients.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>

            <div className="relative">
              <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                value={selectedType} onChange={(e) => setSelectedType(e.target.value as any)} 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-xs font-bold text-slate-900 dark:text-white appearance-none cursor-pointer"
              >
                <option value="all">{language === 'ar' ? 'كل الأنواع' : 'All Types'}</option>
                <option value={TransactionType.INCOME}>{language === 'ar' ? 'دخل' : 'Income'}</option>
                <option value={TransactionType.EXPENSE}>{language === 'ar' ? 'صرف' : 'Expense'}</option>
              </select>
            </div>

            <div className="relative">
              <CalendarIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setTimeRange('all'); }} 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-xs font-bold text-slate-900 dark:text-white"
                title={language === 'ar' ? 'تاريخ البداية' : 'Start Date'}
              />
            </div>

            <div className="relative">
              <CalendarIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setTimeRange('all'); }} 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-xs font-bold text-slate-900 dark:text-white"
                title={language === 'ar' ? 'تاريخ النهاية' : 'End Date'}
              />
            </div>
          </div>
        </div>
      )}

      {/* --- SHARED: Summary Totals & Transaction List --- */}
      
      {/* Summary Totals Bar - Hide in calendar mode unless no date selected to avoid clutter */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-2 gap-4 px-2">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 p-4 md:p-5 rounded-3xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">{language === 'ar' ? 'إجمالي الدخل' : 'Total Income'}</p>
              <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">${totals.income.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50 p-4 md:p-5 rounded-3xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide mb-1">{language === 'ar' ? 'إجمالي الإنفاق' : 'Total Expenses'}</p>
              <p className="text-xl font-black text-rose-700 dark:text-rose-300">${totals.expense.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
              <ArrowDownRight size={20} />
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-50 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-50 dark:border-slate-800">
                <th className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{language === 'ar' ? 'التفاصيل' : 'Details'}</th>
                <th className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-right">{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                <th className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-right">{language === 'ar' ? 'الملاحظة' : 'Note'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredTransactions.map(t => {
                const client = clients.find(c => c.id === t.clientId);
                const group = groups.find(g => g.id === t.groupId);
                return (
                  <tr key={t.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10 group transition-colors">
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center text-lg shadow-sm">
                          {t.groupId === 'system_adjustment' ? '⚖️' : (client?.icon || '👤')}
                        </div>
                        <div className="flex flex-col">
                             <>
                               <span className="text-xs font-black text-black dark:text-slate-100">
                                 {t.groupId === 'system_adjustment' ? (language === 'ar' ? 'تسوية رصيد' : 'Balance Adjustment') : client?.name} 
                                 {t.groupId !== 'system_adjustment' && <span className="text-[10px] text-slate-500 ml-1 font-bold">({group?.name})</span>}
                               </span>
                               <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-1">{new Date(t.date).toLocaleDateString()}</span>
                             </>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className={`text-sm font-black ${t.type === TransactionType.INCOME ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
                            ${t.amount.toLocaleString()}
                          </span>
                          {t.referenceTotal && (
                            <span className="text-[10px] text-slate-400 font-bold mt-0.5">
                              {language === 'ar' ? 'من أصل' : 'out of'} ${t.referenceTotal.toLocaleString()}
                            </span>
                          )}
                        </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-right relative">
                       <div className="flex flex-col items-end">
                           <span className="text-xs font-bold text-slate-500 dark:text-slate-400 max-w-[150px] truncate" title={t.note}>
                             {t.note || (language === 'ar' ? '-' : '-')}
                           </span>
                         {t.items && t.items.length > 0 && (
                           <div className="mt-2 w-full max-w-[200px] bg-slate-50 dark:bg-slate-900/50 rounded-xl p-2 border border-slate-100 dark:border-slate-800">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 text-left">
                               {language === 'ar' ? 'السلع' : 'Items'} ({t.items.length})
                             </p>
                             <div className="space-y-1 max-h-20 overflow-y-auto custom-scrollbar">
                               {t.items.map(item => (
                                 <div 
                                   key={item.id} 
                                   className="flex justify-between items-center text-xs font-bold cursor-pointer hover:text-blue-500 transition-colors"
                                   onClick={() => setDetailedItem(item.name)}
                                 >
                                   <span className="text-slate-600 dark:text-slate-300 truncate max-w-[100px] text-left">{item.quantity}x {item.name}</span>
                                   <span className="text-slate-500">{item.price.toLocaleString()}</span>
                                 </div>
                               ))}
                             </div>
                           </div>
                         )}
                         {/* +++ أضيف بناءً على طلبك: تفاصيل الأسهم والودائع في السجل +++ */}
                         {(t.shares || t.pricePerShare) && (
                           <div className="mt-2 w-full max-w-[200px] bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-2 border border-indigo-100 dark:border-indigo-800/30 text-left">
                             <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide mb-1">
                               {language === 'ar' ? 'تفاصيل السهم' : 'Stock Details'}
                             </p>
                             <div className="flex justify-between items-center text-xs font-bold text-indigo-700 dark:text-indigo-300">
                               <span>{t.shares} {language === 'ar' ? 'سهم' : 'Shares'}</span>
                               <span>× ${t.pricePerShare}</span>
                             </div>
                           </div>
                         )}
                         {(t.interestRate || t.duration) && (
                           <div className="mt-2 w-full max-w-[200px] bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-2 border border-emerald-100 dark:border-emerald-800/30 text-left">
                             <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide mb-1">
                               {language === 'ar' ? 'تفاصيل الوديعة' : 'Deposit Details'}
                             </p>
                             <div className="flex justify-between items-center text-xs font-bold text-emerald-700 dark:text-emerald-300">
                               <span>{t.interestRate}%</span>
                               <span>{t.duration} {language === 'ar' ? 'شهر' : 'Mo'}</span>
                             </div>
                           </div>
                         )}
                         {/* ++++++++++++++++++++++++++++ */}
                         {/* Secondary hover actions to keep app functional but clean */}
                         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                           <button onClick={() => { 
                             navigate('/add', { state: { editTransactionId: t.id } });
                           }} className="p-1.5 text-slate-400 hover:text-blue-500"><Edit3 size={14}/></button>
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
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 mb-6">
                <Search size={40} />
              </div>
              <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wide mb-2">
                {language === 'ar' ? 'لا توجد نتائج' : 'No Results Found'}
              </p>
              <p className="text-sm text-slate-500 font-medium max-w-sm">
                {language === 'ar' ? 'لم نتمكن من العثور على أي معاملات تطابق معايير البحث الخاصة بك.' : 'We couldn\'t find any transactions matching your search criteria.'}
              </p>
            </div>
          )}
        </div>
      </div>

       {/* Detailed Item Modal */}
       {detailedItem && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setDetailedItem(null)}></div>
           <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden relative flex flex-col animate-in zoom-in-95 duration-300">
             <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center">
                   <Tag size={24} />
                 </div>
                 <div>
                   <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{detailedItem}</h3>
                   <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wide">
                     {language === 'ar' ? 'سجل الأسعار المفصل' : 'Detailed Price History'}
                   </p>
                 </div>
               </div>
               <button onClick={() => setDetailedItem(null)} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-rose-500 shadow-sm"><X size={20}/></button>
             </div>
             
             <div className="overflow-y-auto p-4 md:p-6">
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
                 }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

                 if (itemTransactions.length === 0) return null;

                 const latestPrice = itemTransactions[0].price;
                 const oldestPrice = itemTransactions[itemTransactions.length - 1].price;
                 const priceChange = latestPrice - oldestPrice;
                 const priceChangePercent = oldestPrice > 0 ? (priceChange / oldestPrice) * 100 : 0;

                 return (
                   <div className="space-y-6">
                     {/* Stats Row */}
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                       <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800">
                         <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{language === 'ar' ? 'أحدث سعر' : 'Latest Price'}</p>
                         <p className="text-2xl font-black text-slate-900 dark:text-white">${latestPrice.toLocaleString()}</p>
                       </div>
                       <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800">
                         <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{language === 'ar' ? 'التغير' : 'Change'}</p>
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
                         <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{language === 'ar' ? 'مرات الشراء' : 'Purchases'}</p>
                         <p className="text-2xl font-black text-slate-900 dark:text-white">{itemTransactions.length}</p>
                       </div>
                     </div>

                     {/* Detailed List */}
                     <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                       <div className="overflow-x-auto">
                         <table className="w-full text-left border-collapse">
                           <thead>
                             <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                               <th className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                               <th className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">{language === 'ar' ? 'السعر' : 'Price'}</th>
                               <th className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">{language === 'ar' ? 'الكمية' : 'Qty'}</th>
                               <th className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">{language === 'ar' ? 'المتجر/العميل' : 'Store/Client'}</th>
                             </tr>
                           </thead>
                         <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                           {itemTransactions.map((t: any, idx: number) => {
                             const client = clients.find((c: any) => c.id === t.clientId);
                             return (
                               <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                                 <td className="px-4 md:px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-300">
                                   {new Date(t.date).toLocaleDateString()}
                                 </td>
                                 <td className="px-4 md:px-6 py-4 text-sm font-black text-slate-900 dark:text-white">
                                   ${t.price.toLocaleString()}
                                 </td>
                                 <td className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500">
                                   {t.quantity}
                                 </td>
                                 <td className="px-4 md:px-6 py-4">
                                   <div className="flex items-center gap-2">
                                     <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs">
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
                 </div>
                 );
               })()}
             </div>
           </div>
         </div>
       )}

       <ConfirmModal
         isOpen={!!itemToDelete}
         onClose={() => setItemToDelete(null)}
         onConfirm={confirmDelete}
         title={language === 'ar' ? 'تأكيد المسح' : 'Confirm Delete'}
         message={language === 'ar' ? 'هل أنت متأكد من مسح هذه المعاملة؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this transaction? This action cannot be undone.'}
         confirmText={language === 'ar' ? 'مسح' : 'Delete'}
         cancelText={language === 'ar' ? 'إلغاء' : 'Cancel'}
       />
    </div>
  );
};

export default History;
