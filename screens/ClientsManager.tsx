
import React, { useState } from 'react';
import { useApp } from '../store';
import { Users, UserPlus, Search, Phone, Mail, ChevronRight, Layers } from 'lucide-react';

const ClientsManager: React.FC = () => {
  const { state, dispatch } = useApp();
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState(state.groups[0]?.id || '');
  
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
          <form onSubmit={handleAdd} className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-xl shadow-black/5">
            <h3 className="font-black text-sm mb-6 text-slate-500 dark:text-slate-400 uppercase tracking-[3px]">{language === 'ar' ? 'إضافة جهة جديدة' : 'New Entity'}</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 px-2">{language === 'ar' ? 'الاسم' : 'Name'}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: فتح الله، المكتب...' : 'e.g. Fathalla, Office...'}
                  className="w-full p-5 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-4 focus:ring-[#0055CC]/10 text-slate-900 dark:text-white font-bold placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 px-2">{language === 'ar' ? 'المجموعة التابع لها' : 'Parent Group'}</label>
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
                    <button className="flex-1 flex items-center justify-center py-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl text-slate-400 hover:text-[#0055CC] transition-all">
                      <Phone size={20} />
                    </button>
                    <button className="flex-1 flex items-center justify-center py-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl text-slate-400 hover:text-[#0055CC] transition-all">
                      <Mail size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientsManager;
