import React, { useMemo, useState } from 'react';
import { useApp } from '../store';
import { Trash2, RefreshCw, AlertTriangle, Layers, User, ShieldAlert } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const Archive: React.FC = () => {
  const { state, dispatch } = useApp();
  const { language } = state;

  const archivedGroups = useMemo(() => state.groups.filter(g => g.isArchived), [state.groups]);
  const archivedClients = useMemo(() => state.clients.filter(c => c.isArchived), [state.clients]);

  const [groupToRestore, setGroupToRestore] = useState<string | null>(null);
  const [groupToPermanentDelete, setGroupToPermanentDelete] = useState<string | null>(null);
  
  const [clientToRestore, setClientToRestore] = useState<string | null>(null);
  const [clientToPermanentDelete, setClientToPermanentDelete] = useState<string | null>(null);

  const handleRestoreGroup = () => {
    if (groupToRestore) {
      dispatch.restoreGroup(groupToRestore);
      setGroupToRestore(null);
    }
  };

  const handlePermanentDeleteGroup = () => {
    if (groupToPermanentDelete) {
      dispatch.permanentDeleteGroup(groupToPermanentDelete);
      setGroupToPermanentDelete(null);
    }
  };

  const handleRestoreClient = () => {
    if (clientToRestore) {
      dispatch.restoreClient(clientToRestore);
      setClientToRestore(null);
    }
  };

  const handlePermanentDeleteClient = () => {
    if (clientToPermanentDelete) {
      dispatch.permanentDeleteClient(clientToPermanentDelete);
      setClientToPermanentDelete(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500 pb-20 px-2">
      <div className="text-center py-6 flex flex-col items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            {language === 'ar' ? 'الأرشيف' : 'Archive'}
          </h2>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-md font-medium">
          {language === 'ar' 
            ? 'البيانات المحذوفة مؤقتاً. يمكنك استعادتها أو حذفها نهائياً.' 
            : 'Temporarily deleted data. You can restore or permanently delete them.'}
        </p>
      </div>

      <div className="space-y-8">
        {/* Archived Groups */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700/50">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Layers className="text-indigo-500" size={24} />
            {language === 'ar' ? 'المجموعات المحذوفة' : 'Deleted Groups'}
          </h3>
          
          {archivedGroups.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <p>{language === 'ar' ? 'لا توجد مجموعات في الأرشيف' : 'No groups in archive'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {archivedGroups.map(group => (
                <div key={group.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-600/50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-600 shadow-sm flex items-center justify-center text-2xl">
                      {group.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{group.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {language === 'ar' ? 'مجموعة' : 'Group'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setGroupToRestore(group.id)}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition-colors"
                      title={language === 'ar' ? 'استعادة' : 'Restore'}
                    >
                      <RefreshCw size={20} />
                    </button>
                    <button
                      onClick={() => setGroupToPermanentDelete(group.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-colors"
                      title={language === 'ar' ? 'حذف نهائي' : 'Permanent Delete'}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Archived Clients */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700/50">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="text-blue-500" size={24} />
            {language === 'ar' ? 'العملاء المحذوفين' : 'Deleted Clients'}
          </h3>
          
          {archivedClients.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <p>{language === 'ar' ? 'لا يوجد عملاء في الأرشيف' : 'No clients in archive'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {archivedClients.map(client => {
                const parentGroup = state.groups.find(g => g.id === client.groupId);
                const isParentArchived = !parentGroup || parentGroup.isArchived;

                return (
                  <div key={client.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-600/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-600 shadow-sm flex items-center justify-center text-xl">
                        {client.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{client.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {language === 'ar' ? 'تابع لـ: ' : 'Belongs to: '}
                          {parentGroup ? `${parentGroup.icon} ${parentGroup.name}` : (language === 'ar' ? 'مجموعة محذوفة' : 'Deleted Group')}
                          {isParentArchived && <span className="text-rose-500 ml-1">({language === 'ar' ? 'المجموعة في الأرشيف' : 'Group in archive'})</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (isParentArchived) {
                            dispatch.setNotification({
                              message: language === 'ar' ? 'يجب استعادة المجموعة أولاً' : 'Must restore group first',
                              type: 'error'
                            });
                          } else {
                            setClientToRestore(client.id);
                          }
                        }}
                        className={`p-2 rounded-xl transition-colors ${isParentArchived ? 'text-slate-400 cursor-not-allowed' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'}`}
                        title={language === 'ar' ? 'استعادة' : 'Restore'}
                      >
                        <RefreshCw size={20} />
                      </button>
                      <button
                        onClick={() => setClientToPermanentDelete(client.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-colors"
                        title={language === 'ar' ? 'حذف نهائي' : 'Permanent Delete'}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={!!groupToRestore}
        onClose={() => setGroupToRestore(null)}
        onConfirm={handleRestoreGroup}
        title={language === 'ar' ? 'استعادة المجموعة' : 'Restore Group'}
        message={language === 'ar' ? 'هل أنت متأكد من استعادة هذه المجموعة؟ ستعود للظهور في الإحصائيات.' : 'Are you sure you want to restore this group? It will reappear in statistics.'}
        confirmText={language === 'ar' ? 'استعادة' : 'Restore'}
        cancelText={language === 'ar' ? 'إلغاء' : 'Cancel'}
      />

      <ConfirmModal
        isOpen={!!groupToPermanentDelete}
        onClose={() => setGroupToPermanentDelete(null)}
        onConfirm={handlePermanentDeleteGroup}
        title={language === 'ar' ? 'حذف نهائي للمجموعة' : 'Permanent Delete Group'}
        message={language === 'ar' ? 'تحذير: هذا الإجراء لا يمكن التراجع عنه! سيتم حذف المجموعة وجميع عملائها ومعاملاتها نهائياً.' : 'Warning: This action cannot be undone! The group, all its clients, and transactions will be permanently deleted.'}
        confirmText={language === 'ar' ? 'حذف نهائي' : 'Permanent Delete'}
        cancelText={language === 'ar' ? 'إلغاء' : 'Cancel'}
        isDestructive={true}
      />

      <ConfirmModal
        isOpen={!!clientToRestore}
        onClose={() => setClientToRestore(null)}
        onConfirm={handleRestoreClient}
        title={language === 'ar' ? 'استعادة العميل' : 'Restore Client'}
        message={language === 'ar' ? 'هل أنت متأكد من استعادة هذا العميل؟ سيعود للظهور في الإحصائيات.' : 'Are you sure you want to restore this client? It will reappear in statistics.'}
        confirmText={language === 'ar' ? 'استعادة' : 'Restore'}
        cancelText={language === 'ar' ? 'إلغاء' : 'Cancel'}
      />

      <ConfirmModal
        isOpen={!!clientToPermanentDelete}
        onClose={() => setClientToPermanentDelete(null)}
        onConfirm={handlePermanentDeleteClient}
        title={language === 'ar' ? 'حذف نهائي للعميل' : 'Permanent Delete Client'}
        message={language === 'ar' ? 'تحذير: هذا الإجراء لا يمكن التراجع عنه! سيتم حذف العميل وجميع معاملاته نهائياً.' : 'Warning: This action cannot be undone! The client and all its transactions will be permanently deleted.'}
        confirmText={language === 'ar' ? 'حذف نهائي' : 'Permanent Delete'}
        cancelText={language === 'ar' ? 'إلغاء' : 'Cancel'}
        isDestructive={true}
      />
    </div>
  );
};

export default Archive;
