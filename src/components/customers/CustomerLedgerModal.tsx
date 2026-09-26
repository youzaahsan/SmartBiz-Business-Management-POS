import React, { useState, useEffect } from 'react';
import { Customer, CustomerLedgerEntry, Invoice, PaymentMethod } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { StorageService } from '../../services/storage';
import {
  X,
  CreditCard,
  Send,
  PlusCircle,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';

interface CustomerLedgerModalProps {
  customer: Customer;
  onClose: () => void;
  onCustomerUpdated: () => void;
}

export const CustomerLedgerModal: React.FC<CustomerLedgerModalProps> = ({
  customer,
  onClose,
  onCustomerUpdated,
}) => {
  const { currentBusiness, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'ledger' | 'purchases'>('ledger');
  const [ledgerEntries, setLedgerEntries] = useState<CustomerLedgerEntry[]>([]);
  const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([]);

  // Payment Recording State
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('CASH');
  const [payNotes, setPayNotes] = useState('');
  const [payError, setPayError] = useState('');
  const [paySuccess, setPaySuccess] = useState('');

  // Load ledger and invoices
  const loadData = () => {
    const entries = StorageService.getCustomerLedger(customer.id);
    const invoices = StorageService.getInvoices(currentBusiness.id).filter((i) => i.customerId === customer.id);
    setLedgerEntries(entries);
    setCustomerInvoices(invoices);
  };

  useEffect(() => {
    loadData();
  }, [customer.id]);

  // Record Payment
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) {
      setPayError('Please enter a valid amount');
      return;
    }

    const res = StorageService.recordCustomerPayment({
      businessId: currentBusiness.id,
      customerId: customer.id,
      amount: amt,
      paymentMethod: payMethod,
      notes: payNotes,
      recordedByUserId: currentUser.id,
      recordedByUserName: currentUser.name,
      userRole: currentUser.role,
    });

    if (res.success) {
      setPaySuccess(`Received payment of ${currentBusiness.currencySymbol} ${amt.toLocaleString()}`);
      setPayAmount('');
      setPayNotes('');
      setShowPayModal(false);
      loadData();
      onCustomerUpdated();
      setTimeout(() => setPaySuccess(''), 4000);
    } else {
      setPayError(res.error || 'Failed to record payment');
    }
  };

  // WhatsApp Payment Reminder
  const handleSendReminder = () => {
    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    let text = `*Payment Reminder from ${currentBusiness.name}*\n\n`;
    text += `Dear *${customer.name}*,\n`;
    text += `We hope this message finds you well. This is a gentle reminder regarding your outstanding balance with our store.\n\n`;
    text += `*Current Due Balance: ${currentBusiness.currencySymbol} ${customer.totalDue.toLocaleString()}*\n\n`;
    if (currentBusiness.paymentIdentifier) {
      text += `You can transfer payment via ${currentBusiness.paymentIdentifierLabel || 'Online'}: *${currentBusiness.paymentIdentifier}*\n\n`;
    }
    text += `Please feel free to contact us at ${currentBusiness.phone || ''} for any queries.\n`;
    text += `Thank you for your valued patronage!`;

    const encoded = encodeURIComponent(text);
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] flex flex-col">
        {/* Header Bar */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{customer.name}</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {customer.customerType}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span>Phone: <strong className="text-slate-800 dark:text-slate-200">{customer.phone}</strong></span>
              {customer.address && <span>Address: {customer.address}</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success Alert */}
        {paySuccess && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <span>{paySuccess}</span>
          </div>
        )}

        {/* Balance Overview Cards */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Purchases</div>
            <div className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
              {currentBusiness.currencySymbol} {customer.totalPurchases.toLocaleString()}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Paid</div>
            <div className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {currentBusiness.currencySymbol} {customer.totalPaid.toLocaleString()}
            </div>
          </div>

          <div className={`rounded-2xl border p-3.5 ${
            customer.totalDue > 0
              ? 'border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40'
              : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60'
          }`}>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Outstanding Udhaar (Due)</div>
            <div className={`mt-1 text-lg font-bold ${
              customer.totalDue > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-slate-900 dark:text-white'
            }`}>
              {currentBusiness.currencySymbol} {customer.totalDue.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Action Buttons: Record Payment & WhatsApp Reminder */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setPayAmount(String(customer.totalDue > 0 ? customer.totalDue : ''));
              setShowPayModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition active:scale-98"
          >
            <CreditCard className="h-4 w-4" />
            <span>RECORD PAYMENT</span>
          </button>

          {customer.totalDue > 0 && (
            <button
              onClick={handleSendReminder}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition active:scale-98"
            >
              <Send className="h-4 w-4" />
              <span>SEND WHATSAPP REMINDER</span>
            </button>
          )}
        </div>

        {/* Tabs: Ledger vs Purchases */}
        <div className="mt-4 flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 border-b-2 py-2 px-4 text-xs font-bold transition ${
              activeTab === 'ledger'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Statement of Account (Ledger)</span>
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`flex items-center gap-2 border-b-2 py-2 px-4 text-xs font-bold transition ${
              activeTab === 'purchases'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Item-Level Purchase History ({customerInvoices.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto mt-3 pr-1">
          {activeTab === 'ledger' ? (
            <div className="rounded-2xl border border-slate-200 overflow-hidden dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Ref #</th>
                    <th className="py-2.5 px-3">Details</th>
                    <th className="py-2.5 px-3 text-right">Debit (+)</th>
                    <th className="py-2.5 px-3 text-right">Credit (-)</th>
                    <th className="py-2.5 px-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ledgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No ledger entries found
                      </td>
                    </tr>
                  ) : (
                    ledgerEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                          {new Date(entry.date).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                            entry.type === 'SALE'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : entry.type === 'PAYMENT'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          }`}>
                            {entry.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold">{entry.referenceNumber}</td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 text-[11px]">{entry.notes || '&mdash;'}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-rose-600 dark:text-rose-400">
                          {entry.debit > 0 ? `${currentBusiness.currencySymbol} ${entry.debit.toLocaleString()}` : '&mdash;'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          {entry.credit > 0 ? `${currentBusiness.currencySymbol} ${entry.credit.toLocaleString()}` : '&mdash;'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                          {currentBusiness.currencySymbol} {entry.balance.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            // Item-Level Purchase History
            <div className="space-y-3">
              {customerInvoices.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No purchase records for this customer</div>
              ) : (
                customerInvoices.map((inv) => (
                  <div key={inv.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-800/60 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                          {inv.invoiceNumber}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          {new Date(inv.createdAt).toLocaleDateString()} {new Date(inv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Total: {currentBusiness.currencySymbol} {inv.grandTotal.toLocaleString()}
                        </span>
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          inv.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {inv.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Line Items Details */}
                    <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
                      {inv.items.map((it) => (
                        <div key={it.id} className="py-1.5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{it.productName}</span>
                            <span className="text-slate-400 text-[11px] ml-2">
                              {it.quantity} {it.unit} &times; {currentBusiness.currencySymbol}{it.unitPrice}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {currentBusiness.currencySymbol} {it.total.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Paid & Due footer */}
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between text-[11px] text-slate-500">
                      <span>Paid: <strong className="text-emerald-600">{currentBusiness.currencySymbol} {inv.paidAmount.toLocaleString()}</strong></span>
                      {inv.dueAmount > 0 && (
                        <span>Remaining Due: <strong className="text-amber-600">{currentBusiness.currencySymbol} {inv.dueAmount.toLocaleString()}</strong></span>
                      )}
                      <span>Mode: {inv.paymentMethod}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Record Payment Submodal */}
        {showPayModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Record Customer Payment</h3>
                <button onClick={() => setShowPayModal(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {payError && <div className="mt-2 text-xs font-semibold text-rose-500">{payError}</div>}

              <form onSubmit={handleRecordPayment} className="mt-3 space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amount Received ({currentBusiness.currencySymbol}):
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    required
                    placeholder="Enter amount"
                    autoFocus
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
                    <option value="CASH">Cash</option>
                    <option value="QR_ONLINE">Online / QR / App</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CARD">Card</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Notes / Receipt Reference:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Received by cashier"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPayModal(false)}
                    className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                  >
                    Confirm Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
