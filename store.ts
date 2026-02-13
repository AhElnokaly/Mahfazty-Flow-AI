
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, Group, Transaction, TransactionType, Client, UserProfile, AppNotification, ChatMessage, CustomWidget, Installment } from './types';

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
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  lastSyncTimestamp: new Date().toISOString(),
  syncLocationSet: false,
  syncProvider: 'local',
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
      return { 
        ...state, 
        userProfile: { ...state.userProfile, ...action.payload, isAuthenticated: true },
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
      return { ...state, transactions: [newTransaction, ...state.transactions], walletBalance: newBalance };
    }
    case 'ADD_GROUP':
      return { ...state, groups: [...state.groups, { id: Date.now().toString(), name: action.payload.name, icon: action.payload.icon, monthlyBudget: action.payload.budget }] };
    case 'TOGGLE_LANGUAGE':
      return { ...state, language: state.language === 'ar' ? 'en' : 'ar' };
    case 'TOGGLE_DARK_MODE':
      return { ...state, isDarkMode: !state.isDarkMode };
    case 'SET_NOTIFICATION':
      return { ...state, notification: action.payload };
    case 'RESET_DATA':
      return INITIAL_STATE;
    default:
      return state;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE, (initial) => {
    try {
      const persisted = localStorage.getItem('mahfazty_v1_store');
      return persisted ? { ...initial, ...JSON.parse(persisted) } : initial;
    } catch (e) {
      return initial;
    }
  });

  useEffect(() => {
    localStorage.setItem('mahfazty_v1_store', JSON.stringify(state));
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
