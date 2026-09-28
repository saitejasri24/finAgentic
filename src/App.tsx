/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinanceProvider } from './context/FinanceContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AddTransactionModal } from './components/AddTransactionModal';

// Views
import { DashboardView } from './components/views/DashboardView';
import { TransactionsView } from './components/views/TransactionsView';
import { BudgetPlannerView } from './components/views/BudgetPlannerView';
import { OverspendingView } from './components/views/OverspendingView';
import { SavingsGoalsView } from './components/views/SavingsGoalsView';
import { FinancialReportView } from './components/views/FinancialReportView';
import { BillsRemindersView } from './components/views/BillsRemindersView';
import { AIChatbotView } from './components/views/AIChatbotView';
import { AgentWorkflowView } from './components/views/AgentWorkflowView';

function FinAgentMain() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased">
      {/* Top Navbar */}
      <Navbar
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onNavigateToTab={(tabId) => setActiveTab(tabId)}
      />

      {/* Main Shell */}
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1720px] mx-auto overflow-hidden">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Content View Area */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onNavigateToTab={(tabId) => setActiveTab(tabId)}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView onOpenAddModal={() => setIsAddModalOpen(true)} />
          )}

          {activeTab === 'budget-planner' && <BudgetPlannerView />}

          {activeTab === 'overspending' && <OverspendingView />}

          {activeTab === 'savings-goals' && <SavingsGoalsView />}

          {activeTab === 'ai-report' && <FinancialReportView />}

          {activeTab === 'bills' && <BillsRemindersView />}

          {activeTab === 'chatbot' && <AIChatbotView />}

          {activeTab === 'agent-workflow' && <AgentWorkflowView />}
        </main>
      </div>

      {/* Global Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <FinAgentMain />
    </FinanceProvider>
  );
}
