import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StorageService } from '../../services/storage';
import { Purchase, PurchaseItem, Supplier, Product, PaymentMethod } from '../../types';
import {
  ShoppingBag,
  Plus,
  Search,
  Calendar,
  Truck,
  CheckCircle,
  AlertTriangle,
  X,
  FileText,
  DollarSign,
  Package,
} from 'lucide-react';

export const PurchaseList: React.FC = () => {
  const { currentBusiness, currentUser } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Selected purchase for receipt
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  // New Purchase / Stock-in Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paidAmount, setPaidAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [poItems, setPoItems] = useState<PurchaseItem[]>([]);

  // Item selector for PO
  const [addProdId, setAddProdId] = useState('');
  const [addQty, setAddQty] = useState('1');
  const [addCost, setAddCost] = useState('');

  const loadData = () => {
    setPurchases(StorageService.getPurchases(currentBusiness.id));
    setSuppliers(StorageService.getSuppliers(currentBusiness.id));
    setProducts(StorageService.getProducts(currentBusiness.id));
  };

  useEffect(() => {
    loadData();
  }, [currentBusiness.id]);

  const totalProcurement = purchases.reduce((acc, p) => acc + p.grandTotal, 0);
  const totalDueToSuppliers = purchases.reduce((acc, p) => acc + (p.dueAmount || 0), 0);

  const filtered = purchases.filter(
    (p) =>
      p.purchaseNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenStockIn = () => {
    setPoItems([]);
    setSelectedSupplierId(suppliers[0]?.id || '');
    setPaidAmount('');
    setNotes('');
    setAddProdId(products[0]?.id || '');
    setAddQty('1');
    setAddCost(String(products[0]?.purchasePrice || ''));
    setShowStockInModal(true);
  };

  const handleProductSelectChange = (pId: string) => {
    setAddProdId(pId);
    const prod = products.find((p) => p.id === pId);
    if (prod) {
      setAddCost(String(prod.purchasePrice));
    }
  };

  const handleAddItemToPO = () => {
    const prod = products.find((p) => p.id === addProdId);
    if (!prod) return;

    const qty = parseFloat(addQty);
    const cost = parseFloat(addCost);

    if (!qty || qty <= 0 || !cost || cost <= 0) return;

    const existingIdx = poItems.findIndex((it) => it.productId === prod.id);
    if (existingIdx >= 0) {
      const updated = [...poItems];
      updated[existingIdx].quantity += qty;
      updated[existingIdx].purchasePrice = cost;
      updated[existingIdx].total = updated[existingIdx].quantity * cost;
      setPoItems(updated);
    } else {
      setPoItems([
        ...poItems,
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          unit: prod.unit,
          quantity: qty,
          purchasePrice: cost,
          total: qty * cost,
        },
      ]);
    }

    setAddQty('1');
  };

  const handleRemoveItem = (prodId: string) => {
    setPoItems(poItems.filter((i) => i.productId !== prodId));
  };

  const poSubtotal = poItems.reduce((acc, i) => acc + i.total, 0);

  const handleSubmitPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (poItems.length === 0) {
      setErrorMessage('Please add at least one product item to the stock-in order');
      return;
    }

    const supp = suppliers.find((s) => s.id === selectedSupplierId);
    if (!supp) {
      setErrorMessage('Please select a supplier');
      return;
    }

    const paid = parseFloat(paidAmount) || 0;

    const res = StorageService.createPurchaseTransaction({
      businessId: currentBusiness.id,
      supplierId: supp.id,
      supplierName: supp.name,
      items: poItems,
      paidAmount: paid,
      paymentMethod,
      notes: notes.trim() || undefined,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
    });

    if (res.success) {
      setSuccessMessage(`Stock-In order completed! Inventory counts updated automatically.`);
      setShowStockInModal(false);
      loadData();
      setTimeout(() => setSuccessMessage(''), 4000);
    } else {
      setErrorMessage(res.error || 'Failed to complete purchase order');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span>Purchases &amp; Stock In Management</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Record supplier shipments, replenish stock levels, and update cost prices
          </p>
        </div>

        <button
          onClick={handleOpenStockIn}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition active:scale-98"
        >
          <Plus className="h-4 w-4" />
          <span>New Stock In (Purchase)</span>
        </button>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Lifetime Procurements</div>
          <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {currentBusiness.currencySymbol} {totalProcurement.toLocaleString()}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">Total goods purchased</div>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900 dark:bg-rose-950/40">
          <div className="text-xs font-bold text-rose-800 dark:text-rose-300">Unsettled PO Payables</div>
          <div className="mt-1 text-2xl font-black text-rose-700 dark:text-rose-200">
            {currentBusiness.currencySymbol} {totalDueToSuppliers.toLocaleString()}
          </div>
          <div className="mt-0.5 text-[11px] text-rose-700 dark:text-rose-300">Remaining supplier balance</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Stock-In Transactions</div>
          <div className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {purchases.length}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">Orders logged</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by PO # or supplier name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-800 shadow-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 font-semibold">
            <tr>
              <th className="py-3 px-4">PO Number</th>
              <th className="py-3 px-4">Supplier</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Items Count</th>
              <th className="py-3 px-4 text-right">Total Cost</th>
              <th className="py-3 px-4 text-right">Paid</th>
              <th className="py-3 px-4 text-right">Due</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  No purchases recorded yet
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    {p.purchaseNumber}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {p.supplierName}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {p.items.length} products
                  </td>
                  <td className="py-3 px-4 text-right font-black font-mono text-slate-900 dark:text-white">
                    {currentBusiness.currencySymbol} {p.grandTotal.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-emerald-600">
                    {currentBusiness.currencySymbol} {p.paidAmount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-rose-600">
                    {p.dueAmount > 0 ? `${currentBusiness.currencySymbol} ${p.dueAmount.toLocaleString()}` : '&mdash;'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        p.paymentStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.paymentStatus === 'PARTIAL'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {p.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setSelectedPurchase(p)}
                      className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Stock In Modal */}
      {showStockInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] flex flex-col animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="h-5 w-5 text-indigo-600" />
                <span>Stock In / Supplier Purchase Order</span>
              </h3>
              <button
                onClick={() => setShowStockInModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitPurchase} className="mt-4 space-y-4 text-xs flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                {/* Supplier selection */}
                <div>
                  <label className="block font-semibold mb-1">Select Supplier *:</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.company || 'Vendor'}) - Current Due: {currentBusiness.currencySymbol}{s.totalDue}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Add product line */}
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3 dark:border-indigo-950 dark:bg-indigo-950/20">
                  <div className="font-bold text-indigo-950 dark:text-indigo-300 mb-2">
                    Add Items to Shipment
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-6">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Product</label>
                      <select
                        value={addProdId}
                        onChange={(e) => handleProductSelectChange(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white p-1.5 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Stock: {p.stockQuantity} {p.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Quantity</label>
                      <input
                        type="number"
                        min={0.1}
                        step="any"
                        value={addQty}
                        onChange={(e) => setAddQty(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white p-1.5 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Cost/Unit</label>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={addCost}
                        onChange={(e) => setAddCost(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white p-1.5 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-end">
                      <button
                        type="button"
                        onClick={handleAddItemToPO}
                        className="w-full rounded-lg bg-indigo-600 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Added items table */}
                <div className="rounded-xl border border-slate-200 overflow-hidden dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800">
                      <tr>
                        <th className="p-2">Item</th>
                        <th className="p-2 text-right">Qty</th>
                        <th className="p-2 text-right">Cost Price</th>
                        <th className="p-2 text-right">Total</th>
                        <th className="p-2 text-center">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {poItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400">
                            No items added yet. Choose a product above and click + Add
                          </td>
                        </tr>
                      ) : (
                        poItems.map((it) => (
                          <tr key={it.productId}>
                            <td className="p-2 font-bold">{it.productName}</td>
                            <td className="p-2 text-right">
                              {it.quantity} {it.unit}
                            </td>
                            <td className="p-2 text-right">
                              {currentBusiness.currencySymbol} {it.purchasePrice}
                            </td>
                            <td className="p-2 text-right font-bold">
                              {currentBusiness.currencySymbol} {it.total.toLocaleString()}
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(it.productId)}
                                className="text-rose-500 hover:text-rose-700"
                              >
                                &times;
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Totals and Payment */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block font-semibold mb-1">Payment Method:</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="CASH">Cash Payment</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="UDHAAR_CREDIT">Credit / Due to Supplier</option>
                      <option value="QR_ONLINE">Online / Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Amount Paid Now:</label>
                    <input
                      type="number"
                      min={0}
                      placeholder={`Total: ${poSubtotal}`}
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Notes / Invoice Ref #:</label>
                  <input
                    type="text"
                    placeholder="e.g. Supplier delivery challan # 8821"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400">Total Purchase Cost: </span>
                  <span className="font-black text-sm text-slate-900 dark:text-white">
                    {currentBusiness.currencySymbol} {poSubtotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowStockInModal(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-600 px-5 py-2 font-bold text-white hover:bg-indigo-700"
                  >
                    Confirm Stock In
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Purchase Receipt Modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Purchase Order: {selectedPurchase.purchaseNumber}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Supplier: {selectedPurchase.supplierName} &bull; {new Date(selectedPurchase.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedPurchase(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {selectedPurchase.items.map((it: PurchaseItem, idx: number) => (
                  <div key={idx} className="py-2 flex justify-between">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{it.productName}</div>
                      <div className="text-[10px] text-slate-400">
                        {it.quantity} {it.unit} &times; {currentBusiness.currencySymbol}{it.purchasePrice}
                      </div>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {currentBusiness.currencySymbol} {it.total.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Grand Total:</span>
                  <span>{currentBusiness.currencySymbol} {selectedPurchase.grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Paid:</span>
                  <span>{currentBusiness.currencySymbol} {selectedPurchase.paidAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Payable Due:</span>
                  <span>{currentBusiness.currencySymbol} {selectedPurchase.dueAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t">
              <button
                onClick={() => setSelectedPurchase(null)}
                className="w-full rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
