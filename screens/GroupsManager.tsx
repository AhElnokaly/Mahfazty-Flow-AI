
import React, { useState, useMemo } from 'react';
import { useApp } from '../store';
import { 
  Plus, Trash2, Layers, UserPlus, TrendingUp, TrendingDown, 
  Briefcase, Edit3, Check, X, ChevronDown, ChevronUp, History, 
  ArrowUpRight, ArrowDownRight, Calendar, Smile, AlertCircle, Target
} from 'lucide-react';
import { TransactionType } from '../types';

const GroupsManager: React.FC = () => {
  const { state, dispatch } = useApp();
  const { language, groups, clients, transactions } = state;

  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupIcon, setNewGroupIcon] = useState('📁');
  const [newGroupBudget, setNewGroupBudget] = useState('');
  
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupValue, setEditGroupValue] = useState({ name: '', icon: '', monthlyBudget: 0 });

  const vibrate = () => {
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    vibrate();
    dispatch.addGroup(newGroupName, newGroupIcon, Number(newGroupBudget) || 0);
    setNewGroupName('');
    setNewGroupIcon('📁');
    setNewGroupBudget('');
  };

  const getGroupStats = (gid: string) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const filtered = transactions.filter(t => t.groupId === gid && t.date.startsWith(currentMonth));
    const income = filtered.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
    const expense = filtered.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
    return { income, expense };
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500 pb-20 px-2">
      <div className="text-center py-6">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
          {language === 'ar' ? 'هيكلة الميزانية' : 'Budget Architecture'}
        </h2>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[4px] mt-2">
          Manage spending limits per portfolio
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] shadow-sm border border-slate-50 dark:border-slate-800">
        <form onSubmit={handleAddGroup} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder={language === 'ar' ? 'اسم المجموعة...' : 'Group name...'} className="md:col-span-2 px-5 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-[20px] text-xs font-bold text-slate-900 dark:text-white outline-none" />
          <input type="number" value={newGroupBudget} onChange={(e) => setNewGroupBudget(e.target.value)} placeholder={language === 'ar' ? 'الميزانية...' : 'Budget...'} className="px-5 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-[20px] text-xs font-bold text-slate-900 dark:text-white outline-none" />
          <button type="submit" className="bg-blue-600 text-white rounded-[20px] font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20">
            {language === 'ar' ? 'إنشاء' : 'Create'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {groups.map((group) => {
          const stats = getGroupStats(group.id);
          const isEditing = editingGroupId === group.id;
          const budget = group.monthlyBudget || 0;
          const progress = budget > 0 ? (stats.expense / budget) * 100 : 0;
          const isOver = progress > 100;

          return (
            <div key={group.id} className="bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-50 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-8 py-6 flex flex-col gap-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 dark:bg-slate-900 text-2xl rounded-2xl flex items-center justify-center">{group.icon || '📁'}</div>
                      <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-base">{group.name}</h3>
                        <div className="flex gap-4 mt-1">
                          <span className="text-[9px] text-emerald-600 font-black uppercase">In: ${stats.income.toLocaleString()}</span>
                          <span className="text-[9px] text-rose-600 font-black uppercase">Out: ${stats.expense.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{language === 'ar' ? 'الميزانية الشهرية' : 'Monthly Budget'}</p>
                       <p className="text-lg font-black text-slate-900 dark:text-white">${budget.toLocaleString()}</p>
                    </div>
                 </div>

                 {budget > 0 && (
                   <div className="space-y-2">
                      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                         <span className={isOver ? 'text-rose-600' : 'text-slate-400'}>{progress.toFixed(0)}% Consumed</span>
                         <span className="text-slate-400">Target: ${budget}</span>
                      </div>
                      <div className="h-3 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                         <div className={`h-full transition-all duration-1000 ${isOver ? 'bg-rose-500 animate-pulse' : progress > 80 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                      </div>
                   </div>
                 )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GroupsManager;
