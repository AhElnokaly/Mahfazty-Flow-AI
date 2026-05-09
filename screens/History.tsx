
import React, { useState, useMemo } from 'react';
import { useApp, isIncomeLike, isExpenseLike, getClientShare, isTxRelatedToGroup, isTxRelatedToClient } from '../store';
import { TransactionType, Transaction } from '../types';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { 
  Search, Download, History as HistoryIcon,
  Filter, Check, Trash2, Edit3, X, Layers, Users,
  ArrowUpRight, ArrowDownRight, Calendar as CalendarIcon, 
  List, ChevronLeft, ChevronRight, ChevronDown, Calculator, PieChart, LayoutList, Tag, FileText
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
      // Check if ANY of the clients associated with the transaction are archived
      const hasArchivedClient = t.clientIds 
        ? t.clientIds.some(cId => state.clients.find(c => c.id === cId)?.isArchived)
        : state.clients.find(c => c.id === t.clientId)?.isArchived;
      
      return (!g || !g.isArchived) && !hasArchivedClient;
    });
  }, [state.transactions, state.groups, state.clients]);

  // View State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showChart, setShowChart] = useState(false); // +++ optional feature 3 +++

  // Filter State
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(''); // +++ أضيف بناءً على طلبك +++
  const [selectedType, setSelectedType] = useState<'all' | TransactionType | 'DEBT'>('all');

  const [detailedItem, setDetailedItem] = useState<string | null>(null);
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null); // +++ أضيف بناءً على طلبك +++
  
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(t => {
      if (t.date) months.add(t.date.slice(0, 7));
    });
    const currentM = new Date().toISOString().slice(0, 7);
    months.add(currentM);
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [transactions]);
  // Delete confirmation state
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Edit Mode state +++ أضيف بناءً على طلبك +++
  const [isEditMode, setIsEditMode] = useState(false);

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
      if (!t.date) return;
      try {
        const tDate = new Date(t.date).toISOString().split('T')[0]; 
        if (!data[tDate]) data[tDate] = { income: 0, expense: 0, count: 0 };
        if (isIncomeLike(t)) data[tDate].income += t.amount;
        else if (isExpenseLike(t)) data[tDate].expense += t.amount;
        data[tDate].count += 1;
      } catch (e) {
        // Ignore invalid dates
      }
    });
    return data;
  }, [transactions]);


  // --- FILTER LOGIC ---
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];
    
    if (viewMode === 'calendar' && selectedDate) {
       return result.filter(t => {
         try {
           return new Date(t.date).toISOString().startsWith(selectedDate);
         } catch {
           return false;
         }
       });
    }

    if (searchQuery) {
      result = result.filter(t => {
        const clientsForTx = t.clientIds && t.clientIds.length > 0 ? t.clientIds : [t.clientId];
        const clientNames = clientsForTx.map(cId => clients.find(c => c.id === cId)?.name || '').join(' ');
        const groupName = t.groupId ? groups.find(g => g.id === t.groupId)?.name || '' : '';
        const itemsNames = t.items ? t.items.map(i => i.name).join(' ') : '';
        const amountStr = t.amount.toString();
        const lowerQ = searchQuery.toLowerCase();
        
        return (t.note || '').toLowerCase().includes(lowerQ) ||
               clientNames.toLowerCase().includes(lowerQ) ||
               groupName.toLowerCase().includes(lowerQ) ||
               itemsNames.toLowerCase().includes(lowerQ) ||
               amountStr.includes(lowerQ);
      });
    }

    const now = new Date();
    if (viewMode === 'list') {
      if (selectedMonth) {
        result = result.filter(t => t.date.startsWith(selectedMonth));
      } else {
        if (startDate) {
          result = result.filter(t => {
            try { return new Date(t.date).toISOString().split('T')[0] >= startDate; } catch { return false; }
          });
        }
        if (endDate) {
          result = result.filter(t => {
            try { return new Date(t.date).toISOString().split('T')[0] <= endDate; } catch { return false; }
          });
        }
      }
      if (selectedType !== 'all') {
        if (selectedType === TransactionType.INCOME) {
          result = result.filter(t => isIncomeLike(t));
        } else if (selectedType === TransactionType.EXPENSE) {
          result = result.filter(t => isExpenseLike(t));
        } else if ((selectedType as string) === 'DEBT') {
          result = result.filter(t => t.isDebt || (t.items && t.items.some(item => item.isDebt)));
        } else {
          result = result.filter(t => t.type?.toUpperCase() === selectedType?.toUpperCase());
        }
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
        result = result.filter(t => {
          try { return new Date(t.date).toISOString().startsWith(`${y}-${mStr}`); } catch { return false; }
        });
    }

    if (selectedGroupId !== 'all') {
      result = result.filter(t => isTxRelatedToGroup(t, selectedGroupId, clients));
    }

    if (selectedClientId !== 'all') {
      result = result.filter(t => isTxRelatedToClient(t, selectedClientId));
    }

    return result.sort((a, b) => {
      const timeA = new Date(a.date || 0).getTime();
      const timeB = new Date(b.date || 0).getTime();
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
    });
  }, [transactions, timeRange, searchQuery, clients, groups, selectedGroupId, selectedClientId, viewMode, currentDate, selectedDate, startDate, endDate, selectedMonth, selectedType]);

  const totals = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      let amount = t.amount;
      if (selectedClientId !== 'all') {
        amount = getClientShare(t, selectedClientId);
      } else if (selectedGroupId !== 'all') {
        amount = clients.filter(c => c.groupId === selectedGroupId).reduce((s, c) => s + getClientShare(t, c.id), 0);
      }
      
      if (isIncomeLike(t)) acc.income += amount;
      else if (isExpenseLike(t)) acc.expense += amount;
      return acc;
    }, { income: 0, expense: 0 });
  }, [filteredTransactions, selectedClientId, selectedGroupId, clients]);

  const chartData = useMemo(() => {
    if (!showChart) return [];
    
    const data: Record<string, { date: string; raw: string; income: number; expense: number }> = {};
    
    filteredTransactions.forEach(t => {
      let amount = t.amount;
      if (selectedClientId !== 'all') amount = getClientShare(t, selectedClientId);
      else if (selectedGroupId !== 'all') amount = clients.filter(c => c.groupId === selectedGroupId).reduce((s, c) => s + getClientShare(t, c.id), 0);
      
      const parts = t.date.split('-');
      const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : t.date;
      const rawDate = t.date;
      
      if (!data[rawDate]) data[rawDate] = { date: displayDate, raw: rawDate, income: 0, expense: 0 };
      
      if (isIncomeLike(t)) data[rawDate].income += amount;
      else if (isExpenseLike(t)) data[rawDate].expense += amount;
    });
    
    return Object.values(data).sort((a,b) => a.raw.localeCompare(b.raw));
  }, [filteredTransactions, showChart, selectedClientId, selectedGroupId, clients]);

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

    const headers = ['Date', 'Type', 'Amount', 'Client', 'Group', 'Note', 'Items', 'Is Debt']; // +++ أضيف بناءً على طلبك +++
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => {
        const primaryClient = clients.find(c => c.id === (t.clientIds && t.clientIds.length > 0 ? t.clientIds[0] : t.clientId));
        const clientNameDisplay = t.clientIds && t.clientIds.length > 1 
          ? `${primaryClient?.name} +${t.clientIds.length - 1}` 
          : primaryClient?.name;
        const group = groups.find(g => g.id === t.groupId);
        const itemsStr = t.items ? t.items.map(i => `${i.quantity}x ${i.name} (${i.price})`).join('; ') : '';
        return [
          new Date(t.date).toLocaleDateString(),
          t.type,
          t.amount,
          `"${clientNameDisplay || ''}"`,
          `"${group?.name || ''}"`,
          `"${t.note?.replace(/"/g, '""') || ''}"`,
          `"${itemsStr.replace(/"/g, '""')}"`,
          t.isDebt ? 'Yes' : 'No' // +++ أضيف بناءً على طلبك +++
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const fileName = selectedMonth ? `transactions_${selectedMonth}.csv` : `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', fileName);
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
    
    const headers = [['Date', 'Type', 'Amount', 'Client', 'Group', 'Note', 'Is Debt']]; // +++ أضيف بناءً على طلبك +++
    const data = filteredTransactions.map(t => {
      const primaryClientId = t.clientIds && t.clientIds.length > 0 ? t.clientIds[0] : t.clientId;
      const client = clients.find(c => c.id === primaryClientId);
      const clientNameDisplay = t.clientIds && t.clientIds.length > 1 
        ? `${client?.name} +${t.clientIds.length - 1}` 
        : client?.name;
      const group = groups.find(g => g.id === t.groupId);
      return [
        new Date(t.date).toLocaleDateString(),
        isIncomeLike(t) ? '+' : '-',
        `${t.amount} ${baseCurrency}`,
        clientNameDisplay || '-',
        group?.name || '-',
        t.note || '-',
        t.isDebt ? 'Yes' : 'No' // +++ أضيف بناءً على طلبك +++
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

    const fileName = selectedMonth ? `transactions_${selectedMonth}.pdf` : `transactions_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
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

      {/* --- LIST VIEW FILTERS --- */}
      {viewMode === 'list' && (
        <div className="bg-slate-100 dark:bg-slate-800/50 p-4 md:p-6 rounded-[2rem] space-y-6">
          
          <div className="flex justify-between items-center px-2">
             <div className="flex items-center gap-2 text-slate-500">
               <button onClick={() => { setTimeRange('all'); setSelectedMonth(''); setStartDate(''); setEndDate(''); setSelectedGroupId('all'); setSelectedClientId('all'); setSelectedType('all'); setSearchQuery(''); }} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                 <X size={20} />
               </button>
             </div>
             <div className="flex items-center gap-2 select-none">
               <span className="font-bold text-lg text-slate-900 dark:text-white">{language === 'ar' ? 'الفلاتر' : 'Filters'}</span>
               <Filter size={20} className="text-slate-900 dark:text-white" />
             </div>
          </div>

          <div className="flex gap-2 w-full justify-end">
              <button 
                onClick={() => setShowChart(!showChart)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-3xl font-black text-sm shadow-sm hover:scale-[1.02] transition-transform ${showChart ? 'bg-indigo-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
              >
                <PieChart size={18} />
                {language === 'ar' ? 'مخطط التحليل' : 'Analysis Chart'}
              </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder={language === 'ar' ? 'بحث...' : 'Search records...'} 
              className="w-full pr-12 pl-4 py-4 bg-white dark:bg-slate-800 border-none rounded-3xl text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm text-right focus:ring-2 focus:ring-blue-500" 
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Period selector */}
          <div className="space-y-3">
             <div className="flex justify-end px-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">{language === 'ar' ? 'الفترة' : 'Period'}</span>
             </div>
             <div className="flex items-center bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm gap-2">
                <button 
                  onClick={() => {
                    const currentObj = selectedMonth ? new Date(selectedMonth + '-01') : new Date();
                    currentObj.setMonth(currentObj.getMonth() - 1);
                    setSelectedMonth(currentObj.toISOString().slice(0, 7));
                    setStartDate(''); setEndDate(''); setTimeRange('all');
                  }}
                  className="p-3 text-slate-400 hover:text-blue-500 transition-colors"
                >
                  {language === 'ar' ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
                <div className="flex-1 relative flex justify-center">
                  <select
                    value={selectedMonth || new Date().toISOString().slice(0, 7)}
                    onChange={(e) => {
                      setSelectedMonth(e.target.value);
                      setStartDate(''); setEndDate(''); setTimeRange('all');
                    }}
                    className="w-full appearance-none bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full font-bold border border-blue-100 dark:border-blue-800/50 py-2 px-8 text-center cursor-pointer outline-none focus:ring-2 focus:ring-blue-500"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  >
                    {availableMonths.map(m => {
                      const isCurrent = m === new Date().toISOString().slice(0, 7);
                      const displayDate = new Date(m + '-01').toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' });
                      return (
                        <option key={m} value={m}>
                          {isCurrent ? (language === 'ar' ? `الشهر الحالي (${displayDate})` : `Current Month (${displayDate})`) : displayDate}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown size={14} className={`absolute ${language === 'ar' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none`} />
                </div>
                <button 
                  onClick={() => {
                    const currentObj = selectedMonth ? new Date(selectedMonth + '-01') : new Date();
                    currentObj.setMonth(currentObj.getMonth() + 1);
                    setSelectedMonth(currentObj.toISOString().slice(0, 7));
                    setStartDate(''); setEndDate(''); setTimeRange('all');
                  }}
                  className="p-3 text-slate-400 hover:text-blue-500 transition-colors"
                >
                  {language === 'ar' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                </button>
             </div>
          </div>

          {/* Selects */}
          <div className="space-y-3">
            <div className="relative group bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-50 dark:border-slate-800 flex items-center hover:border-blue-200 transition-colors">
              <select 
                value={selectedGroupId} onChange={(e) => { setSelectedGroupId(e.target.value); setSelectedClientId('all'); }} 
                className="w-full flex-1 appearance-none bg-transparent py-4 pl-4 pr-12 text-sm font-bold text-slate-900 dark:text-white cursor-pointer outline-none"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              >
                <option value="all">{language === 'ar' ? 'كل المجموعات' : 'All Groups'}</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
              </select>
              <Users size={18} className="absolute right-4 text-slate-400 pointer-events-none" />
              <ChevronDown size={16} className="absolute left-4 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative group bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-50 dark:border-slate-800 flex items-center hover:border-blue-200 transition-colors">
              <select 
                value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} 
                className="w-full flex-1 appearance-none bg-transparent py-4 pl-4 pr-12 text-sm font-bold text-slate-900 dark:text-white cursor-pointer outline-none"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              >
                <option value="all">{language === 'ar' ? 'كل العملاء' : 'All Clients'}</option>
                {filteredClients.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
              <Users size={18} className="absolute right-4 text-slate-400 pointer-events-none" />
              <ChevronDown size={16} className="absolute left-4 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative group bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-50 dark:border-slate-800 flex items-center hover:border-blue-200 transition-colors">
              <select 
                value={selectedType} onChange={(e) => setSelectedType(e.target.value as any)} 
                className="w-full flex-1 appearance-none bg-transparent py-4 pl-4 pr-12 text-sm font-bold text-slate-900 dark:text-white cursor-pointer outline-none"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              >
                <option value="all">{language === 'ar' ? 'كل الأصناف' : 'All Types'}</option>
                <option value={TransactionType.INCOME}>{language === 'ar' ? 'دخل' : 'Income'}</option>
                <option value={TransactionType.EXPENSE}>{language === 'ar' ? 'صرف' : 'Expense'}</option>
                <option value="DEBT">{language === 'ar' ? 'ديون وسلف' : 'Debts & Loans'}</option>
              </select>
              <Tag size={18} className="absolute right-4 text-slate-400 pointer-events-none" />
              <ChevronDown size={16} className="absolute left-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex justify-end items-center px-4 mt-2">
            <button 
                onClick={() => { setTimeRange('all'); setSelectedMonth(''); setStartDate(''); setEndDate(''); setSelectedGroupId('all'); setSelectedClientId('all'); setSelectedType('all'); setSearchQuery(''); }}
                className="text-slate-400 font-bold text-sm flex items-center gap-2 hover:text-slate-700 transition"
            >
                {language === 'ar' ? 'مسح الفلاتر' : 'Clear Filters'}
                <Trash2 size={16} />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-2">
              <button 
                onClick={() => setIsEditMode(!isEditMode)}
                className={`flex-1 flex flex-row-reverse items-center justify-center gap-2 py-4 rounded-[1.5rem] font-bold text-lg transition-transform border-[1.5px] ${isEditMode ? 'border-amber-500 bg-amber-50 text-amber-600' : 'border-blue-600 bg-transparent text-blue-600 hover:bg-blue-50'}`}
              >
                <Edit3 size={20} />
                {language === 'ar' ? 'تعديل' : 'Edit'}
              </button>
              
              <div className="flex-1 relative group z-10">
                  <button 
                    className="w-full flex flex-row-reverse items-center justify-center gap-2 py-4 bg-blue-600 outline outline-[1.5px] outline-blue-600 text-white rounded-[1.5rem] font-bold text-lg shadow-sm hover:bg-blue-700 transition-colors"
                  >
                    <ChevronDown size={20} />
                    {language === 'ar' ? 'تصدير' : 'Export'}
                    <Download size={20} />
                  </button>
                  <div className="absolute bottom-full mb-2 right-0 w-full bg-white dark:bg-slate-800 rounded-[1.5rem] shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col">
                      <button onClick={handleExportCSV} className="px-4 py-4 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-right flex items-center justify-between transition-colors">
                          <span className="bg-emerald-100 text-emerald-600 p-2 rounded-xl"><Download size={16} /></span>
                          {language === 'ar' ? 'تصدير CSV' : 'Export CSV'}
                      </button>
                      <button onClick={handleExportPDF} className="px-4 py-4 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border-t border-slate-100 dark:border-slate-700 text-right flex items-center justify-between transition-colors">
                          <span className="bg-rose-100 text-rose-600 p-2 rounded-xl"><FileText size={16} /></span>
                          {language === 'ar' ? 'تصدير PDF' : 'Export PDF'}
                      </button>
                  </div>
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

      {/* Optional Chart View */}
      {viewMode === 'list' && showChart && chartData.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-50 dark:border-slate-800 h-80 px-2 mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(val) => `${val / 1000}k`} />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="income" name={language === 'ar' ? 'دخل' : 'Income'} fill="#10B981" radius={[4, 4, 0, 0]} barSize={12} />
              <Bar dataKey="expense" name={language === 'ar' ? 'صرف' : 'Expense'} fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Transactions List */}
      <div className="space-y-2.5">
        {filteredTransactions.map(t => {
          const primaryClientId = t.clientIds && t.clientIds.length > 0 ? t.clientIds[0] : t.clientId;
          const client = clients.find(c => c.id === primaryClientId);
          const clientNameDisplay = t.clientIds && t.clientIds.length > 1 
            ? `${client?.name} +${t.clientIds.length - 1}` 
            : client?.name;
          const group = groups.find(g => g.id === t.groupId);
          const isExpanded = expandedTransactionId === t.id;
          
          const iconDisplay = t.type?.toUpperCase() === 'TRANSFER' ? '💳' : t.groupId === 'system_adjustment' ? '⚖️' : (client?.icon || '👤');
          const titleDisplay = t.type?.toUpperCase() === 'TRANSFER' ? (language === 'ar' ? 'تسديد بطاقة ائتمانية' : 'Credit Card Payment') : t.groupId === 'system_adjustment' ? (language === 'ar' ? 'تسوية رصيد' : 'Balance Adjustment') : clientNameDisplay;
          
          const groupColor = group?.color || 'bg-slate-100';
          const baseColor = t.color ? t.color : groupColor;

          return (
            <div 
               key={t.id} 
               onClick={() => setExpandedTransactionId(isExpanded ? null : t.id)}
               className={`bg-white dark:bg-slate-800 rounded-2xl p-3 md:p-4 shadow-sm border border-slate-50 dark:border-slate-800 cursor-pointer overflow-hidden relative group transition-all duration-300 hover:shadow-md ${isExpanded ? 'ring-1 ring-offset-1 dark:ring-offset-slate-900 ' + baseColor.replace('bg-', 'ring-') : ''}`}
            >
               {/* Color Accent Line */}
               <div className={`absolute top-0 bottom-0 ${language === 'ar' ? 'right-0' : 'left-0'} w-1.5 ${baseColor}`}></div>

               <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-3 z-10 pl-2">
                     <div className={`w-10 h-10 rounded-[0.85rem] flex flex-col items-center justify-center text-lg shadow-sm border border-white/20 text-white ${baseColor} transform group-hover:scale-105 transition-transform`}>
                        {iconDisplay}
                     </div>
                     <div className="flex flex-col text-left">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                           {titleDisplay}
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                           {t.groupId !== 'system_adjustment' && t.type !== TransactionType.TRANSFER && (
                             <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${baseColor.replace('bg-', 'text-')} bg-slate-50 dark:bg-slate-900`}>
                               {group?.name || ''}
                             </span>
                           )}
                           {t.isDebt && (
                             <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 text-[9px] rounded font-bold uppercase tracking-wider">
                               {language === 'ar' ? 'دين' : 'Debt'}
                             </span>
                           )}
                           {t.paymentMethod && (
                             <span className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-500 text-[9px] rounded font-bold">
                               {t.paymentMethod === 'cash' ? (language === 'ar' ? 'كاش' : 'Cash') : (language === 'ar' ? 'فيزا' : 'Visa')}
                             </span>
                           )}
                        </div>
                     </div>
                  </div>
                  <div className="flex flex-col items-end z-10">
                     <span className={`text-base font-black ${
                        isIncomeLike(t) 
                          ? 'text-emerald-500 dark:text-emerald-400' 
                          : t.type?.toUpperCase() === 'TRANSFER'
                            ? 'text-blue-500 dark:text-blue-400'
                            : t.paymentMethod === 'credit' 
                              ? 'text-purple-500 dark:text-purple-400' 
                              : 'text-slate-800 dark:text-slate-200'
                      }`}>
                        {isIncomeLike(t) ? '+' : '-'}${t.amount.toLocaleString()}
                     </span>
                     {t.referenceTotal && (
                        <span className="text-[9px] text-slate-400 font-bold mt-0.5">
                          {language === 'ar' ? 'من أصل' : 'out of'} ${t.referenceTotal.toLocaleString()}
                        </span>
                     )}
                     <span className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase">
                        {new Date(t.date).toLocaleDateString()}
                     </span>
                  </div>
               </div>
               
               {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 z-10 relative px-1">
                     
                     {t.note && (
                       <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg text-left border border-slate-100 dark:border-slate-800">
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{t.note}</p>
                       </div>
                     )}
                     
                     {t.items && t.items.length > 0 && (
                       <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2 text-left">
                           {language === 'ar' ? 'السلع' : 'Items'} ({t.items.length})
                         </p>
                         <div className="space-y-1.5">
                           {t.items.map(item => {
                             const itemClient = item.clientId ? clients.find(c => c.id === item.clientId) : null;
                             return (
                               <div 
                                 key={item.id} 
                                 className="flex justify-between items-center text-xs font-bold bg-white dark:bg-slate-800 p-2.5 rounded-lg cursor-pointer hover:shadow hover:text-blue-500 transition-all border border-slate-100 dark:border-slate-700"
                                 onClick={(e) => { e.stopPropagation(); setDetailedItem(item.name); }}
                               >
                                 <div className="flex flex-col text-left">
                                   <span className="text-slate-700 dark:text-slate-200">{item.quantity}x {item.name}</span>
                                   {itemClient && <span className="text-[9px] text-slate-400">{itemClient.name}</span>}
                                 </div>
                                 <span className="text-slate-500">${item.price.toLocaleString()}</span>
                               </div>
                             );
                           })}
                         </div>
                       </div>
                     )}

                     {(t.shares || t.pricePerShare) && (
                       <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800/30 text-left">
                         <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wide mb-1.5">
                           {language === 'ar' ? 'تفاصيل السهم' : 'Stock Details'}
                         </p>
                         <div className="flex justify-between items-center text-xs font-bold text-indigo-700 dark:text-indigo-300">
                           <span>{t.shares} {language === 'ar' ? 'سهم' : 'Shares'}</span>
                           <span>× ${t.pricePerShare}</span>
                         </div>
                       </div>
                     )}

                     {(t.interestRate || t.duration) && (
                       <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800/30 text-left">
                         <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-wide mb-1.5">
                           {language === 'ar' ? 'تفاصيل الوديعة' : 'Deposit Details'}
                         </p>
                         <div className="flex justify-between items-center text-xs font-bold text-emerald-700 dark:text-emerald-300">
                           <span>{t.interestRate}%</span>
                           <span>{t.duration} {language === 'ar' ? 'شهر' : 'Mo'}</span>
                         </div>
                       </div>
                     )}
                     
                     <div className="flex gap-2 justify-end mt-1">
                        {isEditMode && (
                          <button onClick={(e) => {
                            e.stopPropagation();
                            const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-purple-500', 'bg-slate-500'];
                            const nextColor = colors[(colors.indexOf(t.color || '') + 1) % colors.length];
                            dispatch.updateTransaction(t.id, { color: nextColor });
                          }} className="w-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-lg hover:text-amber-500 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                          </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); navigate('/add', { state: { editTransactionId: t.id } }); }} className="flex-1 flex justify-center items-center gap-1.5 p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg font-black text-xs tracking-wide transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/40">
                           <Edit3 size={14} />
                           {language === 'ar' ? 'تعديل' : 'Edit'}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} className="flex-1 flex justify-center items-center gap-1.5 p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-lg font-black text-xs tracking-wide transition-colors hover:bg-rose-100 dark:hover:bg-rose-900/40">
                           <Trash2 size={14} />
                           {language === 'ar' ? 'مسح' : 'Delete'}
                        </button>
                     </div>
                  </div>
               )}
            </div>
          );
        })}

        {filteredTransactions.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 mb-6 border-4 border-white dark:border-slate-900 shadow-sm">
              <Search size={40} />
            </div>
            <p className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
              {language === 'ar' ? 'لا توجد نتائج' : 'No Results Found'}
            </p>
            <p className="text-sm text-slate-500 font-medium max-w-sm">
              {language === 'ar' ? 'لم نتمكن من العثور على أي معاملات تطابق معايير البحث الخاصة بك.' : 'We couldn\'t find any transactions matching your search criteria.'}
            </p>
          </div>
        )}
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
                     clientId: t.clientId,
                     clientIds: t.clientIds
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
                               <th className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">{language === 'ar' ? 'التصنيف' : 'Category'}</th>
                               <th className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">{language === 'ar' ? 'المتجر/العميل' : 'Store/Client'}</th>
                             </tr>
                           </thead>
                         <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                           {itemTransactions.map((t: any, idx: number) => {
                             const primaryClientId = t.clientIds && t.clientIds.length > 0 ? t.clientIds[0] : t.clientId;
                             const client = clients.find((c: any) => c.id === primaryClientId);
                             const clientNameDisplay = t.clientIds && t.clientIds.length > 1 
                               ? `${client?.name} +${t.clientIds.length - 1}` 
                               : client?.name;
                             const matchedCat = (state.categories || []).find(c => c.id === t.category);
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
                                   {matchedCat ? (
                                     <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                                       <span>{matchedCat.icon}</span>
                                       <span>{matchedCat.name}</span>
                                     </div>
                                   ) : (
                                     <span className="text-xs text-slate-400">-</span>
                                   )}
                                 </td>
                                 <td className="px-4 md:px-6 py-4">
                                   <div className="flex items-center gap-2">
                                     <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs">
                                       {client?.icon || '🏪'}
                                     </span>
                                     <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{clientNameDisplay || '-'}</span>
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
