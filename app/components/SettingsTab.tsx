'use client';

import { useEffect, useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  color: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const COLORS = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#6366f1',
];

const ICONS = ['🏠', '🍔', '🚗', '🎬', '🛍️', '💊', '⚡', '📱', '✈️', '🎓'];

export default function SettingsTab({
  onUsersChange,
}: {
  onUsersChange: () => void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    color: COLORS[0],
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    icon: ICONS[0],
    color: COLORS[0],
  });

  useEffect(() => {
    loadUsers();
    loadCategories();
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

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userFormData.name || !userFormData.email) {
      alert('Preencha todos os campos');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userFormData),
      });

      if (res.ok) {
        loadUsers();
        onUsersChange();
        setUserFormData({
          name: '',
          email: '',
          color: COLORS[0],
        });
        setShowUserForm(false);
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao adicionar usuário');
      }
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryFormData.name) {
      alert('Preencha o nome da categoria');
      return;
    }

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryFormData),
      });

      if (res.ok) {
        loadCategories();
        setCategoryFormData({
          name: '',
          icon: ICONS[0],
          color: COLORS[0],
        });
        setShowCategoryForm(false);
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao adicionar categoria');
      }
    } catch (error) {
      console.error('Erro ao adicionar categoria:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Usuários */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            👥 Usuários
          </h3>
          <button
            onClick={() => setShowUserForm(!showUserForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            {showUserForm ? '✕ Cancelar' : '+ Adicionar Usuário'}
          </button>
        </div>

        {showUserForm && (
          <form onSubmit={handleAddUser} className="mb-6 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={userFormData.name}
                  onChange={(e) =>
                    setUserFormData({
                      ...userFormData,
                      name: e.target.value,
                    })
                  }
                  placeholder="Ex: João"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md dark:bg-slate-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) =>
                    setUserFormData({
                      ...userFormData,
                      email: e.target.value,
                    })
                  }
                  placeholder="joao@email.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md dark:bg-slate-600 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cor
              </label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() =>
                      setUserFormData({ ...userFormData, color })
                    }
                    className={`w-8 h-8 rounded-full border-2 ${
                      userFormData.color === color
                        ? 'border-gray-900 dark:border-white'
                        : 'border-gray-300 dark:border-slate-600'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md font-medium transition-colors"
            >
              Adicionar Usuário
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border-l-4"
              style={{ borderColor: user.color }}
            >
              <p className="font-medium text-gray-900 dark:text-white">
                {user.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {user.email}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Categorias */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            🏷️ Categorias de Despesas
          </h3>
          <button
            onClick={() => setShowCategoryForm(!showCategoryForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            {showCategoryForm ? '✕ Cancelar' : '+ Adicionar Categoria'}
          </button>
        </div>

        {showCategoryForm && (
          <form
            onSubmit={handleAddCategory}
            className="mb-6 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) =>
                    setCategoryFormData({
                      ...categoryFormData,
                      name: e.target.value,
                    })
                  }
                  placeholder="Ex: Alimentação"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md dark:bg-slate-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ícone
                </label>
                <select
                  value={categoryFormData.icon}
                  onChange={(e) =>
                    setCategoryFormData({
                      ...categoryFormData,
                      icon: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md dark:bg-slate-600 dark:text-white"
                >
                  {ICONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cor
              </label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() =>
                      setCategoryFormData({ ...categoryFormData, color })
                    }
                    className={`w-8 h-8 rounded-full border-2 ${
                      categoryFormData.color === color
                        ? 'border-gray-900 dark:border-white'
                        : 'border-gray-300 dark:border-slate-600'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md font-medium transition-colors"
            >
              Adicionar Categoria
            </button>
          </form>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg text-center hover:shadow-md transition-shadow"
            >
              <p className="text-3xl mb-2">{category.icon}</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {category.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
