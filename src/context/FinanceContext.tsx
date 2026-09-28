import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  UserProfile,
  Transaction,
  BudgetCategory,
  SavingsGoal,
  BillReminder,
  AppMode,
  PaymentMethod,
  AgentWorkflowState,
} from '../types/finance';
import {
  STUDENT_PROFILE,
  PROFESSIONAL_PROFILE,
  STUDENT_BUDGETS,
  PROFESSIONAL_BUDGETS,
  STUDENT_SAVINGS_GOALS,
  PROFESSIONAL_SAVINGS_GOALS,
  STUDENT_BILLS,
  PROFESSIONAL_BILLS,
  STUDENT_TRANSACTIONS,
  PROFESSIONAL_TRANSACTIONS,
} from '../data/initialData';
import { getDaysRemainingInMonth } from '../utils/formatters';

interface FinanceContextType {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  currency: string;
  setCurrency: (curr: string) => void;
  switchUser: (type: 'student' | 'professional') => void;

  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<Transaction>;
  deleteTransaction: (id: string) => void;
  batchCategorizeTransactions: () => Promise<number>;

  budgets: BudgetCategory[];
  updateBudgetLimit: (id: string, limit: number) => void;
  applyAIBudgetPlan: (newBudgets: { category: string; limit: number; color?: string; icon?: string }[]) => void;
  addBudgetCategory: (category: string, monthlyLimit: number, color?: string, icon?: string) => void;

  savingsGoals: SavingsGoal[];
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'suggestedMonthlySaving'>) => Promise<void>;
  depositToGoal: (id: string, amount: number) => void;
  deleteGoal: (id: string) => void;

  bills: BillReminder[];
  addBill: (bill: Omit<BillReminder, 'id' | 'isPaid'>) => void;
  toggleBillPaid: (id: string, autoRecordExpense?: boolean) => void;
  deleteBill: (id: string) => void;

  // Computed metrics
  totalIncome: number;
  totalExpenses: number;
  remainingBalance: number;
  monthlySavings: number;
  savingsRate: number;
  dailyAllowance: number;
  categorySpending: { category: string; amount: number; percentage: number; color: string; count: number }[];
  overspendingAlerts: { id: string; category: string; spent: number; limit: number; percent: number; status: 'warning' | 'danger' }[];
  upcomingBillsCount: number;

  // Agentic Workflow
  agentWorkflow: AgentWorkflowState;
  runAgentCycle: () => Promise<void>;
  aiCategorizeTransaction: (
    desc: string,
    amount: number,
    paymentMethod: PaymentMethod
  ) => Promise<{ category: string; tags: string[]; isRecurring: boolean; confidence: number; explanation: string }>;
  isAgentRunning: boolean;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<AppMode>('student');
  const [profile, setProfile] = useState<UserProfile>(STUDENT_PROFILE);
  const [transactions, setTransactions] = useState<Transaction[]>(STUDENT_TRANSACTIONS);
  const [budgets, setBudgets] = useState<BudgetCategory[]>(STUDENT_BUDGETS);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(STUDENT_SAVINGS_GOALS);
  const [bills, setBills] = useState<BillReminder[]>(STUDENT_BILLS);
  const [currency, setCurrencyState] = useState<string>('$');
  const [isAgentRunning, setIsAgentRunning] = useState<boolean>(false);

  const [agentWorkflow, setAgentWorkflow] = useState<AgentWorkflowState>({
    currentStage: 'idle',
    lastRunTimestamp: new Date().toLocaleTimeString(),
    logs: [
      {
        id: 'log_0',
        stage: 'Agent Initialization',
        message: 'FinAgent initialized. Financial neural link established with local records.',
        timestamp: new Date().toLocaleTimeString(),
        type: 'info',
      },
    ],
  });

  // Sync spent amounts into budgets based on current transactions
  const syncedBudgets = useMemo(() => {
    return budgets.map((b) => {
      const spent = transactions
        .filter((t) => t.type === 'expense' && t.category.toLowerCase() === b.category.toLowerCase())
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      return { ...b, spent };
    });
  }, [budgets, transactions]);

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('finagent_mode') as AppMode;
    const initialMode = savedMode || 'student';
    setModeState(initialMode);

    const savedData = localStorage.getItem(`finagent_state_${initialMode}`);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.profile) setProfile(parsed.profile);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.budgets) setBudgets(parsed.budgets);
        if (parsed.savingsGoals) setSavingsGoals(parsed.savingsGoals);
        if (parsed.bills) setBills(parsed.bills);
        if (parsed.currency) setCurrencyState(parsed.currency);
      } catch (e) {
        console.warn('Failed parsing local storage state', e);
      }
    }
  }, []);

  // Save to LocalStorage and server on updates
  useEffect(() => {
    const stateToSave = {
      profile,
      transactions,
      budgets,
      savingsGoals,
      bills,
      currency,
      mode,
    };
    try {
      localStorage.setItem(`finagent_state_${mode}`, JSON.stringify(stateToSave));
      localStorage.setItem('finagent_mode', mode);

      // Async sync with server database
      fetch('/api/user/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id, data: stateToSave }),
      }).catch(() => {
        // silent fallback to offline local storage
      });
    } catch (e) {
      console.warn('Local save failed', e);
    }
  }, [profile, transactions, budgets, savingsGoals, bills, currency, mode]);

  // Switch User Profile (Student vs Professional demo profiles)
  const switchUser = useCallback((targetMode: 'student' | 'professional') => {
    setModeState(targetMode);
    if (targetMode === 'student') {
      setProfile(STUDENT_PROFILE);
      setTransactions(STUDENT_TRANSACTIONS);
      setBudgets(STUDENT_BUDGETS);
      setSavingsGoals(STUDENT_SAVINGS_GOALS);
      setBills(STUDENT_BILLS);
    } else {
      setProfile(PROFESSIONAL_PROFILE);
      setTransactions(PROFESSIONAL_TRANSACTIONS);
      setBudgets(PROFESSIONAL_BUDGETS);
      setSavingsGoals(PROFESSIONAL_SAVINGS_GOALS);
      setBills(PROFESSIONAL_BILLS);
    }

    setAgentWorkflow((prev) => ({
      currentStage: 'idle',
      lastRunTimestamp: new Date().toLocaleTimeString(),
      logs: [
        {
          id: `log_switch_${Date.now()}`,
          stage: 'Context Switch',
          message: `Switched context to ${targetMode === 'student' ? 'Student Mode (Alex Chen)' : 'Professional Mode (Sarah Jenkins)'}. Category schemas and financial bounds re-anchored.`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'info',
        },
        ...prev.logs.slice(0, 15),
      ],
    }));
  }, []);

  const setMode = useCallback((newMode: AppMode) => {
    switchUser(newMode);
  }, [switchUser]);

  const setCurrency = useCallback((curr: string) => {
    setCurrencyState(curr);
    setProfile((p) => ({ ...p, currency: curr }));
  }, []);

  // Computed Financial Metrics
  const totalIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  const totalExpenses = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  const remainingBalance = useMemo(() => {
    return Math.max(0, totalIncome - totalExpenses);
  }, [totalIncome, totalExpenses]);

  const monthlySavings = useMemo(() => {
    return Math.max(0, totalIncome - totalExpenses);
  }, [totalIncome, totalExpenses]);

  const savingsRate = useMemo(() => {
    return totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;
  }, [totalIncome, totalExpenses]);

  const dailyAllowance = useMemo(() => {
    const daysRemaining = getDaysRemainingInMonth();
    return Number((remainingBalance / daysRemaining).toFixed(2));
  }, [remainingBalance]);

  // Category spending breakdown with colors
  const categorySpending = useMemo(() => {
    const colorPalette = [
      '#3b82f6', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6',
      '#06b6d4', '#14b8a6', '#f97316', '#6366f1', '#e11d48'
    ];
    const catMap = new Map<string, { amount: number; count: number }>();

    for (const t of transactions) {
      if (t.type === 'expense') {
        const existing = catMap.get(t.category) || { amount: 0, count: 0 };
        catMap.set(t.category, {
          amount: existing.amount + Number(t.amount || 0),
          count: existing.count + 1,
        });
      }
    }

    const totalExp = totalExpenses > 0 ? totalExpenses : 1;
    let idx = 0;
    return Array.from(catMap.entries())
      .map(([cat, data]) => {
        const percentage = Math.round((data.amount / totalExp) * 100);
        const color = colorPalette[idx % colorPalette.length];
        idx++;
        return {
          category: cat,
          amount: data.amount,
          percentage,
          count: data.count,
          color,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, totalExpenses]);

  // Overspending alerts
  const overspendingAlerts = useMemo(() => {
    const alerts: { id: string; category: string; spent: number; limit: number; percent: number; status: 'warning' | 'danger' }[] = [];
    for (const b of syncedBudgets) {
      if (b.monthlyLimit <= 0) continue;
      const percent = Math.round((b.spent / b.monthlyLimit) * 100);
      if (percent >= 100) {
        alerts.push({
          id: `alert_${b.id}`,
          category: b.category,
          spent: b.spent,
          limit: b.monthlyLimit,
          percent,
          status: 'danger',
        });
      } else if (percent >= (b.alertThresholdPercent || 80)) {
        alerts.push({
          id: `alert_${b.id}`,
          category: b.category,
          spent: b.spent,
          limit: b.monthlyLimit,
          percent,
          status: 'warning',
        });
      }
    }
    return alerts;
  }, [syncedBudgets]);

  // Upcoming bills in next 7 days
  const upcomingBillsCount = useMemo(() => {
    const now = new Date();
    const in7Days = new Date();
    in7Days.setDate(now.getDate() + 7);

    return bills.filter((b) => {
      if (b.isPaid) return false;
      const due = new Date(b.dueDate);
      return due >= now && due <= in7Days;
    }).length;
  }, [bills]);

  // AI Categorize helper
  const aiCategorizeTransaction = useCallback(
    async (desc: string, amount: number, paymentMethod: PaymentMethod) => {
      try {
        const res = await fetch('/api/agent/categorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: desc,
            amount,
            paymentMethod,
            mode,
          }),
        });
        const data = await res.json();
        return {
          category: data.category || (mode === 'student' ? 'Mess & Food' : 'Groceries & Supplies'),
          tags: data.tags || ['general'],
          isRecurring: Boolean(data.isRecurring),
          confidence: data.confidence || 0.9,
          explanation: data.explanation || 'AI analyzed spending pattern.',
        };
      } catch (err) {
        return {
          category: mode === 'student' ? 'Mess & Food' : 'Groceries & Supplies',
          tags: ['offline'],
          isRecurring: false,
          confidence: 0.85,
          explanation: 'Categorized via offline rule fallback.',
        };
      }
    },
    [mode]
  );

  // Add Transaction
  const addTransaction = useCallback(
    async (txData: Omit<Transaction, 'id'>) => {
      const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newTx: Transaction = {
        id,
        ...txData,
      };

      setTransactions((prev) => [newTx, ...prev]);

      // Add to agent logs
      setAgentWorkflow((prev) => ({
        ...prev,
        lastRunTimestamp: new Date().toLocaleTimeString(),
        logs: [
          {
            id: `log_add_${id}`,
            stage: 'Data Ingestion',
            message: `Ingested ${newTx.type === 'expense' ? 'expense' : 'income'} of ${currency}${newTx.amount} for "${newTx.description}" under [${newTx.category}].`,
            timestamp: new Date().toLocaleTimeString(),
            type: newTx.type === 'expense' ? 'info' : 'success',
          },
          ...prev.logs.slice(0, 20),
        ],
      }));

      return newTx;
    },
    [currency]
  );

  // Delete Transaction
  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Batch categorize existing transactions
  const batchCategorizeTransactions = useCallback(async () => {
    setIsAgentRunning(true);
    let updatedCount = 0;
    const updated = await Promise.all(
      transactions.map(async (t) => {
        if (!t.aiCategorized) {
          const res = await aiCategorizeTransaction(t.description, t.amount, t.paymentMethod);
          updatedCount++;
          return {
            ...t,
            category: res.category,
            tags: Array.from(new Set([...t.tags, ...res.tags])),
            aiCategorized: true,
            aiConfidence: res.confidence,
          };
        }
        return t;
      })
    );
    setTransactions(updated);
    setIsAgentRunning(false);
    return updatedCount;
  }, [transactions, aiCategorizeTransaction]);

  // Update budget limit
  const updateBudgetLimit = useCallback((id: string, limit: number) => {
    setBudgets((prev) =>
      prev.map((b) => (b.id === id ? { ...b, monthlyLimit: Math.max(1, limit) } : b))
    );
  }, []);

  // Apply full AI budget plan
  const applyAIBudgetPlan = useCallback(
    (newBudgets: { category: string; limit: number; color?: string; icon?: string }[]) => {
      const mapped: BudgetCategory[] = newBudgets.map((nb, i) => {
        const existing = budgets.find((b) => b.category.toLowerCase() === nb.category.toLowerCase());
        return {
          id: existing ? existing.id : `b_ai_${i}_${Date.now()}`,
          category: nb.category,
          monthlyLimit: nb.limit,
          spent: existing ? existing.spent : 0,
          color: nb.color || existing?.color || '#3b82f6',
          icon: nb.icon || existing?.icon || 'PieChart',
          alertThresholdPercent: 80,
        };
      });

      setBudgets(mapped);

      setAgentWorkflow((prev) => ({
        ...prev,
        lastRunTimestamp: new Date().toLocaleTimeString(),
        logs: [
          {
            id: `log_bplan_${Date.now()}`,
            stage: 'Policy Rebalance',
            message: `Applied full AI Budget Plan across ${newBudgets.length} spending categories.`,
            timestamp: new Date().toLocaleTimeString(),
            type: 'success',
          },
          ...prev.logs.slice(0, 20),
        ],
      }));
    },
    [budgets]
  );

  // Add custom budget category
  const addBudgetCategory = useCallback((category: string, monthlyLimit: number, color?: string, icon?: string) => {
    const newCategory: BudgetCategory = {
      id: `b_custom_${Date.now()}`,
      category,
      monthlyLimit,
      spent: 0,
      color: color || '#10b981',
      icon: icon || 'Tag',
      alertThresholdPercent: 80,
    };
    setBudgets((prev) => [...prev, newCategory]);
  }, []);

  // Add Savings Goal
  const addSavingsGoal = useCallback(
    async (goalData: Omit<SavingsGoal, 'id' | 'suggestedMonthlySaving'>) => {
      // Calculate suggested monthly saving
      const now = new Date();
      const targetDate = new Date(goalData.targetDate);
      const months = Math.max(1, Math.round((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.4)));
      const suggested = Math.round(Math.max(0, goalData.targetAmount - goalData.currentAmount) / months);

      const newGoal: SavingsGoal = {
        id: `goal_${Date.now()}`,
        ...goalData,
        suggestedMonthlySaving: suggested,
        feasibilityScore: suggested <= remainingBalance * 0.7 ? 'High' : 'Moderate',
        aiAdvice: `Saving ${currency}${suggested}/month over ${months} months will achieve this milestone.`,
      };

      setSavingsGoals((prev) => [...prev, newGoal]);
    },
    [currency, remainingBalance]
  );

  // Deposit to Goal
  const depositToGoal = useCallback((id: string, amount: number) => {
    setSavingsGoals((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const updatedCurrent = Math.min(g.targetAmount, g.currentAmount + amount);
          return { ...g, currentAmount: updatedCurrent };
        }
        return g;
      })
    );
  }, []);

  // Delete Goal
  const deleteGoal = useCallback((id: string) => {
    setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  // Add Bill
  const addBill = useCallback((billData: Omit<BillReminder, 'id' | 'isPaid'>) => {
    const newBill: BillReminder = {
      id: `bill_${Date.now()}`,
      ...billData,
      isPaid: false,
    };
    setBills((prev) => [...prev, newBill]);
  }, []);

  // Toggle Bill Paid
  const toggleBillPaid = useCallback(
    (id: string, autoRecordExpense: boolean = true) => {
      setBills((prev) =>
        prev.map((b) => {
          if (b.id === id) {
            const willBePaid = !b.isPaid;
            if (willBePaid && autoRecordExpense) {
              // Log transaction automatically
              addTransaction({
                type: 'expense',
                amount: b.amount,
                date: new Date().toISOString().split('T')[0],
                category: b.category,
                description: `Bill Payment: ${b.title}`,
                paymentMethod: 'Net Banking',
                tags: ['bill-payment', 'auto-logged'],
                aiCategorized: true,
                aiConfidence: 0.99,
              });
            }
            return { ...b, isPaid: willBePaid };
          }
          return b;
        })
      );
    },
    [addTransaction]
  );

  // Delete Bill
  const deleteBill = useCallback((id: string) => {
    setBills((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // Run full Agent Cycle (Demonstrates 5-stage agentic workflow)
  const runAgentCycle = useCallback(async () => {
    setIsAgentRunning(true);

    const stages: AgentWorkflowState['currentStage'][] = [
      'collecting',
      'analyzing',
      'monitoring',
      'recommending',
      'updating',
    ];

    const stageDescriptions = [
      `Stage 1: Normalized ${transactions.length} transactions and parsed payment vectors.`,
      `Stage 2: Pattern analysis detected top spending anchor in "${categorySpending[0]?.category || 'Housing'}" (${categorySpending[0]?.percentage || 0}%).`,
      `Stage 3: Budget watchdog flagged ${overspendingAlerts.length} overspending alerts.`,
      `Stage 4: Formulated personalized micro-savings recommendation of ${currency}${Math.round(remainingBalance * 0.15)}/mo.`,
      `Stage 5: Live model weights updated with latest run metrics. Agent memory refreshed.`,
    ];

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      setAgentWorkflow((prev) => ({
        currentStage: stage,
        lastRunTimestamp: new Date().toLocaleTimeString(),
        logs: [
          {
            id: `run_cycle_${Date.now()}_${i}`,
            stage: stage.toUpperCase(),
            message: stageDescriptions[i],
            timestamp: new Date().toLocaleTimeString(),
            type: i === 2 && overspendingAlerts.length > 0 ? 'warning' : 'info',
          },
          ...prev.logs.slice(0, 25),
        ],
      }));
      // Smooth progress visual delay
      await new Promise((r) => setTimeout(r, 450));
    }

    setAgentWorkflow((prev) => ({
      ...prev,
      currentStage: 'idle',
      lastRunTimestamp: new Date().toLocaleTimeString(),
    }));
    setIsAgentRunning(false);
  }, [transactions.length, categorySpending, overspendingAlerts.length, currency, remainingBalance]);

  return (
    <FinanceContext.Provider
      value={{
        profile,
        setProfile,
        mode,
        setMode,
        currency,
        setCurrency,
        switchUser,

        transactions,
        addTransaction,
        deleteTransaction,
        batchCategorizeTransactions,

        budgets: syncedBudgets,
        updateBudgetLimit,
        applyAIBudgetPlan,
        addBudgetCategory,

        savingsGoals,
        addSavingsGoal,
        depositToGoal,
        deleteGoal,

        bills,
        addBill,
        toggleBillPaid,
        deleteBill,

        totalIncome,
        totalExpenses,
        remainingBalance,
        monthlySavings,
        savingsRate,
        dailyAllowance,
        categorySpending,
        overspendingAlerts,
        upcomingBillsCount,

        agentWorkflow,
        runAgentCycle,
        aiCategorizeTransaction,
        isAgentRunning,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
