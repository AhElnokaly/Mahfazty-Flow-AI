import React, { useState, useEffect } from 'react';
import { X, Check, User, Layers } from 'lucide-react';

interface ClientEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, icon: string, groupId: string) => void;
  client: { id: string; name: string; icon: string; groupId: string } | null;
  groups: { id: string; name: string }[];
  language: string;
}

const ClientEditModal: React.FC<ClientEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  client,
  groups,
  language
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [groupId, setGroupId] = useState('');

  useEffect(() => {
    if (client && isOpen) {
      setName(client.name);
      setIcon(client.icon || '👤');
      setGroupId(client.groupId);
    }
  }, [client, isOpen]);

  if (!isOpen || !client) return null;

  const handleSave = () => {
    onSave(name, icon, groupId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {language === 'ar' ? 'تعديل بيانات العميل' : 'Edit Client Details'}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <User size={14} />
              {language === 'ar' ? 'اسم العميل' : 'Client Name'}
            </label>
            <div className="flex gap-2">
              <input 
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-14 px-2 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-lg outline-none focus:border-blue-500 transition-colors"
                placeholder="👤"
              />
              <input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none focus:border-blue-500 transition-colors"
                placeholder={language === 'ar' ? 'اسم العميل...' : 'Client name...'}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Layers size={14} />
              {language === 'ar' ? 'المجموعة' : 'Group'}
            </label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none focus:border-blue-500 transition-colors appearance-none"
            >
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !groupId}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Check size={18} />
            {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientEditModal;
