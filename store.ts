
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, Group, Transaction, TransactionType, Client, UserProfile, AppNotification, ChatMessage, CustomWidget, Installment, SyncLogEntry } from './types';
import { cloudService } from './services/cloud';
import { cryptoUtils } from './utils/crypto';

const INITIAL_STATE: AppState = {
  walletBalance: 0,
  baseCurrency: 'EGP',
  userProfile: {
    name: 'Guest User',
    username: 'guest',
    email: '',
    avatar: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Guest',
    isAuthenticated: true,
    achievements: []
  },
  apiKeys: [],
  activeApiKeyId: undefined,
  groups: [
    { id: 'g_installments', name: 'الأقساط والديون', icon: '💸', monthlyBudget: 5000 },
    { id: 'g1', name: 'المنزل', icon: '🏠', monthlyBudget: 8000 },
    { id: 'g2', name: 'العمل', icon: '💼', monthlyBudget: 2000 },
  ],
  clients: [
    { id: 'c1', name: 'الشركة الهندسية', groupId: 'g2', icon: '🏢' },
  ],
  transactions: [],
  installments: [], 
  creditCards: [],
  goals: [],
  language: 'ar',
  isDarkMode: false,
  isPro: false,
  isPrivacyMode: false,
  autoSync: true,
  isSyncing: false,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  lastSyncTimestamp: new Date().toISOString(),
  syncLocationSet: false,
  syncProvider: 'local',
  chatHistory: [],
  proChatHistory: [],
  activeWidgets: ['cash_flow', 'lifestyle_radar', 'expense_distribution', 'debt_position', 'investment_portfolio'],
  customWidgets: [], 
  security: {
    appLock: false,
    biometrics: false,
    decoyPassword: ''
  },
  pushNotifications: false,
  aiSettings: {
    enabled: true,
    sensitivity: 'medium',
    autoAnalysisInterval: 'off'
  },
  notification: null,
  notificationHistory: [],
  savedGraphs: [],
  recurringTransactions: [],
  hasSeenOnboarding: false,
  syncHistory: []
};

interface AppContextType {
  state: AppState;
  dispatch: {
    biometricLogin: (username: string) => void;
    login: (username: string, password?: string) => void;
    signup: (username: string, password?: string, email?: string) => void;
    guestLogin: () => void;
    decoyLogin: () => void;
    logout: () => void;
    completeOnboarding: () => void;
    lockApp: () => void;
  addApiKey: (name: string, key: string, provider?: string) => void; // +++ أضيف بناءً على طلبك +++
    deleteApiKey: (id: string) => void;
    setActiveApiKey: (id: string) => void;
    incrementApiKeyUsage: (id: string) => void;
    blockApiKey: (id: string) => void;
    addTransaction: (t: Omit<Transaction, 'id'>) => void;
    updateTransaction: (id: string, t: Partial<Transaction>) => void;
    deleteTransaction: (id: string) => void;
    updateWalletBalance: (amount: number) => void;
    addGroup: (name: string, icon?: string, budget?: number, id?: string, color?: string) => void;
    updateGroup: (id: string, update: Partial<Group>) => void;
    setGroupBudget: (id: string, amount: number) => void;
    addInstallment: (i: Omit<Installment, 'id' | 'monthlyAmount' | 'paidCount' | 'status'>) => void;
    payInstallment: (id: string, penalty?: number) => void;
    addCreditCard: (card: Omit<import('./types').CreditCard, 'id'>) => void;
    updateCreditCard: (id: string, update: Partial<import('./types').CreditCard>) => void;
    deleteCreditCard: (id: string) => void;
    settleCreditCard: (payload: { creditCardId: string; paymentAmount: number; settledTransactions: string[]; settledItems: { transactionId: string, itemId: string }[]; adjustmentTransaction?: Omit<Transaction, 'id'> }) => void;
    setPro: (val: boolean) => void;
    addChatMessage: (msg: ChatMessage, isProChat?: boolean) => void;
    updateProfile: (profile: UserProfile) => void;
    setNotification: (notif: AppState['notification']) => void;
    addNotificationToHistory: (notif: AppNotification) => void;
    addCustomWidget: (widget: CustomWidget) => void;
    updateCustomWidget: (id: string, update: Partial<CustomWidget>) => void;
    deleteCustomWidget: (id: string) => void;
    addAnalyticsWidget: (id: string) => void;
    removeAnalyticsWidget: (id: string) => void;
    toggleLanguage: () => void;
    toggleDarkMode: () => void;
    togglePrivacyMode: () => void;
    toggleBiometrics: () => void;
    setDecoyPassword: (password: string) => void;
    togglePushNotifications: () => void;
    updateAvatar: (avatarUrl: string) => void;
    toggleAutoSync: () => void;
    deleteGroup: (id: string) => void;
    restoreGroup: (id: string) => void;
    permanentDeleteGroup: (id: string) => void;
    addClient: (name: string, groupId: string, icon?: string, id?: string) => void;
    updateClient: (id: string, update: Partial<Client>) => void;
    deleteClient: (id: string) => void;
    restoreClient: (id: string) => void;
    permanentDeleteClient: (id: string) => void;
    moveClient: (clientId: string, newGroupId: string) => void;
    mergeClient: (sourceClientId: string, targetClientId: string) => void;
    updateInstallment: (id: string, update: Partial<Installment>) => void;
    deleteInstallment: (id: string) => void;
    addGoal: (goal: Omit<import('./types').Goal, 'id'>) => void;
    updateGoal: (id: string, update: Partial<import('./types').Goal>) => void;
    deleteGoal: (id: string) => void;
    transferToGroup: (groupId: string, amount: number) => void;
    transferToSavings: (goalId: string, amount: number) => void;
    clearChat: (isProChat: boolean) => void;
    resetData: () => void;
    importState: (jsonData: string) => void;
    markNotificationsRead: () => void;
    clearNotificationHistory: () => void;
    enableCloudSync: (token: string) => void;
    disableCloudSync: () => void;
    setCustomDbConfig: (config: AppState['customDbConfig']) => void;
    setOnlineStatus: (isOnline: boolean) => void;
    syncWithCloud: () => Promise<void>;
    pullFromCloud: () => Promise<void>;
    unlockAchievement: (achievementId: string) => void;
    saveGraph: (graph: import('./types').SavedGraph) => void;
    updateGraph: (id: string, graph: Partial<import('./types').SavedGraph>) => void;
    deleteGraph: (id: string) => void;
    addRecurringTransaction: (rt: Omit<import('./types').RecurringTransaction, 'id'>) => void;
    updateRecurringTransaction: (id: string, update: Partial<import('./types').RecurringTransaction>) => void;
    deleteRecurringTransaction: (id: string) => void;
    processRecurringTransactions: () => void;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

type Action = 
  | { type: 'LOGIN'; payload: { username: string } }
  | { type: 'SIGNUP'; payload: { username: string; email?: string; password?: string } }
  | { type: 'GUEST_LOGIN' }
  | { type: 'LOGOUT' }
  | { type: 'LOCK_APP' }
  | { type: 'ADD_API_KEY'; payload: { name: string; key: string; provider?: string } }
  | { type: 'DELETE_API_KEY'; payload: string }
  | { type: 'SET_ACTIVE_API_KEY'; payload: string }
  | { type: 'INCREMENT_API_USAGE'; payload: string }
  | { type: 'BLOCK_API_KEY'; payload: string }
  | { type: 'ADD_TRANSACTION'; payload: Omit<Transaction, 'id'> }
  | { type: 'UPDATE_TRANSACTION'; payload: { id: string; update: Partial<Transaction> } }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'EDIT_TRANSACTION'; payload: { id: string; update: Partial<Transaction> } } // +++ أضيف بناءً على طلبك +++
  | { type: 'UPDATE_WALLET_BALANCE'; payload: number }
  | { type: 'ADD_GROUP'; payload: { name: string; icon?: string; budget?: number; id?: string; color?: string } }
  | { type: 'UPDATE_GROUP'; payload: { id: string; update: Partial<Group> } }
  | { type: 'SET_GROUP_BUDGET'; payload: { id: string; amount: number } }
  | { type: 'ADD_INSTALLMENT'; payload: Omit<Installment, 'id' | 'monthlyAmount' | 'paidCount' | 'status'> }
  | { type: 'PAY_INSTALLMENT'; payload: { id: string; penalty: number } }
  | { type: 'ADD_CREDIT_CARD'; payload: Omit<import('./types').CreditCard, 'id'> }
  | { type: 'UPDATE_CREDIT_CARD'; payload: { id: string; update: Partial<import('./types').CreditCard> } }
  | { type: 'DELETE_CREDIT_CARD'; payload: string }
  | { type: 'SETTLE_CREDIT_CARD'; payload: { creditCardId: string; paymentAmount: number; settledTransactions: string[]; settledItems: { transactionId: string, itemId: string }[]; adjustmentTransaction?: Omit<Transaction, 'id'> } }
  | { type: 'SET_PRO'; payload: boolean }
  | { type: 'ADD_CHAT_MESSAGE'; payload: { msg: ChatMessage; isProChat: boolean } }
  | { type: 'TOGGLE_LANGUAGE' }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'TOGGLE_PRIVACY_MODE' }
  | { type: 'SET_NOTIFICATION'; payload: AppState['notification'] }
  | { type: 'UPDATE_PROFILE'; payload: UserProfile }
  | { type: 'ADD_CUSTOM_WIDGET'; payload: CustomWidget }
  | { type: 'UPDATE_CUSTOM_WIDGET'; payload: { id: string; update: Partial<CustomWidget> } }
  | { type: 'DELETE_CUSTOM_WIDGET'; payload: string }
  | { type: 'ADD_ANALYTICS_WIDGET'; payload: string }
  | { type: 'REMOVE_ANALYTICS_WIDGET'; payload: string }
  | { type: 'DELETE_GROUP'; payload: string }
  | { type: 'RESTORE_GROUP'; payload: string }
  | { type: 'PERMANENT_DELETE_GROUP'; payload: string }
  | { type: 'ADD_CLIENT'; payload: { name: string; groupId: string; icon?: string; id?: string } }
  | { type: 'UPDATE_CLIENT'; payload: { id: string; update: Partial<Client> } }
  | { type: 'DELETE_CLIENT'; payload: string }
  | { type: 'RESTORE_CLIENT'; payload: string }
  | { type: 'PERMANENT_DELETE_CLIENT'; payload: string }
  | { type: 'MOVE_CLIENT'; payload: { clientId: string; newGroupId: string } }
  | { type: 'MERGE_CLIENT'; payload: { sourceClientId: string; targetClientId: string } }
  | { type: 'UPDATE_INSTALLMENT'; payload: { id: string; update: Partial<Installment> } }
  | { type: 'DELETE_INSTALLMENT'; payload: string }
  | { type: 'CLEAR_CHAT'; payload: boolean }
  | { type: 'RESET_DATA' }
  | { type: 'IMPORT_STATE'; payload: any }
  | { type: 'MARK_NOTIFICATIONS_READ' }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'TOGGLE_AUTO_SYNC' }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'ENABLE_CLOUD_SYNC'; payload: string }
  | { type: 'DISABLE_CLOUD_SYNC' }
  | { type: 'SET_CUSTOM_DB_CONFIG'; payload: AppState['customDbConfig'] }
  | { type: 'SYNC_SUCCESS'; payload: string }
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'ADD_SYNC_LOG'; payload: SyncLogEntry }
  | { type: 'TOGGLE_BIOMETRICS' }
  | { type: 'TOGGLE_PUSH_NOTIFICATIONS' }
  | { type: 'UPDATE_AVATAR'; payload: string }
  | { type: 'UNLOCK_ACHIEVEMENT'; payload: string }
  | { type: 'ADD_GOAL'; payload: Omit<import('./types').Goal, 'id'> }
  | { type: 'UPDATE_GOAL'; payload: { id: string; update: Partial<import('./types').Goal> } }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'TRANSFER_TO_GROUP'; payload: { groupId: string; amount: number } }
  | { type: 'TRANSFER_TO_SAVINGS'; payload: { goalId: string; amount: number } }
  | { type: 'ADD_NOTIFICATION_TO_HISTORY'; payload: AppNotification }
  | { type: 'SET_DECOY_PASSWORD'; payload: string }
  | { type: 'SAVE_GRAPH'; payload: import('./types').SavedGraph }
  | { type: 'UPDATE_GRAPH'; payload: { id: string; update: Partial<import('./types').SavedGraph> } }
  | { type: 'DELETE_GRAPH'; payload: string }
  | { type: 'ADD_RECURRING_TRANSACTION'; payload: Omit<import('./types').RecurringTransaction, 'id'> }
  | { type: 'UPDATE_RECURRING_TRANSACTION'; payload: { id: string; update: Partial<import('./types').RecurringTransaction> } }
  | { type: 'DELETE_RECURRING_TRANSACTION'; payload: string }
  | { type: 'PROCESS_RECURRING_TRANSACTIONS' }
  | { type: 'DECOY_LOGIN' };

// +++ أضيف بناءً على طلبك +++
export const isIncomeLike = (t: Transaction) => t.type?.toUpperCase() === 'INCOME' || (t.type?.toUpperCase() === 'INVESTMENT' && (t.investmentAction?.toUpperCase() === 'SELL' || t.investmentAction?.toUpperCase() === 'RETURN' || t.investmentAction?.toUpperCase() === 'DIVIDEND'));
export const isExpenseLike = (t: Transaction) => t.type?.toUpperCase() === 'EXPENSE' || (t.type?.toUpperCase() === 'INVESTMENT' && t.investmentAction?.toUpperCase() !== 'SELL' && t.investmentAction?.toUpperCase() !== 'RETURN' && t.investmentAction?.toUpperCase() !== 'DIVIDEND' && t.investmentAction?.toUpperCase() !== 'FREE_STOCK');

export const getClientShare = (transaction: Transaction, clientId: string): number => {
  if (transaction.items && transaction.items.length > 0) {
    const explicitItems = transaction.items.filter(i => i.clientId === clientId);
    let share = explicitItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const unassignedItems = transaction.items.filter(i => !i.clientId);
    if (unassignedItems.length > 0) {
      const unassignedTotal = unassignedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      if (transaction.clientIds && transaction.clientIds.includes(clientId)) {
        share += unassignedTotal / transaction.clientIds.length;
      } else if (!transaction.clientIds && transaction.clientId === clientId) {
        share += unassignedTotal;
      }
    }
    return share;
  } else {
    if (transaction.clientIds && transaction.clientIds.includes(clientId)) {
      return transaction.amount / transaction.clientIds.length;
    } else if (!transaction.clientIds && transaction.clientId === clientId) {
      return transaction.amount;
    }
  }
  return 0;
};

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_DECOY_PASSWORD':
      return { ...state, security: { ...state.security, decoyPassword: action.payload } };
    case 'DECOY_LOGIN':
      return {
        ...state,
        isDecoyMode: true,
        transactions: [],
        groups: [],
        clients: [],
        installments: [],
        goals: [],
        walletBalance: 0,
        userProfile: { ...state.userProfile, isAuthenticated: true },
        notification: { message: state.language === 'ar' ? 'تم تسجيل الدخول' : 'Logged in', type: 'success' }
      };
    case 'LOGIN': {
      const updateMessage = state.language === 'ar' 
        ? 'تم إضافة ميزات جديدة: دمج ونقل العملاء، إضافة مجموعات وعملاء أثناء تسجيل المعاملات، وتفعيل النسخة الاحترافية!' 
        : 'New features added: Merge/Move clients, inline group/client creation, and Pro Version activation!';
      
      const hasSeenUpdate = state.notificationHistory.some(n => n.message === updateMessage);
      const updateNotification = {
        id: Date.now().toString(),
        title: state.language === 'ar' ? '✨ تحديث جديد' : '✨ New Update',
        message: updateMessage,
        type: 'update' as const,
        timestamp: new Date().toISOString(),
        read: false
      };

      return { 
        ...state, 
        userProfile: { 
          ...state.userProfile, 
          name: action.payload.username,
          username: action.payload.username,
          isAuthenticated: true 
        },
        notification: hasSeenUpdate ? { message: state.language === 'ar' ? `مرحباً بعودتك، ${action.payload.username}!` : `Welcome back, ${action.payload.username}!`, type: 'success' } : updateNotification,
        notificationHistory: hasSeenUpdate ? state.notificationHistory : [updateNotification, ...state.notificationHistory]
      };
    }
    case 'SIGNUP': {
      const recoveryKey = `MAH-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const welcomeMessage = state.language === 'ar' 
        ? `مرحباً ${action.payload.username}! تم إنشاء حسابك بنجاح.` 
        : `Welcome, ${action.payload.username}! Your account is ready.`;
        
      return { 
        ...state, 
        userProfile: { 
          ...state.userProfile, 
          name: action.payload.username,
          username: action.payload.username,
          email: action.payload.email || state.userProfile.email,
          password: action.payload.password,
          recoveryKey,
          isAuthenticated: true 
        },
        notification: { 
          title: state.language === 'ar' ? 'مفتاح الاسترداد الخاص بك' : 'Your Recovery Key',
          message: state.language === 'ar' ? `يرجى حفظ هذا المفتاح لاستعادة حسابك: ${recoveryKey}` : `Please save this key to recover your account: ${recoveryKey}`, 
          type: 'success' 
        }
      };
    }
    case 'GUEST_LOGIN': {
      const updateMessage = state.language === 'ar' 
        ? 'تم إضافة ميزات جديدة: دمج ونقل العملاء، إضافة مجموعات وعملاء أثناء تسجيل المعاملات، وتفعيل النسخة الاحترافية!' 
        : 'New features added: Merge/Move clients, inline group/client creation, and Pro Version activation!';
      
      const hasSeenUpdate = state.notificationHistory.some(n => n.message === updateMessage);
      const updateNotification = {
        id: Date.now().toString(),
        title: state.language === 'ar' ? '✨ تحديث جديد' : '✨ New Update',
        message: updateMessage,
        type: 'update' as const,
        timestamp: new Date().toISOString(),
        read: false
      };

      return {
        ...state,
        userProfile: {
          ...state.userProfile,
          name: 'Guest User',
          username: 'guest',
          isAuthenticated: true,
          avatar: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Guest'
        },
        notification: hasSeenUpdate ? { 
          title: state.language === 'ar' ? 'وضع الضيف' : 'Guest Mode',
          message: state.language === 'ar' ? 'مرحباً بك! يتم حفظ البيانات محلياً.' : 'Welcome Guest! Data is stored locally.', 
          type: 'info' 
        } : updateNotification,
        notificationHistory: hasSeenUpdate ? state.notificationHistory : [updateNotification, ...state.notificationHistory]
      };
    }
    case 'LOGOUT':
      return { 
        ...state, 
        isDecoyMode: false,
        userProfile: INITIAL_STATE.userProfile, 
        notification: { 
          title: state.language === 'ar' ? 'إلى اللقاء' : 'Goodbye',
          message: state.language === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Logged out successfully', 
          type: 'info' 
        } 
      };
    case 'LOCK_APP':
      return {
        ...INITIAL_STATE,
        language: state.language,
        isDarkMode: state.isDarkMode,
        hasSeenOnboarding: state.hasSeenOnboarding,
        security: state.security,
        userProfile: {
          ...INITIAL_STATE.userProfile,
          username: state.userProfile.username,
          avatar: state.userProfile.avatar,
          isAuthenticated: false
        },
        notification: {
          title: state.language === 'ar' ? 'تم قفل التطبيق' : 'App Locked',
          message: state.language === 'ar' ? 'تم قفل التطبيق بسبب عدم النشاط' : 'App locked due to inactivity',
          type: 'info'
        }
      };
    case 'ADD_API_KEY': {
      const newKey: import('./types').ApiKey = {
        id: Date.now().toString(),
        name: action.payload.name,
        key: action.payload.key,
        provider: (action.payload.provider as import('./types').AIProvider) || 'gemini',
        usageCount: 0
      };
      return { 
        ...state, 
        apiKeys: [...state.apiKeys, newKey],
        activeApiKeyId: state.activeApiKeyId || newKey.id
      };
    }
    case 'DELETE_API_KEY': {
      const newKeys = state.apiKeys.filter(k => k.id !== action.payload);
      return { 
        ...state, 
        apiKeys: newKeys,
        activeApiKeyId: state.activeApiKeyId === action.payload ? (newKeys[0]?.id) : state.activeApiKeyId
      };
    }
    case 'SET_ACTIVE_API_KEY':
      return { ...state, activeApiKeyId: action.payload };
    case 'INCREMENT_API_USAGE':
      return {
        ...state,
        apiKeys: state.apiKeys.map(k => k.id === action.payload ? { ...k, usageCount: k.usageCount + 1, lastUsed: new Date().toISOString() } : k)
      };
    case 'BLOCK_API_KEY':
      return {
        ...state,
        apiKeys: state.apiKeys.map(k => k.id === action.payload ? { ...k, isBlocked: true } : k)
      };
    case 'ADD_TRANSACTION': {
      const newTransaction = { ...action.payload, id: Date.now().toString() };
      let newBalance = state.walletBalance;
      let updatedGroups = state.groups;
      let updatedCreditCards = state.creditCards || [];

      if (isIncomeLike(newTransaction as Transaction)) { // +++ أضيف بناءً على طلبك +++
        newBalance += action.payload.amount;
      } else if (isExpenseLike(newTransaction as Transaction)) { // +++ أضيف بناءً على طلبك +++
        if (action.payload.paymentMethod === 'credit' && action.payload.creditCardId) {
          // If paid by credit card, increase the used balance of the card, don't deduct from wallet
          updatedCreditCards = updatedCreditCards.map(c => 
            c.id === action.payload.creditCardId ? { ...c, balance: c.balance + action.payload.amount } : c
          );
        } else {
          // Paid by cash/wallet
          const group = state.groups.find(g => g.id === action.payload.groupId);
          if (group && group.allocatedAmount && group.allocatedAmount > 0) {
            const deduction = Math.min(group.allocatedAmount, action.payload.amount);
            const remainingExpense = action.payload.amount - deduction;
            updatedGroups = state.groups.map(g => 
              g.id === group.id ? { ...g, allocatedAmount: g.allocatedAmount! - deduction } : g
            );
            newBalance -= remainingExpense;
          } else {
            newBalance -= action.payload.amount;
          }
        }
      } else if (action.payload.type === TransactionType.TRANSFER) {
        // If transfer is to pay a credit card bill
        if (action.payload.creditCardId) {
          updatedCreditCards = updatedCreditCards.map(c => 
            c.id === action.payload.creditCardId ? { ...c, balance: Math.max(0, c.balance - action.payload.amount) } : c
          );
        }
        newBalance -= action.payload.amount;
      }

      return { 
        ...state, 
        transactions: [newTransaction, ...state.transactions], 
        walletBalance: newBalance, 
        groups: updatedGroups,
        creditCards: updatedCreditCards
      };
    }
    case 'ADD_GROUP':
      return { ...state, groups: [...state.groups, { id: action.payload.id || Date.now().toString(), name: action.payload.name, icon: action.payload.icon, monthlyBudget: action.payload.budget, color: action.payload.color }] };
    case 'TOGGLE_LANGUAGE':
      return { ...state, language: state.language === 'ar' ? 'en' : 'ar' };
    case 'TOGGLE_DARK_MODE':
      return { ...state, isDarkMode: !state.isDarkMode };
    case 'TOGGLE_PRIVACY_MODE':
      return { ...state, isPrivacyMode: !state.isPrivacyMode };
    case 'SET_NOTIFICATION': {
      if (action.payload && action.payload.type === 'update') {
        const newNotification = {
          id: Date.now().toString(),
          title: action.payload.title || '',
          message: action.payload.message,
          type: 'update' as const,
          timestamp: new Date().toISOString(),
          read: false
        };
        return { 
          ...state, 
          notification: newNotification,
          notificationHistory: [newNotification, ...state.notificationHistory]
        };
      }
      return { ...state, notification: action.payload };
    }
    case 'UPDATE_PROFILE':
      return { ...state, userProfile: { ...state.userProfile, ...action.payload } };
    case 'RESET_DATA':
      return INITIAL_STATE;
    case 'IMPORT_STATE': {
      let rawPayload = action.payload || {};
      
      if (typeof rawPayload === 'string') {
        try {
          rawPayload = JSON.parse(rawPayload);
        } catch (e) {
          console.error("Failed to parse string payload in IMPORT_STATE");
          return state;
        }
      }
      
      // Handle if the user imported an array of transactions directly
      if (Array.isArray(rawPayload)) {
        return {
          ...state,
          transactions: rawPayload,
          walletBalance: rawPayload.reduce((acc, t) => {
            if (isIncomeLike(t)) return acc + t.amount;
            if (isExpenseLike(t)) return acc - t.amount;
            return acc;
          }, 0)
        };
      }
      
      // Handle nested state from older versions or different state managers
      const payload = rawPayload.app || rawPayload.state || rawPayload;

      const newTransactions = payload.transactions || state.transactions || [];
      const newCreditCards = payload.creditCards || state.creditCards || [];

      // Recalculate wallet balance and credit card balances to ensure accuracy
      let recalculatedBalance = 0;
      const cardBalances: Record<string, number> = {};
      
      newCreditCards.forEach((card: any) => {
        cardBalances[card.id] = 0;
      });

      newTransactions.forEach((t: Transaction) => {
        if (isIncomeLike(t)) {
          recalculatedBalance += t.amount;
        } else if (isExpenseLike(t)) {
          if (t.paymentMethod === 'credit' && t.creditCardId) {
            // Paid by credit card, don't deduct from wallet, increase card used balance
            if (cardBalances[t.creditCardId] !== undefined) {
              cardBalances[t.creditCardId] += t.amount;
            }
          } else {
            recalculatedBalance -= t.amount;
          }
        } else if (t.type === 'TRANSFER' && t.paymentMethod === 'credit' && t.creditCardId) {
           // Repaying credit card
           if (cardBalances[t.creditCardId] !== undefined) {
              cardBalances[t.creditCardId] -= t.amount;
           }
        }
      });

      const updatedCreditCards = newCreditCards.map((card: any) => ({
        ...card,
        balance: cardBalances[card.id] !== undefined ? cardBalances[card.id] : card.balance
      }));

      return { 
        ...state, 
        ...payload,
        transactions: newTransactions,
        groups: payload.groups || state.groups || [],
        clients: payload.clients || state.clients || [],
        installments: payload.installments || state.installments || [],
        creditCards: updatedCreditCards,
        goals: payload.goals || state.goals || [],
        apiKeys: payload.apiKeys || state.apiKeys || [],
        chatHistory: payload.chatHistory || state.chatHistory || [],
        proChatHistory: payload.proChatHistory || state.proChatHistory || [],
        activeWidgets: payload.activeWidgets || state.activeWidgets || ['cash_flow', 'lifestyle_radar', 'expense_distribution', 'debt_position', 'investment_portfolio'],
        customWidgets: payload.customWidgets || state.customWidgets || [],
        savedGraphs: payload.savedGraphs || state.savedGraphs || [],
        recurringTransactions: payload.recurringTransactions || state.recurringTransactions || [],
        notificationHistory: payload.notificationHistory || state.notificationHistory || [],
        syncHistory: payload.syncHistory || state.syncHistory || [],
        walletBalance: recalculatedBalance
      };
    }
    case 'ADD_INSTALLMENT': {
      const newInstallment = { ...action.payload, id: Date.now().toString(), monthlyAmount: action.payload.totalAmount / action.payload.installmentCount, paidCount: 0, status: 'active' as const };
      
      if (action.payload.type === 'loan') {
        const newTransaction: Transaction = {
          id: Date.now().toString() + 'loan',
          amount: action.payload.totalAmount,
          currency: state.baseCurrency,
          type: TransactionType.INCOME,
          date: new Date().toISOString().split('T')[0],
          groupId: state.groups[0]?.id || 'default',
          clientId: state.clients[0]?.id || 'default',
          note: `Loan Received: ${action.payload.title}`
        };
        return { 
          ...state, 
          installments: [...state.installments, newInstallment],
          walletBalance: state.walletBalance + action.payload.totalAmount,
          transactions: [newTransaction, ...state.transactions]
        };
      }
      
      return { ...state, installments: [...state.installments, newInstallment] };
    }
    case 'PAY_INSTALLMENT': {
      const installment = state.installments.find(i => i.id === action.payload.id);
      if (!installment) return state;
      
      const paymentAmount = installment.monthlyAmount + action.payload.penalty;
      
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        amount: paymentAmount,
        currency: state.baseCurrency,
        type: TransactionType.EXPENSE,
        date: new Date().toISOString().split('T')[0],
        groupId: state.groups[0]?.id || 'default',
        clientId: state.clients[0]?.id || 'default',
        note: `Installment Payment: ${installment.title}${action.payload.penalty > 0 ? ` (+${action.payload.penalty} penalty)` : ''}`
      };

      return { 
        ...state, 
        installments: state.installments.map(i => i.id === action.payload.id ? { ...i, paidCount: i.paidCount + 1, status: i.paidCount + 1 >= i.installmentCount ? 'completed' : 'active', lastPaymentDate: new Date().toISOString() } : i),
        walletBalance: state.walletBalance - paymentAmount,
        transactions: [newTransaction, ...state.transactions]
      };
    }
    case 'ADD_CREDIT_CARD':
      return { ...state, creditCards: [...(state.creditCards || []), { ...action.payload, id: Date.now().toString() }] };
    case 'UPDATE_CREDIT_CARD':
      return { ...state, creditCards: (state.creditCards || []).map(c => c.id === action.payload.id ? { ...c, ...action.payload.update } : c) };
    case 'DELETE_CREDIT_CARD':
      return { ...state, creditCards: (state.creditCards || []).map(c => c.id === action.payload ? { ...c, isArchived: true } : c) };
    case 'SETTLE_CREDIT_CARD': {
      const { creditCardId, paymentAmount, settledTransactions, settledItems, adjustmentTransaction } = action.payload;
      
      // 1. Deduct from wallet
      let newBalance = state.walletBalance - paymentAmount;
      
      // 2. Reduce credit card balance
      let updatedCreditCards = (state.creditCards || []).map(c => 
        c.id === creditCardId ? { ...c, balance: Math.max(0, c.balance - paymentAmount) } : c
      );
      
      // 3. Mark transactions/items as settled
      let updatedTransactions = state.transactions.map(t => {
        if (settledTransactions.includes(t.id)) {
          return { ...t, isSettled: true };
        }
        
        // Check if any items in this transaction are settled
        const itemsToSettle = settledItems.filter(si => si.transactionId === t.id).map(si => si.itemId);
        if (itemsToSettle.length > 0 && t.items) {
          const updatedItems = t.items.map(item => 
            itemsToSettle.includes(item.id) ? { ...item, isSettled: true } : item
          );
          
          // If all items are now settled, mark the whole transaction as settled
          const allSettled = updatedItems.every(item => item.isSettled);
          return { ...t, items: updatedItems, isSettled: allSettled };
        }
        
        return t;
      });
      
      // 4. Add adjustment transaction if provided
      if (adjustmentTransaction) {
        const newTx = { ...adjustmentTransaction, id: Date.now().toString() };
        updatedTransactions = [newTx, ...updatedTransactions];
        // The adjustment transaction (fees) is added to the credit card balance
        updatedCreditCards = updatedCreditCards.map(c => 
          c.id === creditCardId ? { ...c, balance: c.balance + adjustmentTransaction.amount } : c
        );
      }
      
      return {
        ...state,
        walletBalance: newBalance,
        creditCards: updatedCreditCards,
        transactions: updatedTransactions
      };
    }
    case 'SET_PRO':
      return { ...state, isPro: action.payload };
    case 'ADD_CHAT_MESSAGE':
      const chatKey = action.payload.isProChat ? 'proChatHistory' : 'chatHistory';
      return { ...state, [chatKey]: [...state[chatKey], action.payload.msg] };
    case 'ADD_CUSTOM_WIDGET':
      return { ...state, customWidgets: [...state.customWidgets, action.payload] };
    case 'UPDATE_CUSTOM_WIDGET':
      return {
        ...state,
        customWidgets: state.customWidgets.map(w => w.id === action.payload.id ? { ...w, ...action.payload.update } : w)
      };
    case 'DELETE_CUSTOM_WIDGET':
      return {
        ...state,
        customWidgets: state.customWidgets.filter(w => w.id !== action.payload),
        activeWidgets: state.activeWidgets.filter(id => id !== action.payload)
      };
    case 'ADD_ANALYTICS_WIDGET':
      return { ...state, activeWidgets: [...state.activeWidgets, action.payload] };
    case 'REMOVE_ANALYTICS_WIDGET':
      return { ...state, activeWidgets: state.activeWidgets.filter(id => id !== action.payload) };
    case 'DELETE_GROUP': {
      return { 
        ...state, 
        groups: state.groups.map(g => g.id === action.payload ? { ...g, isArchived: true } : g),
        clients: state.clients.map(c => c.groupId === action.payload ? { ...c, isArchived: true } : c),
      };
    }
    case 'RESTORE_GROUP': {
      return { 
        ...state, 
        groups: state.groups.map(g => g.id === action.payload ? { ...g, isArchived: false } : g),
        clients: state.clients.map(c => c.groupId === action.payload ? { ...c, isArchived: false } : c),
      };
    }
    case 'PERMANENT_DELETE_GROUP': {
      const clientsToDelete = state.clients.filter(c => c.groupId === action.payload).map(c => c.id);
      const groupTransactions = state.transactions.filter(t => t.groupId === action.payload || clientsToDelete.includes(t.clientId));
      
      let newBalance = state.walletBalance;
      let updatedCreditCards = state.creditCards || [];
      
      groupTransactions.forEach(t => {
        if (t.paymentMethod === 'credit' && t.creditCardId) {
          updatedCreditCards = updatedCreditCards.map(c => 
            c.id === t.creditCardId ? { ...c, balance: Math.max(0, c.balance - t.amount) } : c
          );
        } else {
          if (isIncomeLike(t)) newBalance -= t.amount;
          else if (isExpenseLike(t)) newBalance += t.amount;
          else if (t.type?.toUpperCase() === 'TRANSFER') {
            newBalance += t.amount;
            if (t.creditCardId) {
              updatedCreditCards = updatedCreditCards.map(c => 
                c.id === t.creditCardId ? { ...c, balance: c.balance + t.amount } : c
              );
            }
          }
        }
      });

      return { 
        ...state, 
        groups: state.groups.filter(g => g.id !== action.payload),
        clients: state.clients.filter(c => c.groupId !== action.payload),
        transactions: state.transactions.filter(t => t.groupId !== action.payload && !clientsToDelete.includes(t.clientId)),
        walletBalance: newBalance,
        creditCards: updatedCreditCards
      };
    }
    case 'ADD_CLIENT':
      return { ...state, clients: [...state.clients, { ...action.payload, id: action.payload.id || Date.now().toString() + Math.random().toString(36).substr(2, 9) }] };
    case 'UPDATE_CLIENT':
      return { ...state, clients: state.clients.map(c => c.id === action.payload.id ? { ...c, ...action.payload.update } : c) };
    case 'DELETE_CLIENT': {
      const clientTransactions = state.transactions.filter(t => t.clientId === action.payload || (t.clientIds && t.clientIds.includes(action.payload)));
      let newBalance = state.walletBalance;
      let updatedCreditCards = state.creditCards || [];
      
      clientTransactions.forEach(t => {
        const numClients = t.clientIds ? t.clientIds.length : 1;
        const amountPerClient = t.amount / numClients;
        
        if (t.paymentMethod === 'credit' && t.creditCardId) {
          updatedCreditCards = updatedCreditCards.map(c => 
            c.id === t.creditCardId ? { ...c, balance: Math.max(0, c.balance - amountPerClient) } : c
          );
        } else {
          if (isIncomeLike(t)) newBalance -= amountPerClient;
          else if (isExpenseLike(t)) newBalance += amountPerClient;
          else if (t.type?.toUpperCase() === 'TRANSFER') {
            newBalance += amountPerClient;
            if (t.creditCardId) {
              updatedCreditCards = updatedCreditCards.map(c => 
                c.id === t.creditCardId ? { ...c, balance: c.balance + amountPerClient } : c
              );
            }
          }
        }
      });

      return { 
        ...state, 
        clients: state.clients.map(c => c.id === action.payload ? { ...c, isArchived: true, deletedAt: new Date().toISOString() } : c),
        walletBalance: newBalance,
        creditCards: updatedCreditCards
      };
    }
    case 'RESTORE_CLIENT': {
      const clientTransactions = state.transactions.filter(t => t.clientId === action.payload || (t.clientIds && t.clientIds.includes(action.payload)));
      let newBalance = state.walletBalance;
      let updatedCreditCards = state.creditCards || [];
      
      clientTransactions.forEach(t => {
        const numClients = t.clientIds ? t.clientIds.length : 1;
        const amountPerClient = t.amount / numClients;
        
        if (t.paymentMethod === 'credit' && t.creditCardId) {
          updatedCreditCards = updatedCreditCards.map(c => 
            c.id === t.creditCardId ? { ...c, balance: c.balance + amountPerClient } : c
          );
        } else {
          if (isIncomeLike(t)) newBalance += amountPerClient;
          else if (isExpenseLike(t)) newBalance -= amountPerClient;
          else if (t.type?.toUpperCase() === 'TRANSFER') {
            newBalance -= amountPerClient;
            if (t.creditCardId) {
              updatedCreditCards = updatedCreditCards.map(c => 
                c.id === t.creditCardId ? { ...c, balance: Math.max(0, c.balance - amountPerClient) } : c
              );
            }
          }
        }
      });

      return { 
        ...state, 
        clients: state.clients.map(c => c.id === action.payload ? { ...c, isArchived: false, deletedAt: undefined } : c),
        walletBalance: newBalance,
        creditCards: updatedCreditCards
      };
    }
    case 'PERMANENT_DELETE_CLIENT': {
      return { 
        ...state, 
        clients: state.clients.filter(c => c.id !== action.payload),
        transactions: state.transactions.filter(t => t.clientId !== action.payload && !(t.clientIds && t.clientIds.includes(action.payload)))
      };
    }
    case 'MOVE_CLIENT':
      return {
        ...state,
        clients: state.clients.map(c => c.id === action.payload.clientId ? { ...c, groupId: action.payload.newGroupId } : c),
        transactions: state.transactions.map(t => {
          if (t.clientId === action.payload.clientId || (t.clientIds && t.clientIds.includes(action.payload.clientId))) {
            return { ...t, groupId: action.payload.newGroupId };
          }
          return t;
        })
      };
    case 'MERGE_CLIENT': {
      const { sourceClientId, targetClientId } = action.payload;
      return {
        ...state,
        clients: state.clients.filter(c => c.id !== sourceClientId),
        transactions: state.transactions.map(t => {
          let updatedT = { ...t };
          if (updatedT.clientId === sourceClientId) {
            updatedT.clientId = targetClientId;
          }
          if (updatedT.clientIds && updatedT.clientIds.includes(sourceClientId)) {
            updatedT.clientIds = updatedT.clientIds.map(id => id === sourceClientId ? targetClientId : id);
            // Remove duplicates if targetClientId was already in clientIds
            updatedT.clientIds = Array.from(new Set(updatedT.clientIds));
            // Update primary clientId if it was changed
            updatedT.clientId = updatedT.clientIds[0];
          }
          return updatedT;
        })
      };
    }
    case 'UPDATE_INSTALLMENT':
      return { ...state, installments: state.installments.map(i => i.id === action.payload.id ? { ...i, ...action.payload.update } : i) };
    case 'DELETE_INSTALLMENT':
      return { ...state, installments: state.installments.filter(i => i.id !== action.payload) };
    case 'CLEAR_CHAT':
      return { ...state, [action.payload ? 'proChatHistory' : 'chatHistory']: [] };
    case 'MARK_NOTIFICATIONS_READ':
      return { ...state, notificationHistory: state.notificationHistory.map(n => ({ ...n, read: true })) };
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notificationHistory: [] };
    case 'SAVE_GRAPH':
      return { ...state, savedGraphs: [...(state.savedGraphs || []), action.payload] };
    case 'UPDATE_GRAPH':
      return {
        ...state,
        savedGraphs: (state.savedGraphs || []).map(g => g.id === action.payload.id ? { ...g, ...action.payload.update } : g)
      };
    case 'DELETE_GRAPH':
      return { ...state, savedGraphs: (state.savedGraphs || []).filter(g => g.id !== action.payload) };
    case 'ADD_RECURRING_TRANSACTION':
      return { ...state, recurringTransactions: [...(state.recurringTransactions || []), { ...action.payload, id: Date.now().toString() }] };
    case 'UPDATE_RECURRING_TRANSACTION':
      return { ...state, recurringTransactions: (state.recurringTransactions || []).map(rt => rt.id === action.payload.id ? { ...rt, ...action.payload.update } : rt) };
    case 'DELETE_RECURRING_TRANSACTION':
      return { ...state, recurringTransactions: (state.recurringTransactions || []).filter(rt => rt.id !== action.payload) };
    case 'PROCESS_RECURRING_TRANSACTIONS': {
      const today = new Date().toISOString().split('T')[0];
      let newTransactions = [...state.transactions];
      let newBalance = state.walletBalance;
      let updatedRecurring = [...(state.recurringTransactions || [])];
      let hasChanges = false;

      updatedRecurring = updatedRecurring.map(rt => {
        if (!rt.isActive) return rt;
        let currentNextDate = rt.nextDate;
        let rtChanged = false;

        while (currentNextDate <= today) {
          hasChanges = true;
          rtChanged = true;
          
          const newTx: Transaction = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            amount: rt.amount,
            currency: 'EGP',
            type: rt.type,
            groupId: rt.groupId,
            clientId: rt.clientId || '',
            date: currentNextDate,
            items: [{ id: Date.now().toString(), name: rt.title, price: rt.amount, quantity: 1 }],
            isDebt: false
          };
          newTransactions.push(newTx);
          
          if (isIncomeLike(newTx)) newBalance += rt.amount;
          else if (isExpenseLike(newTx)) newBalance -= rt.amount;

          const dateObj = new Date(currentNextDate);
          if (rt.interval === 'daily') dateObj.setDate(dateObj.getDate() + 1);
          else if (rt.interval === 'weekly') dateObj.setDate(dateObj.getDate() + 7);
          else if (rt.interval === 'monthly') dateObj.setMonth(dateObj.getMonth() + 1);
          else if (rt.interval === 'yearly') dateObj.setFullYear(dateObj.getFullYear() + 1);
          
          currentNextDate = dateObj.toISOString().split('T')[0];
        }

        if (rtChanged) {
          return { ...rt, nextDate: currentNextDate };
        }
        return rt;
      });

      if (!hasChanges) return state;

      return {
        ...state,
        transactions: newTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        walletBalance: newBalance,
        recurringTransactions: updatedRecurring
      };
    }
    case 'ADD_NOTIFICATION_TO_HISTORY':
      return { ...state, notificationHistory: [action.payload, ...state.notificationHistory] };
    case 'TOGGLE_AUTO_SYNC':
      return { ...state, autoSync: !state.autoSync };
    case 'TOGGLE_BIOMETRICS':
      return { ...state, security: { ...state.security, biometrics: !state.security.biometrics } };
    case 'TOGGLE_PUSH_NOTIFICATIONS':
      return { ...state, pushNotifications: !state.pushNotifications };
    case 'UPDATE_AVATAR':
      return { ...state, userProfile: { ...state.userProfile, avatar: action.payload } };
    case 'UNLOCK_ACHIEVEMENT': {
      const currentAchievements = state.userProfile.achievements || [];
      if (currentAchievements.includes(action.payload)) return state;
      return {
        ...state,
        userProfile: {
          ...state.userProfile,
          achievements: [...currentAchievements, action.payload]
        },
        notification: { message: `Achievement Unlocked!`, type: 'success' }
      };
    }
    case 'UPDATE_TRANSACTION': {
      const oldT = state.transactions.find(t => t.id === action.payload.id);
      if (!oldT) return state;
      const newT = { ...oldT, ...action.payload.update };
      let newBalance = state.walletBalance;
      let updatedCreditCards = state.creditCards || [];
      
      // Reverse old transaction
      if (oldT.paymentMethod === 'credit' && oldT.creditCardId) {
        updatedCreditCards = updatedCreditCards.map(c => 
          c.id === oldT.creditCardId ? { ...c, balance: Math.max(0, c.balance - oldT.amount) } : c
        );
      } else {
        if (isIncomeLike(oldT)) newBalance -= oldT.amount; // +++ أضيف بناءً على طلبك +++
        else if (isExpenseLike(oldT)) newBalance += oldT.amount; // +++ أضيف بناءً على طلبك +++
        else if (oldT.type === TransactionType.TRANSFER) {
          newBalance += oldT.amount;
          if (oldT.creditCardId) {
            updatedCreditCards = updatedCreditCards.map(c => 
              c.id === oldT.creditCardId ? { ...c, balance: c.balance + oldT.amount } : c
            );
          }
        }
      }

      // Apply new transaction
      if (newT.paymentMethod === 'credit' && newT.creditCardId) {
        updatedCreditCards = updatedCreditCards.map(c => 
          c.id === newT.creditCardId ? { ...c, balance: c.balance + newT.amount } : c
        );
      } else {
        if (isIncomeLike(newT)) newBalance += newT.amount; // +++ أضيف بناءً على طلبك +++
        else if (isExpenseLike(newT)) newBalance -= newT.amount; // +++ أضيف بناءً على طلبك +++
        else if (newT.type === TransactionType.TRANSFER) {
          newBalance -= newT.amount;
          if (newT.creditCardId) {
            updatedCreditCards = updatedCreditCards.map(c => 
              c.id === newT.creditCardId ? { ...c, balance: Math.max(0, c.balance - newT.amount) } : c
            );
          }
        }
      }

      return { 
        ...state, 
        transactions: state.transactions.map(t => t.id === action.payload.id ? newT : t),
        walletBalance: newBalance,
        creditCards: updatedCreditCards
      };
    }
    case 'DELETE_TRANSACTION': {
      const t = state.transactions.find(t => t.id === action.payload);
      if (!t) return state;
      
      let newBalance = state.walletBalance;
      let updatedCreditCards = state.creditCards || [];

      if (t.paymentMethod === 'credit' && t.creditCardId) {
        // If it was paid by credit card, reduce the card's used balance
        updatedCreditCards = updatedCreditCards.map(c => 
          c.id === t.creditCardId ? { ...c, balance: Math.max(0, c.balance - t.amount) } : c
        );
      } else {
        // If paid by cash/wallet, reverse the wallet balance
        if (isIncomeLike(t)) newBalance -= t.amount; // +++ أضيف بناءً على طلبك +++
        else if (isExpenseLike(t)) newBalance += t.amount; // +++ أضيف بناءً على طلبك +++
        else if (t.type?.toUpperCase() === 'TRANSFER') {
          newBalance += t.amount;
          // If transfer was to pay a credit card bill, increase the card's used balance back
          if (t.creditCardId) {
            updatedCreditCards = updatedCreditCards.map(c => 
              c.id === t.creditCardId ? { ...c, balance: c.balance + t.amount } : c
            );
          }
        }
      }
      
      return { 
        ...state, 
        transactions: state.transactions.filter(t => t.id !== action.payload), 
        walletBalance: newBalance,
        creditCards: updatedCreditCards
      };
    }
    case 'UPDATE_WALLET_BALANCE':
      return { ...state, walletBalance: action.payload };
    case 'UPDATE_GROUP':
      return { ...state, groups: state.groups.map(g => g.id === action.payload.id ? { ...g, ...action.payload.update } : g) };
    case 'SET_GROUP_BUDGET':
      return { ...state, groups: state.groups.map(g => g.id === action.payload.id ? { ...g, monthlyBudget: action.payload.amount } : g) };
    case 'COMPLETE_ONBOARDING':
      return { ...state, hasSeenOnboarding: true };
    case 'ENABLE_CLOUD_SYNC':
      return { ...state, syncProvider: 'cloud', cloudToken: action.payload, isSyncing: true };
    case 'DISABLE_CLOUD_SYNC':
      return { ...state, syncProvider: 'local', cloudToken: undefined };
    case 'SET_CUSTOM_DB_CONFIG':
      return { ...state, syncProvider: action.payload ? 'custom_db' : 'local', customDbConfig: action.payload };
    case 'SYNC_SUCCESS':
      return { ...state, lastSyncTimestamp: action.payload, isSyncing: false };
    case 'SET_ONLINE_STATUS':
      return { ...state, isOnline: action.payload };
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, { ...action.payload, id: Date.now().toString() }] };
    case 'UPDATE_GOAL':
      return { ...state, goals: state.goals.map(g => g.id === action.payload.id ? { ...g, ...action.payload.update } : g) };
    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter(g => g.id !== action.payload) };
    case 'TRANSFER_TO_GROUP':
      return {
        ...state,
        walletBalance: state.walletBalance - action.payload.amount,
        groups: state.groups.map(g => g.id === action.payload.groupId ? { ...g, allocatedAmount: (g.allocatedAmount || 0) + action.payload.amount } : g)
      };
    case 'TRANSFER_TO_SAVINGS':
      return {
        ...state,
        walletBalance: state.walletBalance - action.payload.amount,
        goals: state.goals.map(g => g.id === action.payload.goalId ? { ...g, currentAmount: g.currentAmount + action.payload.amount } : g)
      };
    case 'ADD_SYNC_LOG':
      return { ...state, syncHistory: [action.payload, ...state.syncHistory].slice(0, 50) }; // Keep last 50 logs
    default:
      return state;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE, (initial) => {
    try {
      const persisted = localStorage.getItem('mahfazty_v1_store');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        // Deep merge userProfile to ensure no missing keys
        const userProfile = { 
          ...initial.userProfile, 
          ...(parsed.userProfile || {}),
          achievements: parsed.userProfile?.achievements || initial.userProfile.achievements 
        };
        
        // If biometrics is enabled, force re-authentication
        if (parsed.security?.biometrics) {
          userProfile.isAuthenticated = false;
        }

        return {
          ...initial,
          ...parsed,
          userProfile,
          // Ensure arrays are at least empty arrays if missing
          apiKeys: parsed.apiKeys || initial.apiKeys,
          groups: (parsed.groups || initial.groups).map((g: any) => ({ ...g, id: g.id || Date.now().toString() + Math.random().toString(36).substr(2, 9) })),
          transactions: (parsed.transactions || initial.transactions).map((t: any) => ({ ...t, id: t.id || Date.now().toString() + Math.random().toString(36).substr(2, 9) })),
          clients: (parsed.clients || initial.clients).map((c: any) => ({ ...c, id: c.id || Date.now().toString() + Math.random().toString(36).substr(2, 9) })),
          installments: (parsed.installments || initial.installments).map((i: any) => ({ ...i, id: i.id || Date.now().toString() + Math.random().toString(36).substr(2, 9) })),
          creditCards: (parsed.creditCards || initial.creditCards || []).map((c: any) => ({ ...c, id: c.id || Date.now().toString() + Math.random().toString(36).substr(2, 9) })),
          chatHistory: parsed.chatHistory || initial.chatHistory,
          proChatHistory: parsed.proChatHistory || initial.proChatHistory,
          customWidgets: parsed.customWidgets || initial.customWidgets,
          activeWidgets: parsed.activeWidgets || initial.activeWidgets,
          notificationHistory: parsed.notificationHistory || initial.notificationHistory,
          hasSeenOnboarding: parsed.hasSeenOnboarding ?? initial.hasSeenOnboarding,
          goals: (parsed.goals || initial.goals).map((g: any) => ({ ...g, id: g.id || Date.now().toString() + Math.random().toString(36).substr(2, 9) })),
          syncHistory: parsed.syncHistory || initial.syncHistory,
          language: parsed.language || initial.language,
          isDarkMode: parsed.isDarkMode ?? initial.isDarkMode,
          isPro: parsed.isPro ?? initial.isPro,
          isPrivacyMode: parsed.isPrivacyMode ?? initial.isPrivacyMode,
          walletBalance: parsed.walletBalance ?? initial.walletBalance,
          baseCurrency: parsed.baseCurrency || initial.baseCurrency,
          activeApiKeyId: parsed.activeApiKeyId || initial.activeApiKeyId,
          security: parsed.security || initial.security,
          aiSettings: parsed.aiSettings || initial.aiSettings,
          notification: parsed.notification || initial.notification,
          autoSync: parsed.autoSync ?? initial.autoSync,
          isSyncing: parsed.isSyncing ?? initial.isSyncing,
          isOnline: parsed.isOnline ?? initial.isOnline,
          lastSyncTimestamp: parsed.lastSyncTimestamp || initial.lastSyncTimestamp,
          syncLocationSet: parsed.syncLocationSet ?? initial.syncLocationSet,
          syncProvider: parsed.syncProvider || initial.syncProvider,
          pushNotifications: parsed.pushNotifications ?? initial.pushNotifications
        };
      }
      return initial;
    } catch (e) {
      console.error("State hydration failed:", e);
      return initial;
    }
  });

  useEffect(() => {
    if (state.isDecoyMode) return; // Do not save decoy state to local storage
    localStorage.setItem('mahfazty_v1_store', JSON.stringify(state));
    if (state.userProfile.isAuthenticated && state.userProfile.username) {
      localStorage.setItem(`mahfazty_user_${state.userProfile.username}`, JSON.stringify(state));
    }
  }, [state]);

  const actions = {
    biometricLogin: (username: string) => {
      const savedData = localStorage.getItem(`mahfazty_user_${username}`);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.security?.biometrics) {
            dispatch({ type: 'IMPORT_STATE', payload: { ...parsed, isDecoyMode: false, userProfile: { ...parsed.userProfile, isAuthenticated: true } } });
            dispatch({ type: 'SET_NOTIFICATION', payload: { message: state.language === 'ar' ? 'تم تسجيل الدخول بالبصمة' : 'Logged in with biometrics', type: 'success' } });
          }
        } catch (e) {}
      }
    },
    login: (username: string, password?: string) => {
      const savedData = localStorage.getItem(`mahfazty_user_${username}`);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.security?.decoyPassword && parsed.security.decoyPassword === password) {
            dispatch({ type: 'IMPORT_STATE', payload: { ...parsed, isDecoyMode: true, userProfile: { ...parsed.userProfile, isAuthenticated: true } } });
            dispatch({ type: 'DECOY_LOGIN' });
            return;
          }
          if (parsed.userProfile?.password && parsed.userProfile.password !== password) {
            dispatch({ type: 'SET_NOTIFICATION', payload: { title: 'خطأ / Error', message: 'كلمة المرور غير صحيحة / Invalid password', type: 'error' } });
            return;
          }
          dispatch({ type: 'IMPORT_STATE', payload: { ...parsed, isDecoyMode: false, userProfile: { ...parsed.userProfile, isAuthenticated: true } } });
        } catch (e) {
          dispatch({ type: 'LOGIN', payload: { username } });
        }
      } else {
        dispatch({ type: 'SET_NOTIFICATION', payload: { title: 'خطأ / Error', message: 'المستخدم غير موجود / User not found', type: 'error' } });
      }
    },
    signup: (username: string, password?: string, email?: string) => {
      if (localStorage.getItem(`mahfazty_user_${username}`)) {
        dispatch({ type: 'SET_NOTIFICATION', payload: { title: 'تنبيه / Alert', message: 'المستخدم موجود بالفعل / User already exists', type: 'error' } });
        return;
      }
      dispatch({ type: 'SIGNUP', payload: { username, email, password } });
    },
    guestLogin: () => {
      // Check for existing guest data
      const savedData = localStorage.getItem('mahfazty_user_guest');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          dispatch({ type: 'IMPORT_STATE', payload: { ...parsed, userProfile: { ...parsed.userProfile, isAuthenticated: true } } });
        } catch (e) {
          dispatch({ type: 'GUEST_LOGIN' });
        }
      } else {
        dispatch({ type: 'GUEST_LOGIN' });
      }
    },
    decoyLogin: () => dispatch({ type: 'DECOY_LOGIN' }),
    logout: () => dispatch({ type: 'LOGOUT' }),
    lockApp: () => dispatch({ type: 'LOCK_APP' }),
    completeOnboarding: () => dispatch({ type: 'COMPLETE_ONBOARDING' }),
    addApiKey: (name: string, key: string, provider?: string) => dispatch({ type: 'ADD_API_KEY', payload: { name, key, provider } }), // +++ أضيف بناءً على طلبك +++
    deleteApiKey: (id: string) => dispatch({ type: 'DELETE_API_KEY', payload: id }),
    setActiveApiKey: (id: string) => dispatch({ type: 'SET_ACTIVE_API_KEY', payload: id }),
    incrementApiKeyUsage: (id: string) => dispatch({ type: 'INCREMENT_API_USAGE', payload: id }),
    blockApiKey: (id: string) => dispatch({ type: 'BLOCK_API_KEY', payload: id }),
    addTransaction: (t: Omit<Transaction, 'id'>) => dispatch({ type: 'ADD_TRANSACTION', payload: t }),
    updateTransaction: (id: string, t: Partial<Transaction>) => dispatch({ type: 'UPDATE_TRANSACTION', payload: { id, update: t } }),
    deleteTransaction: (id: string) => dispatch({ type: 'DELETE_TRANSACTION', payload: id }),
    updateWalletBalance: (amount: number) => dispatch({ type: 'UPDATE_WALLET_BALANCE', payload: amount }),
    addGroup: (name: string, icon?: string, budget?: number, id?: string, color?: string) => dispatch({ type: 'ADD_GROUP', payload: { name, icon, budget, id, color } }),
    updateGroup: (id: string, update: Partial<Group>) => dispatch({ type: 'UPDATE_GROUP', payload: { id, update } }),
    setGroupBudget: (id: string, amount: number) => dispatch({ type: 'SET_GROUP_BUDGET', payload: { id, amount } }),
    addInstallment: (i: Omit<Installment, 'id' | 'monthlyAmount' | 'paidCount' | 'status'>) => dispatch({ type: 'ADD_INSTALLMENT', payload: i }),
    payInstallment: (id: string, penalty?: number) => dispatch({ type: 'PAY_INSTALLMENT', payload: { id, penalty: penalty || 0 } }),
    addCreditCard: (card: Omit<import('./types').CreditCard, 'id'>) => dispatch({ type: 'ADD_CREDIT_CARD', payload: card }),
    updateCreditCard: (id: string, update: Partial<import('./types').CreditCard>) => dispatch({ type: 'UPDATE_CREDIT_CARD', payload: { id, update } }),
    deleteCreditCard: (id: string) => dispatch({ type: 'DELETE_CREDIT_CARD', payload: id }),
    settleCreditCard: (payload: { creditCardId: string; paymentAmount: number; settledTransactions: string[]; settledItems: { transactionId: string, itemId: string }[]; adjustmentTransaction?: Omit<Transaction, 'id'> }) => dispatch({ type: 'SETTLE_CREDIT_CARD', payload }),
    addGoal: (goal: Omit<import('./types').Goal, 'id'>) => dispatch({ type: 'ADD_GOAL', payload: goal }),
    updateGoal: (id: string, update: Partial<import('./types').Goal>) => dispatch({ type: 'UPDATE_GOAL', payload: { id, update } }),
    deleteGoal: (id: string) => dispatch({ type: 'DELETE_GOAL', payload: id }),
    transferToGroup: (groupId: string, amount: number) => dispatch({ type: 'TRANSFER_TO_GROUP', payload: { groupId, amount } }),
    transferToSavings: (goalId: string, amount: number) => dispatch({ type: 'TRANSFER_TO_SAVINGS', payload: { goalId, amount } }),
    setPro: (val: boolean) => dispatch({ type: 'SET_PRO', payload: val }),
    addChatMessage: (msg: ChatMessage, isProChat = false) => dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { msg, isProChat } }),
    updateProfile: (profile: UserProfile) => dispatch({ type: 'UPDATE_PROFILE', payload: profile }),
    setNotification: (notif: AppState['notification']) => dispatch({ type: 'SET_NOTIFICATION', payload: notif }),
    addNotificationToHistory: (notif: AppNotification) => dispatch({ type: 'ADD_NOTIFICATION_TO_HISTORY', payload: notif }),
    addCustomWidget: (widget: CustomWidget) => dispatch({ type: 'ADD_CUSTOM_WIDGET', payload: widget }),
    updateCustomWidget: (id: string, update: Partial<CustomWidget>) => dispatch({ type: 'UPDATE_CUSTOM_WIDGET', payload: { id, update } }),
    deleteCustomWidget: (id: string) => dispatch({ type: 'DELETE_CUSTOM_WIDGET', payload: id }),
    addAnalyticsWidget: (id: string) => dispatch({ type: 'ADD_ANALYTICS_WIDGET', payload: id }),
    removeAnalyticsWidget: (id: string) => dispatch({ type: 'REMOVE_ANALYTICS_WIDGET', payload: id }),
    toggleLanguage: () => dispatch({ type: 'TOGGLE_LANGUAGE' }),
    toggleDarkMode: () => dispatch({ type: 'TOGGLE_DARK_MODE' }),
    togglePrivacyMode: () => dispatch({ type: 'TOGGLE_PRIVACY_MODE' }),
    toggleBiometrics: () => dispatch({ type: 'TOGGLE_BIOMETRICS' }),
    setDecoyPassword: (password: string) => dispatch({ type: 'SET_DECOY_PASSWORD', payload: password }),
    togglePushNotifications: () => dispatch({ type: 'TOGGLE_PUSH_NOTIFICATIONS' }),
    updateAvatar: (avatarUrl: string) => dispatch({ type: 'UPDATE_AVATAR', payload: avatarUrl }),
    toggleAutoSync: () => dispatch({ type: 'TOGGLE_AUTO_SYNC' }),
    unlockAchievement: (achievementId: string) => dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: achievementId }),
    deleteGroup: (id: string) => dispatch({ type: 'DELETE_GROUP', payload: id }),
    restoreGroup: (id: string) => dispatch({ type: 'RESTORE_GROUP', payload: id }),
    permanentDeleteGroup: (id: string) => dispatch({ type: 'PERMANENT_DELETE_GROUP', payload: id }),
    addClient: (name: string, groupId: string, icon?: string, id?: string) => dispatch({ type: 'ADD_CLIENT', payload: { name, groupId, icon, id } }),
    updateClient: (id: string, update: Partial<Client>) => dispatch({ type: 'UPDATE_CLIENT', payload: { id, update } }),
    deleteClient: (id: string) => dispatch({ type: 'DELETE_CLIENT', payload: id }),
    restoreClient: (id: string) => dispatch({ type: 'RESTORE_CLIENT', payload: id }),
    permanentDeleteClient: (id: string) => dispatch({ type: 'PERMANENT_DELETE_CLIENT', payload: id }),
    moveClient: (clientId: string, newGroupId: string) => dispatch({ type: 'MOVE_CLIENT', payload: { clientId, newGroupId } }),
    mergeClient: (sourceClientId: string, targetClientId: string) => dispatch({ type: 'MERGE_CLIENT', payload: { sourceClientId, targetClientId } }),
    updateInstallment: (id: string, update: Partial<Installment>) => dispatch({ type: 'UPDATE_INSTALLMENT', payload: { id, update } }),
    deleteInstallment: (id: string) => dispatch({ type: 'DELETE_INSTALLMENT', payload: id }),
    clearChat: (isProChat = false) => dispatch({ type: 'CLEAR_CHAT', payload: isProChat }),
    resetData: () => dispatch({ type: 'RESET_DATA' }),
    importState: (jsonData: string) => dispatch({ type: 'IMPORT_STATE', payload: JSON.parse(jsonData) }),
    markNotificationsRead: () => dispatch({ type: 'MARK_NOTIFICATIONS_READ' }),
    clearNotificationHistory: () => dispatch({ type: 'CLEAR_NOTIFICATIONS' }),
    saveGraph: (graph: import('./types').SavedGraph) => dispatch({ type: 'SAVE_GRAPH', payload: graph }),
    updateGraph: (id: string, update: Partial<import('./types').SavedGraph>) => dispatch({ type: 'UPDATE_GRAPH', payload: { id, update } }),
    deleteGraph: (id: string) => dispatch({ type: 'DELETE_GRAPH', payload: id }),
    addRecurringTransaction: (rt: Omit<import('./types').RecurringTransaction, 'id'>) => dispatch({ type: 'ADD_RECURRING_TRANSACTION', payload: rt }),
    updateRecurringTransaction: (id: string, update: Partial<import('./types').RecurringTransaction>) => dispatch({ type: 'UPDATE_RECURRING_TRANSACTION', payload: { id, update } }),
    deleteRecurringTransaction: (id: string) => dispatch({ type: 'DELETE_RECURRING_TRANSACTION', payload: id }),
    processRecurringTransactions: () => dispatch({ type: 'PROCESS_RECURRING_TRANSACTIONS' }),
    enableCloudSync: (token: string) => dispatch({ type: 'ENABLE_CLOUD_SYNC', payload: token }),
    disableCloudSync: () => dispatch({ type: 'DISABLE_CLOUD_SYNC' }),
    setCustomDbConfig: (config: AppState['customDbConfig']) => dispatch({ type: 'SET_CUSTOM_DB_CONFIG', payload: config }),
    setOnlineStatus: (isOnline: boolean) => dispatch({ type: 'SET_ONLINE_STATUS', payload: isOnline }),
    syncWithCloud: async () => {
      if (state.syncProvider !== 'cloud' || !state.cloudToken) return;
      try {
        // Derive key from token (which is JWT signed with secret, but here we need a user secret)
        // For this implementation, we will use a fixed salt with the token itself as password for simplicity
        // In a real E2EE, we would ask for a separate password.
        // To make it seamless, we'll use the user's username as part of the key derivation.
        const key = await cryptoUtils.deriveKey(state.userProfile.username || 'default');
        
        // Encrypt state
        const stateStr = JSON.stringify(state);
        const { cipherText, iv } = await cryptoUtils.encrypt(stateStr, key);
        
        // Send encrypted data (we wrap it in an object to include IV)
        const payload = {
          encrypted: true,
          data: cipherText,
          iv: iv
        };

        await cloudService.pushData(state.cloudToken, payload as any);
        
        const timestamp = new Date().toISOString();
        dispatch({ type: 'SYNC_SUCCESS', payload: timestamp });
        dispatch({ 
          type: 'ADD_SYNC_LOG', 
          payload: { id: Date.now().toString(), type: 'push', status: 'success', timestamp, details: 'Encrypted push successful' } 
        });
      } catch (e: any) {
        console.error('Sync failed:', e);
        dispatch({ type: 'SET_NOTIFICATION', payload: { message: 'Cloud sync failed', type: 'error' } });
        dispatch({ 
          type: 'ADD_SYNC_LOG', 
          payload: { id: Date.now().toString(), type: 'push', status: 'error', timestamp: new Date().toISOString(), details: e.message } 
        });
      }
    },
    pullFromCloud: async () => {
      if (state.syncProvider !== 'cloud' || !state.cloudToken) return;
      try {
        const { data, timestamp } = await cloudService.pullData(state.cloudToken);
        if (data) {
          let decryptedState = data;
          
          // Check if data is encrypted
          if ((data as any).encrypted) {
            const key = await cryptoUtils.deriveKey(state.userProfile.username || 'default');
            const decryptedStr = await cryptoUtils.decrypt((data as any).data, (data as any).iv, key);
            decryptedState = JSON.parse(decryptedStr);
          }

          dispatch({ type: 'IMPORT_STATE', payload: { ...decryptedState, cloudToken: state.cloudToken, syncProvider: 'cloud' } });
          dispatch({ type: 'SYNC_SUCCESS', payload: timestamp });
          dispatch({ type: 'SET_NOTIFICATION', payload: { message: 'Data synced from cloud', type: 'success' } });
          dispatch({ 
            type: 'ADD_SYNC_LOG', 
            payload: { id: Date.now().toString(), type: 'pull', status: 'success', timestamp, details: 'Encrypted pull successful' } 
          });
        }
      } catch (e: any) {
        console.error('Pull failed:', e);
        dispatch({ type: 'SET_NOTIFICATION', payload: { message: 'Failed to pull data', type: 'error' } });
        dispatch({ 
          type: 'ADD_SYNC_LOG', 
          payload: { id: Date.now().toString(), type: 'pull', status: 'error', timestamp: new Date().toISOString(), details: e.message } 
        });
      }
    }
  };

  // Auto-sync effect
  useEffect(() => {
    if (state.autoSync && state.syncProvider === 'cloud' && state.cloudToken) {
      const timer = setTimeout(() => {
        actions.syncWithCloud();
      }, 5000); // Debounce sync by 5 seconds
      return () => clearTimeout(timer);
    }
  }, [state, state.autoSync, state.syncProvider, state.cloudToken]);

  // Pull on mount
  useEffect(() => {
    if (state.syncProvider === 'cloud' && state.cloudToken) {
      actions.pullFromCloud();
    }
  }, []);

  return React.createElement(AppContext.Provider, { value: { state, dispatch: actions } }, children);
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
