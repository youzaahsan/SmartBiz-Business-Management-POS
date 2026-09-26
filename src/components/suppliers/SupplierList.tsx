import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StorageService } from '../../services/storage';
import { Supplier, SupplierLedgerEntry, PaymentMethod } from '../../types';
import {
  Truck,
  Search,
  Plus,
  Phone,
  Building,
  Edit,
  DollarSign,
  X,
  CreditCard,
  CheckCircle,
  FileText,
} from 'lucide-react';

export const SupplierList: React.FC<{ onNavigateToPurchases?: () => void }> = ({
  onNavigateToPurchases,
}) => {
  const { currentBusiness, currentUser } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);

  // Selected supplier for statement & payment
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<SupplierLedgerEntry[]>([]);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [payNotes, setPayNotes] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form states
  const [formName, setFormName] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');

  const loadSuppliers = () => {
    const list = StorageService.getSuppliers(currentBusiness.id);
    setSuppliers(list);
  };

  useEffect(() => {
    loadSuppliers();
  }, [currentBusiness.id]);

  const totalPayableDue = suppliers.reduce((acc, s) => acc + (s.totalDue || 0), 0);

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search) ||
      (s.company && s.company.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setEditSupplier(null);
    setFormName('');
    setFormCompany('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditSupplier(s);
    setFormName(s.name);
    setFormCompany(s.company || '');
    setFormPhone(s.phone);
    setFormEmail(s.email || '');
    setFormAddress(s.address || '');
    setShowAddModal(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) return;

    if (editSupplier) {
      StorageService.saveSupplier(
        {
          ...editSupplier,
          name: formName.trim(),
          company: formCompany.trim() || undefined,
          phone: formPhone.trim(),
          email: formEmail.trim() || undefined,
          address: formAddress.trim() || undefined,
        },
        {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
        }
      );
    } else {
      StorageService.saveSupplier(
        {
          id: `supp_${Date.now()}`,
          businessId: currentBusiness.id,
          name: formName.trim(),
          company: formCompany.trim() || undefined,
          phone: formPhone.trim(),
          email: formEmail.trim() || undefined,
          address: formAddress.trim() || undefined,
          totalPurchases: 0,
          totalPaid: 0,
          totalDue: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
        }
      );
    }

    setShowAddModal(false);
    loadSuppliers();
  };

  const handleOpenLedger = (s: Supplier) => {
    setSelectedSupplier(s);
    const entries = StorageService.getSupplierLedger(s.id);
    setLedgerEntries(entries);
  };

  const handlePaySupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;

    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) return;

    const res = StorageService.recordSupplierPayment({
      businessId: currentBusiness.id,
      supplierId: selectedSupplier.id,
      amount: amt,
      paymentMethod: payMethod,
      notes: payNotes,
      recordedByUserId: currentUser.id,
      recordedByUserName: currentUser.name,
      userRole: currentUser.role,
    });

    if (res.success) {
      setSuccessMessage(
        `Payment of ${currentBusiness.currencySymbol} ${amt.toLocaleString()} recorded for ${selectedSupplier.name}`
      );
      const updatedList = StorageService.getSuppliers(currentBusiness.id);
      const updated = updatedList.find((s) => s.id === selectedSupplier.id) || selectedSupplier;
      setSelectedSupplier(updated);
      setLedgerEntries(StorageService.getSupplierLedger(selectedSupplier.id));
      setShowPayModal(false);
      setPayAmount('');
      setPayNotes('');
      setSuppliers(updatedList);
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span>Suppliers &amp; Vendors Management</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track vendor payables, purchase history, and disbursement ledgers
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition active:scale-98"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Supplier</span>
        </button>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900 dark:bg-rose-950/40">
          <div className="text-xs font-bold text-rose-800 dark:text-rose-300">Total Supplier Payables (Our Debt)</div>
          <div className="mt-1 text-2xl font-black text-rose-700 dark:text-rose-200">
            {currentBusiness.currencySymbol} {totalPayableDue.toLocaleString()}
          </div>
          <div className="mt-0.5 text-[11px] text-rose-700 dark:text-rose-300">Outstanding vendor payments</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Suppliers / Distributors</div>
          <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {suppliers.length}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">Active supply chain partners</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Stock Procured</div>
          <div className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {currentBusiness.currencySymbol}{' '}
            {suppliers.reduce((acc, s) => acc + (s.totalPurchases || 0), 0).toLocaleString()}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">Lifetime purchases</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search suppliers by name, company, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-800 shadow-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {/* Suppliers Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Supplier / Company</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4 text-right">Total Purchases</th>
                <th className="py-3 px-4 text-right">Paid to Vendor</th>
                <th className="py-3 px-4 text-right">Payable Due</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No suppliers found
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{s.name}</div>
                      {s.company && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          <span>{s.company}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {s.phone}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900 dark:text-white">
                      {currentBusiness.currencySymbol} {s.totalPurchases.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {currentBusiness.currencySymbol} {s.totalPaid.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {s.totalDue > 0 ? (
                        <span className="font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md">
                          {currentBusiness.currencySymbol} {s.totalDue.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-emerald-600 text-[11px] font-semibold">Cleared</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenLedger(s)}
                          className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>Ledger</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
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

      {/* Supplier Ledger & Payment Modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  Supplier Statement: {selectedSupplier.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedSupplier.company || 'Independent Vendor'} &bull; Phone: {selectedSupplier.phone}
                </p>
              </div>
              <button
                onClick={() => setSelectedSupplier(null)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Balances */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 p-3 text-xs bg-slate-50 dark:border-slate-800 dark:bg-slate-800">
                <div className="text-slate-500">Total Billed</div>
                <div className="mt-0.5 font-bold text-slate-900 dark:text-white text-base">
                  {currentBusiness.currencySymbol} {selectedSupplier.totalPurchases.toLocaleString()}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 text-xs bg-slate-50 dark:border-slate-800 dark:bg-slate-800">
                <div className="text-slate-500">Total Paid</div>
                <div className="mt-0.5 font-bold text-emerald-600 dark:text-emerald-400 text-base">
                  {currentBusiness.currencySymbol} {selectedSupplier.totalPaid.toLocaleString()}
                </div>
              </div>
              <div className="rounded-xl border border-rose-200 p-3 text-xs bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40">
                <div className="text-rose-700 dark:text-rose-300 font-bold">Payable Due</div>
                <div className="mt-0.5 font-bold text-rose-700 dark:text-rose-200 text-base">
                  {currentBusiness.currencySymbol} {selectedSupplier.totalDue.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  setPayAmount(String(selectedSupplier.totalDue > 0 ? selectedSupplier.totalDue : ''));
                  setShowPayModal(true);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
              >
                <CreditCard className="h-4 w-4" />
                <span>PAY VENDOR</span>
              </button>
            </div>

            {/* Ledger entries */}
            <div className="mt-4 flex-1 overflow-y-auto">
              <div className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-2">Ledger Entries</div>
              <div className="rounded-xl border border-slate-200 overflow-hidden dark:border-slate-800 text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
                    <tr>
                      <th className="p-2">Date</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Ref</th>
                      <th className="p-2 text-right">Debit (+)</th>
                      <th className="p-2 text-right">Credit (-)</th>
                      <th className="p-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {ledgerEntries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400">No records found</td>
                      </tr>
                    ) : (
                      ledgerEntries.map((e) => (
                        <tr key={e.id}>
                          <td className="p-2">{new Date(e.date).toLocaleDateString()}</td>
                          <td className="p-2 font-bold">{e.type}</td>
                          <td className="p-2 font-mono text-[11px]">{e.referenceNumber}</td>
                          <td className="p-2 text-right font-medium text-slate-800 dark:text-slate-200">
                            {e.debit > 0 ? `${currentBusiness.currencySymbol} ${e.debit.toLocaleString()}` : '&mdash;'}
                          </td>
                          <td className="p-2 text-right font-medium text-emerald-600">
                            {e.credit > 0 ? `${currentBusiness.currencySymbol} ${e.credit.toLocaleString()}` : '&mdash;'}
                          </td>
                          <td className="p-2 text-right font-bold">
                            {currentBusiness.currencySymbol} {e.balance.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pay Supplier Modal */}
      {showPayModal && selectedSupplier && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Pay Supplier</h3>
              <button onClick={() => setShowPayModal(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handlePaySupplier} className="mt-3 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount to Pay ({currentBusiness.currencySymbol}) *:
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  autoFocus
                  placeholder="Enter payment amount"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Mode:
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="QR_ONLINE">Online / Cheque</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Cheque #:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bank online transfer Ref # 99238"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2 font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 py-2 font-bold text-white hover:bg-indigo-700"
                >
                  Confirm Disbursement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Person Name *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aslam Khan"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company / Distributor Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Metro Commodities Ltd"
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 03219876543"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Warehouse Address:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Grain Market, Industrial Area"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
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
                  {editSupplier ? 'Update Supplier' : 'Create Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
