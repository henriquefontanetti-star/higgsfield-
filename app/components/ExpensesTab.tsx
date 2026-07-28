'use client';

import { useEffect, useState } from 'react';

interface Expense {
  id: string;
  amount: number;
  title: string;
  date: string;
  user: { id: string; name: string; color: string };
  category: { id: string; name: string; icon: string };
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface User {
  id: string;
  name: string;
  color: string;
}

export default function ExpensesTab({ users }: { users: User[] }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    userId: users[0]?.id || '',
    categoryId: '',
  });

  useEffect(() => {
    loadCategories();
    loadExpenses();
  }, [month, year]);

  useEffect(() => {
    if (!formData.userId && users[0]?.id) {
      setFormData((prev) => ({ ...prev, userId: users[0].id }));
    }
  }, [users]);

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        setCategories(await res.json());
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/expenses?month=${month}&year=${year}`
      );
      if (res.ok) {
        setExpenses(await res.json());
      }
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.amount || !formData.categoryId) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        loadExpenses();
        setFormData({
          title: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          userId: users[0]?.id || '',
          categoryId: '',
        });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Erro ao adicionar despesa:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar?')) return;

    try {
      const res = await fetch(`/api/expenses?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadExpenses();
      }
    } catch (error) {
      console.error('Erro ao deletar despesa:', error);
    }
  };

  const totalByUser = users.map((user) => ({
    user,
    total: expenses
      .filter((e) => e.user.id === user.id)
      .reduce((sum, e) => sum + e.amount, 0),
  }));

  const grandTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Filtros e Ações */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 flex gap-4 items-end flex-wrap">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Mês
          </label>
          <input
            type="number"
            min="1"
            max="12"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Ano
          </label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white"
          />
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          {showForm ? '✕ Cancelar' : '+ Adicionar Despesa'}
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Nova Despesa
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Ex: Supermercado"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  De quem?
                </label>
                <select
                  value={formData.userId}
                  onChange={(e) =>
                    setFormData({ ...formData, userId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white"
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoria
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md font-medium transition-colors"
            >
              Salvar Despesa
            </button>
          </form>
        </div>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {totalByUser.map(({ user, total }) => (
          <div
            key={user.id}
            className="bg-white dark:bg-slate-800 rounded-lg shadow p-4"
            style={{
              borderLeft: `4px solid ${user.color}`,
            }}
          >
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Total de {user.name}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              R$ {total.toFixed(2)}
            </p>
          </div>
        ))}

        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow p-4 text-white">
          <p className="text-purple-100 text-sm">Total Geral</p>
          <p className="text-2xl font-bold">R$ {grandTotal.toFixed(2)}</p>
        </div>
      </div>

      {/* Lista de Despesas */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Despesas - {month}/{year}
          </h3>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            Carregando...
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            Nenhuma despesa registrada para este mês.
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-2xl">
                    {expense.category.icon}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {expense.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {expense.category.name} •{' '}
                      <span
                        style={{ color: expense.user.color }}
                        className="font-medium"
                      >
                        {expense.user.name}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    R$ {expense.amount.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(expense.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <button
                  onClick={() => handleDelete(expense.id)}
                  className="ml-4 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
