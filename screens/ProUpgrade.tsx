
import React from 'react';
import { useApp } from '../store';
import { Check, ShieldCheck, Sparkles, Cpu, Cloud, BarChart2, Lock } from 'lucide-react';

const ProUpgrade: React.FC = () => {
  const { state, dispatch } = useApp();
  const { language } = state;

  const features = [
    { title: language === 'ar' ? 'تحليلات ذكاء اصطناعي متقدمة' : 'Advanced AI Insights', icon: Cpu },
    { title: language === 'ar' ? 'مزامنة سحابية فورية' : 'Real-time Cloud Sync', icon: Cloud },
    { title: language === 'ar' ? 'تقارير مالية عميقة' : 'Deep Financial Reports', icon: BarChart2 },
    { title: language === 'ar' ? 'دعم فني مخصص' : 'Priority Support', icon: Sparkles },
    { title: language === 'ar' ? 'بدون إعلانات تماماً' : 'Completely Ad-Free', icon: Lock },
  ];

  const handleUpgrade = () => {
    dispatch.setPro(true);
    alert(language === 'ar' ? 'تمت الترقية بنجاح!' : 'Upgraded successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in zoom-in duration-500">
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center p-4 bg-blue-100 dark:bg-blue-900/30 rounded-3xl text-blue-600 mb-6">
          <ShieldCheck size={48} />
        </div>
        <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-800 dark:text-white mb-4">
          {language === 'ar' ? 'ارتقِ بإدارتك المالية' : 'Elevate Your Finance Game'}
        </h2>
        <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          {language === 'ar' 
            ? 'احصل على كافة الميزات الاحترافية وتحكم كامل في تدفقاتك النقدية.' 
            : 'Get all the pro features and complete control over your cash flow.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                <f.icon size={24} />
              </div>
              <span className="font-bold text-slate-700 dark:text-slate-200">{f.title}</span>
              <Check className="ml-auto text-green-500" size={20} />
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-2xl shadow-blue-500/10 border border-slate-100 dark:border-slate-700 relative overflow-hidden">
          {state.isPro && (
             <div className="absolute top-4 right-4 rotate-12 bg-green-500 text-white px-4 py-1 rounded-full font-bold text-sm shadow-lg">ACTIVE</div>
          )}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{language === 'ar' ? 'الباقة الاحترافية' : 'Pro Monthly'}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-blue-600">49.99</span>
              <span className="text-slate-500 font-bold uppercase tracking-tighter">EGP / Mo</span>
            </div>
          </div>
          
          <ul className="space-y-4 mb-10">
            <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
               <Check size={18} className="text-blue-500" />
               {language === 'ar' ? 'مجموعات غير محدودة' : 'Unlimited Groups'}
            </li>
            <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
               <Check size={18} className="text-blue-500" />
               {language === 'ar' ? 'تصدير بصيغة PDF و Excel' : 'Export to PDF & Excel'}
            </li>
            <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
               <Check size={18} className="text-blue-500" />
               {language === 'ar' ? 'تذكيرات ذكية' : 'Smart Reminders'}
            </li>
          </ul>

          <button 
            disabled={state.isPro}
            onClick={handleUpgrade}
            className={`w-full py-5 rounded-3xl font-black text-xl shadow-xl transition-all transform active:scale-95 ${state.isPro ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'}`}
          >
            {state.isPro ? (language === 'ar' ? 'أنت عضو مميز بالفعل' : 'Already Pro') : (language === 'ar' ? 'ابدأ الآن' : 'Get Started Now')}
          </button>
          
          <p className="text-center text-slate-400 text-xs mt-6 px-4">
            {language === 'ar' 
              ? 'بالنقر على "ابدأ الآن"، فإنك توافق على شروط الخدمة وسياسة الخصوصية.' 
              : 'By clicking "Get Started", you agree to our Terms of Service & Privacy Policy.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProUpgrade;
