import React, { useState, useMemo } from 'react';
import { useApp } from '../store';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { 
  BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon, 
  Activity, Hexagon, Layers, Filter, Calendar, Users, Folder, 
  Play, ArrowLeft, Check, X, Download, Type, Grid, Tag, Save, Trash2
} from 'lucide-react';
import { TransactionType } from '../types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function GraphMaker() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const { language, transactions, groups, clients } = state;

  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'area' | 'radar' | 'composed'>('bar');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [timeGrouping, setTimeGrouping] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [dataType, setDataType] = useState<'expense' | 'income' | 'net' | 'all'>('expense');
  const [graphTitle, setGraphTitle] = useState('');
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  
  const [generatedData, setGeneratedData] = useState<any[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingGraphId, setEditingGraphId] = useState<string | null>(null);

  const handleSaveGraph = () => {
    const graphData = {
      title: graphTitle || (language === 'ar' ? 'رسم بياني جديد' : 'New Graph'),
      chartType,
      selectedGroups,
      selectedClients,
      dateRange,
      timeGrouping,
      dataType,
      showGrid,
      showLabels
    };

    if (editingGraphId) {
      dispatch.updateGraph(editingGraphId, graphData);
    } else {
      const newId = Date.now().toString();
      dispatch.saveGraph({ id: newId, ...graphData });
      setEditingGraphId(newId);
    }
  };

  const handleLoadGraph = (graph: import('../types').SavedGraph) => {
    setEditingGraphId(graph.id);
    setGraphTitle(graph.title);
    setChartType(graph.chartType);
    setSelectedGroups(graph.selectedGroups);
    setSelectedClients(graph.selectedClients);
    setDateRange(graph.dateRange);
    setTimeGrouping(graph.timeGrouping);
    setDataType(graph.dataType);
    setShowGrid(graph.showGrid);
    setShowLabels(graph.showLabels);
    // Auto generate after loading
    setTimeout(() => handleGenerate(), 100);
  };

  const handleNewGraph = () => {
    setEditingGraphId(null);
    setGraphTitle('');
    setChartType('bar');
    setSelectedGroups([]);
    setSelectedClients([]);
    setDateRange({ start: '', end: '' });
    setTimeGrouping('monthly');
    setDataType('expense');
    setShowGrid(true);
    setShowLabels(false);
    setGeneratedData(null);
  };

  const toggleSelection = (id: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (list.includes(id)) {
      setList(list.filter(item => item !== id));
    } else {
      setList([...list, id]);
    }
  };

  const handleExportCSV = () => {
    if (!generatedData || generatedData.length === 0) return;
    
    const headers = Object.keys(generatedData[0]).join(',');
    const rows = generatedData.map(row => 
      Object.values(row).map(val => `"${val}"`).join(',')
    ).join('\n');
    
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${graphTitle || 'graph_data'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      let filtered = transactions;

      // Filter by Date
      if (dateRange.start) {
        filtered = filtered.filter(t => t.date >= dateRange.start);
      }
      if (dateRange.end) {
        filtered = filtered.filter(t => t.date <= dateRange.end);
      }

      // Filter by Group
      if (selectedGroups.length > 0) {
        filtered = filtered.filter(t => selectedGroups.includes(t.groupId));
      }

      // Filter by Client
      if (selectedClients.length > 0) {
        filtered = filtered.filter(t => selectedClients.includes(t.clientId) || (t.clientIds && t.clientIds.some(cId => selectedClients.includes(cId))));
      }

      // Filter by Data Type
      if (dataType === 'expense') {
        filtered = filtered.filter(t => t.type === TransactionType.EXPENSE);
      } else if (dataType === 'income') {
        filtered = filtered.filter(t => t.type === TransactionType.INCOME);
      }

      // Grouping Data
      let processedData: any[] = [];

      if (chartType === 'pie' || chartType === 'radar') {
        // Group by Category/Group for Pie/Radar
        const grouped = filtered.reduce((acc, t) => {
          const key = groups.find(g => g.id === t.groupId)?.name || 'Unknown';
          if (!acc[key]) acc[key] = 0;
          acc[key] += t.amount;
          return acc;
        }, {} as Record<string, number>);

        processedData = Object.keys(grouped).map(key => ({
          name: key,
          value: grouped[key]
        })).sort((a, b) => b.value - a.value);

      } else {
        // Time-based grouping for Bar, Line, Area, Composed
        const grouped = filtered.reduce((acc, t) => {
          let dateKey = t.date;
          if (timeGrouping === 'monthly') {
            dateKey = t.date.substring(0, 7); // YYYY-MM
          } else if (timeGrouping === 'yearly') {
            dateKey = t.date.substring(0, 4); // YYYY
          }

          if (!acc[dateKey]) {
            acc[dateKey] = { date: dateKey, income: 0, expense: 0, net: 0 };
          }

          if (t.type === TransactionType.INCOME) {
            acc[dateKey].income += t.amount;
            acc[dateKey].net += t.amount;
          } else if (t.type === TransactionType.EXPENSE) {
            acc[dateKey].expense += t.amount;
            acc[dateKey].net -= t.amount;
          }

          return acc;
        }, {} as Record<string, any>);

        processedData = Object.values(grouped).sort((a: any, b: any) => a.date.localeCompare(b.date));
      }

      setGeneratedData(processedData);
      setIsGenerating(false);
    }, 600); // Fake loading for UX
  };

  const renderChart = () => {
    if (!generatedData || generatedData.length === 0) {
      return (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400">
          <BarChart3 size={48} className="mb-4 opacity-20" />
          <p className="text-sm font-bold uppercase tracking-widest">{language === 'ar' ? 'لا توجد بيانات مطابقة' : 'No matching data'}</p>
        </div>
      );
    }

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={generatedData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />}
              <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} />
              <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
              {(dataType === 'income' || dataType === 'all') && (
                <Bar dataKey="income" name={language === 'ar' ? 'دخل' : 'Income'} fill="#10b981" radius={[4, 4, 0, 0]}>
                  {showLabels && <LabelList dataKey="income" position="top" style={{ fontSize: '10px', fill: '#64748b' }} />}
                </Bar>
              )}
              {(dataType === 'expense' || dataType === 'all') && (
                <Bar dataKey="expense" name={language === 'ar' ? 'مصروف' : 'Expense'} fill="#ef4444" radius={[4, 4, 0, 0]}>
                  {showLabels && <LabelList dataKey="expense" position="top" style={{ fontSize: '10px', fill: '#64748b' }} />}
                </Bar>
              )}
              {dataType === 'net' && (
                <Bar dataKey="net" name={language === 'ar' ? 'الصافي' : 'Net'} fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {showLabels && <LabelList dataKey="net" position="top" style={{ fontSize: '10px', fill: '#64748b' }} />}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={generatedData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />}
              <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} />
              <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
              {(dataType === 'income' || dataType === 'all') && (
                <Line type="monotone" dataKey="income" name={language === 'ar' ? 'دخل' : 'Income'} stroke="#10b981" strokeWidth={3} dot={{ r: 4 }}>
                  {showLabels && <LabelList dataKey="income" position="top" style={{ fontSize: '10px', fill: '#64748b' }} />}
                </Line>
              )}
              {(dataType === 'expense' || dataType === 'all') && (
                <Line type="monotone" dataKey="expense" name={language === 'ar' ? 'مصروف' : 'Expense'} stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }}>
                  {showLabels && <LabelList dataKey="expense" position="top" style={{ fontSize: '10px', fill: '#64748b' }} />}
                </Line>
              )}
              {dataType === 'net' && (
                <Line type="monotone" dataKey="net" name={language === 'ar' ? 'الصافي' : 'Net'} stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }}>
                  {showLabels && <LabelList dataKey="net" position="top" style={{ fontSize: '10px', fill: '#64748b' }} />}
                </Line>
              )}
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={generatedData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />}
              <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} />
              <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
              {(dataType === 'income' || dataType === 'all') && (
                <Area type="monotone" dataKey="income" name={language === 'ar' ? 'دخل' : 'Income'} stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)">
                  {showLabels && <LabelList dataKey="income" position="top" style={{ fontSize: '10px', fill: '#64748b' }} />}
                </Area>
              )}
              {(dataType === 'expense' || dataType === 'all') && (
                <Area type="monotone" dataKey="expense" name={language === 'ar' ? 'مصروف' : 'Expense'} stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)">
                  {showLabels && <LabelList dataKey="expense" position="top" style={{ fontSize: '10px', fill: '#64748b' }} />}
                </Area>
              )}
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'composed':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={generatedData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />}
              <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} />
              <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
              <Bar dataKey="expense" name={language === 'ar' ? 'مصروف' : 'Expense'} fill="#ef4444" radius={[4, 4, 0, 0]}>
                {showLabels && <LabelList dataKey="expense" position="top" style={{ fontSize: '10px', fill: '#64748b' }} />}
              </Bar>
              <Line type="monotone" dataKey="income" name={language === 'ar' ? 'دخل' : 'Income'} stroke="#10b981" strokeWidth={3} dot={{ r: 4 }}>
                {showLabels && <LabelList dataKey="income" position="top" style={{ fontSize: '10px', fill: '#64748b' }} />}
              </Line>
            </ComposedChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={generatedData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={showLabels ? { fontSize: '10px', fill: '#64748b' } : false}
              >
                {generatedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} />
              <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'radar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={generatedData}>
              {showGrid && <PolarGrid stroke="#e2e8f0" />}
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
              <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fontSize: 10 }} />
              <Radar name={language === 'ar' ? 'القيمة' : 'Value'} dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} />
            </RadarChart>
          </ResponsiveContainer>
        );
    }
  };

  const chartTypes = [
    { id: 'bar', icon: BarChart3, label: language === 'ar' ? 'أعمدة' : 'Bar' },
    { id: 'line', icon: LineChartIcon, label: language === 'ar' ? 'خطوط' : 'Line' },
    { id: 'area', icon: Activity, label: language === 'ar' ? 'مساحة' : 'Area' },
    { id: 'composed', icon: Layers, label: language === 'ar' ? 'مركب' : 'Composed' },
    { id: 'pie', icon: PieChartIcon, label: language === 'ar' ? 'دائري' : 'Pie' },
    { id: 'radar', icon: Hexagon, label: language === 'ar' ? 'رادار' : 'Radar' },
  ];

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-900 pb-24 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-6 shadow-sm sticky top-0 z-30 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors">
          <ArrowLeft size={20} className={language === 'ar' ? 'rotate-180' : ''} />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">
            {language === 'ar' ? 'صانع الجرافات' : 'Graph Maker'}
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            {language === 'ar' ? 'توليد رسوم بيانية مخصصة' : 'Generate Custom Charts'}
          </p>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Controls Panel */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Saved Graphs */}
          {state.savedGraphs && state.savedGraphs.length > 0 && (
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Folder size={16} /> {language === 'ar' ? 'الرسوم المحفوظة' : 'Saved Graphs'}
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {state.savedGraphs.map(graph => (
                  <div key={graph.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${editingGraphId === graph.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800'}`}>
                    <button 
                      onClick={() => handleLoadGraph(graph)}
                      className="flex-1 text-left flex items-center gap-2"
                    >
                      <BarChart3 size={14} className={editingGraphId === graph.id ? 'text-blue-500' : 'text-slate-400'} />
                      <span className={`text-sm font-bold ${editingGraphId === graph.id ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>{graph.title}</span>
                    </button>
                    <button 
                      onClick={() => dispatch.deleteGraph(graph.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button 
                onClick={handleNewGraph}
                className="w-full py-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors"
              >
                {language === 'ar' ? '+ رسم بياني جديد' : '+ New Graph'}
              </button>
            </div>
          )}

          {/* Chart Title & Customization */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                <Type size={16} /> {language === 'ar' ? 'عنوان الرسم البياني' : 'Chart Title'}
              </h3>
              <input 
                type="text" 
                value={graphTitle}
                onChange={e => setGraphTitle(e.target.value)}
                placeholder={language === 'ar' ? 'أدخل عنواناً...' : 'Enter a title...'}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showGrid ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border border-slate-100 dark:border-slate-800'}`}
              >
                <Grid size={14} /> {language === 'ar' ? 'الشبكة' : 'Grid'}
              </button>
              <button
                onClick={() => setShowLabels(!showLabels)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showLabels ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border border-slate-100 dark:border-slate-800'}`}
              >
                <Tag size={14} /> {language === 'ar' ? 'القيم' : 'Labels'}
              </button>
            </div>
          </div>

          {/* Chart Type */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <BarChart3 size={16} /> {language === 'ar' ? 'نوع الرسم البياني' : 'Chart Type'}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {chartTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setChartType(type.id as any)}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all ${chartType === type.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-transparent bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <type.icon size={20} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Data Type & Time Grouping (Only for non-pie/radar) */}
          {chartType !== 'pie' && chartType !== 'radar' && (
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                  <Filter size={16} /> {language === 'ar' ? 'نوع البيانات' : 'Data Type'}
                </h3>
                <div className="flex gap-2">
                  {['all', 'income', 'expense', 'net'].map(type => (
                    <button
                      key={type}
                      onClick={() => setDataType(type as any)}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dataType === type ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      {language === 'ar' ? (type === 'all' ? 'الكل' : type === 'income' ? 'دخل' : type === 'expense' ? 'مصروف' : 'الصافي') : type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                  <Calendar size={16} /> {language === 'ar' ? 'التجميع الزمني' : 'Time Grouping'}
                </h3>
                <div className="flex gap-2">
                  {['daily', 'monthly', 'yearly'].map(type => (
                    <button
                      key={type}
                      onClick={() => setTimeGrouping(type as any)}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeGrouping === type ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      {language === 'ar' ? (type === 'daily' ? 'يومي' : type === 'monthly' ? 'شهري' : 'سنوي') : type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <Folder size={16} /> {language === 'ar' ? 'تصفية بالمجموعات' : 'Filter by Groups'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {groups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => toggleSelection(group.id, selectedGroups, setSelectedGroups)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${selectedGroups.includes(group.id) ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-200 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-slate-800 hover:border-slate-300'}`}
                  >
                    {group.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <Users size={16} /> {language === 'ar' ? 'تصفية بالعملاء' : 'Filter by Clients'}
              </h3>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                {clients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => toggleSelection(client.id, selectedClients, setSelectedClients)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${selectedClients.includes(client.id) ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-slate-800 hover:border-slate-300'}`}
                  >
                    {client.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <Calendar size={16} /> {language === 'ar' ? 'النطاق الزمني' : 'Date Range'}
              </h3>
              <div className="flex gap-2">
                <input 
                  type="date" 
                  value={dateRange.start}
                  onChange={e => setDateRange({...dateRange, start: e.target.value})}
                  className="flex-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
                />
                <input 
                  type="date" 
                  value={dateRange.end}
                  onChange={e => setDateRange({...dateRange, end: e.target.value})}
                  className="flex-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Play size={18} fill="currentColor" />
                  {language === 'ar' ? 'توليد' : 'Generate'}
                </>
              )}
            </button>
            <button 
              onClick={handleSaveGraph}
              className="px-6 py-4 bg-white dark:bg-slate-800 text-blue-600 border-2 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {language === 'ar' ? 'حفظ' : 'Save'}
            </button>
          </div>

        </div>

        {/* Output Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 h-full min-h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div className="flex-1">
                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">
                  {language === 'ar' ? 'النتيجة' : 'Output'}
                </h2>
                {graphTitle && (
                  <p className="text-sm font-bold text-slate-500 mt-1">{graphTitle}</p>
                )}
              </div>
              {generatedData && generatedData.length > 0 && (
                <button 
                  onClick={handleExportCSV}
                  className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                  title={language === 'ar' ? 'تصدير CSV' : 'Export CSV'}
                >
                  <Download size={18} />
                </button>
              )}
            </div>
            
            <div className="flex-1 relative min-h-[300px]">
              {isGenerating ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm z-10 rounded-2xl">
                  <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : null}
              {renderChart()}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
