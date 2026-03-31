
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../store';
import { sendChatMessage, editFinancialImage, generateVideo } from '../geminiService';
import { TransactionType } from '../types';
import { 
  Sparkles, Send, Bot, Loader2, 
  Zap, MessageSquare, ShieldCheck,
  BrainCircuit, Terminal,
  Lightbulb, Compass, Trash2,
  Image as ImageIcon, Wand2, X, Upload, ExternalLink, BarChart3, CheckCircle2, AlertCircle, TrendingUp, Scale,
  LayoutGrid, Search, PieChart, Activity
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getLocalResponse, getLocalSuggestions } from '../knowledgeBase'; // +++ أضيف بناءً على طلبك +++

// AI Feature Definitions
const AI_FEATURES = [
  {
    id: 'audit',
    titleEn: 'Forensic Audit',
    titleAr: 'تدقيق جنائي',
    descEn: 'Identify hidden spending leaks and forensic patterns in your 30-day history.',
    descAr: 'تحديد تسريبات الإنفاق المخفية والأنماط الجنائية في سجلك المالي.',
    icon: ShieldCheck,
    color: 'bg-rose-500',
    mode: 'architect',
    prompt: 'Analyze my last 30 days of transactions for forensic spending leaks and suggest 3 concrete improvements.'
  },
  {
    id: 'visualize',
    titleEn: 'Data Visualizer',
    titleAr: 'منشئ الرسوم',
    descEn: 'Transform raw data into a custom dashboard widget using natural language.',
    descAr: 'تحويل البيانات الخام إلى رسم بياني مخصص باستخدام لغة طبيعية.',
    icon: PieChart,
    color: 'bg-blue-600',
    mode: 'architect',
    prompt: 'Create a bar chart showing my expenses grouped by category for this month.'
  },
  {
    id: 'debt',
    titleEn: 'Debt Projection',
    titleAr: 'تخطيط الديون',
    descEn: 'Plan a new purchase or loan and see how it affects your future net worth.',
    descAr: 'خطط لشراء جديد أو قرض وشاهد كيف يؤثر ذلك على صافي ثروتك المستقبلية.',
    icon: Scale,
    color: 'bg-amber-500',
    mode: 'assistant',
    prompt: 'I want to buy something for 15,000 EGP over 12 months with 5% interest. Should I do it?'
  },
  {
    id: 'search',
    titleEn: 'Market Search',
    titleAr: 'بحث السوق',
    descEn: 'Live search for item prices and market trends to ensure you get the best deal.',
    descAr: 'بحث مباشر عن أسعار السلع وتوجهات السوق لضمان حصولك على أفضل صفقة.',
    icon: Search,
    color: 'bg-emerald-600',
    mode: 'architect',
    prompt: 'Check the current market prices for iPhone 15 in Egypt and compare it with my recent electronics spending.'
  },
  {
    id: 'magic',
    titleEn: 'Magic Receipt',
    titleAr: 'المعالج السحري',
    descEn: 'Digitize and improve old receipts or document images for clear bookkeeping.',
    descAr: 'رقمنة وتحسين الإيصالات القديمة أو صور المستندات لتدوين حسابات واضح.',
    icon: Wand2,
    color: 'bg-purple-600',
    mode: 'studio',
    prompt: 'Clean up this receipt and extract the total amount spent.'
  },
  {
    id: 'video',
    titleEn: 'Cosmic Journey',
    titleAr: 'رحلة كونية',
    descEn: 'Generate a cinematic cosmic journey video using Veo.',
    descAr: 'إنشاء فيديو سينمائي لرحلة كونية باستخدام Veo.',
    icon: Sparkles,
    color: 'bg-indigo-600',
    mode: 'video',
    prompt: 'A first-person cosmic journey starting inside the infinite glowing singularity at t=0, ultra-dense white-blue plasma point exploding into rapid cosmic inflation, spacetime stretching like a balloon in hyper-speed, colors shifting from blinding white to fiery plasma soup of quarks and gluons swirling violently, then cooling into glowing orange-red cosmic microwave background fog with tiny fluctuations, finally dark void pierced by the sudden ignition of the very first ancient stars bursting into brilliant golden-blue light everywhere, cinematic, epic scale, intense dynamic camera rush forward through expanding universe, 6 seconds smooth fast motion, ultra high detail, 8k, dramatic lighting, awe-inspiring, scientific visualization style --ar 16:9 --v 6 --stylize 750 --chaos 20'
  }
];

// Enhanced Text Component for AI Responses
const AIResponseContent: React.FC<{ text: string; isUser: boolean }> = ({ text, isUser }) => {
  if (isUser) return <span className="whitespace-pre-wrap font-sans">{text}</span>;

  const lines = text.split('\n');
  return (
    <div className="space-y-2 text-[13px] leading-relaxed text-slate-700 dark:text-slate-200">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        
        // Render Grounding Links
        if (trimmed.startsWith('http')) {
          return (
            <a key={i} href={trimmed} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-500 font-black hover:underline py-1 group/link">
              <ExternalLink size={12} className="group-hover/link:scale-125 transition-transform" />
              <span className="truncate max-w-[200px] sm:max-w-none">{trimmed}</span>
            </a>
          );
        }

        // List Handling
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          return (
             <div key={i} className="flex gap-2 items-start ml-2 my-1">
               <span className="text-blue-500 mt-2 text-[10px] shrink-0">●</span>
               <span className="flex-1" dangerouslySetInnerHTML={{ __html: formatBold(trimmed.substring(2)) }} />
             </div>
          );
        }

        // Bold Headers Handling
        if (trimmed.startsWith('## ')) {
           return <h4 key={i} className="text-sm font-black text-blue-700 dark:text-blue-400 mt-4 mb-2 pb-1 border-b border-blue-50 dark:border-blue-900/30">{trimmed.replace('## ', '')}</h4>
        }

        if (trimmed === '') return <div key={i} className="h-1"></div>;
        
        return <p key={i} dangerouslySetInnerHTML={{ __html: formatBold(line) }} />;
      })}
    </div>
  );
};

const formatBold = (text: string) => {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-slate-900 dark:text-white">$1</strong>');
};

// --- PROPOSAL CARD: PROFESSIONAL EDITION ---
const InstallmentProposal: React.FC<{ data: any, onAccept: () => void, onReject: () => void }> = ({ data, onAccept, onReject }) => {
  return (
    <div className="mt-6 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
      {/* Header Verdict */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white flex justify-between items-center">
         <div className="flex items-center gap-2">
            <BrainCircuit size={18} />
            <span className="text-xs font-black uppercase tracking-[2px]">AI Financial Verdict</span>
         </div>
         <div className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-bold">Proposed Plan</div>
      </div>

      <div className="p-6 space-y-6">
         {/* Analysis Section */}
         <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0 text-blue-600">
               <Scale size={20} />
            </div>
            <div>
               <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">Opinion & Analysis</h4>
               <p className="text-xs text-slate-500 leading-relaxed">
                  Based on the loan request for <strong className="text-slate-800 dark:text-slate-200">{data.title}</strong>, adding this liability will increase your monthly commitment by approximately <strong className="text-rose-500">${(data.totalAmount * (1 + (data.interestRate||0)/100) / data.installmentCount).toFixed(0)}</strong>. Ensure this fits within your disposable income.
               </p>
            </div>
         </div>
         
         {/* Data Grid */}
         <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
            <div>
               <p className="text-[9px] font-black uppercase text-slate-400">Total Principal</p>
               <p className="text-sm font-black text-slate-900 dark:text-white">${data.totalAmount}</p>
            </div>
             <div>
               <p className="text-[9px] font-black uppercase text-slate-400">Duration</p>
               <p className="text-sm font-black text-slate-900 dark:text-white">{data.installmentCount} Months</p>
            </div>
             <div>
               <p className="text-[9px] font-black uppercase text-slate-400">Interest</p>
               <p className="text-sm font-black text-amber-500">{data.interestRate > 0 ? `${data.interestRate}%` : '0% (Interest Free)'}</p>
            </div>
             <div>
               <p className="text-[9px] font-black uppercase text-slate-400">Start Date</p>
               <p className="text-sm font-black text-slate-900 dark:text-white">{data.startDate || 'Immediate'}</p>
            </div>
         </div>

         {/* Actions */}
         <div className="flex gap-3 pt-2">
            <button onClick={onAccept} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all">
                <CheckCircle2 size={16} /> Approve Plan
            </button>
            <button onClick={onReject} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 transition-all">
                Discard
            </button>
         </div>
      </div>
    </div>
  );
}

const AIInsights: React.FC = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { language, chatHistory, proChatHistory, isPro, userProfile } = state;
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [showFeatureLibrary, setShowFeatureLibrary] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [selectedImage, setSelectedImage] = useState<{file: File, preview: string, base64: string} | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State to hold pending proposal
  const [pendingProposal, setPendingProposal] = useState<any>(null);

  const isConfigured = state.apiKeys?.some(k => k.provider === 'gemini' && k.key && !k.isBlocked); // +++ أضيف بناءً على طلبك +++

  const currentHistory = isPro ? proChatHistory : chatHistory;

  const vibrate = () => {
    if (navigator.vibrate) navigator.vibrate(15);
  };

  // Handle passed initial messages
  useEffect(() => {
    const initialMsg = location.state?.initialMessage;
    if (initialMsg && !isChatting) {
      const timer = setTimeout(() => {
        handleSendMessage(initialMsg);
        navigate(location.pathname, { replace: true, state: {} });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage({
          file,
          preview: URL.createObjectURL(file),
          base64: (reader.result as string).split(',')[1]
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (overrideMsg?: string) => {
    const messageToSend = overrideMsg || chatInput;
    if ((!messageToSend.trim() && !selectedImage) || isChatting) return;
    vibrate();
    
    const userMsg = messageToSend;
    const currentImageData = selectedImage ? { data: selectedImage.base64, mimeType: selectedImage.file.type } : undefined;
    const currentSelectedImage = selectedImage;
    
    setChatInput('');
    setSelectedImage(null);
    setPendingProposal(null); // Clear old proposals
    setShowFeatureLibrary(false);
    
    const isImageEditRequest = currentSelectedImage && /edit|improve|clean|تعديل|تحسين|وضح/i.test(userMsg);
    const isVideoRequest = /video|فيديو|generate video|انشاء فيديو/i.test(userMsg);

    if (isImageEditRequest) {
      handleImageEdit(userMsg, currentSelectedImage);
      return;
    }

    if (isVideoRequest) {
      handleGenerateVideo(userMsg);
      return;
    }

    dispatch.addChatMessage({ role: 'user', text: userMsg + (currentImageData ? ` [Attached: ${currentSelectedImage?.file.name}]` : ''), timestamp: new Date().toISOString() }, isPro);
    
    // +++ أضيف بناءً على طلبك +++ (Offline Smart Commands)
    const isOfflineCommand = userMsg.startsWith('/') || 
      /^(اضف|إضافة|add)\s+(\d+)\s+(.+)/i.test(userMsg) ||
      /^(رصيد|balance|رصيدي)/i.test(userMsg) ||
      /^(اهداف|أهداف|أهدافي|goals)/i.test(userMsg) ||
      /^(مساعدة|help)/i.test(userMsg);

    if (isOfflineCommand || !state.apiKeys?.find(k => k.provider === 'gemini' && k.key)) {
      const cmd = userMsg.toLowerCase().trim();
      let reply = '';
      
      const addMatch = userMsg.match(/^(?:اضف|إضافة|add)\s+(\d+)\s+(.+)/i);
      
      if (cmd === '/help' || cmd === '/faq' || cmd === 'مساعدة' || cmd === 'help') {
        reply = language === 'ar' 
          ? 'مرحباً! أنا المساعد الذكي المدمج (يعمل بدون إنترنت).\nالأوامر المتاحة:\n**/balance** أو **رصيدي** - عرض رصيدك الحالي\n**/add [amount] [category]** أو **اضف 500 طعام** - إضافة معاملة سريعة\n**اضف 500 دخل راتب** - لإضافة دخل\n**اضف 500 استثمار اسهم** - لإضافة استثمار\n**/goals** أو **أهدافي** - عرض حالة أهدافك' 
          : 'Hello! I am the built-in smart assistant (works offline).\nAvailable commands:\n**/balance** or **balance** - Show current balance\n**/add [amount] [category]** or **add 500 food** - Quick add transaction\n**add 500 income salary** - Add income\n**add 500 investment stocks** - Add investment\n**/goals** or **goals** - Show goals status';
      } else if (cmd === '/balance' || cmd === 'رصيد' || cmd === 'رصيدي' || cmd === 'balance') {
        reply = language === 'ar' 
          ? `رصيد محفظتك الحالي هو: **${state.walletBalance}**` 
          : `Your current wallet balance is: **${state.walletBalance}**`;
      } else if (cmd.startsWith('/add ') || addMatch) {
        let amount = 0;
        let category = '';
        
        if (addMatch) {
          amount = parseFloat(addMatch[1]);
          category = addMatch[2];
        } else {
          const parts = cmd.split(' ');
          if (parts.length >= 3) {
            amount = parseFloat(parts[1]);
            category = parts.slice(2).join(' ');
          }
        }
        
        if (!isNaN(amount) && amount > 0) {
          const defaultGroup = state.groups[0]?.id || 'default';
          const defaultClient = state.clients[0]?.id || 'default';
          
          let type: TransactionType = TransactionType.EXPENSE;
          let typeStr = language === 'ar' ? 'مصروف' : 'expense';
          
          if (category.includes('دخل') || category.includes('income')) {
            type = TransactionType.INCOME;
            typeStr = language === 'ar' ? 'دخل' : 'income';
            category = category.replace(/دخل|income/gi, '').trim();
          } else if (category.includes('استثمار') || category.includes('investment')) {
            type = TransactionType.INVESTMENT;
            typeStr = language === 'ar' ? 'استثمار' : 'investment';
            category = category.replace(/استثمار|investment/gi, '').trim();
          } else if (category.includes('مصروف') || category.includes('expense')) {
            type = TransactionType.EXPENSE;
            typeStr = language === 'ar' ? 'مصروف' : 'expense';
            category = category.replace(/مصروف|expense/gi, '').trim();
          }

          dispatch.addTransaction({
            amount,
            currency: state.baseCurrency,
            type,
            date: new Date().toISOString().split('T')[0],
            groupId: defaultGroup,
            clientId: defaultClient,
            clientIds: [defaultClient],
            note: `Added via Smart Command: ${category || typeStr}`
          });
          
          reply = language === 'ar' ? `تم إضافة ${typeStr} بقيمة **${amount}** لـ **${category || typeStr}** بنجاح.` : `Successfully added ${typeStr} of **${amount}** to **${category || typeStr}**.`;
        } else {
          reply = language === 'ar' ? 'صيغة المبلغ غير صحيحة. استخدم: اضف 500 طعام' : 'Invalid amount format. Use: add 500 food';
        }
      } else if (cmd === '/goals' || cmd === 'اهداف' || cmd === 'أهداف' || cmd === 'أهدافي' || cmd === 'goals') {
        const totalGoals = state.goals?.length || 0;
        const completed = state.goals?.filter(g => g.currentAmount >= g.targetAmount).length || 0;
        reply = language === 'ar' ? `لديك **${totalGoals}** أهداف إجمالية.\nتم تحقيق **${completed}** منها.` : `You have **${totalGoals}** total goals.\n**${completed}** are completed.`;
      } else {
        reply = getLocalResponse(userMsg, language); // +++ أضيف بناءً على طلبك +++
      }
      
      setTimeout(() => {
        dispatch.addChatMessage({ role: 'model', text: `⚡ **[Offline Smart System]**\n\n${reply}`, timestamp: new Date().toISOString() }, isPro);
      }, 500);
      return;
    }
    // +++ نهاية الإضافة +++

    setIsChatting(true);
    const response = await sendChatMessage(state, dispatch, userMsg, isPro, currentImageData);
    
    dispatch.addChatMessage({ role: 'model', text: response.text, timestamp: new Date().toISOString() }, isPro);

    // Handle Tool Calls
    if (response.chartWidget) {
      dispatch.addCustomWidget(response.chartWidget);
      dispatch.setNotification({
        message: language === 'ar' ? 'تم إنشاء الرسم البياني بنجاح!' : 'Chart created successfully!',
        type: 'success'
      });
      setTimeout(() => navigate('/analytics'), 1500);
    }

    if (response.toolCall && response.toolCall.name === 'add_installment_plan') {
       setPendingProposal(response.toolCall.args);
    }

    setIsChatting(false);
  };

  const confirmProposal = () => {
    if(pendingProposal) {
       vibrate();
       dispatch.addInstallment({
         title: pendingProposal.title,
         totalAmount: pendingProposal.totalAmount,
         interestRate: pendingProposal.interestRate || 0,
         installmentCount: pendingProposal.installmentCount,
         startDate: pendingProposal.startDate || new Date().toISOString().split('T')[0],
         type: pendingProposal.type || 'purchase',
         penalty: 0
       });
       dispatch.setNotification({ message: 'Plan added successfully', type: 'success' });
       setPendingProposal(null);
       navigate('/installments');
    }
  };

  const handleImageEdit = async (msg: string, img: {file: File, preview: string, base64: string}) => {
    setIsChatting(true);
    const editedUrl = await editFinancialImage(state, dispatch, msg || "Improve the quality of this receipt", img.base64, img.file.type);
    if (editedUrl) {
      dispatch.addChatMessage({ role: 'user', text: `${language === 'ar' ? 'تعديل سحري:' : 'Magic Edit:'} ${msg || 'Auto'} [Attached: ${img.file.name}]`, timestamp: new Date().toISOString() }, isPro);
      dispatch.addChatMessage({ role: 'model', text: `![Edited Image](${editedUrl})`, timestamp: new Date().toISOString() }, isPro);
    } else {
      dispatch.setNotification({ message: language === 'ar' ? 'فشل التعديل' : 'Edit failed', type: 'error' });
    }
    setIsChatting(false);
  };

  const handleGenerateVideo = async (msg: string) => {
    if (!msg.trim()) return;
    setIsChatting(true);
    setGeneratedVideoUrl(null);
    dispatch.addChatMessage({ role: 'user', text: `${language === 'ar' ? 'إنشاء فيديو:' : 'Generate Video:'} ${msg}`, timestamp: new Date().toISOString() }, isPro);
    
    const videoUrl = await generateVideo(state, dispatch, msg);
    
    if (videoUrl) {
      setGeneratedVideoUrl(videoUrl);
      dispatch.addChatMessage({ role: 'model', text: `[Video Generated Successfully]`, timestamp: new Date().toISOString() }, isPro);
    } else {
      dispatch.setNotification({ message: language === 'ar' ? 'فشل إنشاء الفيديو' : 'Video generation failed', type: 'error' });
    }
    setIsChatting(false);
  };

  const initiateFeature = (feature: typeof AI_FEATURES[0]) => {
    vibrate();
    setChatInput(feature.prompt);
    setShowFeatureLibrary(false);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentHistory, isChatting, pendingProposal]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-32 px-2 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
             <BrainCircuit size={28} />
           </div>
           <div>
             <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
               {language === 'ar' ? 'مركز الذكاء المالي' : 'Financial AI Hub'}
             </h2>
             <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
               Gemini 3 Powered Intelligence
             </p>
           </div>
        </div>
        {isPro && (
           <div className="px-3 py-1.5 bg-amber-400/10 text-amber-600 rounded-full flex items-center gap-2 border border-amber-400/20">
             <Zap size={14} fill="currentColor" />
             <span className="text-[10px] font-black uppercase tracking-widest">PRO Active</span>
           </div>
        )}
      </div>

      {/* Chat Window Container */}
      <div className={`bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-50 dark:border-slate-700 flex flex-col min-h-[550px] overflow-hidden relative`}>
        
        {/* Chat History Area */}
        <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-h-[500px] custom-scrollbar bg-slate-50/20 dark:bg-slate-900/10">
            <>
              {currentHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 gap-4">
                  <Compass size={64} className="text-blue-500 opacity-25" />
                  <p className="text-xs font-black uppercase tracking-[5px] text-slate-900 dark:text-white opacity-25 mb-8">{language === 'ar' ? 'ابدأ المحادثة المالية' : 'Start Finance Chat'}</p>
                  
                  {/* Quick Prompts for Empty State */}
                  <div className="flex flex-wrap justify-center gap-2 max-w-md">
                    {(isConfigured ? [
                      { en: "Summarize my spending", ar: "لخص مصاريفي" },
                      { en: "How can I save money?", ar: "كيف يمكنني توفير المال؟" },
                      { en: "Analyze my top categories", ar: "حلل أكثر الفئات استهلاكاً" },
                      { en: "Predict next month's expenses", ar: "توقع مصاريف الشهر القادم" },
                      { en: "How is my investment portfolio doing?", ar: "كيف هو أداء محفظتي الاستثمارية؟" },
                      { en: "What is my total debt?", ar: "ما هو إجمالي الديون علي؟" }
                    ] : getLocalSuggestions(language).map(s => ({ en: s, ar: s }))).map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => setChatInput(language === 'ar' ? prompt.ar : prompt.en)}
                        className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all border border-blue-100 dark:border-blue-800/30"
                      >
                        {language === 'ar' ? prompt.ar : prompt.en}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                currentHistory.map((msg, idx) => (
                  <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${msg.role === 'user' ? 'bg-blue-600 border-blue-500 text-white shadow-blue-500/20' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                      {msg.role === 'user' ? <img src={userProfile.avatar} className="w-full h-full object-cover rounded-xl" /> : <Bot size={18} className="text-blue-500" />}
                    </div>
                    <div className={`p-4 md:p-5 rounded-2xl text-xs shadow-sm max-w-[85%] ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-900 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-800 shadow-xl shadow-black/5'}`}>
                      {msg.text.includes('![Edited Image]') ? (
                        <div className="space-y-3">
                          <img src={msg.text.match(/\((.*?)\)/)?.[1] || ''} className="w-full rounded-xl shadow-md" alt="Magic Edit Output" />
                          <p className="text-[10px] font-black opacity-60 uppercase">{language === 'ar' ? 'تمت المعالجة بواسطة الذكاء الاصطناعي' : 'Processed by AI Engine'}</p>
                        </div>
                      ) : (
                        <AIResponseContent text={msg.text} isUser={msg.role === 'user'} />
                      )}
                    </div>
                  </div>
                ))
              )}
            </>

          {/* Pending AI Proposal */}
          {pendingProposal && (
            <div className="flex items-start gap-3 w-full">
               <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0 mt-6">
                 <Bot size={18} className="text-blue-500" />
               </div>
               <div className="flex-1">
                 <InstallmentProposal 
                   data={pendingProposal} 
                   onAccept={confirmProposal} 
                   onReject={() => setPendingProposal(null)} 
                 />
               </div>
            </div>
          )}

          {isChatting && (
            <div className="flex items-center gap-2 text-[10px] font-black text-blue-500/60 animate-pulse px-4">
               <Loader2 size={14} className="animate-spin" /> {language === 'ar' ? 'المهندس يقوم بالتحليل...' : 'Architect is analyzing...'}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Feature Library Launcher Overlay */}
        {showFeatureLibrary && (
          <div className="absolute bottom-24 left-6 right-6 z-[60] p-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-100 dark:border-blue-900 animate-in slide-in-from-bottom-10">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                  <LayoutGrid size={18} /> {language === 'ar' ? 'مكتبة ميزات الذكاء' : 'AI Capability Library'}
                </h3>
                <button onClick={() => setShowFeatureLibrary(false)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><X size={16}/></button>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {AI_FEATURES.map((feature) => (
                   <button 
                     key={feature.id} 
                     onClick={() => initiateFeature(feature)}
                     className="flex items-start gap-4 p-4 rounded-3xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border border-slate-50 dark:border-slate-800 group"
                   >
                      <div className={`w-12 h-12 rounded-2xl ${feature.color} text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                         <feature.icon size={24} />
                      </div>
                      <div className="text-left">
                         <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase mb-1">{language === 'ar' ? feature.titleAr : feature.titleEn}</h4>
                         <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-snug">{language === 'ar' ? feature.descAr : feature.descEn}</p>
                      </div>
                   </button>
                ))}
             </div>
          </div>
        )}

        {/* +++ أضيف بناءً على طلبك +++ (Quick Prompts) */}
        {!isChatting && currentHistory.length > 0 && (
          <div className="px-6 pb-2 flex gap-2 overflow-x-auto custom-scrollbar">
            {(isConfigured ? [
              { en: "Summarize my spending", ar: "لخص مصاريفي" },
              { en: "How can I save money?", ar: "كيف يمكنني توفير المال؟" },
              { en: "Analyze my top categories", ar: "حلل أكثر الفئات استهلاكاً" },
              { en: "Predict next month's expenses", ar: "توقع مصاريف الشهر القادم" },
              { en: "How is my investment portfolio doing?", ar: "كيف هو أداء محفظتي الاستثمارية؟" },
              { en: "What is my total debt?", ar: "ما هو إجمالي الديون علي؟" }
            ] : getLocalSuggestions(language).map(s => ({ en: s, ar: s }))).map((prompt, i) => (
              <button
                key={i}
                onClick={() => setChatInput(language === 'ar' ? prompt.ar : prompt.en)}
                className="whitespace-nowrap px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all border border-blue-100 dark:border-blue-800/30"
              >
                {language === 'ar' ? prompt.ar : prompt.en}
              </button>
            ))}
          </div>
        )}
        {/* +++ نهاية الإضافة +++ */}

        {/* Input Control Bar */}
        <div className="p-6 bg-white dark:bg-slate-800 border-t border-slate-50 dark:border-slate-700">
          {selectedImage && (
            <div className="mb-4 relative inline-block">
              <img src={selectedImage.preview} className="h-20 rounded-xl border-2 border-blue-500/20" />
              <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg"><X size={12}/></button>
            </div>
          )}
          <div className="flex items-center gap-3 relative">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            
            <button 
               onClick={() => { vibrate(); setShowFeatureLibrary(!showFeatureLibrary); }} 
               className={`w-12 h-12 rounded-2xl transition-all flex items-center justify-center shrink-0 border ${showFeatureLibrary ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-blue-600 border-slate-100 dark:border-slate-800'}`}
            >
              <LayoutGrid size={20} />
            </button>

            <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-blue-600 transition-all flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800">
              <ImageIcon size={20} />
            </button>

            <div className="flex-1 relative">
              <input 
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder={language === 'ar' ? 'اسأل أي شيء مالي...' : 'Ask anything financial...'}
                className="w-full py-4 pl-5 pr-5 bg-slate-50 dark:bg-slate-900 border border-transparent rounded-full text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
            </div>

            <button 
              onClick={() => handleSendMessage()}
              disabled={(!chatInput.trim() && !selectedImage) || isChatting}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-all active:scale-95 disabled:opacity-20 ${isPro ? 'bg-[#101827] text-amber-400 border border-amber-400/30' : 'bg-blue-600 text-white shadow-blue-500/20'}`}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;
