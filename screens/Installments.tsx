
import React, { useState, useMemo } from 'react';
import { useApp } from '../store';
import { 
  CreditCard, Plus, Calendar, Percent, AlertCircle, 
  CheckCircle2, Trash2, ArrowRight, DollarSign, Wallet, Layers,
  TrendingDown, TrendingUp, PieChart as PieIcon, Activity, Edit3, X
} from 'lucide-react';
import { Installment } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

const Installments: React.FC = () => {
  const { state, dispatch } = useApp();
  const { language, installments, baseCurrency, groups } = state;
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Installment>>({
    title: '',
    totalAmount: 0,
    interestRate: 0,
    installmentCount: 12,
    type: 'purchase',
    startDate: new Date().toISOString().split('T')[0],
    linkedGroupId: ''
  });

  // Pay State
  const [payId, setPayId] = useState<string | null>(null);
  const [penalty, setPenalty] = useState(0);

  const vibrate = () => {
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const handleEdit = (inst: Installment) => {
    setEditingId(inst.id);
    setFormData({
      title: inst.title,
      totalAmount: inst.totalAmount,
      interestRate: inst.interestRate,
      installmentCount: inst.installmentCount,
      startDate: inst.startDate,
      type: inst.type,
      linkedGroupId: inst.linkedGroupId || ''
    });
    setShowAdd(true);
  };

  const handleDelete = (id: string) => {
    vibrate();
    dispatch.deleteInstallment(id);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.totalAmount || !formData.installmentCount) return;
    vibrate();

    if (editingId) {
       dispatch.updateInstallment(editingId, {
         title: formData.title,
         totalAmount: Number(formData.totalAmount),
         interestRate: Number(formData.interestRate || 0),
         installmentCount: Number(formData.installmentCount),
         startDate: formData.startDate,
         type: formData.type as any,
         linkedGroupId: formData.linkedGroupId || undefined
       });
       dispatch.setNotification({ message: language === 'ar' ? 'تم تحديث القسط' : 'Installment updated', type: 'success' });
       setEditingId(null);
    } else {
       dispatch.addInstallment({
         title: formData.title,
         totalAmount: Number(formData.totalAmount),
         interestRate: Number(formData.interestRate || 0),
         installmentCount: Number(formData.installmentCount),
         startDate: formData.startDate || new Date().toISOString().split('T')[0],
         type: formData.type as any || 'purchase',
         penalty: 0,
         linkedGroupId: formData.linkedGroupId || undefined
       });
       dispatch.setNotification({ message: language === 'ar' ? 'تمت إضافة خطة القسط' : 'Installment plan added', type: 'success' });
    }
    
    setShowAdd(false);
    setFormData({ title: '', totalAmount: 0, interestRate: 0, installmentCount: 12, type: 'purchase', startDate: new Date().toISOString().split('T')[0], linkedGroupId: '' });
  };

  const handlePay = () => {
    if (payId) {
      vibrate();
      dispatch.payInstallment(payId, Number(penalty));
      setPayId(null);
      setPenalty(0);
    }
  };

  // --- CALCULATIONS & STATS ---
  const activeInstallments = installments.filter(i => i.status === 'active');
  const completedInstallments = installments.filter(i => i.status === 'completed');

  const stats = useMemo(() => {
    let totalMonthlyCommitment = 0;
    let totalPrincipalWithInterest = 0;
    let totalPaidAmount = 0;
    let totalRemainingAmount = 0;
    let totalRemainingMonths = 0;

    activeInstallments.forEach(inst => {
      // Re-calculate derived values
      const totalWithInterest = inst.totalAmount * (1 + (inst.interestRate / 100));
      const monthly = inst.monthlyAmount;
      const paid = inst.paidCount * monthly;
      const remaining = totalWithInterest - paid;

      totalMonthlyCommitment += monthly;
      totalPrincipalWithInterest += totalWithInterest;
      totalPaidAmount += paid;
      totalRemainingAmount += remaining;
      totalRemainingMonths += (inst.installmentCount - inst.paidCount);
    });

    return {
      totalMonthlyCommitment,
      totalPrincipalWithInterest,
      totalPaidAmount,
      totalRemainingAmount,
      totalRemainingMonths
    };
  }, [activeInstallments]);

  // Data for Pie Chart
  const chartData = [
    { name: language === 'ar' ? 'مدفوع' : 'Paid', value: stats.totalPaidAmount, color: '#10B981' }, // Emerald
    { name: language === 'ar' ? 'متبقي' : 'Remaining', value: stats.totalRemainingAmount, color: '#F43F5E' }, // Rose
  ];

  const emptyChart = stats.totalPrincipalWithInterest === 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-24 px-2">
      
      {/* 1. Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <CreditCard className="text-rose-500" />
            {language === 'ar' ? 'الأقساط والديون' : 'Debts & Installments'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2 font-bold uppercase tracking-wider text-xs">
            {language === 'ar' ? 'لوحة التحكم بالالتزامات المالية' : 'Financial Liabilities Dashboard'}
          </p>
        </div>
        <button 
          onClick={() => { setShowAdd(!showAdd); setEditingId(null); setFormData({ title: '', totalAmount: 0, interestRate: 0, installmentCount: 12, type: 'purchase', startDate: new Date().toISOString().split('T')[0], linkedGroupId: '' }); }}
          className="px-6 py-3 bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 hover:scale-105 transition-transform"
        >
          {showAdd ? <X size={20} /> : <Plus size={20} />}
          {showAdd ? (language === 'ar' ? 'إلغاء' : 'Cancel') : (language === 'ar' ? 'خطة جديدة' : 'New Plan')}
        </button>
      </div>

      {/* 2. STATS DASHBOARD & GRAPH */}
      {!showAdd && activeInstallments.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Stats Cards */}
           <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              <div className="bg-slate-900 text-white p-6 rounded-[32px] shadow-xl flex flex-col justify-between relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10"><Calendar size={64} /></div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{language === 'ar' ? 'الالتزام الشهري' : 'Monthly Commitment'}</p>
                    <p className="text-2xl font-black text-white">${stats.totalMonthlyCommitment.toLocaleString()}</p>
                 </div>
                 <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-400">
                    <Activity size={12} />
                    {language === 'ar' ? 'يخصم شهرياً من دخلك' : 'Deducted monthly from income'}
                 </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{language === 'ar' ? 'إجمالي الدين المتبقي' : 'Total Remaining Debt'}</p>
                    <p className="text-2xl font-black text-rose-600 dark:text-rose-400">${stats.totalRemainingAmount.toLocaleString()}</p>
                 </div>
                 <div className="mt-4 flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                       <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(stats.totalRemainingAmount / stats.totalPrincipalWithInterest) * 100}%` }}></div>
                    </div>
                    <span className="text-[9px] font-black text-slate-400">
                       {Math.round((stats.totalRemainingAmount / stats.totalPrincipalWithInterest) * 100)}%
                    </span>
                 </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-[32px] border border-emerald-100 dark:border-emerald-800/30 flex flex-col justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">{language === 'ar' ? 'تم سداده' : 'Total Paid'}</p>
                    <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">${stats.totalPaidAmount.toLocaleString()}</p>
                 </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{language === 'ar' ? 'أقساط متبقية' : 'Remaining Installments'}</p>
                    <p className="text-xl font-black text-slate-800 dark:text-white">{stats.totalRemainingMonths} <span className="text-xs">{language === 'ar' ? 'شهر' : 'Months'}</span></p>
                 </div>
              </div>
           </div>

           {/* Chart */}
           <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center relative">
               <h3 className="absolute top-6 left-6 text-[10px] font-black uppercase tracking-widest text-slate-400">{language === 'ar' ? 'هيكل الديون' : 'Debt Structure'}</h3>
               <div className="w-full h-[160px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie 
                         data={emptyChart ? [{value: 1}] : chartData} 
                         innerRadius={45} 
                         outerRadius={60} 
                         paddingAngle={5} 
                         dataKey="value"
                         stroke="none"
                       >
                         {emptyChart 
                           ? <Cell fill="#f1f5f9" />
                           : chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} cornerRadius={4} />)
                         }
                       </Pie>
                       <RechartsTooltip 
                         contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                         itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                       />
                    </PieChart>
                  </ResponsiveContainer>
               </div>
               <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-1.5">
                     <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                     <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{language === 'ar' ? 'مدفوع' : 'Paid'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                     <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                     <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{language === 'ar' ? 'متبقي' : 'Remaining'}</span>
                  </div>
               </div>
           </div>
        </div>
      )}

      {/* 3. ADD / EDIT FORM */}
      {showAdd && (
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-700 animate-in slide-in-from-top-4">
           <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase flex items-center gap-2">
              <CreditCard className="text-rose-500" /> 
              {editingId ? (language === 'ar' ? 'تعديل الخطة' : 'Edit Plan') : (language === 'ar' ? 'إنشاء خطة تقسيط' : 'Create Installment Plan')}
           </h3>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">{language === 'ar' ? 'عنوان الخطة (مثال: قرض سيارة)' : 'Plan Title (e.g. Car Loan)'}</label>
                 <input 
                   required
                   value={formData.title} 
                   onChange={e => setFormData({...formData, title: e.target.value})}
                   className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl font-bold text-slate-900 dark:text-white border-none outline-none focus:ring-4 focus:ring-rose-500/10"
                   placeholder="..."
                 />
              </div>
              
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">{language === 'ar' ? 'المبلغ الإجمالي (الأصل)' : 'Total Principal Amount'}</label>
                 <input 
                   required
                   type="number"
                   value={formData.totalAmount || ''} 
                   onChange={e => setFormData({...formData, totalAmount: parseFloat(e.target.value)})}
                   className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl font-bold text-slate-900 dark:text-white border-none outline-none focus:ring-4 focus:ring-rose-500/10"
                   placeholder="0.00"
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">{language === 'ar' ? 'نسبة الفائدة (إن وجدت)' : 'Interest Rate % (Flat)'}</label>
                 <div className="relative">
                    <input 
                      type="number"
                      value={formData.interestRate || ''} 
                      onChange={e => setFormData({...formData, interestRate: parseFloat(e.target.value)})}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl font-bold text-slate-900 dark:text-white border-none outline-none focus:ring-4 focus:ring-rose-500/10"
                      placeholder="0"
                    />
                    <Percent size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">{language === 'ar' ? 'عدد الأشهر' : 'Duration (Months)'}</label>
                 <input 
                   required
                   type="number"
                   value={formData.installmentCount || ''} 
                   onChange={e => setFormData({...formData, installmentCount: parseFloat(e.target.value)})}
                   className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl font-bold text-slate-900 dark:text-white border-none outline-none focus:ring-4 focus:ring-rose-500/10"
                   placeholder="12"
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">{language === 'ar' ? 'تاريخ البدء' : 'Start Date'}</label>
                 <input 
                   type="date"
                   value={formData.startDate} 
                   onChange={e => setFormData({...formData, startDate: e.target.value})}
                   className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl font-bold text-slate-900 dark:text-white border-none outline-none focus:ring-4 focus:ring-rose-500/10"
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">{language === 'ar' ? 'ربط بمجموعة (اختياري)' : 'Link to Group (Cost Center)'}</label>
                 <select 
                   value={formData.linkedGroupId} 
                   onChange={e => setFormData({...formData, linkedGroupId: e.target.value})}
                   className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl font-bold text-slate-900 dark:text-white border-none outline-none focus:ring-4 focus:ring-rose-500/10 appearance-none cursor-pointer"
                 >
                   <option value="">{language === 'ar' ? 'بدون ربط (افتراضي)' : 'Unlinked (Default)'}</option>
                   {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                 </select>
              </div>
           </div>

           <div className="mt-8 flex gap-4">
              <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-4 bg-slate-100 dark:bg-slate-900 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest flex-1 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                 {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button type="submit" className="px-6 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex-[2] shadow-xl shadow-rose-600/20 hover:scale-[1.02] transition-transform">
                 {language === 'ar' ? 'حفظ الخطة' : 'Save Plan'}
              </button>
           </div>
        </form>
      )}

      {/* 4. ACTIVE PLANS LIST */}
      {!showAdd && (
        <div className="space-y-4">
           {activeInstallments.map(inst => {
             const progress = (inst.paidCount / inst.installmentCount) * 100;
             const isNearEnd = progress > 80;
             return (
               <div key={inst.id} className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                  {/* Progress Bar Background */}
                  <div className="absolute bottom-0 left-0 h-1.5 bg-slate-100 dark:bg-slate-700 w-full">
                     <div className={`h-full ${isNearEnd ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }}></div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400">
                           <Wallet size={24} />
                        </div>
                        <div>
                           <h4 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                             {inst.title}
                             {inst.linkedGroupId && <span className="text-[9px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-md text-slate-500 uppercase">{groups.find(g => g.id === inst.linkedGroupId)?.name}</span>}
                           </h4>
                           <div className="flex items-center gap-3 text-xs font-bold text-slate-500 mt-1">
                              <span>${inst.monthlyAmount.toLocaleString()}/mo</span>
                              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                              <span>{inst.paidCount} of {inst.installmentCount} Paid</span>
                           </div>
                        </div>
                     </div>

                     <div className="flex items-center gap-3">
                        <button 
                           onClick={() => setPayId(inst.id)}
                           className="px-5 py-3 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform flex items-center gap-2"
                        >
                           <DollarSign size={14} /> {language === 'ar' ? 'دفع قسط' : 'Pay Month'}
                        </button>
                        <button onClick={() => handleEdit(inst)} className="p-3 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-blue-500 rounded-xl transition-colors">
                           <Edit3 size={18} />
                        </button>
                        <button onClick={() => handleDelete(inst.id)} className="p-3 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-rose-500 rounded-xl transition-colors">
                           <Trash2 size={18} />
                        </button>
                     </div>
                  </div>
               </div>
             );
           })}

           {activeInstallments.length === 0 && !showAdd && (
              <div className="text-center py-20 opacity-40">
                 <CheckCircle2 size={48} className="mx-auto mb-4 text-slate-300" />
                 <p className="text-sm font-black uppercase tracking-[4px]">{language === 'ar' ? 'لا توجد التزامات نشطة' : 'No active liabilities'}</p>
              </div>
           )}
        </div>
      )}
      
      {/* 5. PAY MODAL */}
      {payId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] w-full max-w-md shadow-2xl animate-in zoom-in-95">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                 <DollarSign size={32} />
              </div>
              <h3 className="text-xl font-black text-center text-slate-900 dark:text-white mb-2 uppercase">{language === 'ar' ? 'تأكيد الدفع' : 'Confirm Payment'}</h3>
              <p className="text-center text-slate-500 text-xs font-bold mb-8">{language === 'ar' ? 'سيتم تسجيل العملية كمصروف وخصمها من الرصيد.' : 'Transaction will be recorded as expense.'}</p>
              
              <div className="space-y-4 mb-8">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">{language === 'ar' ? 'غرامة تأخير (إن وجدت)' : 'Late Penalty (Optional)'}</label>
                 <input 
                   type="number"
                   value={penalty}
                   onChange={e => setPenalty(parseFloat(e.target.value))}
                   className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl font-bold text-slate-900 dark:text-white border-none outline-none focus:ring-4 focus:ring-emerald-500/10"
                 />
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => setPayId(null)} className="py-4 bg-slate-100 dark:bg-slate-900 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200">
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                 </button>
                 <button onClick={handlePay} className="py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform">
                    {language === 'ar' ? 'تأكيد الدفع' : 'Confirm Pay'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Installments;
