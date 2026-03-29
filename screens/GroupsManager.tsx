
import React, { useState, useMemo } from 'react';
import { useApp, isIncomeLike, isExpenseLike } from '../store';
import { 
  Plus, Trash2, Layers, UserPlus, TrendingUp, TrendingDown, 
  Briefcase, Edit3, Check, X, ChevronDown, ChevronUp, History, 
  ArrowUpRight, ArrowDownRight, Calendar, Smile, AlertCircle, Target, Info
} from 'lucide-react';
import { TransactionType } from '../types';
import ConfirmModal from '../components/ConfirmModal';
import ClientEditModal from '../components/ClientEditModal';

const GroupsManager: React.FC = () => {
  const { state, dispatch } = useApp();
  const { language } = state;
  const groups = useMemo(() => state.groups.filter(g => !g.isArchived), [state.groups]);
  const clients = useMemo(() => state.clients.filter(c => !c.isArchived), [state.clients]);
  const transactions = useMemo(() => {
    return state.transactions.filter(t => {
      const g = state.groups.find(g => g.id === t.groupId);
      const hasArchivedClient = t.clientIds 
        ? t.clientIds.some(cId => state.clients.find(c => c.id === cId)?.isArchived)
        : state.clients.find(c => c.id === t.clientId)?.isArchived;
      return (!g || !g.isArchived) && !hasArchivedClient;
    });
  }, [state.transactions, state.groups, state.clients]);

  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupIcon, setNewGroupIcon] = useState('📁');
  const [newGroupBudget, setNewGroupBudget] = useState('');
  
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupValue, setEditGroupValue] = useState({ name: '', icon: '', monthlyBudget: 0 });

  const [clientToEdit, setClientToEdit] = useState<any>(null);

  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [newClientName, setNewClientName] = useState('');
  const [newClientIcon, setNewClientIcon] = useState('👤');

  // Delete confirmation states
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  const vibrate = () => {
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const parseArabicNumber = (val: string) => {
    const englishVal = val.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
    return englishVal.replace(/[^0-9.]/g, '');
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
    const income = filtered.filter(t => isIncomeLike(t)).reduce((s, t) => s + t.amount, 0);
    const expense = filtered.filter(t => isExpenseLike(t)).reduce((s, t) => s + t.amount, 0);
    return { income, expense };
  };

  const confirmDeleteGroup = () => {
    if (groupToDelete) {
      dispatch.permanentDeleteGroup(groupToDelete);
      setGroupToDelete(null);
    }
  };

  const confirmDeleteClient = () => {
    if (clientToDelete) {
      dispatch.deleteClient(clientToDelete);
      setClientToDelete(null);
    }
  };

  return (
    <>
      <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500 pb-20 px-2">
        <div className="text-center py-6 flex flex-col items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            {language === 'ar' ? 'هيكلة الميزانية' : 'Budget Architecture'}
          </h2>
          <div className="group relative flex items-center">
            <Info size={16} className="text-slate-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 dark:bg-slate-700 text-white text-xs font-medium rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-center pointer-events-none shadow-xl">
              {language === 'ar' ? 'قم بإنشاء مجموعات (مثل: المحفظة، البنك) وحدد ميزانية شهرية لكل منها للتحكم في نفقاتك.' : 'Create portfolios (e.g., Wallet, Bank) and set a monthly budget for each to control your spending.'}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700"></div>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">
          {language === 'ar' ? 'إدارة حدود الإنفاق لكل مجموعة' : 'Manage spending limits per portfolio'}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-50 dark:border-slate-800">
        <form onSubmit={handleAddGroup} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder={language === 'ar' ? 'اسم المجموعة...' : 'Group name...'} className="md:col-span-2 px-5 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-[20px] text-xs font-bold text-slate-900 dark:text-white outline-none" />
          <input type="text" inputMode="decimal" value={newGroupBudget} onChange={(e) => setNewGroupBudget(parseArabicNumber(e.target.value))} placeholder={language === 'ar' ? 'الميزانية...' : 'Budget...'} className="px-5 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-[20px] text-xs font-bold text-slate-900 dark:text-white outline-none" />
          <button type="submit" className="bg-blue-600 text-white rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20">
            {language === 'ar' ? 'إنشاء' : 'Create'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {groups.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 p-12 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mb-6">
              <Layers size={40} />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wide mb-2">
              {language === 'ar' ? 'لا توجد مجموعات حسابات' : 'No Portfolios Yet'}
            </h3>
            <p className="text-sm text-slate-500 font-medium max-w-sm mb-2">
              {language === 'ar' ? 'قم بإنشاء مجموعة حسابات (مثل: المحفظة، البنك، مدخرات) لتنظيم أموالك وتحديد ميزانياتك.' : 'Create a portfolio (e.g., Wallet, Bank, Savings) to organize your money and set budgets.'}
            </p>
          </div>
        ) : groups.map((group) => {
          const stats = getGroupStats(group.id);
          const isEditing = editingGroupId === group.id;
          const budget = group.monthlyBudget || 0;
          const progress = budget > 0 ? (stats.expense / budget) * 100 : 0;
          const isOver = progress > 100;

          return (
            <div key={group.id} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-50 dark:border-slate-800 shadow-sm overflow-hidden">
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
                         type="text"
                         inputMode="decimal"
                         value={editGroupValue.monthlyBudget} 
                         onChange={(e) => setEditGroupValue({...editGroupValue, monthlyBudget: Number(parseArabicNumber(e.target.value))})} 
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
                          {group.allocatedAmount !== undefined && group.allocatedAmount > 0 && (
                            <div className="mt-2">
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md">
                                {language === 'ar' ? 'الرصيد المخصص:' : 'Allocated:'} ${group.allocatedAmount.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                         <div>
                           <p className="text-xs font-black uppercase text-slate-400 mb-1">{language === 'ar' ? 'الميزانية الشهرية' : 'Monthly Budget'}</p>
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
                               setGroupToDelete(group.id);
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
                       className="text-xs font-bold text-blue-500 uppercase flex items-center gap-1 hover:underline"
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
                          <div className="flex gap-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setClientToEdit(client); }}
                              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setClientToDelete(client.id); }}
                              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
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

      <ConfirmModal
        isOpen={!!groupToDelete}
        onClose={() => setGroupToDelete(null)}
        onConfirm={confirmDeleteGroup}
        title={language === 'ar' ? 'تأكيد المسح' : 'Confirm Delete'}
        message={language === 'ar' ? 'هل أنت متأكد من مسح هذه المجموعة؟ سيتم مسح جميع العملاء والمعاملات المرتبطة بها.' : 'Are you sure you want to delete this group? All associated clients and transactions will be deleted.'}
        confirmText={language === 'ar' ? 'مسح' : 'Delete'}
        cancelText={language === 'ar' ? 'إلغاء' : 'Cancel'}
      />

      <ConfirmModal
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={confirmDeleteClient}
        title={language === 'ar' ? 'تأكيد المسح' : 'Confirm Delete'}
        message={language === 'ar' ? 'هل أنت متأكد من مسح هذه الجهة؟ سيتم مسح جميع المعاملات المرتبطة بها.' : 'Are you sure you want to delete this client? All associated transactions will be deleted.'}
        confirmText={language === 'ar' ? 'مسح' : 'Delete'}
        cancelText={language === 'ar' ? 'إلغاء' : 'Cancel'}
      />

      <ClientEditModal
        isOpen={!!clientToEdit}
        onClose={() => setClientToEdit(null)}
        client={clientToEdit}
        groups={groups}
        language={language}
        onSave={(name, icon, groupId) => {
          if (clientToEdit) {
            if (groupId !== clientToEdit.groupId) {
              dispatch.moveClient(clientToEdit.id, groupId);
            }
            if (name !== clientToEdit.name || icon !== clientToEdit.icon) {
              dispatch.updateClient(clientToEdit.id, { name, icon });
            }
          }
        }}
      />
    </>
  );
};

export default GroupsManager;
