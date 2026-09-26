import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StorageService } from '../../services/storage';
import { Expense, PaymentMethod } from '../../types';
import {
  TrendingDown,
  Plus,
  Search,
  Calendar,
  Trash2,
  DollarSign,
  Tag,
  CreditCard,
  FileText,
  CheckCircle,
} from 'lucide-react';

export const ExpenseList: React.FC = () => {
  const { currentBusiness, currentUser, hasPermission } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Form states
  const [category, setCategory] = useState<Expense['category']>('Electricity');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [notes, setNotes] = useState('');

  const loadExpenses = () => {
    setExpenses(StorageService.getExpenses(currentBusiness.id));
  };

  useEffect(() => {
    loadExpenses();
  }, [currentBusiness.id]);

  const categories: Expense['category'][] = [
    'Rent',
    'Electricity',
    'Salaries',
    'Transport',
    'Supplies',
    'Maintenance',
    'Food',
    'Marketing',
    'Other',
  ];

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  // Today's expenses
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayExpenses = expenses
    .filter((e) => e.date.startsWith(todayStr))
    .reduce((acc, e) => acc + e.amount, 0);

  const filtered = expenses.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.notes && e.notes.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = categoryFilter === 'All' || e.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || !title.trim()) return;

    const newExpense: Expense = {
      id: `exp_${Date.now()}`,
      businessId: currentBusiness.id,
      title: title.trim(),
      amount: amt,
      category,
      paymentMethod,
      date: new Date().toISOString(),
      notes: notes.trim() || undefined,
      recordedByUserId: currentUser.id,
      recordedByUserName: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    StorageService.saveExpense(newExpense, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });

    loadExpenses();
    setShowAddModal(false);
    setTitle('');
    setAmount('');
    setNotes('');
    setSuccessMessage(`Expense of ${currentBusiness.currencySymbol} ${amt.toLocaleString()} recorded!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm('Are you sure you want to delete this expense record?')) {
      StorageService.deleteExpense(id);
      loadExpenses();
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingDown className="h-6 w-6 text-rose-500" />
            <span>Store Overhead &amp; Expense Log</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Record petty cash, store bills, rent, and utility disbursements
          </p>
        </div>

        {hasPermission('manage_expenses') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition active:scale-98"
          >
            <Plus className="h-4 w-4" />
            <span>Record New Expense</span>
          </button>
        )}
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 dark:border-rose-900 dark:bg-rose-950/40">
          <div className="text-xs font-bold text-rose-800 dark:text-rose-300">Today&apos;s Store Expenses</div>
          <div className="mt-1 text-2xl font-black text-rose-700 dark:text-rose-200">
            {currentBusiness.currencySymbol} {todayExpenses.toLocaleString()}
          </div>
          <div className="mt-0.5 text-[11px] text-rose-700 dark:text-rose-300">Spent out of drawer today</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Lifetime Overheads</div>
          <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {currentBusiness.currencySymbol} {totalExpenses.toLocaleString()}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">All recorded expenses</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Expense Entries</div>
          <div className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {expenses.length}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">Transactions tracked</div>
        </div>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search expenses by title or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-800 shadow-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setCategoryFilter('All')}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition ${
              categoryFilter === 'All'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-white text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition ${
                categoryFilter === c
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 font-semibold">
            <tr>
              <th className="py-3 px-4">Title / Purpose</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Payment Method</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  No expense records found
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 dark:text-white">{e.title}</div>
                    {e.notes && (
                      <div className="text-[10px] text-slate-400 max-w-xs truncate">{e.notes}</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                      {e.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    {new Date(e.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">
                    {e.paymentMethod}
                  </td>
                  <td className="py-3 px-4 text-right font-black font-mono text-rose-600 dark:text-rose-400">
                    {currentBusiness.currencySymbol} {e.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleDeleteExpense(e.id)}
                      className="rounded-lg p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-3">
              Record Store Expense
            </h3>

            <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Expense Title *:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shop Electricity Bill or Tea & Biscuits"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Amount ({currentBusiness.currencySymbol}) *:</label>
                  <input
                    type="number"
                    min={1}
                    required
                    placeholder="e.g. 500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Category:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Expense['category'])}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Payment Method:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="CASH">Cash Drawer</option>
                  <option value="BANK_TRANSFER">Bank Account Transfer</option>
                  <option value="QR_ONLINE">Online / Card / Mobile Wallet</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Notes / Description:</label>
                <input
                  type="text"
                  placeholder="Additional details (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 font-bold text-white hover:bg-indigo-700"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
