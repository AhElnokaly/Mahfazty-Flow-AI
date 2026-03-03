import React, { useState } from 'react';
import { useApp } from '../store';
import { 
  Wallet, PieChart, BrainCircuit, ShieldCheck, ArrowRight, Check
} from 'lucide-react';

const ONBOARDING_SLIDES = [
  {
    id: 'welcome',
    title: { en: 'Welcome to Mahfazty Flow', ar: 'مرحباً بك في محفظتي Flow' },
    description: { 
      en: 'Master your finances with ease and precision. The ultimate tool for personal financial management.', 
      ar: 'تحكم في أموالك بدقة وسهولة. الأداة المثالية لإدارة شؤونك المالية الشخصية.' 
    },
    icon: Wallet,
    color: 'bg-blue-500'
  },
  {
    id: 'budget',
    title: { en: 'Smart Budgeting', ar: 'ميزانية ذكية' },
    description: { 
      en: 'Set monthly budgets for your groups and track your spending in real-time to stay on top of your goals.', 
      ar: 'حدد ميزانيات شهرية لمجموعاتك وتابع نفقاتك في الوقت الفعلي لتحقيق أهدافك.' 
    },
    icon: PieChart,
    color: 'bg-emerald-500'
  },
  {
    id: 'ai',
    title: { en: 'AI-Powered Insights', ar: 'رؤى مدعومة بالذكاء الاصطناعي' },
    description: { 
      en: 'Get personalized financial advice, trend analysis, and smart recommendations powered by advanced AI.', 
      ar: 'احصل على نصائح مالية مخصصة، وتحليل للاتجاهات، وتوصيات ذكية مدعومة بأحدث تقنيات الذكاء الاصطناعي.' 
    },
    icon: BrainCircuit,
    color: 'bg-amber-500'
  },
  {
    id: 'privacy',
    title: { en: 'Secure & Private', ar: 'آمن وخاص' },
    description: { 
      en: 'Your data is stored locally on your device. We prioritize your privacy and security above all else.', 
      ar: 'يتم تخزين بياناتك محلياً على جهازك. نحن نعطي الأولوية لخصوصيتك وأمانك قبل كل شيء.' 
    },
    icon: ShieldCheck,
    color: 'bg-indigo-500'
  }
];

const Onboarding: React.FC = () => {
  const { state, dispatch } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      dispatch.completeOnboarding();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    dispatch.completeOnboarding();
  };

  const currentSlide = ONBOARDING_SLIDES[currentIndex];
  const lang = state.language;

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Background Effects */}
      <div className={`absolute inset-0 transition-colors duration-700 opacity-20 ${currentSlide.color.replace('bg-', 'bg-opacity-20 bg-')}`}></div>
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>

      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-20">
        <button 
          onClick={handleSkip}
          className="text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
        >
          {lang === 'ar' ? 'تخطي' : 'Skip'}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center relative z-10">
        <div key={currentIndex} className="animate-in fade-in slide-in-from-bottom-8 duration-500 flex flex-col items-center space-y-8 max-w-md">
          
          {/* Icon */}
          <div className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center shadow-2xl mb-4 ${currentSlide.color} shadow-${currentSlide.color.replace('bg-', '')}/30`}>
            <currentSlide.icon size={64} className="text-white" />
          </div>

          {/* Text */}
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
              {lang === 'ar' ? currentSlide.title.ar : currentSlide.title.en}
            </h2>
            <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed">
              {lang === 'ar' ? currentSlide.description.ar : currentSlide.description.en}
            </p>
          </div>
        </div>
      </div>

      {/* Footer / Controls */}
      <div className="p-8 pb-12 w-full max-w-md mx-auto relative z-10">
        
        {/* Indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {ONBOARDING_SLIDES.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/20'}`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button 
          onClick={handleNext}
          className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl flex items-center justify-center gap-2 group ${
            isLastSlide 
              ? 'bg-white text-slate-950 hover:bg-slate-100' 
              : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/10'
          }`}
        >
          {isLastSlide ? (
            <>
              {lang === 'ar' ? 'ابدأ الآن' : 'Get Started'}
              <Check size={16} />
            </>
          ) : (
            <>
              {lang === 'ar' ? 'التالي' : 'Next'}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
