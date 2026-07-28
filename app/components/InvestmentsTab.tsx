'use client';

import { useEffect, useState } from 'react';

interface Investment {
  id: string;
  name: string;
  amount: number;
  type: string;
  date: string;
  notes?: string;
  user: { id: string; name: string; color: string };
}

interface User {
  id: string;
  name: string;
  color: string;
}

const INVESTMENT_TYPES = ['Ações', 'Fundo', 'Cripto', 'Imóvel', 'Poupança', 'Outro'];

export default function InvestmentsTab({ users }: { users: User[] }) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    type: 'Fundo',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    userId: users[0]?.id || '',
  });

  useEffect(() => {
    loadInvestments();
  }, []);

  const loadInvestments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/investments');
      if (res.ok) {
        setInvestments(await res.json());
      }
    } catch (error) {
      console.error('Erro ao carregar investimentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.amount) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    try {
      const res = await fetch('/api/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        loadInvestments();
        setFormData({
          name: '',
          amount: '',
          type: 'Fundo',
          date: new Date().toISOString().split('T')[0],
          notes: '',
          userId: users[0]?.id || '',
        });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Erro ao adicionar investimento:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar?')) return;

    try {
      const res = await fetch(`/api/investments?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadInvestments();
      }
    } catch (error) {
      console.error('Erro ao deletar investimento:', error);
    }
  };

  const totalByUser = users.map((user) => ({
    user,
    total: investments
      .filter((i) => i.user.id === user.id)
      .reduce((sum, i) => sum + i.amount, 0),
  }));

  const grandTotal = investments.reduce((sum, i) => sum + i.amount, 0);
  const totalByType = INVESTMENT_TYPES.map((type) => ({
    type,
    total: investments
      .filter((i) => i.type === type)
      .reduce((sum, i) => sum + i.amount, 0),
  })).filter((t) => t.total > 0);

  return (
    <div className="space-y-6">
      {/* Ações */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 flex gap-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          {showForm ? '✕ Cancelar' : '+ Adicionar Investimento'}
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Novo Investimento
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Investimento
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Fundo Imobiliário XYZ"
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
                  Tipo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white"
                >
                  {INVESTMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notas (opcional)
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Observações sobre o investimento"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md font-medium transition-colors"
            >
              Salvar Investimento
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

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow p-4 text-white">
          <p className="text-green-100 text-sm">Total Investido</p>
          <p className="text-2xl font-bold">R$ {grandTotal.toFixed(2)}</p>
        </div>
      </div>

      {/* Resumo por Tipo */}
      {totalByType.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Distribuição por Tipo
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {totalByType.map(({ type, total }) => (
              <div
                key={type}
                className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4"
              >
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {type}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  R$ {total.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Investimentos */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Seus Investimentos
          </h3>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            Carregando...
          </div>
        ) : investments.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            Nenhum investimento registrado ainda.
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {investments.map((investment) => (
              <div
                key={investment.id}
                className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {investment.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {investment.type} •{' '}
                      <span
                        style={{ color: investment.user.color }}
                        className="font-medium"
                      >
                        {investment.user.name}
                      </span>
                      {investment.notes && ` • ${investment.notes}`}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    R$ {investment.amount.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(investment.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <button
                  onClick={() => handleDelete(investment.id)}
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
