import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StorageService } from '../../services/storage';
import { Invoice } from '../../types';
import { Search, Receipt, Printer, Share2, Eye, Filter, ArrowUpDown } from 'lucide-react';
import { InvoiceReceiptModal } from './InvoiceReceiptModal';

export const InvoiceList: React.FC<{ onNavigateToReturns?: () => void }> = () => {
  const { currentBusiness } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    const list = StorageService.getInvoices(currentBusiness.id);
    setInvoices(list);
  }, [currentBusiness.id]);

  const filtered = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (inv.customerPhone && inv.customerPhone.includes(search));

    const matchesStatus =
      statusFilter === 'ALL' ||
      inv.paymentStatus === statusFilter ||
      inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span>Invoices &amp; Bills History</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            View, print, reprint, share, or audit completed sales receipts
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap gap-2.5 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice #, customer name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="ALL">All Payments</option>
            <option value="PAID">Paid in Full</option>
            <option value="PARTIAL">Partial Paid</option>
            <option value="UNPAID">Unpaid / Udhaar</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date &amp; Time</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No invoices found
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      <div>{new Date(inv.createdAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400">{new Date(inv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{inv.customerName}</div>
                      {inv.customerPhone && inv.customerPhone !== '0000000000' && (
                        <div className="text-[10px] text-slate-400">{inv.customerPhone}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold dark:bg-slate-800">
                        {inv.items.length}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                      {currentBusiness.currencySymbol} {inv.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {currentBusiness.currencySymbol} {inv.paidAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {inv.dueAmount > 0 ? (
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {currentBusiness.currencySymbol} {inv.dueAmount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">&mdash;</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          inv.status === 'REFUNDED'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : inv.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : inv.paymentStatus === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {inv.status === 'REFUNDED' ? 'REFUNDED' : inv.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setViewInvoice(inv)}
                        className="rounded-lg bg-indigo-50 p-1.5 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300"
                        title="View / Print / Share Receipt"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details / Receipt Modal */}
      {viewInvoice && (
        <InvoiceReceiptModal
          invoice={viewInvoice}
          business={currentBusiness}
          onClose={() => setViewInvoice(null)}
          onNewSale={() => setViewInvoice(null)}
        />
      )}
    </div>
  );
};
