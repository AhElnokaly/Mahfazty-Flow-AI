
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

  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [newClientName, setNewClientName] = useState('');
  const [newClientIcon, setNewClientIcon] = useState('👤');

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

  const handleAddClient = (e: React.FormEvent, groupId: string) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    vibrate();
    dispatch.addClient(newClientName, groupId, newClientIcon);
    setNewClientName('');
    setNewClientIcon('👤');
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
                 {isEditing ? (
                   <div className="flex flex-col gap-4">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <input 
                         value={editGroupValue.name} 
                         onChange={(e) => setEditGroupValue({...editGroupValue, name: e.target.value})} 
                         className="px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm font-bold"
                         placeholder="Group Name"
                       />
                       <input 
                         value={editGroupValue.icon} 
                         onChange={(e) => setEditGroupValue({...editGroupValue, icon: e.target.value})} 
                         className="px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm font-bold"
                         placeholder="Icon (emoji)"
                       />
                       <input 
                         type="number"
                         value={editGroupValue.monthlyBudget} 
                         onChange={(e) => setEditGroupValue({...editGroupValue, monthlyBudget: Number(e.target.value)})} 
                         className="px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm font-bold"
                         placeholder="Monthly Budget"
                       />
                     </div>
                     <div className="flex justify-end gap-2">
                       <button 
                         onClick={() => setEditingGroupId(null)}
                         className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500"
                       >
                         <X size={18} />
                       </button>
                       <button 
                         onClick={() => {
                           dispatch.updateGroup(group.id, editGroupValue);
                           setEditingGroupId(null);
                         }}
                         className="p-2 rounded-xl bg-emerald-500 text-white"
                       >
                         <Check size={18} />
                       </button>
                     </div>
                   </div>
                 ) : (
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
                      <div className="text-right flex items-center gap-4">
                         <div>
                           <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{language === 'ar' ? 'الميزانية الشهرية' : 'Monthly Budget'}</p>
                           <p className="text-lg font-black text-slate-900 dark:text-white">${budget.toLocaleString()}</p>
                         </div>
                         <div className="flex flex-col gap-2">
                           <button 
                             onClick={() => setExpandedGroupId(expandedGroupId === group.id ? null : group.id)}
                             className={`p-2 rounded-xl ${expandedGroupId === group.id ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-emerald-500'}`}
                             title={language === 'ar' ? 'إضافة عميل' : 'Add Client'}
                           >
                             <Plus size={16} />
                           </button>
                           <button 
                             onClick={() => {
                               setEditingGroupId(group.id);
                               setEditGroupValue({ name: group.name, icon: group.icon || '📁', monthlyBudget: group.monthlyBudget || 0 });
                             }}
                             className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-blue-500"
                           >
                             <Edit3 size={16} />
                           </button>
                           <button 
                             onClick={() => {
                               if(confirm('Delete group?')) dispatch.deleteGroup(group.id);
                             }}
                             className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-rose-500"
                           >
                             <Trash2 size={16} />
                           </button>
                         </div>
                      </div>
                   </div>
                 )}

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

                 {/* Clients Section */}
                 <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                   <div className="flex items-center justify-between mb-4">
                     <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
                       <Briefcase size={14} className="text-blue-500" />
                       {language === 'ar' ? 'العملاء / البنود' : 'Clients / Items'}
                     </h4>
                     <button 
                       onClick={() => setExpandedGroupId(expandedGroupId === group.id ? null : group.id)}
                       className="text-[10px] font-bold text-blue-500 uppercase flex items-center gap-1 hover:underline"
                     >
                       {expandedGroupId === group.id ? (language === 'ar' ? 'إخفاء' : 'Hide') : (language === 'ar' ? 'إضافة عميل' : 'Add Client')}
                       {expandedGroupId === group.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                     </button>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     {clients.filter(c => c.groupId === group.id).map(client => (
                       <div key={client.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm text-sm">
                             {client.icon || '👤'}
                           </div>
                           <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{client.name}</span>
                         </div>
                         <button 
                           onClick={() => {
                             if(confirm('Delete client?')) dispatch.deleteClient(client.id);
                           }}
                           className="text-slate-400 hover:text-rose-500 p-1"
                         >
                           <Trash2 size={14} />
                         </button>
                       </div>
                     ))}
                   </div>

                   {expandedGroupId === group.id && (
                     <form onSubmit={(e) => handleAddClient(e, group.id)} className="mt-4 flex gap-2 animate-in slide-in-from-top-2">
                       <input 
                         value={newClientName} 
                         onChange={(e) => setNewClientName(e.target.value)} 
                         placeholder={language === 'ar' ? 'اسم العميل...' : 'Client name...'} 
                         className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-blue-500" 
                       />
                       <input 
                         value={newClientIcon} 
                         onChange={(e) => setNewClientIcon(e.target.value)} 
                         placeholder="👤" 
                         className="w-16 px-2 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-xs outline-none focus:border-blue-500" 
                       />
                       <button type="submit" className="px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                         <Plus size={18} />
                       </button>
                     </form>
                   )}
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GroupsManager;
