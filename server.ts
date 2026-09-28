import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = parseInt(process.env.PORT || '3000', 10);

// Initialize Gemini SDK with User-Agent as required by AI Studio guidelines
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Ensure persistent data directory exists
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.warn('Could not create data directory, using memory store:', err);
  }
}

// In-memory cache for user data as fallback or fast access
const memoryStore = new Map<string, any>();

// Helper to save user data
function saveUserData(userId: string, data: any) {
  memoryStore.set(userId, data);
  try {
    const filePath = path.join(DATA_DIR, `user_${userId.replace(/[^a-zA-Z0-9_-]/g, '')}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.warn(`Failed writing to disk for user ${userId}:`, e);
  }
}

// Helper to load user data
function loadUserData(userId: string) {
  if (memoryStore.has(userId)) {
    return memoryStore.get(userId);
  }
  try {
    const filePath = path.join(DATA_DIR, `user_${userId.replace(/[^a-zA-Z0-9_-]/g, '')}.json`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      memoryStore.set(userId, parsed);
      return parsed;
    }
  } catch (e) {
    console.warn(`Failed reading from disk for user ${userId}:`, e);
  }
  return null;
}

// -------------------------------------------------------------
// Fallback smart rule categorization engine
// -------------------------------------------------------------
function fallbackCategorize(description: string, mode: 'student' | 'professional', amount: number) {
  const d = description.toLowerCase();

  if (mode === 'student') {
    if (d.includes('parent') || d.includes('allowance') || d.includes('pocket') || d.includes('transfer from mom') || d.includes('transfer from dad')) {
      return { category: 'Pocket Money', tags: ['family', 'allowance'], isRecurring: true, confidence: 0.98, type: 'income' };
    }
    if (d.includes('tutor') || d.includes('stipend') || d.includes('intern') || d.includes('part-time') || d.includes('fellowship')) {
      return { category: 'Part-time Tutoring', tags: ['stipend', 'income'], isRecurring: false, confidence: 0.94, type: 'income' };
    }
    if (d.includes('hostel') || d.includes('dorm') || d.includes('room rent') || d.includes('pg rent')) {
      return { category: 'Hostel & Room Rent', tags: ['housing', 'fixed'], isRecurring: true, confidence: 0.97, type: 'expense' };
    }
    if (d.includes('mess') || d.includes('canteen') || d.includes('dining hall') || d.includes('maggi') || d.includes('meal')) {
      return { category: 'Mess & Food', tags: ['mess', 'food'], isRecurring: false, confidence: 0.95, type: 'expense' };
    }
    if (d.includes('book') || d.includes('print') || d.includes('photocopy') || d.includes('stationary') || d.includes('notes') || d.includes('lab')) {
      return { category: 'Books & Campus Prints', tags: ['academics', 'study'], isRecurring: false, confidence: 0.93, type: 'expense' };
    }
    if (d.includes('metro') || d.includes('bus') || d.includes('subway') || d.includes('train') || d.includes('auto') || d.includes('bike') || d.includes('transit')) {
      return { category: 'Travel & Metro', tags: ['commute', 'transit'], isRecurring: false, confidence: 0.94, type: 'expense' };
    }
    if (d.includes('pizza') || d.includes('coffee') || d.includes('cafe') || d.includes('boba') || d.includes('hangout') || d.includes('movie') || d.includes('snack')) {
      return { category: 'Hangouts & Snacks', tags: ['treats', 'social'], isRecurring: false, confidence: 0.91, type: 'expense' };
    }
    if (d.includes('spotify') || d.includes('recharge') || d.includes('sim') || d.includes('wifi') || d.includes('mobile')) {
      return { category: 'Mobile & Subscriptions', tags: ['utility', 'mobile'], isRecurring: true, confidence: 0.92, type: 'expense' };
    }
    return { category: 'Other Expenses', tags: ['student'], isRecurring: false, confidence: 0.85, type: amount > 0 ? 'expense' : 'income' };
  } else {
    // Professional
    if (d.includes('salary') || d.includes('payroll') || d.includes('direct deposit')) {
      return { category: 'Monthly Salary', tags: ['salary', 'income'], isRecurring: true, confidence: 0.99, type: 'income' };
    }
    if (d.includes('freelance') || d.includes('client') || d.includes('consulting') || d.includes('invoice')) {
      return { category: 'Freelance & Consulting', tags: ['freelance', 'income'], isRecurring: false, confidence: 0.95, type: 'income' };
    }
    if (d.includes('rent') || d.includes('mortgage') || d.includes('lease') || d.includes('apartment')) {
      return { category: 'Rent & Housing', tags: ['rent', 'fixed'], isRecurring: true, confidence: 0.98, type: 'expense' };
    }
    if (d.includes('grocery') || d.includes('whole foods') || d.includes('trader') || d.includes('supermarket') || d.includes('walmart')) {
      return { category: 'Groceries & Supplies', tags: ['groceries', 'household'], isRecurring: false, confidence: 0.96, type: 'expense' };
    }
    if (d.includes('restaurant') || d.includes('cafe') || d.includes('dinner') || d.includes('bistro') || d.includes('uber eats') || d.includes('doordash')) {
      return { category: 'Dining & Cafes', tags: ['dining', 'food'], isRecurring: false, confidence: 0.94, type: 'expense' };
    }
    if (d.includes('electric') || d.includes('utility') || d.includes('water') || d.includes('internet') || d.includes('wifi') || d.includes('gas')) {
      return { category: 'Utilities & Internet', tags: ['utilities', 'bills'], isRecurring: true, confidence: 0.95, type: 'expense' };
    }
    if (d.includes('fuel') || d.includes('gas station') || d.includes('ev') || d.includes('charging') || d.includes('parking') || d.includes('uber') || d.includes('transit')) {
      return { category: 'Transportation & Fuel', tags: ['commute', 'transport'], isRecurring: false, confidence: 0.93, type: 'expense' };
    }
    if (d.includes('gym') || d.includes('doctor') || d.includes('pharmacy') || d.includes('wellness') || d.includes('dental')) {
      return { category: 'Health & Wellness', tags: ['health', 'fitness'], isRecurring: false, confidence: 0.92, type: 'expense' };
    }
    if (d.includes('concert') || d.includes('game') || d.includes('movie') || d.includes('netflix') || d.includes('entertainment')) {
      return { category: 'Entertainment & Leisure', tags: ['leisure', 'entertainment'], isRecurring: false, confidence: 0.92, type: 'expense' };
    }
    return { category: 'Miscellaneous', tags: ['general'], isRecurring: false, confidence: 0.85, type: 'expense' };
  }
}

// -------------------------------------------------------------
// API Routes
// -------------------------------------------------------------

// User Data Sync (Database persistence)
app.get('/api/user/data', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'default';
  const data = loadUserData(userId);
  if (!data) {
    return res.json({ success: false, message: 'No stored data for this user ID' });
  }
  return res.json({ success: true, data });
});

app.post('/api/user/data', (req: Request, res: Response) => {
  const { userId, data } = req.body;
  if (!userId || !data) {
    return res.status(400).json({ success: false, error: 'Missing userId or data' });
  }
  saveUserData(userId, data);
  return res.json({ success: true, message: 'Saved successfully' });
});

// AI Categorization Endpoint
app.post('/api/agent/categorize', async (req: Request, res: Response) => {
  try {
    const { description, amount, paymentMethod, mode } = req.body;
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const fallback = fallbackCategorize(description, mode || 'student', Number(amount) || 0);

    if (!ai) {
      return res.json({
        ...fallback,
        source: 'rule_engine',
        explanation: 'Categorized via FinAgent heuristic pattern matching.',
      });
    }

    const categoriesList = mode === 'student'
      ? 'Pocket Money, Part-time Tutoring, College & Tuition Fees, Hostel & Room Rent, Mess & Food, Books & Campus Prints, Travel & Metro, Hangouts & Snacks, Mobile & Subscriptions, Tech & Gadgets, Other'
      : 'Monthly Salary, Freelance & Consulting, Investments & Dividends, Rent & Housing, Groceries & Supplies, Dining & Cafes, Utilities & Internet, Transportation & Fuel, Entertainment & Leisure, Health & Wellness, Shopping & Personal Care, Other';

    const prompt = `You are FinAgent, an AI personal finance agent. Categorize this financial transaction accurately.
Transaction description: "${description}"
Amount: ${amount || 'unknown'}
Payment Method: ${paymentMethod || 'standard'}
User Mode: ${mode || 'student'}

Available Categories: ${categoriesList}

Respond strictly in valid JSON with:
{
  "category": "exact best category from the list",
  "tags": ["tag1", "tag2"],
  "isRecurring": boolean,
  "confidence": number between 0.70 and 0.99,
  "type": "income" or "expense",
  "explanation": "short 1-sentence reasoning"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json({
      category: parsed.category || fallback.category,
      tags: Array.isArray(parsed.tags) ? parsed.tags : fallback.tags,
      isRecurring: Boolean(parsed.isRecurring ?? fallback.isRecurring),
      confidence: parsed.confidence || fallback.confidence,
      type: parsed.type || fallback.type,
      explanation: parsed.explanation || 'AI analyzed spending description context.',
      source: 'gemini_3.8_flash',
    });
  } catch (error: any) {
    console.error('Categorize error:', error);
    const fallback = fallbackCategorize(req.body.description || '', req.body.mode || 'student', req.body.amount || 0);
    return res.json({
      ...fallback,
      source: 'rule_engine_fallback',
      explanation: 'Analyzed using FinAgent smart rules.',
    });
  }
});

// AI Budget Planner Endpoint
app.post('/api/agent/budget-planner', async (req: Request, res: Response) => {
  try {
    const { monthlyIncome, mode, goals, existingObligations, targetSavingsRate } = req.body;
    const income = Number(monthlyIncome) || 1000;
    const savingsPercent = Number(targetSavingsRate) || 20;

    if (!ai) {
      // Deterministic calculation
      const targetSavings = Math.round(income * (savingsPercent / 100));
      const remainingForExpenses = income - targetSavings;

      const studentSplits = [
        { category: 'Hostel & Room Rent', limit: Math.round(remainingForExpenses * 0.38), color: '#3b82f6', icon: 'Home' },
        { category: 'Mess & Food', limit: Math.round(remainingForExpenses * 0.32), color: '#f59e0b', icon: 'Utensils' },
        { category: 'Hangouts & Snacks', limit: Math.round(remainingForExpenses * 0.12), color: '#ec4899', icon: 'Coffee' },
        { category: 'Travel & Metro', limit: Math.round(remainingForExpenses * 0.08), color: '#06b6d4', icon: 'Bus' },
        { category: 'Books & Campus Prints', limit: Math.round(remainingForExpenses * 0.06), color: '#8b5cf6', icon: 'BookOpen' },
        { category: 'Mobile & Subscriptions', limit: Math.round(remainingForExpenses * 0.04), color: '#10b981', icon: 'Smartphone' },
      ];

      const proSplits = [
        { category: 'Rent & Housing', limit: Math.round(remainingForExpenses * 0.40), color: '#3b82f6', icon: 'Home' },
        { category: 'Groceries & Supplies', limit: Math.round(remainingForExpenses * 0.18), color: '#10b981', icon: 'ShoppingBag' },
        { category: 'Dining & Cafes', limit: Math.round(remainingForExpenses * 0.12), color: '#f59e0b', icon: 'Utensils' },
        { category: 'Transportation & Fuel', limit: Math.round(remainingForExpenses * 0.10), color: '#8b5cf6', icon: 'Car' },
        { category: 'Utilities & Internet', limit: Math.round(remainingForExpenses * 0.08), color: '#06b6d4', icon: 'Zap' },
        { category: 'Entertainment & Leisure', limit: Math.round(remainingForExpenses * 0.07), color: '#ec4899', icon: 'Film' },
        { category: 'Health & Wellness', limit: Math.round(remainingForExpenses * 0.05), color: '#14b8a6', icon: 'Activity' },
      ];

      return res.json({
        success: true,
        recommendedSavings: targetSavings,
        categories: mode === 'student' ? studentSplits : proSplits,
        agentRationale: `Based on your monthly income of $${income} and a ${savingsPercent}% savings objective, the budget is split following an optimized needs-vs-wants ratio.`,
        keyTips: [
          'Track discretionary hangouts and dining to prevent stealth budget depletion.',
          'Automate your target savings right on the day of deposit.',
          'Review category balances weekly with FinAgent.'
        ],
      });
    }

    const prompt = `You are FinAgent, an expert personal finance AI agent. Create a personalized monthly budget plan.
User Profile:
- Monthly Income: $${income}
- User Mode: ${mode || 'student'}
- User Financial Goals: "${goals || 'Save consistently and avoid overspending'}"
- Stated Fixed Obligations: "${existingObligations || 'Standard housing/rent and essentials'}"
- Desired Target Savings Rate: ${savingsPercent}%

Generate a comprehensive budget plan matching the exact income.
Respond strictly in JSON:
{
  "recommendedSavings": number,
  "savingsPercentage": number,
  "categories": [
    {
      "category": string,
      "limit": number,
      "color": string (hex color like "#3b82f6"),
      "icon": string (e.g. "Home", "Utensils", "Coffee", "Bus", "BookOpen", "Smartphone", "ShoppingBag", "Zap", "Car", "Film", "Activity"),
      "reasoning": string
    }
  ],
  "agentRationale": string (2-3 concise sentences detailing strategy),
  "keyTips": [string, string, string]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json({ success: true, ...parsed });
  } catch (error: any) {
    console.error('Budget planner error:', error);
    return res.status(500).json({ error: 'Failed to generate budget plan' });
  }
});

// AI Savings Goal Advice
app.post('/api/agent/goal-advice', async (req: Request, res: Response) => {
  try {
    const { title, targetAmount, currentAmount, targetDate, monthlyIncome, currentMonthlyExpenses, mode } = req.body;
    const target = Number(targetAmount) || 1000;
    const current = Number(currentAmount) || 0;
    const remainingToSave = Math.max(0, target - current);

    // Calculate months remaining
    const now = new Date();
    const targetD = targetDate ? new Date(targetDate) : new Date(now.getFullYear(), now.getMonth() + 6, 1);
    const months = Math.max(1, Math.round((targetD.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.4)));
    const calculatedMonthly = Math.round(remainingToSave / months);

    if (!ai) {
      const income = Number(monthlyIncome) || 1000;
      const expense = Number(currentMonthlyExpenses) || 600;
      const surplus = Math.max(50, income - expense);
      const feasibility = calculatedMonthly <= surplus * 0.6 ? 'High' : calculatedMonthly <= surplus ? 'Moderate' : 'Challenging';

      return res.json({
        success: true,
        suggestedMonthlySaving: calculatedMonthly,
        monthsRemaining: months,
        feasibilityScore: feasibility,
        estimatedCompletionDate: targetD.toISOString().split('T')[0],
        aiAdvice: `Saving $${calculatedMonthly}/month over the next ${months} months will comfortably reach your $${target} target. Trimming non-essential discretionary expenses by 10-15% will easily fund this gap.`,
        actionSteps: [
          `Set aside $${calculatedMonthly} at the start of each month.`,
          'Automate deposit into a separate savings bucket.',
          'Deposit micro-windfalls or freelance bonuses directly to this goal.'
        ],
      });
    }

    const prompt = `You are FinAgent. Analyze this savings goal and provide realistic, actionable advice.
Goal: "${title}"
Target Amount: $${target}
Current Saved: $${current}
Target Date: ${targetD.toISOString().split('T')[0]} (approx ${months} months)
User Monthly Income: $${monthlyIncome || 1000}
User Current Monthly Expenses: $${currentMonthlyExpenses || 700}
Mode: ${mode || 'student'}

Respond in JSON:
{
  "suggestedMonthlySaving": number,
  "monthsRemaining": number,
  "feasibilityScore": "High" | "Moderate" | "Challenging",
  "aiAdvice": string (2-3 sentences),
  "actionSteps": [string, string, string]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json({ success: true, ...parsed });
  } catch (error: any) {
    console.error('Goal advice error:', error);
    return res.status(500).json({ error: 'Failed to calculate goal advice' });
  }
});

// AI Monthly Financial Report Endpoint
app.post('/api/agent/generate-report', async (req: Request, res: Response) => {
  try {
    const { profile, transactions, budgets, goals } = req.body;

    const income = (transactions || [])
      .filter((t: any) => t.type === 'income')
      .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
    const expense = (transactions || [])
      .filter((t: any) => t.type === 'expense')
      .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
    const netSavings = income - expense;
    const savingsRate = income > 0 ? Math.round((netSavings / income) * 100) : 0;

    // Group expenses by category
    const catMap = new Map<string, number>();
    for (const t of transactions || []) {
      if (t.type === 'expense') {
        catMap.set(t.category, (catMap.get(t.category) || 0) + Number(t.amount || 0));
      }
    }
    const majorCategories = Array.from(catMap.entries())
      .map(([cat, amt]) => ({
        category: cat,
        amount: amt,
        percentage: expense > 0 ? Math.round((amt / expense) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    if (!ai) {
      const score = Math.min(100, Math.max(30, 60 + Math.round(savingsRate * 0.4)));
      return res.json({
        success: true,
        month: 'September',
        year: 2026,
        generatedAt: new Date().toISOString(),
        financialHealthScore: score,
        scoreLabel: score >= 80 ? 'Excellent' : score >= 65 ? 'Healthy' : 'Needs Attention',
        totalIncome: income,
        totalExpenses: expense,
        netSavings,
        savingsRate,
        majorCategories,
        unusualSpending: [
          {
            item: majorCategories[0]?.category || 'Dining',
            amount: majorCategories[0]?.amount || 0,
            category: majorCategories[0]?.category || 'Food',
            reason: 'Consolidated majority of monthly spending; monitor frequent discretionary taps.',
            severity: 'medium',
          }
        ],
        personalizedSuggestions: [
          `Your net monthly savings is $${netSavings.toFixed(2)} (${savingsRate}% rate). Maintaining this preserves your safety cushion.`,
          `Top expense driver was "${majorCategories[0]?.category || 'Housing'}" totaling $${majorCategories[0]?.amount || 0}.`,
          'Review recurring subscriptions and bills before month-end to avoid surprise late fees.'
        ],
        agentSummary: `FinAgent analyzed ${transactions?.length || 0} transactions for this billing period. Cash flow remains positive with a ${savingsRate}% net savings margin.`,
        projectedAnnualSavings: Math.max(0, netSavings * 12),
      });
    }

    const prompt = `You are FinAgent. Generate a comprehensive monthly financial report.
Financial Context:
- User: ${profile?.name || 'User'} (${profile?.mode || 'student'} mode)
- Total Income: $${income}
- Total Expenses: $${expense}
- Net Savings: $${netSavings} (${savingsRate}%)
- Major Categories: ${JSON.stringify(majorCategories)}
- Recent Transactions Sample: ${JSON.stringify((transactions || []).slice(-10))}
- Active Savings Goals: ${JSON.stringify(goals || [])}
- Active Budgets: ${JSON.stringify(budgets || [])}

Provide an insightful, realistic financial assessment. Clearly identify unusual spending or overspending risks and actionable savings suggestions.

Respond strictly in JSON format:
{
  "financialHealthScore": number (0 to 100),
  "scoreLabel": "Excellent" | "Healthy" | "Fair" | "Needs Attention",
  "unusualSpending": [
    {
      "item": string,
      "amount": number,
      "category": string,
      "reason": string,
      "severity": "low" | "medium" | "high"
    }
  ],
  "personalizedSuggestions": [string, string, string, string],
  "agentSummary": string (3-4 crisp sentences summarizing the period),
  "projectedAnnualSavings": number
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json({
      success: true,
      month: 'September',
      year: 2026,
      generatedAt: new Date().toISOString(),
      financialHealthScore: parsed.financialHealthScore || 78,
      scoreLabel: parsed.scoreLabel || 'Healthy',
      totalIncome: income,
      totalExpenses: expense,
      netSavings,
      savingsRate,
      majorCategories,
      unusualSpending: parsed.unusualSpending || [],
      personalizedSuggestions: parsed.personalizedSuggestions || [
        'Automate your savings transfer immediately after receiving income.',
        'Cap weekend discretionary dining by cooking in batches.'
      ],
      agentSummary: parsed.agentSummary || `FinAgent processed all accounts. Net savings came in at $${netSavings}.`,
      projectedAnnualSavings: parsed.projectedAnnualSavings || Math.max(0, netSavings * 12),
    });
  } catch (error: any) {
    console.error('Report error:', error);
    return res.status(500).json({ error: 'Failed to generate financial report' });
  }
});

// AI Finance Chatbot Endpoint
app.post('/api/agent/chat', async (req: Request, res: Response) => {
  try {
    const { message, history, context } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const {
      profile,
      totalIncome = 0,
      totalExpenses = 0,
      netBalance = 0,
      monthlySavings = 0,
      topCategories = [],
      recentTransactions = [],
      budgets = [],
      savingsGoals = [],
      upcomingBills = [],
    } = context || {};

    // Standard pre-computed figures for fast queries
    const foodExpenses = (recentTransactions || [])
      .filter((t: any) => t.type === 'expense' && (t.category?.toLowerCase().includes('food') || t.category?.toLowerCase().includes('mess') || t.category?.toLowerCase().includes('dining') || t.category?.toLowerCase().includes('snack')))
      .reduce((s: number, t: any) => s + Number(t.amount || 0), 0);

    const topCategoryStr = topCategories && topCategories[0]
      ? `${topCategories[0].category} ($${topCategories[0].amount.toFixed(2)}, ${topCategories[0].percentage}%)`
      : 'Housing/Food';

    if (!ai) {
      // Deterministic intelligent finance chatbot fallback
      const q = message.toLowerCase();
      let answer = '';
      let metricHighlights: any[] = [];
      let suggestedQuestions = [
        'Where am I spending the most?',
        'How much did I spend on food this month?',
        'How can I save more money?',
        'What bills are due this week?'
      ];

      if (q.includes('where am i spending the most') || q.includes('top expense') || q.includes('highest spending')) {
        answer = `According to your tracked transactions, your highest spending category this month is **${topCategoryStr}**. Total expenses stand at **$${totalExpenses.toFixed(2)}**, with the top category consuming a notable portion of your budget.`;
        metricHighlights = [
          { label: 'Top Category', value: topCategories[0]?.category || 'Dining', status: 'warning' },
          { label: 'Top Spend', value: `$${topCategories[0]?.amount?.toFixed(2) || '0.00'}`, status: 'warning' },
          { label: 'Share of Total', value: `${topCategories[0]?.percentage || 0}%`, status: 'neutral' }
        ];
      } else if (q.includes('food') || q.includes('dining') || q.includes('mess') || q.includes('snacks')) {
        answer = `You have spent approximately **$${foodExpenses.toFixed(2)}** on food, dining, and snacks this month across your recorded transactions.`;
        metricHighlights = [
          { label: 'Food Total', value: `$${foodExpenses.toFixed(2)}`, status: 'neutral' },
          { label: 'Total Expenses', value: `$${totalExpenses.toFixed(2)}`, status: 'neutral' }
        ];
      } else if (q.includes('save') || q.includes('how can i save') || q.includes('more money') || q.includes('reduce')) {
        const topDiscretionary = topCategories.find((c: any) => c.category.includes('Dining') || c.category.includes('Snacks') || c.category.includes('Hangouts') || c.category.includes('Entertainment'));
        const discName = topDiscretionary ? topDiscretionary.category : 'discretionary leisure';
        const discAmt = topDiscretionary ? topDiscretionary.amount : 120;
        answer = `Based on your live cash flow, you currently have **$${netBalance.toFixed(2)}** in net monthly surplus (${profile?.monthlyIncome ? Math.round((netBalance / profile.monthlyIncome) * 100) : 0}% savings rate). To save an extra $50–$150/month:
1. **Trim ${discName}**: You spent $${discAmt.toFixed(2)} here; shaving 25% frees up ~$${Math.round(discAmt * 0.25)}.
2. **Review Recurring Bills**: You have ${upcomingBills?.length || 0} active recurring bills.
3. **Automate Goal Transfers**: Lock away your target savings right when income is deposited.`;
      } else if (q.includes('afford') || q.includes('can i buy') || q.includes('purchase')) {
        answer = `Your remaining net balance for this cycle is **$${netBalance.toFixed(2)}**. Any purchase above this amount would dip into your core savings or trigger an overspending alert. If it is an essential purchase, check if it can be deferred or split across upcoming pay cycles!`;
      } else {
        answer = `I analyzed your active financial data:
- **Total Income**: $${totalIncome.toFixed(2)}
- **Total Expenses**: $${totalExpenses.toFixed(2)}
- **Remaining Balance**: $${netBalance.toFixed(2)}
- **Top Spending**: ${topCategoryStr}

You are in **${profile?.mode || 'student'} mode**. Feel free to ask about specific categories, how to reach your goals faster, or how to rebalance your budget!`;
      }

      return res.json({
        success: true,
        reply: answer,
        metricHighlights,
        suggestedQuestions,
      });
    }

    const systemInstruction = `You are FinAgent, an elite, friendly, and analytical personal finance AI agent.
You have real-time access to the user's actual financial records:
- Profile: ${profile?.name} (${profile?.mode} mode, currency: ${profile?.currency || '$'})
- Total Income: $${totalIncome.toFixed(2)}
- Total Expenses: $${totalExpenses.toFixed(2)}
- Net Remaining Balance: $${netBalance.toFixed(2)}
- Food & Dining Total: $${foodExpenses.toFixed(2)}
- Spending Categories: ${JSON.stringify(topCategories)}
- Active Category Budgets: ${JSON.stringify(budgets)}
- Savings Goals: ${JSON.stringify(savingsGoals)}
- Upcoming Bills: ${JSON.stringify(upcomingBills)}
- Recent Transactions: ${JSON.stringify(recentTransactions.slice(-8))}

Rules:
1. Always base answers on the actual user financial data provided. Quote exact numbers accurately.
2. If asked "Where am I spending the most?", calculate and cite the highest spending category with dollar amount and percentage.
3. If asked about food spending, cite the exact total spent on food/dining/mess.
4. Keep the tone encouraging, concise, and structured with bold highlights and bullet points.
5. In student mode, be mindful of tight budgets, pocket money, canteen/mess, metro, and textbook costs.
6. Clearly separate AI-generated estimates and suggestions from actual financial records, and do not present AI outputs as guaranteed financial advice.
7. Return a structured JSON response with:
   - "reply": string (markdown supported)
   - "metricHighlights": array of objects { "label": string, "value": string, "status": "positive" | "warning" | "neutral" } (0 to 3 items)
   - "suggestedQuestions": array of 3-4 natural follow-up prompt questions`;

    const chatContents = [
      {
        role: 'user',
        parts: [
          {
            text: `Conversation Context:\n${JSON.stringify((history || []).slice(-6))}\n\nCurrent Question: "${message}"`
          }
        ]
      }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: chatContents as any,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json({
      success: true,
      reply: parsed.reply || 'Here is an analysis of your financial data.',
      metricHighlights: parsed.metricHighlights || [],
      suggestedQuestions: parsed.suggestedQuestions || [
        'Where am I spending the most?',
        'How much did I spend on food this month?',
        'How can I save more money?',
        'Am I on track for my savings goals?'
      ],
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: 'Failed to answer financial query' });
  }
});

// AI Anomaly & Overspending Detection Endpoint
app.post('/api/agent/detect-anomalies', async (req: Request, res: Response) => {
  try {
    const { transactions, budgets } = req.body;
    const overspentBudgets = (budgets || []).filter((b: any) => b.spent >= b.monthlyLimit);
    const nearLimitBudgets = (budgets || []).filter(
      (b: any) => b.spent >= b.monthlyLimit * 0.8 && b.spent < b.monthlyLimit
    );

    const alerts = [];
    for (const b of overspentBudgets) {
      alerts.push({
        id: `alert_over_${b.id}`,
        type: 'danger',
        category: b.category,
        title: `Budget Exceeded: ${b.category}`,
        message: `You've spent $${b.spent} of your $${b.monthlyLimit} limit (${Math.round((b.spent / b.monthlyLimit) * 100)}%).`,
        action: 'Freeze discretionary spending in this category until next month.',
      });
    }

    for (const b of nearLimitBudgets) {
      alerts.push({
        id: `alert_near_${b.id}`,
        type: 'warning',
        category: b.category,
        title: `Approaching Limit: ${b.category}`,
        message: `You are at ${Math.round((b.spent / b.monthlyLimit) * 100)}% of your monthly limit ($${b.spent}/$${b.monthlyLimit}).`,
        action: `Remaining allowance is $${Math.max(0, b.monthlyLimit - b.spent)}.`,
      });
    }

    return res.json({
      success: true,
      alerts,
      overspentCount: overspentBudgets.length,
      warningCount: nearLimitBudgets.length,
    });
  } catch (e: any) {
    return res.status(500).json({ error: 'Failed to analyze anomalies' });
  }
});

// Vite Middleware for development
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FinAgent server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
