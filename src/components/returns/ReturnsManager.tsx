import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StorageService } from '../../services/storage';
import { Invoice, ReturnTransaction, Product, Supplier, PaymentMethod } from '../../types';
import {
  RotateCcw,
  Search,
  CheckCircle,
  AlertTriangle,
  X,
  Package,
  Receipt,
  Users,
} from 'lucide-react';

export const ReturnsManager: React.FC = () => {
  const { currentBusiness, currentUser } = useAuth();
  const [returnType, setReturnType] = useState<'CUSTOMER' | 'SUPPLIER'>('CUSTOMER');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [returnsList, setReturnsList] = useState<ReturnTransaction[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Customer Return Form State
  const [invoiceQuery, setInvoiceQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [returnQty, setReturnQty] = useState('');
  const [returnReason, setReturnReason] = useState('Customer changed mind');
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>('CASH');
  const [restockItem, setRestockItem] = useState(true);

  // Supplier Return Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedSupplierProdId, setSelectedSupplierProdId] = useState('');
  const [supplierReturnQty, setSupplierReturnQty] = useState('');
  const [supplierReturnReason, setSupplierReturnReason] = useState('Damaged / Defective');

  const loadData = () => {
    setInvoices(StorageService.getInvoices(currentBusiness.id));
    setReturnsList(StorageService.getReturns(currentBusiness.id));
    setSuppliers(StorageService.getSuppliers(currentBusiness.id));
    setProducts(StorageService.getProducts(currentBusiness.id));
  };

  useEffect(() => {
    loadData();
  }, [currentBusiness.id]);

  const handleSearchInvoice = () => {
    setErrorMessage('');
    const found = invoices.find(
      (inv) =>
        inv.invoiceNumber.toLowerCase() === invoiceQuery.trim().toLowerCase() ||
        inv.id === invoiceQuery.trim()
    );

    if (found) {
      setSelectedInvoice(found);
      if (found.items.length > 0) {
        setSelectedItemId(found.items[0].productId);
        setReturnQty('1');
      }
    } else {
      setErrorMessage(`No invoice found matching "${invoiceQuery}"`);
    }
  };

  const handleProcessCustomerReturn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!selectedInvoice) return;

    const item = selectedInvoice.items.find((i) => i.productId === selectedItemId);
    if (!item) {
      setErrorMessage('Please select an item to return');
      return;
    }

    const qty = parseFloat(returnQty);
    const maxReturnable = item.quantity - (item.returnedQuantity || 0);

    if (!qty || qty <= 0 || qty > maxReturnable) {
      setErrorMessage(`Invalid return quantity. Max returnable: ${maxReturnable} ${item.unit}`);
      return;
    }

    const res = StorageService.processReturn({
      businessId: currentBusiness.id,
      invoiceId: selectedInvoice.id,
      itemsToReturn: [
        {
          productId: item.productId,
          quantity: qty,
          restockEligible: restockItem,
        },
      ],
      reason: returnReason,
      refundMethod,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
    });

    if (res.success) {
      const refundAmt = (item.total / item.quantity) * qty;
      setSuccessMessage(
        `Return processed successfully! Total Refund: ${currentBusiness.currencySymbol} ${refundAmt.toLocaleString()}`
      );
      setSelectedInvoice(null);
      setInvoiceQuery('');
      loadData();
      setTimeout(() => setSuccessMessage(''), 4000);
    } else {
      setErrorMessage(res.error || 'Failed to process return');
    }
  };

  const handleProcessSupplierReturn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    const product = products.find((p) => p.id === selectedSupplierProdId);
    const qty = parseFloat(supplierReturnQty);

    if (!supplier || !product || !qty || qty <= 0) {
      setErrorMessage('Please complete all supplier return fields');
      return;
    }

    if (qty > product.stockQuantity) {
      setErrorMessage(`Cannot return ${qty} ${product.unit}. Current stock is only ${product.stockQuantity}`);
      return;
    }

    const refundAmt = qty * product.purchasePrice;

    // Deduct stock
    StorageService.saveProduct(
      {
        ...product,
        stockQuantity: product.stockQuantity - qty,
      },
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );

    // Reduce supplier payable due
    const newDue = Math.max(0, (supplier.totalDue || 0) - refundAmt);
    StorageService.saveSupplier({
      ...supplier,
      totalDue: newDue,
    });

    StorageService.logActivity({
      businessId: currentBusiness.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Supplier Goods Return',
      entity: 'SUPPLIER',
      entityId: supplier.id,
      details: `Returned ${qty} ${product.unit} of ${product.name} to ${supplier.name}. Reduced debt by ${currentBusiness.currencySymbol}${refundAmt}`,
    });

    setSuccessMessage(
      `Supplier return recorded! Vendor payable decreased by ${currentBusiness.currencySymbol} ${refundAmt.toLocaleString()}`
    );
    setSupplierReturnQty('');
    loadData();
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <RotateCcw className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span>Returns &amp; Refunds Management</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Process customer bill returns with restocking &amp; return defective items to suppliers
          </p>
        </div>

        {/* Switcher */}
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 text-xs dark:border-slate-700 dark:bg-slate-900">
          <button
            onClick={() => setReturnType('CUSTOMER')}
            className={`rounded-lg px-3 py-1.5 font-bold transition ${
              returnType === 'CUSTOMER'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
            }`}
          >
            Customer Return
          </button>
          <button
            onClick={() => setReturnType('SUPPLIER')}
            className={`rounded-lg px-3 py-1.5 font-bold transition ${
              returnType === 'SUPPLIER'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
            }`}
          >
            Supplier Return
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
          <AlertTriangle className="h-4 w-4 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Customer Return Workflow */}
      {returnType === 'CUSTOMER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form */}
          <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
              1. Search Original Customer Bill / Invoice
            </h3>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Enter Invoice # (e.g. SB-1001)"
                value={invoiceQuery}
                onChange={(e) => setInvoiceQuery(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none focus:border-indigo-500 font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="button"
                onClick={handleSearchInvoice}
                className="rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white hover:bg-indigo-700"
              >
                Find Bill
              </button>
            </div>

            {selectedInvoice && (
              <form onSubmit={handleProcessCustomerReturn} className="space-y-3 text-xs border-t pt-3 border-slate-100 dark:border-slate-800">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <div className="font-bold text-slate-900 dark:text-white">
                    Invoice: {selectedInvoice.invoiceNumber}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Customer: {selectedInvoice.customerName} &bull; Total: {currentBusiness.currencySymbol} {selectedInvoice.grandTotal}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Item to Return:
                  </label>
                  <select
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {selectedInvoice.items.map((i) => {
                      const maxCanRet = i.quantity - (i.returnedQuantity || 0);
                      return (
                        <option key={i.id} value={i.productId} disabled={maxCanRet <= 0}>
                          {i.productName} (Bought: {i.quantity} {i.unit}, Remaining: {maxCanRet})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Return Quantity:
                    </label>
                    <input
                      type="number"
                      min={0.1}
                      step="any"
                      required
                      value={returnQty}
                      onChange={(e) => setReturnQty(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Refund Mode:
                    </label>
                    <select
                      value={refundMethod}
                      onChange={(e) => setRefundMethod(e.target.value as PaymentMethod)}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="CASH">Cash Refund</option>
                      <option value="UDHAAR_CREDIT">Adjust Customer Due / Credit</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="QR_ONLINE">Online / Wallet</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reason:
                  </label>
                  <input
                    type="text"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="restockCheck"
                    checked={restockItem}
                    onChange={(e) => setRestockItem(e.target.checked)}
                    className="rounded text-indigo-600 h-4 w-4"
                  />
                  <label htmlFor="restockCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Restock items back into product inventory
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-rose-600 py-2.5 font-bold text-white shadow-xs hover:bg-rose-700"
                  >
                    Confirm &amp; Process Return
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Past Returns History */}
          <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
              Past Return Records
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2 max-h-[500px]">
              {returnsList.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No returns processed yet
                </div>
              ) : (
                returnsList.map((ret) => (
                  <div
                    key={ret.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/60"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-mono font-bold text-rose-600 dark:text-rose-400">
                          {ret.invoiceNumber}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {ret.customerName} &bull; {new Date(ret.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {currentBusiness.currencySymbol} {ret.totalRefundAmount.toLocaleString()}
                      </div>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                      Reason: {ret.reason} ({ret.refundMethod})
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Supplier Return Workflow */}
      {returnType === 'SUPPLIER' && (
        <div className="max-w-xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-3">
            Return Goods to Supplier / Distributor
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Deducts damaged/expired items from store inventory and reduces supplier payable debt.
          </p>

          <form onSubmit={handleProcessSupplierReturn} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Supplier:
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">-- Choose Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.company || 'Vendor'}) - Due: {currentBusiness.currencySymbol}{s.totalDue}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Product to Return:
              </label>
              <select
                value={selectedSupplierProdId}
                onChange={(e) => setSelectedSupplierProdId(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">-- Choose Product --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.stockQuantity} {p.unit}, Cost: {currentBusiness.currencySymbol}{p.purchasePrice})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Return Quantity:
              </label>
              <input
                type="number"
                min={1}
                required
                placeholder="Enter quantity"
                value={supplierReturnQty}
                onChange={(e) => setSupplierReturnQty(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason:
              </label>
              <input
                type="text"
                value={supplierReturnReason}
                onChange={(e) => setSupplierReturnReason(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 py-2.5 font-bold text-white shadow-xs hover:bg-indigo-700"
              >
                Submit Supplier Return
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
