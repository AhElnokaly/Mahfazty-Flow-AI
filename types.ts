

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
  INVESTMENT = 'INVESTMENT' // +++ أضيف بناءً على طلبك +++
}

export interface Group {
  id: string;
  name: string;
  icon?: string; 
  color?: string; // +++ أضيف بناءً على طلبك +++
  monthlyBudget?: number; // New: Budgeting support
  allocatedAmount?: number; // New: Money transferred to this group
  isArchived?: boolean;
}

export interface Client {
  id: string;
  name: string;
  groupId: string;
  icon?: string; 
  contact?: string;
  isArchived?: boolean;
  deletedAt?: string;
}

export interface TransactionItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  barcode?: string;
  isSettled?: boolean; // +++ أضيف بناءً على طلبك +++
  clientId?: string; // +++ أضيف بناءً على طلبك +++
  isDebt?: boolean; // +++ أضيف بناءً على طلبك +++
}

export type PaymentMethod = 'cash' | 'credit';

export interface CreditCard {
  id: string;
  name: string; // e.g., "CIB Visa"
  limit: number; // Total credit limit
  balance: number; // Current used balance
  billingDate: number; // Day of the month (1-31)
  dueDate: number; // Day of the month (1-31)
  color: string; // Tailwind color class
  icon: string; // Lucide icon name
  isArchived?: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  referenceTotal?: number; // New: Full bill amount for partial payments
  currency: string;
  type: TransactionType;
  paymentMethod?: PaymentMethod;
  creditCardId?: string; // New: Link to a specific credit card
  dueDate?: string;
  isSettled?: boolean;
  isDebt?: boolean; // New: Mark transaction as a debt/loan
  investmentAction?: 'BUY' | 'SELL' | 'RETURN' | 'FREE_STOCK' | 'DIVIDEND'; // +++ أضيف بناءً على طلبك +++
  debtAction?: 'BORROW' | 'LEND' | 'REPAY_BORROW' | 'REPAY_LEND'; // New: Action for debts
  date: string;
  groupId: string;
  clientId: string;
  clientIds?: string[]; // +++ أضيف بناءً على طلبك +++
  categoryId?: string; // +++ أضيف بناءً على طلبك +++
  note?: string;
  items?: TransactionItem[]; // New: Support for itemized transactions
  shares?: number;
  pricePerShare?: number;
  interestRate?: number;
  duration?: number;
  returnFrequency?: 'monthly' | 'quarterly' | 'semi-annually' | 'annually'; // +++ أضيف بناءً على طلبك +++
  investmentType?: 'stock' | 'deposit'; // +++ أضيف بناءً على طلبك +++
  stockSymbol?: string; // +++ أضيف بناءً على طلبك +++
  color?: string; // +++ أضيف بناءً على طلبك +++ (For Editor feature)
}

export interface UserProfile {
  name: string;
  username?: string;
  password?: string;
  email: string;
  avatar: string;
  isAuthenticated: boolean;
  preferredApiKeyId?: string; 
  achievements?: string[];
  recoveryKey?: string;
  streak?: number;
  lastTransactionDate?: string;
  smartRoundup?: boolean;
}

export interface Installment {
  id: string;
  title: string;
  totalAmount: number;
  interestRate: number;
  startDate: string;
  installmentCount: number;
  paidCount: number;
  monthlyAmount: number;
  status: 'active' | 'completed';
  type: 'loan' | 'purchase' | 'jamiyah';
  lastPaymentDate?: string;
  linkedGroupId?: string;
  penalty?: number;
  paymentMethod?: 'cash' | 'credit'; // +++ أضيف بناءً على طلبك +++
  creditCardId?: string; // +++ أضيف بناءً على طلبك +++
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  toolCalls?: any[]; 
}

export interface AppNotification {
  id: string;
  title?: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'update';
  timestamp: string;
  read: boolean;
}

export interface CustomWidget {
  id: string;
  title: string;
  description: string;
  chartType: 'bar' | 'pie' | 'area' | 'line';
  dataSource: 'income' | 'expense' | 'net';
  groupBy: 'group' | 'client' | 'date';
  colorTheme: 'blue' | 'emerald' | 'rose' | 'amber' | 'purple';
}

export type AIProvider = 'gemini' | 'xai' | 'openai' | 'groq'; // +++ أضيف بناءً على طلبك +++

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  provider?: AIProvider; // +++ أضيف بناءً على طلبك +++
  usageCount: number;
  isBlocked?: boolean;
  lastUsed?: string;
}

export interface SyncLogEntry {
  id: string;
  type: 'push' | 'pull';
  status: 'success' | 'error';
  timestamp: string;
  details?: string;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: string;
  color: string;
}

export interface SavedGraph {
  id: string;
  title: string;
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'radar' | 'composed';
  selectedGroups: string[];
  selectedClients: string[];
  selectedCategories?: string[]; // +++ أضيف بناءً على طلبك +++
  dateRange: { start: string; end: string };
  timeGrouping: 'daily' | 'monthly' | 'yearly';
  dataType: 'expense' | 'income' | 'net' | 'all';
  showGrid: boolean;
  showLabels: boolean;
}

export type RecurrenceInterval = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  amount: number;
  type: TransactionType;
  groupId: string;
  clientId?: string;
  title: string;
  interval: RecurrenceInterval;
  startDate: string;
  nextDate: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface AppState {
  walletBalance: number;
  baseCurrency: string;
  apiKeys: ApiKey[];
  activeApiKeyId?: string;
  groups: Group[];
  transactions: Transaction[];
  clients: Client[];
  installments: Installment[];
  creditCards: CreditCard[];
  categories: Category[];
  goals: Goal[];
  savedGraphs: SavedGraph[];
  recurringTransactions: RecurringTransaction[];
  language: 'ar' | 'en';
  isDarkMode: boolean;
  isPro: boolean;
  isPrivacyMode: boolean; // New: Toggle to blur financial numbers
  isDecoyMode?: boolean; // New: Decoy mode for fake data
  autoSync: boolean;
  isSyncing: boolean;
  isOnline: boolean;
  lastSyncTimestamp: string | null;
  syncLocationSet: boolean;
  syncProvider: 'local' | 'cloud' | 'manual' | 'custom_db';
  customDbConfig?: {
    provider: 'firebase' | 'supabase' | 'rest';
    url: string;
    apiKey: string;
  };
  cloudEndpoint?: string;
  cloudToken?: string;
  syncHistory: SyncLogEntry[];
  userProfile: UserProfile;
  chatHistory: ChatMessage[];
  proChatHistory: ChatMessage[]; 
  activeWidgets: string[]; 
  customWidgets: CustomWidget[]; 
  security: {
    appLock: boolean;
    biometrics: boolean;
    decoyPassword?: string;
  };
  pushNotifications: boolean;
  aiSettings: {
    enabled: boolean;
    sensitivity: 'low' | 'medium' | 'high';
    autoAnalysisInterval: 'daily' | 'weekly' | 'off';
    lastAnalysisDate?: string;
  };
  notification: {
    title?: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'update';
  } | null;
  notificationHistory: AppNotification[];
  hasSeenOnboarding: boolean;
}
