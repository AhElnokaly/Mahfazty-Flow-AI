
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface Group {
  id: string;
  name: string;
  icon?: string; 
  monthlyBudget?: number; // New: Budgeting support
}

export interface Client {
  id: string;
  name: string;
  groupId: string;
  icon?: string; 
  contact?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  type: TransactionType;
  date: string;
  groupId: string;
  clientId: string;
  note?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  googleId?: string;
  isAuthenticated: boolean;
  preferredApiKeyId?: string; // Link to default key
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
}

export interface ApiKeyDefinition {
  id: string;
  key: string;
  label: string; 
  isRateLimited: boolean; 
  lastUsed?: string;
  linkedToGoogle?: boolean;
}

export interface ApiConfig {
  provider: 'gemini' | 'openai' | 'local';
  keys: ApiKeyDefinition[]; 
  activeKeyId?: string; 
  model: string;
  status: 'connected' | 'error' | 'idle';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  toolCalls?: any[]; 
}

export interface AppNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
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

export interface AppState {
  walletBalance: number;
  baseCurrency: string;
  groups: Group[];
  transactions: Transaction[];
  clients: Client[];
  installments: Installment[];
  language: 'ar' | 'en';
  isDarkMode: boolean;
  isPro: boolean;
  autoSync: boolean;
  isSyncing: boolean;
  isOnline: boolean;
  lastSyncTimestamp: string | null;
  syncLocationSet: boolean;
  syncProvider: 'local' | 'cloud' | 'manual';
  cloudEndpoint?: string;
  userProfile: UserProfile;
  apiConfig: ApiConfig;
  chatHistory: ChatMessage[];
  proChatHistory: ChatMessage[]; 
  activeWidgets: string[]; 
  customWidgets: CustomWidget[]; 
  security: {
    appLock: boolean;
    biometrics: boolean;
  };
  aiSettings: {
    enabled: boolean;
    sensitivity: 'low' | 'medium' | 'high';
    autoAnalysisInterval: 'daily' | 'weekly' | 'off';
    lastAnalysisDate?: string;
  };
  notification: {
    message: string;
    type: 'info' | 'success' | 'error';
  } | null;
  notificationHistory: AppNotification[];
}
