export const getLocalResponse = (message: string, language: 'ar' | 'en'): string => {
  const msg = message.toLowerCase();
  
  if (language === 'ar') {
    if (msg.includes('شرح') || msg.includes('تطبيق') || msg.includes('محفظتي') || msg.includes('بتعمل ايه')) {
      return "تطبيق محفظتي هو مديرك المالي الشخصي. يساعدك على تتبع مصاريفك، دخلك، ديونك، وبطاقاتك الائتمانية في مكان واحد وبكل سهولة. يمكنك إضافة معاملاتك اليومية من خلال زر (+) في الأسفل.";
    }
    if (msg.includes('كريدت') || msg.includes('فيزا') || msg.includes('ائتمان') || msg.includes('بطاقة') || msg.includes('كارت')) {
      return "لإدارة البطاقات الائتمانية، يمكنك إضافتها من شاشة 'الإعدادات' -> 'البطاقات الائتمانية'. عند إضافة معاملة جديدة (شراء)، يمكنك اختيار الدفع عبر البطاقة. وعند التسديد، يمكنك تسجيل معاملة 'تحويل' من المحفظة إلى البطاقة.";
    }
    if (msg.includes('دين') || msg.includes('سلف') || msg.includes('ديون') || msg.includes('استلف')) {
      return "يمكنك تسجيل الديون (سلف أو استدانة) من خلال شاشة الإضافة (+). اختر 'دين' وحدد ما إذا كنت قد اقترضت أم أقرضت شخصاً آخر. سيقوم التطبيق بتتبع المتبقي تلقائياً.";
    }
    if (msg.includes('استثمار') || msg.includes('اسهم') || msg.includes('استثمارات')) {
      return "لإضافة استثمار، اذهب إلى شاشة الإضافة (+) واختر 'استثمار'. يمكنك تسجيل شراء أو بيع الأسهم، وتتبع أرباحك وخسائرك في لوحة التحليلات.";
    }
    if (msg.includes('جمعية') || msg.includes('جمعيات') || msg.includes('قسط') || msg.includes('اقساط')) {
      return "لإضافة قسط أو جمعية، اذهب إلى شاشة 'الأقساط والجمعيات' من القائمة السفلية. يمكنك تحديد المبلغ الإجمالي، القسط الشهري، وعدد الأشهر، وسيقوم التطبيق بتذكيرك وتتبع المدفوعات.";
    }
    if (msg.includes('سريع') || msg.includes('بسرعة') || msg.includes('اضف') || msg.includes('اضافة')) {
      return "يمكنك إضافة معاملة سريعة من خلال الشات مباشرة! اكتب مثلاً: 'اضف 500 طعام' أو 'اضف 1000 دخل راتب' وسأقوم بتسجيلها لك فوراً.";
    }
    if (msg.includes('برو') || msg.includes('pro') || msg.includes('اشتراك') || msg.includes('مدفوع')) {
      return "نسخة Pro تتيح لك ميزات متقدمة مثل: الذكاء الاصطناعي لتحليل مصاريفك، ودجت (Widgets) مخصصة في لوحة التحليلات، وتصدير التقارير المتقدمة. يمكنك تفعيلها من الإعدادات.";
    }
    if (msg.includes('مرحبا') || msg.includes('هلا') || msg.includes('السلام') || msg.includes('اهلا')) {
      return "مرحباً بك في محفظتي! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟ يمكنك سؤالي عن كيفية استخدام التطبيق.";
    }
    return "عذراً، أنا أعمل الآن في الوضع المحلي (أوفلاين). يمكنك سؤالي عن كيفية استخدام التطبيق، أو تفعيل مفتاح الذكاء الاصطناعي (API Key) من الإعدادات للحصول على تحليل مالي متقدم لمصاريفك.";
  } else {
    if (msg.includes('explain') || msg.includes('app') || msg.includes('mahfazty') || msg.includes('what do you do')) {
      return "Mahfazty is your personal financial manager. It helps you track your expenses, income, debts, and credit cards in one place easily. You can add daily transactions using the (+) button below.";
    }
    if (msg.includes('credit') || msg.includes('visa') || msg.includes('card')) {
      return "To manage credit cards, add them from 'Settings' -> 'Credit Cards'. When adding a new transaction (purchase), you can choose to pay via the card. For repayment, record a 'Transfer' from your wallet to the card.";
    }
    if (msg.includes('debt') || msg.includes('borrow') || msg.includes('lend') || msg.includes('loan')) {
      return "You can record debts from the Add (+) screen. Choose 'Debt' and specify if you borrowed or lent money. The app will track the remaining balance automatically.";
    }
    if (msg.includes('investment') || msg.includes('stocks') || msg.includes('invest')) {
      return "To add an investment, go to the Add (+) screen and choose 'Investment'. You can record buying or selling stocks, and track your profits and losses in the Analytics dashboard.";
    }
    if (msg.includes('installment') || msg.includes('savings') || msg.includes('association')) {
      return "To add an installment or savings association, go to the 'Installments' screen from the bottom menu. Set the total amount, monthly payment, and duration, and the app will track it for you.";
    }
    if (msg.includes('quick') || msg.includes('fast') || msg.includes('add')) {
      return "You can add a quick transaction directly from the chat! For example, type: 'add 500 food' or 'add 1000 income salary' and I will record it for you instantly.";
    }
    if (msg.includes('pro') || msg.includes('premium') || msg.includes('subscription')) {
      return "The Pro version unlocks advanced features like: AI-powered financial analysis, custom widgets in the Analytics dashboard, and advanced report exports. You can activate it from Settings.";
    }
    if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) {
      return "Hello! Welcome to Mahfazty. I'm your smart assistant. How can I help you today? You can ask me how to use the app.";
    }
    return "Sorry, I am currently running in local mode (offline). You can ask me how to use the app, or activate the AI API Key in Settings to get advanced financial analysis of your expenses.";
  }
};

export const getLocalSuggestions = (language: 'ar' | 'en') => {
  if (language === 'ar') {
    return [
      "اشرح لي التطبيق 📱",
      "كيف أضيف كريدت كارد؟ 💳",
      "كيف أسجل دين؟ 🤝",
      "كيف أضيف استثمار؟ 📈",
      "كيف أضيف قسط أو جمعية؟ 📅",
      "كيف أضيف معاملة سريعة؟ ⚡",
      "ما هي مميزات Pro؟ ⭐"
    ];
  } else {
    return [
      "Explain the app 📱",
      "How to add a credit card? 💳",
      "How to record a debt? 🤝",
      "How to add an investment? 📈",
      "How to add an installment? 📅",
      "How to add a quick transaction? ⚡",
      "What are Pro features? ⭐"
    ];
  }
};
