
import React, { useState, useMemo } from 'react';
import { useApp, getClientShare } from '../store';
import { Users, UserPlus, Search, Phone, Mail, ChevronRight, Layers, Edit2, Trash2, Save, X, GitMerge } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import ClientEditModal from '../components/ClientEditModal';

const ClientsManager: React.FC = () => {
  const { state, dispatch } = useApp();
  const { language } = state;
  const groups = useMemo(() => state.groups.filter(g => !g.isArchived), [state.groups]);
  const clients = useMemo(() => state.clients.filter(c => !c.isArchived), [state.clients]);

  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState(groups[0]?.id || '');
  const [clientToEdit, setClientToEdit] = useState<any>(null);
  
  // Delete confirmation state
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  // Merge state
  const [clientToMerge, setClientToMerge] = useState<string | null>(null);
  const [targetMergeClientId, setTargetMergeClientId] = useState<string>('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !groupId) return;
    dispatch.addClient(name, groupId);
    setName('');
    dispatch.setNotification({
      message: language === 'ar' ? 'تمت الإضافة بنجاح' : 'Added successfully',
      type: 'success'
    });
  };

  const handleDelete = (id: string) => {
    setClientToDelete(id);
  };

  const confirmDelete = () => {
    if (clientToDelete) {
      dispatch.deleteClient(clientToDelete);
      dispatch.setNotification({
        message: language === 'ar' ? 'تم المسح بنجاح' : 'Deleted successfully',
        type: 'success'
      });
      setClientToDelete(null);
    }
  };

  const handleMerge = (sourceId: string) => {
    setClientToMerge(sourceId);
    setTargetMergeClientId('');
  };

  const confirmMerge = () => {
    if (clientToMerge && targetMergeClientId) {
      dispatch.mergeClient(clientToMerge, targetMergeClientId);
      dispatch.setNotification({
        message: language === 'ar' ? 'تم الدمج بنجاح' : 'Merged successfully',
        type: 'success'
      });
      setClientToMerge(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-24 px-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Users className="text-[#0055CC]" />
            {language === 'ar' ? 'جهات التعامل والعملاء' : 'Entities & Clients'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2 font-bold uppercase tracking-wider text-xs">
            {language === 'ar' ? 'إدارة وتصنيف الأشخاص والجهات تحت المجموعات.' : 'Manage and categorize people/entities under groups.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleAdd} className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-black/5">
            <h3 className="font-black text-sm mb-6 text-slate-500 dark:text-slate-400 uppercase tracking-[3px]">{language === 'ar' ? 'إضافة جهة جديدة' : 'New Entity'}</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 px-2">{language === 'ar' ? 'الاسم' : 'Name'}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: فتح الله، المكتب...' : 'e.g. Fathalla, Office...'}
                  className="w-full p-5 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-4 focus:ring-[#0055CC]/10 text-slate-900 dark:text-white font-bold placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 px-2">{language === 'ar' ? 'المجموعة التابع لها' : 'Parent Group'}</label>
                <div className="relative">
                   <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                   <select
                     value={groupId}
                     onChange={(e) => setGroupId(e.target.value)}
                     className="w-full pl-12 pr-10 py-5 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-4 focus:ring-[#0055CC]/10 text-slate-900 dark:text-white font-bold appearance-none cursor-pointer"
                   >
                     {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                   </select>
                   <ChevronRight size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
                </div>
              </div>

              <button className="w-full py-5 bg-[#0055CC] text-white rounded-[24px] font-black shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all mt-4">
                <UserPlus size={22} />
                {language === 'ar' ? 'حفظ الجهة' : 'Save Entity'}
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder={language === 'ar' ? 'بحث عن جهة أو عميل...' : 'Search entities...'}
              className="w-full pl-14 pr-6 py-5 bg-white dark:bg-slate-800 border-none rounded-3xl shadow-xl shadow-black/5 focus:ring-4 focus:ring-[#0055CC]/10 text-slate-900 dark:text-white font-bold placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {clients.length === 0 ? (
               <div className="col-span-full py-20 bg-slate-50 dark:bg-slate-900/40 rounded-[48px] border-4 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400">
                 <Users size={64} className="mb-6 opacity-20" />
                 <p className="font-black uppercase tracking-widest text-sm">{language === 'ar' ? 'لا يوجد جهات مسجلة' : 'No entries found'}</p>
               </div>
            ) : (
              clients.map(client => (
                <React.Fragment key={client.id}>
                  <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-xl shadow-black/5 hover:shadow-2xl transition-all group">
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-16 h-16 rounded-[24px] bg-[#0055CC]/10 text-[#0055CC] flex items-center justify-center font-black text-2xl shadow-inner">
                        {client.icon || client.name.charAt(0)}
                      </div>
                      <span className="px-4 py-2 bg-[#00AA55]/10 text-[#00AA55] rounded-xl text-[10px] font-black uppercase tracking-widest">
                        {groups.find(g => g.id === client.groupId)?.name}
                      </span>
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-6 leading-tight">{client.name}</h4>
                    
                    {/* +++ أضيف بناءً على طلبك +++ */}
                    {(() => {
                      const clientDebts = state.transactions.filter(t => (t.clientId === client.id || (t.clientIds && t.clientIds.includes(client.id))) && t.isDebt);
                      const partialPayments = state.transactions.filter(t => (t.clientId === client.id || (t.clientIds && t.clientIds.includes(client.id))) && t.referenceTotal && t.referenceTotal > t.amount);
                      
                      if (clientDebts.length === 0 && partialPayments.length === 0) return null;
                      
                      let debtBalance = clientDebts.reduce((acc, t) => {
                        const share = getClientShare(t, client.id); // +++ أضيف بناءً على طلبك +++
                        return t.type === 'INCOME' ? acc + share : acc - share; // +++ أضيف بناءً على طلبك +++
                      }, 0);

                      partialPayments.forEach(t => {
                        const share = getClientShare(t, client.id); // +++ أضيف بناءً على طلبك +++
                        const remaining = (t.referenceTotal || 0) - share; // +++ أضيف بناءً على طلبك +++
                        if (t.type === 'EXPENSE') debtBalance += remaining;
                        else if (t.type === 'INCOME') debtBalance -= remaining;
                      });

                      if (debtBalance === 0) return null;

                      return (
                        <div className={`mb-6 p-4 rounded-2xl border ${debtBalance > 0 ? 'bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/50' : 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/50'}`}>
                          <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${debtBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {language === 'ar' ? (debtBalance > 0 ? 'دين مستحق عليك' : 'دين مستحق لك') : (debtBalance > 0 ? 'You Owe' : 'They Owe')}
                          </p>
                          <p className={`text-xl font-black ${debtBalance > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                            {Math.abs(debtBalance).toLocaleString()} {state.baseCurrency}
                          </p>
                        </div>
                      );
                    })()}
                    {/* ++++++++++++++++++++++++++++ */}

                    <div className="flex gap-3 mt-4">
                      <button onClick={() => setClientToEdit(client)} className="flex-1 flex items-center justify-center py-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl text-slate-400 hover:text-blue-500 transition-all" title={language === 'ar' ? 'تعديل / نقل' : 'Edit / Move'}>
                        <Edit2 size={20} />
                      </button>
                      <button onClick={() => handleMerge(client.id)} className="flex-1 flex items-center justify-center py-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl text-slate-400 hover:text-purple-500 transition-all" title={language === 'ar' ? 'دمج' : 'Merge'}>
                        <GitMerge size={20} />
                      </button>
                      <button onClick={() => handleDelete(client.id)} className="flex-1 flex items-center justify-center py-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl text-slate-400 hover:text-rose-500 transition-all" title={language === 'ar' ? 'مسح' : 'Delete'}>
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </React.Fragment>
              ))
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={confirmDelete}
        title={language === 'ar' ? 'تأكيد المسح' : 'Confirm Delete'}
        message={language === 'ar' ? 'هل أنت متأكد من مسح هذه الجهة؟ سيتم مسح جميع المعاملات المرتبطة بها. لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this entity? All related transactions will be deleted. This action cannot be undone.'}
        confirmText={language === 'ar' ? 'مسح' : 'Delete'}
        cancelText={language === 'ar' ? 'إلغاء' : 'Cancel'}
      />

      {clientToMerge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-black mb-4 dark:text-white">
              {language === 'ar' ? 'دمج عميل' : 'Merge Client'}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {language === 'ar' ? 'اختر العميل الذي تريد دمج هذا العميل معه. سيتم نقل جميع المعاملات إلى العميل المختار.' : 'Select the client to merge into. All transactions will be moved to the selected client.'}
            </p>
            <select
              value={targetMergeClientId}
              onChange={(e) => setTargetMergeClientId(e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl mb-6 dark:text-white"
            >
              <option value="" disabled>{language === 'ar' ? 'اختر عميل...' : 'Select client...'}</option>
              {clients
                .filter(c => c.id !== clientToMerge && c.groupId === clients.find(cl => cl.id === clientToMerge)?.groupId)
                .map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
            <div className="flex gap-3">
              <button 
                onClick={confirmMerge}
                disabled={!targetMergeClientId}
                className="flex-1 py-4 bg-purple-600 text-white rounded-2xl font-bold disabled:opacity-50"
              >
                {language === 'ar' ? 'تأكيد الدمج' : 'Confirm Merge'}
              </button>
              <button 
                onClick={() => setClientToMerge(null)}
                className="flex-1 py-4 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-2xl font-bold"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default ClientsManager;
