
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, Group, Transaction, TransactionType, Client, UserProfile, AppNotification, ChatMessage, CustomWidget, Installment, SyncLogEntry } from './types';
import { cloudService } from './services/cloud';
import { cryptoUtils } from './utils/crypto';

const INITIAL_STATE: AppState = {
  walletBalance: 24500,
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
  activeWidgets: ['cash_flow', 'lifestyle_radar', 'item_price_tracker'],
  customWidgets: [], 
  security: {
    appLock: false,
    biometrics: false
  },
  pushNotifications: false,
  aiSettings: {
    enabled: true,
    sensitivity: 'medium',
    autoAnalysisInterval: 'off'
  },
  notification: null,
  notificationHistory: [],
  hasSeenOnboarding: false,
  syncHistory: []
};

interface AppContextType {
  state: AppState;
  dispatch: {
    login: (username: string, password?: string) => void;
    signup: (username: string, password?: string, email?: string) => void;
    guestLogin: () => void;
    logout: () => void;
    completeOnboarding: () => void;
    addApiKey: (name: string, key: string) => void;
    deleteApiKey: (id: string) => void;
    setActiveApiKey: (id: string) => void;
    incrementApiKeyUsage: (id: string) => void;
    blockApiKey: (id: string) => void;
    addTransaction: (t: Omit<Transaction, 'id'>) => void;
    updateTransaction: (id: string, t: Partial<Transaction>) => void;
    deleteTransaction: (id: string) => void;
    addGroup: (name: string, icon?: string, budget?: number, id?: string) => void;
    updateGroup: (id: string, update: Partial<Group>) => void;
    setGroupBudget: (id: string, amount: number) => void;
    addInstallment: (i: Omit<Installment, 'id' | 'monthlyAmount' | 'paidCount' | 'status'>) => void;
    payInstallment: (id: string, penalty?: number) => void;
    setPro: (val: boolean) => void;
    addChatMessage: (msg: ChatMessage, isProChat?: boolean) => void;
    updateProfile: (profile: UserProfile) => void;
    setNotification: (notif: AppState['notification']) => void;
    addNotificationToHistory: (notif: AppNotification) => void;
    addCustomWidget: (widget: CustomWidget) => void;
    addAnalyticsWidget: (id: string) => void;
    removeAnalyticsWidget: (id: string) => void;
    toggleLanguage: () => void;
    toggleDarkMode: () => void;
    togglePrivacyMode: () => void;
    toggleBiometrics: () => void;
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
    clearChat: (isProChat: boolean) => void;
    resetData: () => void;
    importState: (jsonData: string) => void;
    markNotificationsRead: () => void;
    clearNotificationHistory: () => void;
    enableCloudSync: (token: string) => void;
    disableCloudSync: () => void;
    syncWithCloud: () => Promise<void>;
    pullFromCloud: () => Promise<void>;
    unlockAchievement: (achievementId: string) => void;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

type Action = 
  | { type: 'LOGIN'; payload: { username: string } }
  | { type: 'SIGNUP'; payload: { username: string; email?: string; password?: string } }
  | { type: 'GUEST_LOGIN' }
  | { type: 'LOGOUT' }
  | { type: 'ADD_API_KEY'; payload: { name: string; key: string } }
  | { type: 'DELETE_API_KEY'; payload: string }
  | { type: 'SET_ACTIVE_API_KEY'; payload: string }
  | { type: 'INCREMENT_API_USAGE'; payload: string }
  | { type: 'BLOCK_API_KEY'; payload: string }
  | { type: 'ADD_TRANSACTION'; payload: Omit<Transaction, 'id'> }
  | { type: 'UPDATE_TRANSACTION'; payload: { id: string; update: Partial<Transaction> } }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'ADD_GROUP'; payload: { name: string; icon?: string; budget?: number; id?: string } }
  | { type: 'UPDATE_GROUP'; payload: { id: string; update: Partial<Group> } }
  | { type: 'SET_GROUP_BUDGET'; payload: { id: string; amount: number } }
  | { type: 'ADD_INSTALLMENT'; payload: Omit<Installment, 'id' | 'monthlyAmount' | 'paidCount' | 'status'> }
  | { type: 'PAY_INSTALLMENT'; payload: { id: string; penalty: number } }
  | { type: 'SET_PRO'; payload: boolean }
  | { type: 'ADD_CHAT_MESSAGE'; payload: { msg: ChatMessage; isProChat: boolean } }
  | { type: 'TOGGLE_LANGUAGE' }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'TOGGLE_PRIVACY_MODE' }
  | { type: 'SET_NOTIFICATION'; payload: AppState['notification'] }
  | { type: 'UPDATE_PROFILE'; payload: UserProfile }
  | { type: 'ADD_CUSTOM_WIDGET'; payload: CustomWidget }
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
  | { type: 'SYNC_SUCCESS'; payload: string }
  | { type: 'ADD_SYNC_LOG'; payload: SyncLogEntry }
  | { type: 'TOGGLE_BIOMETRICS' }
  | { type: 'TOGGLE_PUSH_NOTIFICATIONS' }
  | { type: 'UPDATE_AVATAR'; payload: string }
  | { type: 'UNLOCK_ACHIEVEMENT'; payload: string }
  | { type: 'ADD_GOAL'; payload: Omit<import('./types').Goal, 'id'> }
  | { type: 'UPDATE_GOAL'; payload: { id: string; update: Partial<import('./types').Goal> } }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'ADD_NOTIFICATION_TO_HISTORY'; payload: AppNotification };

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
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
          isAuthenticated: true 
        },
        notification: { 
          title: state.language === 'ar' ? '🎉 أهلاً بك في محفظتي' : '🎉 Welcome to Mahfazty',
          message: welcomeMessage, 
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
        userProfile: INITIAL_STATE.userProfile, 
        notification: { 
          title: state.language === 'ar' ? 'إلى اللقاء' : 'Goodbye',
          message: state.language === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Logged out successfully', 
          type: 'info' 
        } 
      };
    case 'ADD_API_KEY': {
      const newKey = {
        id: Date.now().toString(),
        name: action.payload.name,
        key: action.payload.key,
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
      const newTransaction = { id: Date.now().toString(), ...action.payload };
      const newBalance = action.payload.type === TransactionType.INCOME 
        ? state.walletBalance + action.payload.amount 
        : state.walletBalance - action.payload.amount;
      return { ...state, transactions: [newTransaction, ...state.transactions], walletBalance: newBalance };
    }
    case 'ADD_GROUP':
      return { ...state, groups: [...state.groups, { id: action.payload.id || Date.now().toString(), name: action.payload.name, icon: action.payload.icon, monthlyBudget: action.payload.budget }] };
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
    case 'IMPORT_STATE':
      return { ...state, ...action.payload };
    case 'ADD_INSTALLMENT':
      return { ...state, installments: [...state.installments, { id: Date.now().toString(), ...action.payload, monthlyAmount: action.payload.totalAmount / action.payload.installmentCount, paidCount: 0, status: 'active' }] };
    case 'PAY_INSTALLMENT':
      return { 
        ...state, 
        installments: state.installments.map(i => i.id === action.payload.id ? { ...i, paidCount: i.paidCount + 1, status: i.paidCount + 1 >= i.installmentCount ? 'completed' : 'active', lastPaymentDate: new Date().toISOString() } : i),
        walletBalance: state.walletBalance - (state.installments.find(i => i.id === action.payload.id)?.monthlyAmount || 0) - action.payload.penalty
      };
    case 'SET_PRO':
      return { ...state, isPro: action.payload };
    case 'ADD_CHAT_MESSAGE':
      const chatKey = action.payload.isProChat ? 'proChatHistory' : 'chatHistory';
      return { ...state, [chatKey]: [...state[chatKey], action.payload.msg] };
    case 'ADD_CUSTOM_WIDGET':
      return { ...state, customWidgets: [...state.customWidgets, action.payload] };
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
      return { 
        ...state, 
        groups: state.groups.filter(g => g.id !== action.payload),
        clients: state.clients.filter(c => c.groupId !== action.payload),
        transactions: state.transactions.filter(t => t.groupId !== action.payload && !clientsToDelete.includes(t.clientId))
      };
    }
    case 'ADD_CLIENT':
      return { ...state, clients: [...state.clients, { id: action.payload.id || Date.now().toString(), ...action.payload }] };
    case 'UPDATE_CLIENT':
      return { ...state, clients: state.clients.map(c => c.id === action.payload.id ? { ...c, ...action.payload.update } : c) };
    case 'DELETE_CLIENT':
      return { 
        ...state, 
        clients: state.clients.map(c => c.id === action.payload ? { ...c, isArchived: true } : c),
      };
    case 'RESTORE_CLIENT':
      return { 
        ...state, 
        clients: state.clients.map(c => c.id === action.payload ? { ...c, isArchived: false } : c),
      };
    case 'PERMANENT_DELETE_CLIENT':
      return { 
        ...state, 
        clients: state.clients.filter(c => c.id !== action.payload),
        transactions: state.transactions.filter(t => t.clientId !== action.payload)
      };
    case 'MOVE_CLIENT':
      return {
        ...state,
        clients: state.clients.map(c => c.id === action.payload.clientId ? { ...c, groupId: action.payload.newGroupId } : c),
        transactions: state.transactions.map(t => t.clientId === action.payload.clientId ? { ...t, groupId: action.payload.newGroupId } : t)
      };
    case 'MERGE_CLIENT': {
      const { sourceClientId, targetClientId } = action.payload;
      return {
        ...state,
        clients: state.clients.filter(c => c.id !== sourceClientId),
        transactions: state.transactions.map(t => t.clientId === sourceClientId ? { ...t, clientId: targetClientId } : t)
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
    case 'UPDATE_TRANSACTION':
      return { 
        ...state, 
        transactions: state.transactions.map(t => t.id === action.payload.id ? { ...t, ...action.payload.update } : t) 
      };
    case 'DELETE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) };
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
    case 'SYNC_SUCCESS':
      return { ...state, lastSyncTimestamp: action.payload, isSyncing: false };
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, { id: Date.now().toString(), ...action.payload }] };
    case 'UPDATE_GOAL':
      return { ...state, goals: state.goals.map(g => g.id === action.payload.id ? { ...g, ...action.payload.update } : g) };
    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter(g => g.id !== action.payload) };
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
        return {
          ...initial,
          ...parsed,
          userProfile: { 
            ...initial.userProfile, 
            ...(parsed.userProfile || {}),
            achievements: parsed.userProfile?.achievements || initial.userProfile.achievements 
          },
          // Ensure arrays are at least empty arrays if missing
          apiKeys: parsed.apiKeys || initial.apiKeys,
          groups: parsed.groups || initial.groups,
          transactions: parsed.transactions || initial.transactions,
          clients: parsed.clients || initial.clients,
          installments: parsed.installments || initial.installments,
          chatHistory: parsed.chatHistory || initial.chatHistory,
          proChatHistory: parsed.proChatHistory || initial.proChatHistory,
          customWidgets: parsed.customWidgets || initial.customWidgets,
          activeWidgets: parsed.activeWidgets || initial.activeWidgets,
          notificationHistory: parsed.notificationHistory || initial.notificationHistory,
          hasSeenOnboarding: parsed.hasSeenOnboarding ?? initial.hasSeenOnboarding,
          goals: parsed.goals || initial.goals,
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
    localStorage.setItem('mahfazty_v1_store', JSON.stringify(state));
    if (state.userProfile.isAuthenticated && state.userProfile.username) {
      localStorage.setItem(`mahfazty_user_${state.userProfile.username}`, JSON.stringify(state));
    }
  }, [state]);

  const actions = {
    login: (username: string, password?: string) => {
      const savedData = localStorage.getItem(`mahfazty_user_${username}`);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.userProfile?.password && parsed.userProfile.password !== password) {
            dispatch({ type: 'SET_NOTIFICATION', payload: { title: 'خطأ / Error', message: 'كلمة المرور غير صحيحة / Invalid password', type: 'error' } });
            return;
          }
          dispatch({ type: 'IMPORT_STATE', payload: { ...parsed, userProfile: { ...parsed.userProfile, isAuthenticated: true } } });
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
    logout: () => dispatch({ type: 'LOGOUT' }),
    completeOnboarding: () => dispatch({ type: 'COMPLETE_ONBOARDING' }),
    addApiKey: (name: string, key: string) => dispatch({ type: 'ADD_API_KEY', payload: { name, key } }),
    deleteApiKey: (id: string) => dispatch({ type: 'DELETE_API_KEY', payload: id }),
    setActiveApiKey: (id: string) => dispatch({ type: 'SET_ACTIVE_API_KEY', payload: id }),
    incrementApiKeyUsage: (id: string) => dispatch({ type: 'INCREMENT_API_USAGE', payload: id }),
    blockApiKey: (id: string) => dispatch({ type: 'BLOCK_API_KEY', payload: id }),
    addTransaction: (t: Omit<Transaction, 'id'>) => dispatch({ type: 'ADD_TRANSACTION', payload: t }),
    updateTransaction: (id: string, t: Partial<Transaction>) => dispatch({ type: 'UPDATE_TRANSACTION', payload: { id, update: t } }),
    deleteTransaction: (id: string) => dispatch({ type: 'DELETE_TRANSACTION', payload: id }),
    addGroup: (name: string, icon?: string, budget?: number, id?: string) => dispatch({ type: 'ADD_GROUP', payload: { name, icon, budget, id } }),
    updateGroup: (id: string, update: Partial<Group>) => dispatch({ type: 'UPDATE_GROUP', payload: { id, update } }),
    setGroupBudget: (id: string, amount: number) => dispatch({ type: 'SET_GROUP_BUDGET', payload: { id, amount } }),
    addInstallment: (i: Omit<Installment, 'id' | 'monthlyAmount' | 'paidCount' | 'status'>) => dispatch({ type: 'ADD_INSTALLMENT', payload: i }),
    payInstallment: (id: string, penalty?: number) => dispatch({ type: 'PAY_INSTALLMENT', payload: { id, penalty: penalty || 0 } }),
    addGoal: (goal: Omit<import('./types').Goal, 'id'>) => dispatch({ type: 'ADD_GOAL', payload: goal }),
    updateGoal: (id: string, update: Partial<import('./types').Goal>) => dispatch({ type: 'UPDATE_GOAL', payload: { id, update } }),
    deleteGoal: (id: string) => dispatch({ type: 'DELETE_GOAL', payload: id }),
    setPro: (val: boolean) => dispatch({ type: 'SET_PRO', payload: val }),
    addChatMessage: (msg: ChatMessage, isProChat = false) => dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { msg, isProChat } }),
    updateProfile: (profile: UserProfile) => dispatch({ type: 'UPDATE_PROFILE', payload: profile }),
    setNotification: (notif: AppState['notification']) => dispatch({ type: 'SET_NOTIFICATION', payload: notif }),
    addNotificationToHistory: (notif: AppNotification) => dispatch({ type: 'ADD_NOTIFICATION_TO_HISTORY', payload: notif }),
    addCustomWidget: (widget: CustomWidget) => dispatch({ type: 'ADD_CUSTOM_WIDGET', payload: widget }),
    addAnalyticsWidget: (id: string) => dispatch({ type: 'ADD_ANALYTICS_WIDGET', payload: id }),
    removeAnalyticsWidget: (id: string) => dispatch({ type: 'REMOVE_ANALYTICS_WIDGET', payload: id }),
    toggleLanguage: () => dispatch({ type: 'TOGGLE_LANGUAGE' }),
    toggleDarkMode: () => dispatch({ type: 'TOGGLE_DARK_MODE' }),
    togglePrivacyMode: () => dispatch({ type: 'TOGGLE_PRIVACY_MODE' }),
    toggleBiometrics: () => dispatch({ type: 'TOGGLE_BIOMETRICS' }),
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
    enableCloudSync: (token: string) => dispatch({ type: 'ENABLE_CLOUD_SYNC', payload: token }),
    disableCloudSync: () => dispatch({ type: 'DISABLE_CLOUD_SYNC' }),
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
