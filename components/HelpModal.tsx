import React, { useState } from 'react';
import { useApp } from '../store';
import { X, HelpCircle, BookOpen, MessageSquare, Target, PieChart, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState<'faq' | 'guide'>('guide');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const faqs = [
    {
      q: state.language === 'ar' ? 'كيف أضيف معاملة جديدة؟' : 'How do I add a new transaction?',
      a: state.language === 'ar' ? 'يمكنك الضغط على زر (+) في أسفل الشاشة الرئيسية لإضافة مصروف أو دخل جديد.' : 'You can tap the (+) button at the bottom of the home screen to add a new expense or income.'
    },
    {
      q: state.language === 'ar' ? 'كيف يعمل الذكاء الاصطناعي (AI)؟' : 'How does the AI work?',
      a: state.language === 'ar' ? 'يقوم الذكاء الاصطناعي بتحليل مصاريفك، تقديم نصائح، وقراءة الإيصالات. يمكنك أيضاً استخدام الأوامر المدمجة (بدون إنترنت) مثل /balance.' : 'The AI analyzes your spending, provides tips, and reads receipts. You can also use built-in offline commands like /balance.'
    },
    {
      q: state.language === 'ar' ? 'هل بياناتي آمنة؟' : 'Is my data secure?',
      a: state.language === 'ar' ? 'نعم، جميع بياناتك يتم تخزينها محلياً على جهازك ولا يتم إرسالها لأي جهة خارجية إلا عند استخدامك لميزات الذكاء الاصطناعي (يتم إرسال السؤال فقط).' : 'Yes, all your data is stored locally on your device and is not sent to any third party except when using AI features (only the prompt is sent).'
    },
    {
      q: state.language === 'ar' ? 'كيف أحسب الأهداف المالية؟' : 'How do I calculate financial goals?',
      a: state.language === 'ar' ? 'اذهب إلى شاشة "الأهداف" وأضف هدفك. التطبيق سيقوم تلقائياً بحساب الوقت المتبقي بناءً على معدل توفيرك الشهري.' : 'Go to the "Goals" screen and add your goal. The app will automatically calculate the remaining time based on your monthly savings rate.'
    }
  ];

  const guides = [
    {
      icon: PieChart,
      title: state.language === 'ar' ? 'التحليلات الذكية' : 'Smart Analytics',
      desc: state.language === 'ar' ? 'تابع مصاريفك من خلال رسوم بيانية تفاعلية. يمكنك إنشاء رسوم مخصصة عبر التحدث مع الذكاء الاصطناعي.' : 'Track your expenses through interactive charts. You can create custom charts by chatting with the AI.'
    },
    {
      icon: Target,
      title: state.language === 'ar' ? 'الأهداف المستقبلية' : 'Future Goals',
      desc: state.language === 'ar' ? 'حدد أهدافك (مثل شراء سيارة) وسيقوم التطبيق بحساب موعد تحقيقها بناءً على مدخراتك الحالية.' : 'Set your goals (like buying a car) and the app will calculate when you will achieve them based on your current savings.'
    },
    {
      icon: MessageSquare,
      title: state.language === 'ar' ? 'المساعد المدمج (أوفلاين)' : 'Built-in Assistant (Offline)',
      desc: state.language === 'ar' ? 'في شاشة الذكاء الاصطناعي، اكتب /help لمعرفة الأوامر المتاحة التي تعمل بدون إنترنت مثل /add و /balance.' : 'In the AI screen, type /help to see available offline commands like /add and /balance.'
    },
    {
      icon: Sparkles,
      title: state.language === 'ar' ? 'الذكاء الاصطناعي (AI)' : 'Artificial Intelligence (AI)',
      desc: state.language === 'ar' ? 'استخدم الـ AI للحصول على تدقيق مالي، قراءة الفواتير، أو حتى البحث عن أسعار المنتجات في السوق.' : 'Use AI to get financial audits, read receipts, or even search for product prices in the market.'
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <HelpCircle size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {state.language === 'ar' ? 'دليل الاستخدام والأسئلة' : 'Help & FAQ'}
              </h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {state.language === 'ar' ? 'تعرف على ميزات التطبيق' : 'Discover app features'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-4 gap-2 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              activeTab === 'guide' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-blue-600'
            }`}
          >
            <BookOpen size={16} /> {state.language === 'ar' ? 'دليل التطبيق' : 'App Guide'}
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              activeTab === 'faq' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-blue-600'
            }`}
          >
            <MessageSquare size={16} /> {state.language === 'ar' ? 'الأسئلة الشائعة' : 'FAQ'}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {activeTab === 'guide' ? (
            <div className="space-y-4">
              {guides.map((guide, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                    <guide.icon size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1">{guide.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{guide.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span className="text-sm font-black text-slate-900 dark:text-white">{faq.q}</span>
                    {openFaqIndex === idx ? <ChevronUp size={18} className="text-blue-500" /> : <ChevronDown size={18} className="text-slate-400" />}
                  </button>
                  {openFaqIndex === idx && (
                    <div className="p-4 pt-0 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium border-t border-slate-50 dark:border-slate-800/50 mt-2">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
