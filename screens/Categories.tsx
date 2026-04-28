import React, { useState } from 'react';
import { useApp } from '../store';
import { Plus, X, Edit3, Trash2, Tag, Save } from 'lucide-react';
import { Category } from '../types';

export const Categories: React.FC = () => {
  const { state, dispatch } = useApp();
  const { language } = state;
  const categories = state.categories || [];

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [icon, setIcon] = useState('📦');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingId) {
      dispatch.updateCategory(editingId, { name, color, icon });
      dispatch.setNotification({ message: language === 'ar' ? 'تم تحديث التصنيف' : 'Category updated', type: 'success' });
    } else {
      dispatch.addCategory({ name, color, icon });
      dispatch.setNotification({ message: language === 'ar' ? 'تمت إضافة التصنيف' : 'Category added', type: 'success' });
    }
    
    setName('');
    setColor('#3B82F6');
    setIcon('📦');
    setShowAdd(false);
    setEditingId(null);
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setColor(cat.color || '#3B82F6');
    setIcon(cat.icon || '📦');
    setShowAdd(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(language === 'ar' ? 'تأكيد الحذف؟' : 'Confirm delete?')) {
      dispatch.deleteCategory(id);
      dispatch.setNotification({ message: language === 'ar' ? 'تم حذف التصنيف' : 'Category deleted', type: 'success' });
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <Tag className="text-blue-500" />
            {language === 'ar' ? 'التصنيفات' : 'Categories'}
          </h1>
          <p className="text-sm font-bold text-slate-500 mt-1">
            {language === 'ar' ? 'إدارة تصنيفات المصروفات والمداخيل' : 'Manage your income and expense categories'}
          </p>
        </div>
        <button 
          onClick={() => { setShowAdd(!showAdd); setEditingId(null); setName(''); setColor('#3B82F6'); setIcon('📦'); }}
          className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20 hover:scale-105 transition-transform"
        >
          {showAdd ? <X size={24} /> : <Plus size={24} />}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 animate-in slide-in-from-top-4 space-y-4">
          <h3 className="font-black text-slate-900 dark:text-white uppercase">
            {editingId ? (language === 'ar' ? 'تعديل التصنيف' : 'Edit Category') : (language === 'ar' ? 'تصنيف جديد' : 'New Category')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 px-2">
                {language === 'ar' ? 'اسم التصنيف' : 'Category Name'}
              </label>
              <input 
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder={language === 'ar' ? 'مثال: سفر' : 'e.g. Travel'}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 px-2">
                {language === 'ar' ? 'أيقونة' : 'Icon (Emoji)'}
              </label>
              <input 
                value={icon}
                onChange={e => setIcon(e.target.value)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 px-2">
                {language === 'ar' ? 'اللون (Hex)' : 'Color (Hex)'}
              </label>
              <div className="flex gap-2">
                <input 
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-12 h-12 p-1 bg-slate-50 dark:bg-slate-900 rounded-xl cursor-pointer border-none"
                />
                <input 
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="flex-1 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-4 pt-4">
             <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-600/20 flex justify-center items-center gap-2">
                <Save size={18} /> {language === 'ar' ? 'حفظ' : 'Save'}
             </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="p-4 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                {cat.icon}
              </div>
              <div>
                <p className="font-black text-slate-900 dark:text-white">{cat.name}</p>
              </div>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button onClick={() => handleEdit(cat)} className="p-2 text-slate-400 hover:text-blue-500"><Edit3 size={18}/></button>
              <button onClick={(e) => handleDelete(cat.id, e)} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 size={18}/></button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500">
            {language === 'ar' ? 'لا توجد تصنيفات حالياً' : 'No Categories Found'}
          </div>
        )}
      </div>
    </div>
  );
};
