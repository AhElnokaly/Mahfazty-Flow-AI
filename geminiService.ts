
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
  
  let excludedIds: string[] = [];
  let attempt = 0;
  // Allow trying all available keys
  const maxAttempts = state.apiKeys.length > 0 ? state.apiKeys.length : 1;

  while (attempt < maxAttempts) {
    const activeKeyConfig = getActiveApiKey(state, excludedIds);

    if (!activeKeyConfig) {
      return { text: state.language === 'ar' ? 'يرجى إضافة مفتاح API نشط في الإعدادات.' : 'Please add an active API Key in Settings.' };
    }

    try {
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
        // Pro users get Search and Chart tools + Installment
        tools.push({ googleSearch: {} });
        tools.push({ functionDeclarations: [createChartTool, addInstallmentTool] });
      } else {
        // Standard users get Installment tool
        tools.push({ functionDeclarations: [addInstallmentTool] });
      }

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: modelName,
        contents: [
          ...history.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
          { role: 'user', parts: (parts.length > 1 ? { parts } : parts[0]) }
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
           if (call.name === 'create_chart') {
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
           
           if (call.name === 'add_installment_plan') {
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
      
      // Auto-switch logic
      if (error.message?.includes('429') || error.message?.includes('403') || error.message?.includes('key') || error.message?.includes('quota')) {
         if (dispatch) dispatch.blockApiKey(activeKeyConfig.id);
         excludedIds.push(activeKeyConfig.id);
         attempt++;
         // Continue to next iteration to try next key
         continue;
      }

      return { text: `System Alert: ${error.message}` };
    }
  }

  return { text: state.language === 'ar' ? 'فشلت جميع مفاتيح API. يرجى التحقق من الإعدادات.' : 'All API Keys failed. Please check Settings.' };
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
      if (error.message?.includes('429') || error.message?.includes('403') || error.message?.includes('key') || error.message?.includes('quota')) {
         if (dispatch) dispatch.blockApiKey(activeKeyConfig.id);
         excludedIds.push(activeKeyConfig.id);
         attempt++;
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
      if (error.message?.includes('429') || error.message?.includes('403') || error.message?.includes('key') || error.message?.includes('quota')) {
         if (dispatch) dispatch.blockApiKey(activeKeyConfig.id);
         excludedIds.push(activeKeyConfig.id);
         attempt++;
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
      if (e.message?.includes('429') || e.message?.includes('403') || e.message?.includes('key') || e.message?.includes('quota')) {
         if (dispatch) dispatch.blockApiKey(activeKeyConfig.id);
         excludedIds.push(activeKeyConfig.id);
         attempt++;
         continue;
      }
      return ""; 
    }
  }
  return "";
};
