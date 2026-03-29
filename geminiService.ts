
import { GoogleGenAI, FunctionDeclaration, Type, GenerateContentResponse, Tool } from "@google/genai";
import { AppState, CustomWidget } from "./types";

/**
 * Helper to get the financial context of the user for better AI reasoning.
 */
const getWalletContext = (state: AppState) => {
  const groupsSummary = state.groups.map(g => `Group: ${g.name}`).join(' | ');
  const installmentsSummary = state.installments.map(i => `${i.title} (${i.paidCount}/${i.installmentCount} paid)`).join(' | ');
  
  const transactionsSummary = [...state.transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 40)
    .map(t => `${t.date}: ${t.type} ${t.amount} ${t.currency} (Ref: ${t.clientId}) - ${t.note || ''}`)
    .join('\n');

  return `
--- FINANCIAL CONTEXT ---
User Profile: ${state.userProfile.name}
Subscription: ${state.isPro ? 'PRO' : 'Standard'}
Base Currency: ${state.baseCurrency}
Total Balance: ${state.walletBalance}

STRUCTURE:
Groups: ${groupsSummary}
Active Debts/Installments: ${installmentsSummary}

RECENT HISTORY:
${transactionsSummary}
-------------------------
`;
};

const getSystemInstruction = (state: AppState, mode: 'assistant' | 'architect') => {
  const context = getWalletContext(state);
  const lang = state.language === 'ar' ? 'Arabic' : 'English';

  const base = `Identity: You are "Mahfazty AI", a senior financial consultant.
Language: Respond in ${lang}.
Context: ${context}
Capabilities:
- If the user asks to add an installment plan or debt (e.g. "I bought a TV for 5000 on 10 months"), use the 'add_installment_plan' tool.
- If the user asks to visualize data, use 'create_chart'.
`;

  return base;
};

// Tool Definitions
const createChartTool: FunctionDeclaration = {
  name: 'create_chart',
  description: 'Creates a custom analytics chart widget for the user dashboard based on their data request.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      chartType: { type: Type.STRING, enum: ['bar', 'pie', 'line', 'area'] },
      dataSource: { type: Type.STRING, enum: ['income', 'expense', 'net'] },
      groupBy: { type: Type.STRING, enum: ['group', 'client', 'date'] },
      colorTheme: { type: Type.STRING, enum: ['blue', 'emerald', 'rose', 'amber', 'purple'] }
    },
    required: ['title', 'chartType', 'dataSource', 'groupBy']
  }
};

const addInstallmentTool: FunctionDeclaration = {
  name: 'add_installment_plan',
  description: 'Proposes a new installment plan or debt record to be added to the app.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Item name or Debt title' },
      totalAmount: { type: Type.NUMBER, description: 'Principal amount' },
      interestRate: { type: Type.NUMBER, description: 'Interest percentage (0 if none)' },
      installmentCount: { type: Type.NUMBER, description: 'Number of months' },
      startDate: { type: Type.STRING, description: 'ISO Date string YYYY-MM-DD' },
      type: { type: Type.STRING, enum: ['loan', 'purchase', 'jamiyah'] }
    },
    required: ['title', 'totalAmount', 'installmentCount']
  }
};

export interface AIChatResponse {
  text: string;
  chartWidget?: CustomWidget;
  toolCall?: any; // To pass back to UI for confirmation
}

// Helper to get active API key
export const getActiveApiKey = (state: AppState, excludedIds: string[] = []) => {
  const { apiKeys, activeApiKeyId } = state;
  
  // Filter out blocked keys and explicitly excluded keys (failed in current session)
  const availableKeys = apiKeys.filter(k => !k.isBlocked && !excludedIds.includes(k.id));

  // 1. Try to use the specifically active key if it's available and not excluded
  if (activeApiKeyId && !excludedIds.includes(activeApiKeyId)) {
    const activeKey = availableKeys.find(k => k.id === activeApiKeyId);
    if (activeKey) {
      return activeKey;
    }
  }

  // 2. Fallback: Find the first available key
  if (availableKeys.length > 0) {
    return availableKeys[0];
  }

  return null;
};

// Correct usage of GoogleGenAI: Create instance with process.env.API_KEY inside the call.
export const sendChatMessage = async (state: AppState, dispatch: any, message: string, isProChat = false, imageData?: { data: string, mimeType: string }): Promise<AIChatResponse> => {
  const history = isProChat ? state.proChatHistory : state.chatHistory;
  const isArabic = state.language === 'ar';
  
  // --- OFFLINE COMMAND PROCESSING ---
  const msg = message.toLowerCase().trim();
  
  if (msg.includes('رصيد') || msg.includes('balance')) {
    return { text: isArabic ? `رصيدك الحالي هو ${state.walletBalance.toLocaleString()} ${state.baseCurrency}` : `Your current balance is ${state.walletBalance.toLocaleString()} ${state.baseCurrency}` };
  }

  const addMatch = msg.match(/(اضف|إضافة|add)\s+(مصروف|دخل|expense|income)\s+(\d+)\s*(ل|الى|لـ|to)?\s*(.+)/i);
  if (addMatch) {
    const typeStr = addMatch[2];
    const amount = parseFloat(addMatch[3]);
    let targetNameRaw = addMatch[5].trim();
    
    // Handle Arabic prefix "ل" (e.g., "للمنزل" -> "المنزل")
    if (targetNameRaw.startsWith('ل') && !targetNameRaw.startsWith('لل')) {
        targetNameRaw = targetNameRaw.substring(1);
    } else if (targetNameRaw.startsWith('لل')) {
        targetNameRaw = 'ا' + targetNameRaw.substring(1);
    }

    const isIncome = typeStr === 'دخل' || typeStr === 'income';
    
    let targetGroup = state.groups.find(g => g.name.toLowerCase() === targetNameRaw.toLowerCase() && !g.isArchived);
    let targetClient = state.clients.find(c => c.name.toLowerCase() === targetNameRaw.toLowerCase() && !c.isArchived);

    if (targetGroup || targetClient) {
      const groupId = targetGroup ? targetGroup.id : targetClient!.groupId;
      const clientId = targetClient ? targetClient.id : state.clients.find(c => c.groupId === groupId && !c.isArchived)?.id;

      if (groupId && clientId) {
        if (dispatch) {
          dispatch.addTransaction({
            type: isIncome ? 'INCOME' : 'EXPENSE',
            amount,
            currency: state.baseCurrency,
            groupId,
            clientId,
            clientIds: [clientId],
            date: new Date().toISOString().split('T')[0],
            note: isArabic ? 'تمت الإضافة عبر المساعد الذكي' : 'Added via Smart Assistant'
          });
        }
        return { text: isArabic ? `تمت إضافة ${isIncome ? 'الدخل' : 'المصروف'} بنجاح بقيمة ${amount} لـ ${targetNameRaw}.` : `Successfully added ${isIncome ? 'income' : 'expense'} of ${amount} to ${targetNameRaw}.` };
      } else {
         return { text: isArabic ? `المجموعة "${targetNameRaw}" لا تحتوي على عملاء. يرجى إضافة عميل أولاً.` : `Group "${targetNameRaw}" has no clients. Please add a client first.` };
      }
    }
    return { text: isArabic ? `لم أتمكن من العثور على مجموعة أو عميل باسم "${targetNameRaw}". يرجى التأكد من الاسم.` : `Could not find a group or client named "${targetNameRaw}". Please check the name.` };
  }
  // --- END OFFLINE COMMAND PROCESSING ---

  let excludedIds: string[] = [];
  let attempt = 0;
  // Allow trying all available keys
  const maxAttempts = state.apiKeys.length > 0 ? state.apiKeys.length : 1;

  while (attempt < maxAttempts) {
    const activeKeyConfig = getActiveApiKey(state, excludedIds);

    if (!activeKeyConfig) {
      return { 
        text: isArabic 
          ? `مرحباً بك في المساعد الذكي (وضع عدم الاتصال).\n\nالأوامر المتاحة حالياً:\n- "كم رصيدي؟"\n- "اضف مصروف [المبلغ] لـ [اسم المجموعة/العميل]"\n- "اضف دخل [المبلغ] لـ [اسم المجموعة/العميل]"\n\nللحصول على تحليل ذكي متقدم، يرجى إضافة مفتاح API في الإعدادات.` 
          : `Welcome to the Smart Assistant (Offline Mode).\n\nAvailable commands:\n- "What is my balance?"\n- "Add expense [amount] to [Group/Client Name]"\n- "Add income [amount] to [Group/Client Name]"\n\nFor advanced AI analysis, please add an API key in Settings.` 
      };
    }

    try {
      if (activeKeyConfig.provider === 'xai' || activeKeyConfig.provider === 'openai' || activeKeyConfig.provider === 'groq') { // +++ أضيف بناءً على طلبك +++
        const baseUrl = activeKeyConfig.provider === 'xai' ? 'https://api.x.ai/v1/chat/completions' :
                        activeKeyConfig.provider === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' :
                        'https://api.openai.com/v1/chat/completions';
        const model = activeKeyConfig.provider === 'xai' ? 'grok-beta' :
                      activeKeyConfig.provider === 'groq' ? 'llama3-8b-8192' :
                      (state.isPro ? 'gpt-4o' : 'gpt-4o-mini');
        
        const systemInstruction = getSystemInstruction(state, isProChat ? 'architect' : 'assistant');
        const messages = [
          { role: 'system', content: systemInstruction },
          ...history.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
          { role: 'user', content: message }
        ];

        const res = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeKeyConfig.key}`
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.7
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        const text = data.choices[0].message.content;
        
        if (dispatch) dispatch.incrementApiKeyUsage(activeKeyConfig.id);
        return { text };
      }

      const ai = new GoogleGenAI({ apiKey: activeKeyConfig.key });
      const modelName = state.isPro ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
      
      const parts: any[] = [{ text: message }];
      if (imageData) {
        parts.push({
          inlineData: {
            data: imageData.data,
            mimeType: imageData.mimeType
          }
        });
      }

      const tools: Tool[] = [];
      if (state.isPro && isProChat) {
        // Pro users get Chart tools + Installment
        tools.push({ functionDeclarations: [createChartTool, addInstallmentTool] });
      } else {
        // Standard users get Installment tool
        tools.push({ functionDeclarations: [addInstallmentTool] });
      }

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: modelName,
        contents: [
          ...history.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
          { role: 'user', parts: parts }
        ],
        config: { 
          systemInstruction: getSystemInstruction(state, isProChat ? 'architect' : 'assistant'),
          temperature: 0.5,
          tools: tools
        }
      });

      let outputText = response.text || "";
      let generatedWidget: CustomWidget | undefined;
      let toolCallData: any = null;

      if (response.functionCalls && response.functionCalls.length > 0) {
         for (const call of response.functionCalls) {
           if (call.name === 'create_chart' && call.args) {
             generatedWidget = {
               id: `custom-${Date.now()}`,
               title: call.args.title as string,
               description: (call.args.description as string) || 'AI Generated Insight',
               chartType: call.args.chartType as any,
               dataSource: call.args.dataSource as any,
               groupBy: call.args.groupBy as any,
               colorTheme: (call.args.colorTheme as any) || 'blue'
             } as CustomWidget;
             outputText += `\n\n[System: Generated Chart "${call.args.title}"]`;
           }
           
           if (call.name === 'add_installment_plan' && call.args) {
             toolCallData = {
               name: 'add_installment_plan',
               args: call.args
             };
             outputText += `\n\n[System: Proposed Installment Plan for "${call.args.title}"]`;
           }
         }
      }
      
      // Search Grounding URL Extraction
      if (state.isPro && isProChat && response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        const chunks = response.candidates[0].groundingMetadata.groundingChunks;
        const urls = chunks.map((c: any) => c.web?.uri).filter(Boolean);
        if (urls.length > 0) {
          const uniqueUrls = [...new Set(urls)].slice(0, 3);
          const sourceTitle = state.language === 'ar' ? 'مصادر البيانات الحية' : 'Live Data Sources';
          outputText += `\n\n--- ${sourceTitle} ---\n` + uniqueUrls.join('\n');
        }
      }

      // Success! Update usage count
      if (dispatch) dispatch.incrementApiKeyUsage(activeKeyConfig.id);
      return { text: outputText, chartWidget: generatedWidget, toolCall: toolCallData };

    } catch (error: any) {
      console.error(`AI Error (Key: ${activeKeyConfig.name}):`, error);
      
      // Always try the next key if this one fails for any reason
      excludedIds.push(activeKeyConfig.id);
      attempt++;
      if (attempt < maxAttempts) {
        continue;
      }
      
      // Return the actual error message so the user knows what's wrong
      return { text: `API Error: ${error.message || 'Unknown error occurred.'}` };
    }
  }

  return { text: state.language === 'ar' ? 'يرجى إضافة مفتاح API نشط في الإعدادات.' : 'Please add an active API Key in Settings.' };
};

// Image Editing with Gemini 2.5 Flash Image
export const editFinancialImage = async (state: AppState, dispatch: any, prompt: string, base64Image: string, mimeType: string) => {
  let excludedIds: string[] = [];
  let attempt = 0;
  const maxAttempts = state.apiKeys.length > 0 ? state.apiKeys.length : 1;

  while (attempt < maxAttempts) {
    const activeKeyConfig = getActiveApiKey(state, excludedIds);
    if (!activeKeyConfig) return null;

    try {
      const ai = new GoogleGenAI({ apiKey: activeKeyConfig.key });
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64Image, mimeType: mimeType } },
            { text: prompt }
          ],
        },
      });

      if (response.candidates?.[0]?.content?.parts) {
        const img = response.candidates[0].content.parts.find(p => p.inlineData);
        if (img?.inlineData) {
          if (dispatch) dispatch.incrementApiKeyUsage(activeKeyConfig.id);
          return `data:${img.inlineData.mimeType || 'image/png'};base64,${img.inlineData.data}`;
        }
      }
      return null;
    } catch (error: any) {
      console.error(`Image Edit Error (Key: ${activeKeyConfig.name}):`, error);
      
      excludedIds.push(activeKeyConfig.id);
      attempt++;
      if (attempt < maxAttempts) {
        continue;
      }
      
      return null;
    }
  }
  return null;
};

export const generateVideo = async (state: AppState, dispatch: any, prompt: string) => {
  let excludedIds: string[] = [];
  let attempt = 0;
  const maxAttempts = state.apiKeys.length > 0 ? state.apiKeys.length : 1;

  while (attempt < maxAttempts) {
    const activeKeyConfig = getActiveApiKey(state, excludedIds);
    if (!activeKeyConfig) return null;

    try {
      const ai = new GoogleGenAI({ apiKey: activeKeyConfig.key });
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      // Poll for completion
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({operation: operation});
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        if (dispatch) dispatch.incrementApiKeyUsage(activeKeyConfig.id);
        
        // Fetch the video using the API key in the header
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': activeKeyConfig.key,
          },
        });
        
        if (response.ok) {
          const blob = await response.blob();
          return URL.createObjectURL(blob);
        }
      }
      return null;
    } catch (error: any) {
      console.error(`Video Generation Error (Key: ${activeKeyConfig.name}):`, error);
      
      excludedIds.push(activeKeyConfig.id);
      attempt++;
      if (attempt < maxAttempts) {
        continue;
      }
      
      return null;
    }
  }
  return null;
};

export const suggestTransactionNote = async (state: AppState, dispatch: any, data: { type: string, amount: string, currency: string, groupName: string, clientName: string, date: string }) => {
  let excludedIds: string[] = [];
  let attempt = 0;
  const maxAttempts = state.apiKeys.length > 0 ? state.apiKeys.length : 1;

  while (attempt < maxAttempts) {
    const activeKeyConfig = getActiveApiKey(state, excludedIds);
    if (!activeKeyConfig) return "";

    try {
      if (activeKeyConfig.provider === 'xai' || activeKeyConfig.provider === 'openai' || activeKeyConfig.provider === 'groq') { // +++ أضيف بناءً على طلبك +++
        const baseUrl = activeKeyConfig.provider === 'xai' ? 'https://api.x.ai/v1/chat/completions' :
                        activeKeyConfig.provider === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' :
                        'https://api.openai.com/v1/chat/completions';
        const model = activeKeyConfig.provider === 'xai' ? 'grok-beta' :
                      activeKeyConfig.provider === 'groq' ? 'llama3-8b-8192' :
                      'gpt-4o-mini';
        
        const res = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeKeyConfig.key}`
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: `Max 4 words. Language: ${state.language === 'ar' ? 'Arabic' : 'English'}.` },
              { role: 'user', content: `Smart note for: ${data.type} of ${data.amount} ${data.currency} via ${data.clientName}.` }
            ],
            temperature: 0.7
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP error! status: ${res.status}`);
        }
        const resData = await res.json();
        const text = resData.choices[0].message.content;
        
        if (dispatch) dispatch.incrementApiKeyUsage(activeKeyConfig.id);
        return text?.trim() || "";
      }

      const ai = new GoogleGenAI({ apiKey: activeKeyConfig.key });
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Smart note for: ${data.type} of ${data.amount} ${data.currency} via ${data.clientName}.`,
        config: {
          systemInstruction: `Max 4 words. Language: ${state.language === 'ar' ? 'Arabic' : 'English'}.`
        }
      });
      if (dispatch) dispatch.incrementApiKeyUsage(activeKeyConfig.id);
      return response.text?.trim() || "";
    } catch (e: any) { 
      console.error(`Note Suggestion Error (Key: ${activeKeyConfig.name}):`, e);
      
      excludedIds.push(activeKeyConfig.id);
      attempt++;
      if (attempt < maxAttempts) {
        continue;
      }
      
      return ""; 
    }
  }
  return "";
};
