export type AppMode = 'student' | 'professional';

export type PaymentMethod = 'UPI' | 'Credit Card' | 'Debit Card' | 'Net Banking' | 'Cash' | 'Apple Pay / GPay';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string; // YYYY-MM-DD
  category: string;
  description: string;
  paymentMethod: PaymentMethod;
  tags: string[];
  isRecurring?: boolean;
  notes?: string;
  aiCategorized?: boolean;
  aiConfidence?: number;
}

export interface BudgetCategory {
  id: string;
  category: string;
  monthlyLimit: number;
  spent: number;
  color: string;
  icon?: string;
  alertThresholdPercent?: number; // default 80
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  category: 'Tech' | 'Education' | 'Emergency' | 'Travel' | 'Vehicle' | 'Lifestyle';
  icon: string;
  suggestedMonthlySaving: number;
  feasibilityScore?: 'High' | 'Moderate' | 'Challenging';
  aiAdvice?: string;
}

export interface BillReminder {
  id: string;
  title: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  category: string;
  isPaid: boolean;
  frequency: 'Monthly' | 'Weekly' | 'Quarterly' | 'Yearly' | 'One-Time';
  autoReminder: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  mode: AppMode;
  currency: string;
  monthlyIncome: number;
  financialGoals: string;
  targetSavingsRate: number; // percentage, e.g. 20
  avatar: string;
}

export interface UnusualSpendingItem {
  item: string;
  amount: number;
  category: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

export interface MonthlyFinancialReport {
  month: string;
  year: number;
  generatedAt: string;
  financialHealthScore: number; // 0 - 100
  scoreLabel: string;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  majorCategories: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  unusualSpending: UnusualSpendingItem[];
  personalizedSuggestions: string[];
  agentSummary: string;
  projectedAnnualSavings: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  suggestedQuestions?: string[];
  metricHighlights?: {
    label: string;
    value: string;
    status?: 'positive' | 'warning' | 'neutral';
  }[];
}

export interface AgentWorkflowState {
  currentStage: 'idle' | 'collecting' | 'analyzing' | 'monitoring' | 'recommending' | 'updating';
  lastRunTimestamp: string;
  logs: {
    id: string;
    stage: string;
    message: string;
    timestamp: string;
    type: 'info' | 'success' | 'warning' | 'alert';
  }[];
}
