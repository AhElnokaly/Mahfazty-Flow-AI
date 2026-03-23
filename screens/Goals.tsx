import React, { useState, useMemo } from 'react';
import { useApp } from '../store';
import { Target, Plus, Check, X, TrendingUp, Trophy, AlertCircle, Trash2, Edit2 } from 'lucide-react';
import { Goal } from '../types';
import { CalculatorInput } from '../components/CalculatorInput';

const Goals: React.FC = () => {
  const { state, dispatch } = useApp();
  const { language, goals, baseCurrency, isPrivacyMode } = state;

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState('bg-blue-500');

  const privacyClass = isPrivacyMode ? 'blur-sm select-none' : '';

  const handleSave = () => {
    if (!title || !targetAmount || !deadline) {
      dispatch.setNotification({ message: language === 'ar' ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields', type: 'error' });
      return;
    }

    const goalData = {
      title,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount) || 0,
      deadline,
      icon,
      color
    };

    if (editingId) {
      dispatch.updateGoal(editingId, goalData);
      dispatch.setNotification({ message: language === 'ar' ? 'تم تحديث الهدف' : 'Goal updated', type: 'success' });
    } else {
      dispatch.addGoal(goalData);
      dispatch.setNotification({ message: language === 'ar' ? 'تمت إضافة الهدف' : 'Goal added', type: 'success' });
      if (goals.length === 0) {
        dispatch.unlockAchievement('first_goal');
      }
    }

    resetForm();
  };

  const handleEdit = (goal: Goal) => {
    setTitle(goal.title);
    setTargetAmount(goal.targetAmount.toString());
    setCurrentAmount(goal.currentAmount.toString());
    setDeadline(goal.deadline);
    setIcon(goal.icon);
    setColor(goal.color);
    setEditingId(goal.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    dispatch.deleteGoal(id);
    dispatch.setNotification({ message: language === 'ar' ? 'تم حذف الهدف' : 'Goal deleted', type: 'info' });
  };

  const resetForm = () => {
    setTitle('');
    setTargetAmount('');
    setCurrentAmount('');
    setDeadline('');
    setIcon('🎯');
    setColor('bg-blue-500');
    setEditingId(null);
    setIsAdding(false);
  };

  const colors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-purple-500', 'bg-indigo-500'
  ];

  const icons = ['🎯', '🚗', '🏠', '✈️', '💻', '💍', '🎓', '🏥'];

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20 px-2 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <Target className="text-blue-500" />
            {language === 'ar' ? 'أهداف الادخار' : 'Saving Goals'}
          </h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
            {language === 'ar' ? 'تتبع أهدافك المالية' : 'Track your financial targets'}
          </p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">{language === 'ar' ? 'هدف جديد' : 'New Goal'}</span>
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm animate-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
              {editingId ? (language === 'ar' ? 'تعديل الهدف' : 'Edit Goal') : (language === 'ar' ? 'إضافة هدف جديد' : 'Add New Goal')}
            </h2>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{language === 'ar' ? 'عنوان الهدف' : 'Goal Title'}</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder={language === 'ar' ? 'مثال: سيارة جديدة' : 'e.g. New Car'}
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{language === 'ar' ? 'المبلغ المستهدف' : 'Target Amount'}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{baseCurrency}</span>
                <CalculatorInput 
                  value={targetAmount}
                  onChange={setTargetAmount}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{language === 'ar' ? 'المبلغ الحالي (اختياري)' : 'Current Amount (Optional)'}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{baseCurrency}</span>
                <CalculatorInput 
                  value={currentAmount}
                  onChange={setCurrentAmount}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{language === 'ar' ? 'تاريخ الهدف' : 'Target Date'}</label>
              <input 
                type="date" 
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{language === 'ar' ? 'الرمز' : 'Icon'}</label>
              <div className="flex flex-wrap gap-2">
                {icons.map(i => (
                  <button 
                    key={i}
                    onClick={() => setIcon(i)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-transform ${icon === i ? 'bg-slate-200 dark:bg-slate-700 scale-110' : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{language === 'ar' ? 'اللون' : 'Color'}</label>
              <div className="flex flex-wrap gap-2">
                {colors.map(c => (
                  <button 
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-10 h-10 rounded-xl ${c} transition-transform flex items-center justify-center ${color === c ? 'scale-110 ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-600' : 'opacity-80 hover:opacity-100'}`}
                  >
                    {color === c && <Check size={16} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button 
              onClick={handleSave}
              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform"
            >
              {language === 'ar' ? 'حفظ الهدف' : 'Save Goal'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.length > 0 ? goals.map(goal => {
          const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          const isCompleted = progress >= 100;
          const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
          
          return (
            <div key={goal.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className={`absolute top-0 left-0 w-1 h-full ${goal.color}`} />
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${goal.color} bg-opacity-10 dark:bg-opacity-20`}>
                    {goal.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">{goal.title}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {daysLeft > 0 ? (language === 'ar' ? `متبقي ${daysLeft} يوم` : `${daysLeft} days left`) : (language === 'ar' ? 'انتهى الوقت' : 'Time is up')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(goal)} className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(goal.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="mb-2 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{language === 'ar' ? 'تم جمع' : 'Saved'}</p>
                  <p className={`text-lg font-black text-slate-900 dark:text-white ${privacyClass}`}>
                    {baseCurrency} {goal.currentAmount.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{language === 'ar' ? 'الهدف' : 'Target'}</p>
                  <p className={`text-sm font-bold text-slate-500 ${privacyClass}`}>
                    {baseCurrency} {goal.targetAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="relative h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                <div 
                  className={`absolute top-0 left-0 h-full ${goal.color} transition-all duration-1000`} 
                  style={{ width: `${progress}%` }} 
                />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-500">{progress.toFixed(1)}%</span>
                {isCompleted && (
                  <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                    <Trophy size={12} /> {language === 'ar' ? 'مكتمل' : 'Completed'}
                  </span>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
              <Target size={32} />
            </div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide mb-2">
              {language === 'ar' ? 'لا توجد أهداف بعد' : 'No Goals Yet'}
            </h4>
            <p className="text-xs text-slate-500 font-medium max-w-sm mb-6">
              {language === 'ar' ? 'قم بإضافة أهدافك المالية لتتبع تقدمك نحو تحقيقها.' : 'Add your financial goals to track your progress towards achieving them.'}
            </p>
            <button 
              onClick={() => setIsAdding(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform"
            >
              {language === 'ar' ? 'إنشاء أول هدف' : 'Create First Goal'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Goals;
