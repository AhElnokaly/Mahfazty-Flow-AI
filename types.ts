

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER'
}

export interface Group {
  id: string;
  name: string;
  icon?: string; 
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
}

export interface TransactionItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  barcode?: string;
}

export type PaymentMethod = 'cash' | 'credit';

export interface Transaction {
  id: string;
  amount: number;
  referenceTotal?: number; // New: Full bill amount for partial payments
  currency: string;
  type: TransactionType;
  paymentMethod?: PaymentMethod;
  dueDate?: string;
  isSettled?: boolean;
  date: string;
  groupId: string;
  clientId: string;
  note?: string;
  items?: TransactionItem[]; // New: Support for itemized transactions
  shares?: number;
  pricePerShare?: number;
  interestRate?: number;
  duration?: number;
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

export interface ApiKey {
  id: string;
  name: string;
  key: string;
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

export interface AppState {
  walletBalance: number;
  baseCurrency: string;
  apiKeys: ApiKey[];
  activeApiKeyId?: string;
  groups: Group[];
  transactions: Transaction[];
  clients: Client[];
  installments: Installment[];
  goals: Goal[];
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
  syncProvider: 'local' | 'cloud' | 'manual';
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
