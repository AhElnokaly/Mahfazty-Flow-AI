
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, Group, Transaction, TransactionType, Client, UserProfile, AppNotification, ApiConfig, ChatMessage, CustomWidget, ApiKeyDefinition, Installment } from './types';

const INITIAL_STATE: AppState = {
  walletBalance: 24500,
  baseCurrency: 'EGP',
  userProfile: {
    name: 'Guest User',
    email: '',
    avatar: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Guest',
    isAuthenticated: false
  },
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
  language: 'ar',
  isDarkMode: false,
  isPro: false,
  autoSync: true,
  isSyncing: false,
  isOnline: navigator.onLine,
  lastSyncTimestamp: new Date().toISOString(),
  syncLocationSet: false,
  syncProvider: 'local',
  apiConfig: {
    provider: 'gemini',
    keys: [],
    activeKeyId: undefined,
    model: 'gemini-3-flash-preview',
    status: 'idle'
  },
  chatHistory: [],
  proChatHistory: [],
  activeWidgets: ['cash_flow', 'lifestyle_radar'],
  customWidgets: [], 
  security: {
    appLock: false,
    biometrics: false
  },
  aiSettings: {
    enabled: true,
    sensitivity: 'medium',
    autoAnalysisInterval: 'off'
  },
  notification: null,
  notificationHistory: []
};

interface AppContextType {
  state: AppState;
  dispatch: {
    loginWithGoogle: (user: Partial<UserProfile>) => void;
    logout: () => void;
    addTransaction: (t: Omit<Transaction, 'id'>) => void;
    updateTransaction: (id: string, t: Partial<Transaction>) => void;
    deleteTransaction: (id: string) => void;
    addGroup: (name: string, icon?: string, budget?: number) => void;
    updateGroup: (id: string, update: Partial<Group>) => void;
    setGroupBudget: (id: string, amount: number) => void;
    addInstallment: (i: Omit<Installment, 'id' | 'monthlyAmount' | 'paidCount' | 'status'>) => void;
    payInstallment: (id: string, penalty?: number) => void;
    setPro: (val: boolean) => void;
    addApiKey: (key: string, label: string, linkedToGoogle?: boolean) => void;
    removeApiKey: (id: string) => void;
    setActiveApiKey: (id: string) => void;
    addChatMessage: (msg: ChatMessage, isProChat?: boolean) => void;
    updateProfile: (profile: UserProfile) => void;
    setNotification: (notif: AppState['notification']) => void;
    addCustomWidget: (widget: CustomWidget) => void;
    addAnalyticsWidget: (id: string) => void;
    removeAnalyticsWidget: (id: string) => void;
    toggleLanguage: () => void;
    toggleDarkMode: () => void;
    toggleAutoSync: () => void;
    deleteGroup: (id: string) => void;
    addClient: (name: string, groupId: string, icon?: string) => void;
    updateClient: (id: string, update: Partial<Client>) => void;
    deleteClient: (id: string) => void;
    updateInstallment: (id: string, update: Partial<Installment>) => void;
    deleteInstallment: (id: string) => void;
    clearChat: (isProChat: boolean) => void;
    resetData: () => void;
    importState: (jsonData: string) => void;
    markNotificationsRead: () => void;
    clearNotificationHistory: () => void;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

type Action = 
  | { type: 'LOGIN'; payload: Partial<UserProfile> }
  | { type: 'LOGOUT' }
  | { type: 'ADD_TRANSACTION'; payload: Omit<Transaction, 'id'> }
  | { type: 'UPDATE_TRANSACTION'; payload: { id: string; update: Partial<Transaction> } }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'ADD_GROUP'; payload: { name: string; icon?: string; budget?: number } }
  | { type: 'UPDATE_GROUP'; payload: { id: string; update: Partial<Group> } }
  | { type: 'SET_GROUP_BUDGET'; payload: { id: string; amount: number } }
  | { type: 'ADD_INSTALLMENT'; payload: Omit<Installment, 'id' | 'monthlyAmount' | 'paidCount' | 'status'> }
  | { type: 'PAY_INSTALLMENT'; payload: { id: string; penalty: number } }
  | { type: 'SET_PRO'; payload: boolean }
  | { type: 'ADD_API_KEY'; payload: { key: string; label: string; linkedToGoogle?: boolean } }
  | { type: 'REMOVE_API_KEY'; payload: string }
  | { type: 'SET_ACTIVE_API_KEY'; payload: string }
  | { type: 'ADD_CHAT_MESSAGE'; payload: { msg: ChatMessage; isProChat: boolean } }
  | { type: 'TOGGLE_LANGUAGE' }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'SET_NOTIFICATION'; payload: AppState['notification'] }
  | { type: 'UPDATE_PROFILE'; payload: UserProfile }
  | { type: 'ADD_CUSTOM_WIDGET'; payload: CustomWidget }
  | { type: 'ADD_ANALYTICS_WIDGET'; payload: string }
  | { type: 'REMOVE_ANALYTICS_WIDGET'; payload: string }
  | { type: 'DELETE_GROUP'; payload: string }
  | { type: 'ADD_CLIENT'; payload: { name: string; groupId: string; icon?: string } }
  | { type: 'UPDATE_CLIENT'; payload: { id: string; update: Partial<Client> } }
  | { type: 'DELETE_CLIENT'; payload: string }
  | { type: 'UPDATE_INSTALLMENT'; payload: { id: string; update: Partial<Installment> } }
  | { type: 'DELETE_INSTALLMENT'; payload: string }
  | { type: 'CLEAR_CHAT'; payload: boolean }
  | { type: 'RESET_DATA' }
  | { type: 'IMPORT_STATE'; payload: any }
  | { type: 'MARK_NOTIFICATIONS_READ' }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'TOGGLE_AUTO_SYNC' };

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'LOGIN': {
      // Simulate auto-provisioning a key if user is new
      const hasKeys = state.apiConfig.keys.length > 0;
      let newApiConfig = { ...state.apiConfig };
      
      if (!hasKeys) {
        const defaultKey = { id: 'key_google_default', key: '', label: 'Cloud Default Key', linkedToGoogle: true, isRateLimited: false };
        newApiConfig.keys = [defaultKey];
        newApiConfig.activeKeyId = 'key_google_default';
      }

      return { 
        ...state, 
        userProfile: { ...state.userProfile, ...action.payload, isAuthenticated: true },
        apiConfig: newApiConfig,
        notification: { message: `Welcome back, ${action.payload.name}!`, type: 'success' }
      };
    }
    case 'LOGOUT':
      return { ...state, userProfile: INITIAL_STATE.userProfile, notification: { message: 'Logged out successfully', type: 'info' } };
    case 'ADD_TRANSACTION': {
      const newTransaction = { id: Date.now().toString(), ...action.payload };
      const newBalance = action.payload.type === TransactionType.INCOME 
        ? state.walletBalance + action.payload.amount 
        : state.walletBalance - action.payload.amount;
      
      // Check budget alert
      let notification = state.notification;
      if (action.payload.type === TransactionType.EXPENSE) {
        const group = state.groups.find(g => g.id === action.payload.groupId);
        if (group && group.monthlyBudget) {
           const currentMonthSpending = state.transactions
             .filter(t => t.groupId === group.id && t.type === TransactionType.EXPENSE && t.date.startsWith(new Date().toISOString().slice(0, 7)))
             .reduce((s, t) => s + t.amount, 0) + action.payload.amount;
           
           if (currentMonthSpending > group.monthlyBudget) {
              notification = { message: `⚠️ Budget Alert: ${group.name} exceeded!`, type: 'error' };
           }
        }
      }

      return { ...state, transactions: [newTransaction, ...state.transactions], walletBalance: newBalance, notification };
    }
    case 'ADD_GROUP':
      return { ...state, groups: [...state.groups, { id: Date.now().toString(), name: action.payload.name, icon: action.payload.icon, monthlyBudget: action.payload.budget }] };
    case 'SET_GROUP_BUDGET':
      return { ...state, groups: state.groups.map(g => g.id === action.payload.id ? { ...g, monthlyBudget: action.payload.amount } : g) };
    case 'ADD_API_KEY': {
      const newKey = { id: Date.now().toString(), key: action.payload.key, label: action.payload.label, linkedToGoogle: action.payload.linkedToGoogle, isRateLimited: false };
      return { ...state, apiConfig: { ...state.apiConfig, keys: [...state.apiConfig.keys, newKey], activeKeyId: state.apiConfig.activeKeyId === 'key_google_default' ? newKey.id : (state.apiConfig.activeKeyId || newKey.id) } };
    }
    case 'SET_PRO':
      return { ...state, isPro: action.payload };
    case 'RESET_DATA':
      return INITIAL_STATE;
    default:
      return state;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE, (initial) => {
    const persisted = localStorage.getItem('mahfazty_state_v12');
    return persisted ? JSON.parse(persisted) : initial;
  });

  useEffect(() => {
    localStorage.setItem('mahfazty_state_v12', JSON.stringify(state));
  }, [state]);

  const actions = {
    loginWithGoogle: (user: Partial<UserProfile>) => dispatch({ type: 'LOGIN', payload: user }),
    logout: () => dispatch({ type: 'LOGOUT' }),
    addTransaction: (t: Omit<Transaction, 'id'>) => dispatch({ type: 'ADD_TRANSACTION', payload: t }),
    updateTransaction: (id: string, t: Partial<Transaction>) => dispatch({ type: 'UPDATE_TRANSACTION', payload: { id, update: t } }),
    deleteTransaction: (id: string) => dispatch({ type: 'DELETE_TRANSACTION', payload: id }),
    addGroup: (name: string, icon?: string, budget?: number) => dispatch({ type: 'ADD_GROUP', payload: { name, icon, budget } }),
    updateGroup: (id: string, update: Partial<Group>) => dispatch({ type: 'UPDATE_GROUP', payload: { id, update } }),
    setGroupBudget: (id: string, amount: number) => dispatch({ type: 'SET_GROUP_BUDGET', payload: { id, amount } }),
    addInstallment: (i: Omit<Installment, 'id' | 'monthlyAmount' | 'paidCount' | 'status'>) => dispatch({ type: 'ADD_INSTALLMENT', payload: i }),
    payInstallment: (id: string, penalty?: number) => dispatch({ type: 'PAY_INSTALLMENT', payload: { id, penalty: penalty || 0 } }),
    setPro: (val: boolean) => dispatch({ type: 'SET_PRO', payload: val }),
    addApiKey: (key: string, label: string, linkedToGoogle?: boolean) => dispatch({ type: 'ADD_API_KEY', payload: { key, label, linkedToGoogle } }),
    removeApiKey: (id: string) => dispatch({ type: 'REMOVE_API_KEY', payload: id }),
    setActiveApiKey: (id: string) => dispatch({ type: 'SET_ACTIVE_API_KEY', payload: id }),
    addChatMessage: (msg: ChatMessage, isProChat = false) => dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { msg, isProChat } }),
    updateProfile: (profile: UserProfile) => dispatch({ type: 'UPDATE_PROFILE', payload: profile }),
    setNotification: (notif: AppState['notification']) => dispatch({ type: 'SET_NOTIFICATION', payload: notif }),
    addCustomWidget: (widget: CustomWidget) => dispatch({ type: 'ADD_CUSTOM_WIDGET', payload: widget }),
    addAnalyticsWidget: (id: string) => dispatch({ type: 'ADD_ANALYTICS_WIDGET', payload: id }),
    removeAnalyticsWidget: (id: string) => dispatch({ type: 'REMOVE_ANALYTICS_WIDGET', payload: id }),
    toggleLanguage: () => dispatch({ type: 'TOGGLE_LANGUAGE' }),
    toggleDarkMode: () => dispatch({ type: 'TOGGLE_DARK_MODE' }),
    toggleAutoSync: () => dispatch({ type: 'TOGGLE_AUTO_SYNC' }),
    deleteGroup: (id: string) => dispatch({ type: 'DELETE_GROUP', payload: id }),
    addClient: (name: string, groupId: string, icon?: string) => dispatch({ type: 'ADD_CLIENT', payload: { name, groupId, icon } }),
    updateClient: (id: string, update: Partial<Client>) => dispatch({ type: 'UPDATE_CLIENT', payload: { id, update } }),
    deleteClient: (id: string) => dispatch({ type: 'DELETE_CLIENT', payload: id }),
    updateInstallment: (id: string, update: Partial<Installment>) => dispatch({ type: 'UPDATE_INSTALLMENT', payload: { id, update } }),
    deleteInstallment: (id: string) => dispatch({ type: 'DELETE_INSTALLMENT', payload: id }),
    clearChat: (isProChat = false) => dispatch({ type: 'CLEAR_CHAT', payload: isProChat }),
    resetData: () => dispatch({ type: 'RESET_DATA' }),
    importState: (jsonData: string) => dispatch({ type: 'IMPORT_STATE', payload: JSON.parse(jsonData) }),
    markNotificationsRead: () => dispatch({ type: 'MARK_NOTIFICATIONS_READ' }),
    clearNotificationHistory: () => dispatch({ type: 'CLEAR_NOTIFICATIONS' }),
  };

  return React.createElement(AppContext.Provider, { value: { state, dispatch: actions } }, children);
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
