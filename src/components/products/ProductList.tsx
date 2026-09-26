import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StorageService } from '../../services/storage';
import { Product } from '../../types';
import {
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Star,
  Barcode,
  X,
  Filter,
} from 'lucide-react';

export const ProductList: React.FC<{ onNavigateToStockIn?: () => void }> = () => {
  const { currentBusiness, currentUser, hasPermission } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formCategory, setFormCategory] = useState('Grocery');
  const [formUnit, setFormUnit] = useState('KG');
  const [formPurchasePrice, setFormPurchasePrice] = useState<string>('');
  const [formRetailPrice, setFormRetailPrice] = useState<string>('');
  const [formWholesalePrice, setFormWholesalePrice] = useState<string>('');
  const [formSpecialPrice, setFormSpecialPrice] = useState<string>('');
  const [formStockQty, setFormStockQty] = useState<string>('');
  const [formMinStock, setFormMinStock] = useState<string>('10');
  const [formDesc, setFormDesc] = useState('');
  const [formIsFavorite, setFormIsFavorite] = useState(false);

  const canViewCost = hasPermission('view_purchase_cost');

  const loadProducts = () => {
    const list = StorageService.getProducts(currentBusiness.id);
    setProducts(list);
  };

  useEffect(() => {
    loadProducts();
  }, [currentBusiness.id]);

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search);
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesLowStock = !lowStockOnly || p.stockQuantity <= p.minimumStock;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const handleOpenAdd = () => {
    setEditProduct(null);
    setFormName('');
    setFormSku(`SKU-${Math.floor(100 + Math.random() * 900)}`);
    setFormBarcode(String(890123456000 + products.length + 1));
    setFormCategory('Grocery');
    setFormUnit('KG');
    setFormPurchasePrice('');
    setFormRetailPrice('');
    setFormWholesalePrice('');
    setFormSpecialPrice('');
    setFormStockQty('0');
    setFormMinStock('10');
    setFormDesc('');
    setFormIsFavorite(false);
    setShowAddModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditProduct(p);
    setFormName(p.name);
    setFormSku(p.sku);
    setFormBarcode(p.barcode);
    setFormCategory(p.category);
    setFormUnit(p.unit);
    setFormPurchasePrice(String(p.purchasePrice));
    setFormRetailPrice(String(p.retailPrice));
    setFormWholesalePrice(String(p.wholesalePrice));
    setFormSpecialPrice(String(p.specialPrice));
    setFormStockQty(String(p.stockQuantity));
    setFormMinStock(String(p.minimumStock));
    setFormDesc(p.description || '');
    setFormIsFavorite(!!p.isFavorite);
    setShowAddModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSku.trim()) return;

    const retail = parseFloat(formRetailPrice) || 0;
    const purchase = parseFloat(formPurchasePrice) || Math.round(retail * 0.8);
    const wholesale = parseFloat(formWholesalePrice) || Math.round(retail * 0.9);
    const special = parseFloat(formSpecialPrice) || Math.round(retail * 0.85);
    const stock = parseFloat(formStockQty) || 0;
    const minStock = parseFloat(formMinStock) || 5;

    const actor = { id: currentUser.id, name: currentUser.name, role: currentUser.role };

    if (editProduct) {
      StorageService.saveProduct(
        {
          ...editProduct,
          name: formName.trim(),
          sku: formSku.trim(),
          barcode: formBarcode.trim(),
          category: formCategory,
          unit: formUnit,
          purchasePrice: purchase,
          retailPrice: retail,
          wholesalePrice: wholesale,
          specialPrice: special,
          stockQuantity: stock,
          minimumStock: minStock,
          description: formDesc.trim() || undefined,
          isFavorite: formIsFavorite,
        },
        actor
      );
    } else {
      StorageService.saveProduct(
        {
          id: `prod_${Date.now()}`,
          businessId: currentBusiness.id,
          name: formName.trim(),
          sku: formSku.trim(),
          barcode: formBarcode.trim(),
          category: formCategory,
          unit: formUnit,
          purchasePrice: purchase,
          retailPrice: retail,
          wholesalePrice: wholesale,
          specialPrice: special,
          stockQuantity: stock,
          minimumStock: minStock,
          description: formDesc.trim() || undefined,
          isFavorite: formIsFavorite,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        actor
      );
    }

    setShowAddModal(false);
    loadProducts();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete product "${name}"?`)) {
      StorageService.deleteProduct(id, currentBusiness.id, {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      });
      loadProducts();
    }
  };

  const toggleFavorite = (p: Product) => {
    StorageService.saveProduct({
      ...p,
      isFavorite: !p.isFavorite,
    });
    loadProducts();
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span>Products &amp; Pricing Catalog</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage SKU, Barcode, Retail, Wholesale, Special &amp; Purchase prices
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition active:scale-98"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap gap-2.5 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name, SKU, or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              lowStockOnly
                ? 'border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            <span>Low Stock Filter</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3 text-center">Fav</th>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-center">Stock</th>
                {canViewCost && <th className="py-3 px-3 text-right">Cost Price</th>}
                <th className="py-3 px-3 text-right">Retail Price</th>
                <th className="py-3 px-3 text-right">Wholesale</th>
                <th className="py-3 px-3 text-right">Special</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={canViewCost ? 9 : 8} className="py-12 text-center text-slate-400">
                    No products found
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => {
                  const isLow = prod.stockQuantity <= prod.minimumStock;
                  const isOut = prod.stockQuantity <= 0;

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => toggleFavorite(prod)}
                          title="Toggle Quick Add Favorite"
                          className="text-slate-300 hover:text-amber-500"
                        >
                          <Star
                            className={`h-4 w-4 ${
                              prod.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                            }`}
                          />
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{prod.name}</div>
                        <div className="flex gap-2 text-[10px] text-slate-400 font-mono">
                          <span>SKU: {prod.sku}</span>
                          <span>&bull;</span>
                          <span>Barcode: {prod.barcode}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {prod.category}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isOut
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : isLow
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {prod.stockQuantity} {prod.unit}
                        </span>
                      </td>
                      {canViewCost && (
                        <td className="py-3 px-3 text-right font-mono text-slate-500 dark:text-slate-400">
                          {currentBusiness.currencySymbol} {prod.purchasePrice.toLocaleString()}
                        </td>
                      )}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {currentBusiness.currencySymbol} {prod.retailPrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                        {currentBusiness.currencySymbol} {prod.wholesalePrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                        {currentBusiness.currencySymbol} {prod.specialPrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(prod)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(prod.id, prod.name)}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product Name *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Super Kernel Basmati Rice"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    SKU Code *:
                  </label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none font-mono focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Barcode (EAN/UPC):
                  </label>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none font-mono focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category:
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g. Grocery, Beverages, Dairy"
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unit:
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="KG">KG</option>
                    <option value="Ltr">Ltr</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Pack">Pack</option>
                    <option value="Box">Box</option>
                    <option value="Gram">Gram</option>
                  </select>
                </div>
              </div>

              {/* Price tiers */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60 space-y-2">
                <div className="font-bold text-slate-800 dark:text-white text-xs">
                  Pricing Matrix ({currentBusiness.currencySymbol})
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-0.5 text-[10px]">
                      Purchase Cost:
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="0"
                      value={formPurchasePrice}
                      onChange={(e) => setFormPurchasePrice(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-slate-800 outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-0.5 text-[10px]">
                      Retail Price *:
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="0"
                      value={formRetailPrice}
                      onChange={(e) => setFormRetailPrice(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-1.5 text-xs font-bold text-indigo-600 outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-indigo-400"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-0.5 text-[10px]">
                      Wholesale Price:
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formWholesalePrice}
                      onChange={(e) => setFormWholesalePrice(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-slate-800 outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-0.5 text-[10px]">
                      Special Price:
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formSpecialPrice}
                      onChange={(e) => setFormSpecialPrice(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-slate-800 outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Stock settings */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Current Stock Quantity:
                  </label>
                  <input
                    type="number"
                    value={formStockQty}
                    onChange={(e) => setFormStockQty(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Minimum Alert Level:
                  </label>
                  <input
                    type="number"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Favorite toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="favCheck"
                  checked={formIsFavorite}
                  onChange={(e) => setFormIsFavorite(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="favCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Pin to Quick Add Favorites in POS Terminal
                </label>
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
                  {editProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
