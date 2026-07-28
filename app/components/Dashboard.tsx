'use client';

import { useEffect, useState } from 'react';
import ExpensesTab from './ExpensesTab';
import InvestmentsTab from './InvestmentsTab';
import SettingsTab from './SettingsTab';

type Tab = 'expenses' | 'investments' | 'settings';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('expenses');
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 shadow-sm">
          <div className="px-6 py-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              💰 Controle Financeiro
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Gerencie despesas e investimentos você e sua namorada
            </p>
          </div>
        </header>

        {/* Tabs */}
        <nav className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('expenses')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'expenses'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                📊 Despesas
              </button>
              <button
                onClick={() => setActiveTab('investments')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'investments'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                📈 Investimentos
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                ⚙️ Configurações
              </button>
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="p-6">
          {activeTab === 'expenses' && <ExpensesTab users={users} />}
          {activeTab === 'investments' && <InvestmentsTab users={users} />}
          {activeTab === 'settings' && (
            <SettingsTab onUsersChange={loadUsers} />
          )}
        </main>
      </div>
    </div>
  );
}
