
import React, { useState } from 'react';
import { useApp } from '../store';
import { Users, UserPlus, Search, Phone, Mail, ChevronRight, Layers, Edit2, Trash2, Save, X } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const ClientsManager: React.FC = () => {
  const { state, dispatch } = useApp();
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState(state.groups[0]?.id || '');
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editGroupId, setEditGroupId] = useState('');
  
  // Delete confirmation state
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  
  const { language, clients, groups } = state;

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

  const startEditing = (client: any) => {
    setEditingClientId(client.id);
    setEditName(client.name);
    setEditGroupId(client.groupId);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim() || !editGroupId) return;
    dispatch.updateClient(id, { name: editName, groupId: editGroupId });
    setEditingClientId(null);
    dispatch.setNotification({
      message: language === 'ar' ? 'تم التعديل بنجاح' : 'Updated successfully',
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
                editingClientId === client.id ? (
                  <div key={client.id} className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-blue-500 shadow-xl shadow-blue-500/10 transition-all">
                    <div className="space-y-4 mb-6">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-4 focus:ring-blue-500/10 text-slate-900 dark:text-white font-bold"
                      />
                      <select
                        value={editGroupId}
                        onChange={(e) => setEditGroupId(e.target.value)}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-4 focus:ring-blue-500/10 text-slate-900 dark:text-white font-bold appearance-none cursor-pointer"
                      >
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleSaveEdit(client.id)} className="flex-1 flex items-center justify-center py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all">
                        <Save size={20} />
                      </button>
                      <button onClick={() => setEditingClientId(null)} className="flex-1 flex items-center justify-center py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={client.id} className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-xl shadow-black/5 hover:shadow-2xl transition-all group">
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-16 h-16 rounded-[24px] bg-[#0055CC]/10 text-[#0055CC] flex items-center justify-center font-black text-2xl shadow-inner">
                        {client.name.charAt(0)}
                      </div>
                      <span className="px-4 py-2 bg-[#00AA55]/10 text-[#00AA55] rounded-xl text-[10px] font-black uppercase tracking-widest">
                        {groups.find(g => g.id === client.groupId)?.name}
                      </span>
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-6 leading-tight">{client.name}</h4>
                    <div className="flex gap-3">
                      <button onClick={() => startEditing(client)} className="flex-1 flex items-center justify-center py-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl text-slate-400 hover:text-blue-500 transition-all">
                        <Edit2 size={20} />
                      </button>
                      <button onClick={() => handleDelete(client.id)} className="flex-1 flex items-center justify-center py-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl text-slate-400 hover:text-rose-500 transition-all">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                )
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
        message={language === 'ar' ? 'هل أنت متأكد من مسح هذه الجهة؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this entity? This action cannot be undone.'}
        confirmText={language === 'ar' ? 'مسح' : 'Delete'}
        cancelText={language === 'ar' ? 'إلغاء' : 'Cancel'}
      />
    </div>
  );
};

export default ClientsManager;
