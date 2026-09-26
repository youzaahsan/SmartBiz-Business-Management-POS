import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StorageService } from '../../services/storage';
import { Customer } from '../../types';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  FileText,
  AlertTriangle,
  Edit,
  DollarSign,
  X,
  CreditCard,
  CheckCircle,
} from 'lucide-react';
import { CustomerLedgerModal } from './CustomerLedgerModal';

export const CustomerList: React.FC = () => {
  const { currentBusiness, currentUser } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [phoneSearch, setPhoneSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formType, setFormType] = useState<Customer['customerType']>('Regular');
  const [formCreditLimit, setFormCreditLimit] = useState<string>('');

  const loadCustomers = () => {
    const list = StorageService.getCustomers(currentBusiness.id);
    setCustomers(list);
  };

  useEffect(() => {
    loadCustomers();
  }, [currentBusiness.id]);

  // Total Outstanding Udhaar across all customers
  const totalUdhaar = customers.reduce((sum, c) => sum + (c.totalDue || 0), 0);
  const totalCustomersWithDue = customers.filter((c) => c.totalDue > 0).length;

  const filteredCustomers = customers.filter((c) => {
    const query = phoneSearch.trim().toLowerCase();
    if (!query) return true;
    return c.phone.includes(query) || c.name.toLowerCase().includes(query);
  });

  const handleOpenAdd = () => {
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormNotes('');
    setFormType('Regular');
    setFormCreditLimit('');
    setEditCustomer(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (cust: Customer) => {
    setEditCustomer(cust);
    setFormName(cust.name);
    setFormPhone(cust.phone);
    setFormEmail(cust.email || '');
    setFormAddress(cust.address || '');
    setFormNotes(cust.notes || '');
    setFormType(cust.customerType);
    setFormCreditLimit(cust.creditLimit ? String(cust.creditLimit) : '');
    setShowAddModal(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) return;

    const actor = { id: currentUser.id, name: currentUser.name, role: currentUser.role };

    if (editCustomer) {
      StorageService.saveCustomer(
        {
          ...editCustomer,
          name: formName.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim() || undefined,
          address: formAddress.trim() || undefined,
          notes: formNotes.trim() || undefined,
          customerType: formType,
          creditLimit: formCreditLimit ? parseFloat(formCreditLimit) : undefined,
        },
        actor
      );
    } else {
      StorageService.saveCustomer(
        {
          id: `cust_${Date.now()}`,
          businessId: currentBusiness.id,
          name: formName.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim() || undefined,
          address: formAddress.trim() || undefined,
          notes: formNotes.trim() || undefined,
          customerType: formType,
          totalPurchases: 0,
          totalPaid: 0,
          totalDue: 0,
          creditLimit: formCreditLimit ? parseFloat(formCreditLimit) : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        actor
      );
    }

    setShowAddModal(false);
    loadCustomers();
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span>Customers &amp; Udhaar Ledger</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Fast phone lookup, purchase tracking, statement of accounts, and payment reminders
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition active:scale-98"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Udhaar / Due Balance Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900 dark:bg-amber-950/40">
          <div className="text-xs font-bold text-amber-800 dark:text-amber-300">
            Total Outstanding Udhaar
          </div>
          <div className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-200">
            {currentBusiness.currencySymbol} {totalUdhaar.toLocaleString()}
          </div>
          <div className="mt-0.5 text-[11px] text-amber-800 dark:text-amber-300">
            Across {totalCustomersWithDue} customer(s)
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Registered Customers</div>
          <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {customers.length}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">Excluding walk-in sales</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Lifetime Payments</div>
          <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {currentBusiness.currencySymbol}{' '}
            {customers.reduce((sum, c) => sum + (c.totalPaid || 0), 0).toLocaleString()}
          </div>
          <div className="mt-0.5 text-[11px] text-emerald-600">Verified cash &amp; bank ledger</div>
        </div>
      </div>

      {/* Fast Phone Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Fast search by phone number (e.g. 03001234567) or customer name..."
          value={phoneSearch}
          onChange={(e) => setPhoneSearch(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-800 shadow-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Total Purchases</th>
                <th className="py-3 px-4 text-right">Total Paid</th>
                <th className="py-3 px-4 text-right">Udhaar / Due</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No customers found
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr
                    key={cust.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{cust.name}</div>
                      {cust.address && <div className="text-[10px] text-slate-400">{cust.address}</div>}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {cust.phone}
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {cust.customerType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900 dark:text-white">
                      {currentBusiness.currencySymbol} {cust.totalPurchases.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {currentBusiness.currencySymbol} {cust.totalPaid.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {cust.totalDue > 0 ? (
                        <span className="font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                          {currentBusiness.currencySymbol} {cust.totalDue.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Paid</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedCustomer(cust)}
                          className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300"
                          title="Open Customer Profile & Statement"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>Ledger</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(cust)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit Customer"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Name *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muhammad Bilal"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 03001234567"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Customer Type:
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as Customer['customerType'])}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Credit Limit ({currentBusiness.currencySymbol}):
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 25000"
                    value={formCreditLimit}
                    onChange={(e) => setFormCreditLimit(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Address:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Street 4, Sector G-9"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Clears udhaar every 15 days"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 font-bold text-white hover:bg-indigo-700"
                >
                  {editCustomer ? 'Update Customer' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Profile & Statement Modal */}
      {selectedCustomer && (
        <CustomerLedgerModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onCustomerUpdated={() => {
            loadCustomers();
            // Refresh selected customer state
            const updated = StorageService.getCustomers(currentBusiness.id).find(
              (c) => c.id === selectedCustomer.id
            );
            if (updated) setSelectedCustomer(updated);
          }}
        />
      )}
    </div>
  );
};
