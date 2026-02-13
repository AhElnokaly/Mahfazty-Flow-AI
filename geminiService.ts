
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

// Correct usage of GoogleGenAI: Create instance with process.env.API_KEY inside the call.
export const sendChatMessage = async (state: AppState, message: string, isProChat = false, imageData?: { data: string, mimeType: string }): Promise<AIChatResponse> => {
  const history = isProChat ? state.proChatHistory : state.chatHistory;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

    return { text: outputText, chartWidget: generatedWidget, toolCall: toolCallData };

  } catch (error: any) {
    console.error("AI Error:", error);
    return { text: `System Alert: ${error.message}` };
  }
};

// Image Editing with Gemini 2.5 Flash Image
export const editFinancialImage = async (state: AppState, prompt: string, base64Image: string, mimeType: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
        return `data:${img.inlineData.mimeType || 'image/png'};base64,${img.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Edit Error:", error);
    return null;
  }
};

export const suggestTransactionNote = async (state: AppState, data: { type: string, amount: string, currency: string, groupName: string, clientName: string, date: string }) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Smart note for: ${data.type} of ${data.amount} ${data.currency} via ${data.clientName}.`,
      config: {
        systemInstruction: `Max 4 words. Language: ${state.language === 'ar' ? 'Arabic' : 'English'}.`
      }
    });
    return response.text?.trim() || "";
  } catch (e) { 
    return ""; 
  }
};
