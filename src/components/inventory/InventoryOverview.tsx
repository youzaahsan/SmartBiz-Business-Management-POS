import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StorageService } from '../../services/storage';
import { Product } from '../../types';
import {
  Boxes,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  PlusCircle,
  X,
  Search,
  CheckCircle,
} from 'lucide-react';

export const InventoryOverview: React.FC<{ onNavigateToPurchases?: () => void }> = ({
  onNavigateToPurchases,
}) => {
  const { currentBusiness, currentUser, hasPermission } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('Restock / Manual Addition');
  const [adjustType, setAdjustType] = useState<'ADD' | 'SUBTRACT'>('ADD');
  const [successMessage, setSuccessMessage] = useState('');

  const canViewCost = hasPermission('view_purchase_cost');

  const loadData = () => {
    const prods = StorageService.getProducts(currentBusiness.id);
    setProducts(prods);
  };

  useEffect(() => {
    loadData();
  }, [currentBusiness.id]);

  // Calculations
  const totalStockUnits = products.reduce((acc, p) => acc + p.stockQuantity, 0);
  const totalRetailValuation = products.reduce((acc, p) => acc + p.stockQuantity * p.retailPrice, 0);
  const totalCostValuation = products.reduce((acc, p) => acc + p.stockQuantity * p.purchasePrice, 0);
  const potentialGrossProfit = totalRetailValuation - totalCostValuation;

  const lowStockItems = products.filter((p) => p.stockQuantity <= p.minimumStock);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProduct) return;

    const qty = parseFloat(adjustQty);
    if (!qty || qty <= 0) return;

    const currentQty = adjustProduct.stockQuantity;
    const newQty = adjustType === 'ADD' ? currentQty + qty : Math.max(0, currentQty - qty);

    StorageService.saveProduct(
      {
        ...adjustProduct,
        stockQuantity: newQty,
      },
      {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      }
    );

    StorageService.logActivity({
      businessId: currentBusiness.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Stock Adjustment',
      entity: 'PRODUCT',
      entityId: adjustProduct.id,
      details: `${adjustProduct.name}: Adjusted by ${adjustType === 'ADD' ? '+' : '-'}${qty} ${adjustProduct.unit}. New Stock: ${newQty}. Reason: ${adjustReason}`,
    });

    setSuccessMessage(`Stock updated for "${adjustProduct.name}". Current Stock: ${newQty} ${adjustProduct.unit}`);
    setAdjustProduct(null);
    setAdjustQty('');
    loadData();
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Boxes className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span>Inventory Valuation &amp; Stock Levels</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time asset value, stock movements, and automatic reorder thresholds
          </p>
        </div>

        {onNavigateToPurchases && (
          <button
            onClick={onNavigateToPurchases}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition active:scale-98"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>Create Purchase Order (Stock In)</span>
          </button>
        )}
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Valuation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Units in Stock</div>
          <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {totalStockUnits.toLocaleString()}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">{products.length} distinct items</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Stock Retail Valuation</div>
          <div className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {currentBusiness.currencySymbol} {totalRetailValuation.toLocaleString()}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">Based on selling price</div>
        </div>

        {canViewCost && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Stock Cost Value</div>
            <div className="mt-1 text-2xl font-black text-slate-800 dark:text-slate-200">
              {currentBusiness.currencySymbol} {totalCostValuation.toLocaleString()}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-400">Acquisition purchase cost</div>
          </div>
        )}

        {canViewCost && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
            <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              Projected Stock Profit
            </div>
            <div className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-200">
              {currentBusiness.currencySymbol} {potentialGrossProfit.toLocaleString()}
            </div>
            <div className="mt-0.5 text-[11px] text-emerald-800 dark:text-emerald-300">
              Margin: {totalRetailValuation > 0 ? Math.round((potentialGrossProfit / totalRetailValuation) * 100) : 0}%
            </div>
          </div>
        )}
      </div>

      {/* Low Stock Alerts Section */}
      {lowStockItems.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 dark:border-rose-900 dark:bg-rose-950/30">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-rose-200 dark:border-rose-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 animate-pulse" />
              <h3 className="font-bold text-sm text-rose-900 dark:text-rose-200">
                Low Stock &amp; Reorder Warning ({lowStockItems.length} Products)
              </h3>
            </div>
            <span className="text-[11px] text-rose-700 dark:text-rose-300 font-semibold">
              Action required to prevent stockouts
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {lowStockItems.map((prod) => (
              <div
                key={prod.id}
                className="flex items-center justify-between rounded-xl bg-white p-3 border border-rose-200 shadow-2xs dark:bg-slate-900 dark:border-rose-950 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{prod.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">SKU: {prod.sku}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                      In Stock: {prod.stockQuantity} {prod.unit}
                    </span>
                    <span className="text-[10px] text-slate-400">Min: {prod.minimumStock}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setAdjustProduct(prod);
                    setAdjustType('ADD');
                    setAdjustReason('Reorder / Fast Restock');
                  }}
                  className="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 whitespace-nowrap"
                >
                  + Restock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock Management List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">All Stock Items</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-center">Available Stock</th>
                  <th className="py-3 px-3 text-center">Minimum Threshold</th>
                  <th className="py-3 px-3 text-right">Retail Value</th>
                  {canViewCost && <th className="py-3 px-3 text-right">Cost Value</th>}
                  <th className="py-3 px-4 text-center">Quick Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProducts.map((p) => {
                  const isLow = p.stockQuantity <= p.minimumStock;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{p.category}</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            p.stockQuantity === 0
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : isLow
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {p.stockQuantity} {p.unit}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-500">
                        {p.minimumStock} {p.unit}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {currentBusiness.currencySymbol} {(p.stockQuantity * p.retailPrice).toLocaleString()}
                      </td>
                      {canViewCost && (
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          {currentBusiness.currencySymbol} {(p.stockQuantity * p.purchasePrice).toLocaleString()}
                        </td>
                      )}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setAdjustProduct(p);
                            setAdjustType('ADD');
                            setAdjustReason('Physical inventory recount');
                          }}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {adjustProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Stock Adjustment</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {adjustProduct.name} (Current: {adjustProduct.stockQuantity} {adjustProduct.unit})
                </p>
              </div>
              <button
                onClick={() => setAdjustProduct(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="mt-4 space-y-3 text-xs">
              {/* Type: Add or Subtract */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('ADD')}
                  className={`rounded-xl py-2 font-bold transition border ${
                    adjustType === 'ADD'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800'
                  }`}
                >
                  + Add Units
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('SUBTRACT')}
                  className={`rounded-xl py-2 font-bold transition border ${
                    adjustType === 'SUBTRACT'
                      ? 'border-rose-600 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800'
                  }`}
                >
                  - Deduct Units
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quantity ({adjustProduct.unit}) *:
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  autoFocus
                  placeholder="Enter quantity"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Adjustment:
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Restock / Manual Addition">Restock / Manual Addition</option>
                  <option value="Physical Inventory Recount">Physical Inventory Recount</option>
                  <option value="Damaged / Broken Goods">Damaged / Broken Goods</option>
                  <option value="Expired Products">Expired Products</option>
                  <option value="Internal Store Consumption">Internal Store Consumption</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustProduct(null)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 font-bold text-white hover:bg-indigo-700"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
