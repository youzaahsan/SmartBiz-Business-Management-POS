import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StorageService } from '../../services/storage';
import { Invoice, Expense, Product, Customer, Supplier } from '../../types';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Download,
  Printer,
  DollarSign,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Award,
} from 'lucide-react';

export const ProfitReports: React.FC = () => {
  const { currentBusiness } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');

  useEffect(() => {
    setInvoices(StorageService.getInvoices(currentBusiness.id));
    setExpenses(StorageService.getExpenses(currentBusiness.id));
    setProducts(StorageService.getProducts(currentBusiness.id));
    setCustomers(StorageService.getCustomers(currentBusiness.id));
    setSuppliers(StorageService.getSuppliers(currentBusiness.id));
  }, [currentBusiness.id]);

  // Date filtering logic
  const now = new Date();
  const filterDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (dateRange === 'all') return true;

    if (dateRange === 'today') {
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }
    if (dateRange === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return d >= oneWeekAgo;
    }
    if (dateRange === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (dateRange === 'year') {
      return d.getFullYear() === now.getFullYear();
    }
    return true;
  };

  const periodInvoices = invoices.filter((i) => i.status !== 'CANCELLED' && filterDate(i.createdAt));
  const periodExpenses = expenses.filter((e) => filterDate(e.date));

  // Financial aggregates
  const totalSalesRevenue = periodInvoices.reduce((acc, i) => acc + i.grandTotal, 0);
  const totalCostOfGoodsSold = periodInvoices.reduce((acc, inv) => {
    const invCost = inv.items.reduce((sum, item) => sum + item.quantity * item.purchasePrice, 0);
    return acc + invCost;
  }, 0);

  const grossProfit = totalSalesRevenue - totalCostOfGoodsSold;
  const totalOverheadExpenses = periodExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = grossProfit - totalOverheadExpenses;
  const netProfitMargin = totalSalesRevenue > 0 ? (netProfit / totalSalesRevenue) * 100 : 0;

  // Receivables & Payables
  const totalReceivables = customers.reduce((sum, c) => sum + (c.totalDue || 0), 0);
  const totalPayables = suppliers.reduce((sum, s) => sum + (s.totalDue || 0), 0);

  // Top Selling Products in period
  const productSalesMap: {
    [key: string]: { name: string; sku: string; qty: number; revenue: number; profit: number };
  } = {};

  periodInvoices.forEach((inv) => {
    inv.items.forEach((item) => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = {
          name: item.productName,
          sku: item.sku,
          qty: 0,
          revenue: 0,
          profit: 0,
        };
      }
      productSalesMap[item.productId].qty += item.quantity;
      productSalesMap[item.productId].revenue += item.total;
      productSalesMap[item.productId].profit +=
        item.total - item.quantity * item.purchasePrice;
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Payment methods breakdown
  const paymentMethodsTotal = {
    CASH: periodInvoices.filter((i) => i.paymentMethod === 'CASH').reduce((sum, i) => sum + i.paidAmount, 0),
    CARD: periodInvoices.filter((i) => i.paymentMethod === 'CARD').reduce((sum, i) => sum + i.paidAmount, 0),
    QR_ONLINE: periodInvoices.filter((i) => i.paymentMethod === 'QR_ONLINE').reduce((sum, i) => sum + i.paidAmount, 0),
    BANK_TRANSFER: periodInvoices.filter((i) => i.paymentMethod === 'BANK_TRANSFER').reduce((sum, i) => sum + i.paidAmount, 0),
    UDHAAR_CREDIT: periodInvoices.reduce((sum, i) => sum + (i.dueAmount || 0), 0),
  };

  // CSV Export
  const handleExportCSV = () => {
    let csv = `Date Range,${dateRange.toUpperCase()}\n`;
    csv += `Total Revenue,${totalSalesRevenue}\n`;
    csv += `Cost of Goods Sold (COGS),${totalCostOfGoodsSold}\n`;
    csv += `Gross Profit,${grossProfit}\n`;
    csv += `Operating Expenses,${totalOverheadExpenses}\n`;
    csv += `Net Profit,${netProfit}\n`;
    csv += `Net Profit Margin %,${netProfitMargin.toFixed(2)}%\n\n`;

    csv += `Top Selling Products\n`;
    csv += `Product Name,SKU,Units Sold,Revenue,Profit\n`;
    topProducts.forEach((p) => {
      csv += `"${p.name}",${p.sku},${p.qty},${p.revenue},${p.profit}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Profit_Report_${dateRange}_${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span>Business Reports &amp; Profit Analytics</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time revenue, cost of goods, overheads, and net profit ledger
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 text-xs dark:border-slate-700 dark:bg-slate-900">
            {(['today', 'week', 'month', 'year', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`rounded-lg px-2.5 py-1 font-semibold uppercase text-[10px] transition ${
                  dateRange === r
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Revenue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Sales Revenue</span>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {currentBusiness.currencySymbol} {totalSalesRevenue.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {periodInvoices.length} invoices in period
          </div>
        </div>

        {/* Cost of Goods Sold */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Cost of Goods (COGS)</span>
            <ArrowDownRight className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-700 dark:text-slate-300">
            {currentBusiness.currencySymbol} {totalCostOfGoodsSold.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Wholesale inventory cost
          </div>
        </div>

        {/* Store Overheads */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-xs dark:border-rose-900 dark:bg-rose-950/30">
          <div className="flex items-center justify-between text-xs text-rose-700 dark:text-rose-300 font-semibold">
            <span>Operating Overheads</span>
            <span className="text-[10px] font-bold uppercase">{dateRange}</span>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-700 dark:text-rose-200">
            {currentBusiness.currencySymbol} {totalOverheadExpenses.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-rose-700 dark:text-rose-300">
            {periodExpenses.length} expense items
          </div>
        </div>

        {/* Net Profit */}
        <div className="rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-xs dark:border-emerald-800 dark:from-emerald-950/40 dark:to-teal-950/40">
          <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-bold">
            <span>NET BUSINESS PROFIT</span>
            <Award className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-300">
            {currentBusiness.currencySymbol} {netProfit.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
            Net Margin: {netProfitMargin.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Balance Sheet Position (Udhaar Asset vs Vendor Liability) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/40">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
              Customer Udhaar / Receivables (Asset)
            </div>
            <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-900 dark:text-amber-200">
              Market Due
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-800 dark:text-amber-200">
            {currentBusiness.currencySymbol} {totalReceivables.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-amber-800 dark:text-amber-300">
            Pending collection from registered credit customers
          </p>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 dark:border-rose-900 dark:bg-rose-950/40">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-rose-900 dark:text-rose-200">
              Supplier Payables (Vendor Debt / Liability)
            </div>
            <span className="rounded-full bg-rose-200/80 px-2 py-0.5 text-[10px] font-bold text-rose-900 dark:bg-rose-900 dark:text-rose-200">
              To Pay
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-700 dark:text-rose-200">
            {currentBusiness.currencySymbol} {totalPayables.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-rose-700 dark:text-rose-300">
            Amount owed to suppliers for goods received on credit
          </p>
        </div>
      </div>

      {/* Top Selling Products and Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Top Selling Products */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Top Performing Products (by Revenue)
              </h3>
            </div>
            <span className="text-xs text-slate-400">Period: {dateRange.toUpperCase()}</span>
          </div>

          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No product sales in this period
              </div>
            ) : (
              topProducts.map((p, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      #{idx + 1} {p.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {p.sku} &bull; Sold: {p.qty} units
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {currentBusiness.currencySymbol} {p.revenue.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-emerald-600 font-semibold">
                      Profit: +{currentBusiness.currencySymbol}{p.profit.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment Methods Distribution */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <PieChart className="h-4 w-4 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Collections by Channel
              </h3>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Cash in Hand</span>
                  <span>{currentBusiness.currencySymbol} {paymentMethodsTotal.CASH.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${totalSalesRevenue > 0 ? (paymentMethodsTotal.CASH / totalSalesRevenue) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Card / POS Machine</span>
                  <span>{currentBusiness.currencySymbol} {paymentMethodsTotal.CARD.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{
                      width: `${totalSalesRevenue > 0 ? (paymentMethodsTotal.CARD / totalSalesRevenue) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>QR / Mobile Wallet / Online</span>
                  <span>{currentBusiness.currencySymbol} {paymentMethodsTotal.QR_ONLINE.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{
                      width: `${totalSalesRevenue > 0 ? (paymentMethodsTotal.QR_ONLINE / totalSalesRevenue) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-semibold text-amber-700 dark:text-amber-400">
                  <span>Udhaar / Unpaid Balance</span>
                  <span>{currentBusiness.currencySymbol} {paymentMethodsTotal.UDHAAR_CREDIT.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{
                      width: `${totalSalesRevenue > 0 ? (paymentMethodsTotal.UDHAAR_CREDIT / totalSalesRevenue) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 text-center">
            Transactions automatically aggregated from all cashier terminals
          </div>
        </div>
      </div>
    </div>
  );
};
