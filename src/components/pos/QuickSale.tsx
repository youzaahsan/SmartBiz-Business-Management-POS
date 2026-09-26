import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StorageService } from '../../services/storage';
import { Product, Customer, InvoiceItem, PaymentMethod, PriceType, Invoice } from '../../types';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  Percent,
  UserCheck,
  UserPlus,
  Zap,
  CreditCard,
  QrCode,
  DollarSign,
  AlertCircle,
  X,
  Star,
  Check,
} from 'lucide-react';
import { InvoiceReceiptModal } from './InvoiceReceiptModal';

interface QuickSaleProps {
  initialCartItems?: { name: string; quantity: number; price: number; total: number }[];
  onClearInitialItems?: () => void;
}

export const QuickSale: React.FC<QuickSaleProps> = ({
  initialCartItems,
  onClearInitialItems,
}) => {
  const { currentBusiness, currentUser, hasPermission } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriceType, setSelectedPriceType] = useState<PriceType>('retail');

  // Active Sale Cart
  const [cartItems, setCartItems] = useState<InvoiceItem[]>([]);
  const [billDiscountType, setBillDiscountType] = useState<'percentage' | 'fixed'>('fixed');
  const [billDiscountValue, setBillDiscountValue] = useState<number>(0);

  // Customer Selection
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);

  // New Customer Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);

  // Barcode buffer
  const barcodeBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  // Load products and customers
  const loadData = useCallback(() => {
    const prods = StorageService.getProducts(currentBusiness.id);
    const custs = StorageService.getCustomers(currentBusiness.id);
    setProducts(prods);
    setCustomers(custs);

    // Set default customer to Walk-in
    const walkin = custs.find((c) => c.customerType === 'Walk-in') || custs[0];
    if (walkin && !selectedCustomer) {
      setSelectedCustomer(walkin);
    }
  }, [currentBusiness.id, selectedCustomer]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle incoming items converted from Smart Calculator
  useEffect(() => {
    if (initialCartItems && initialCartItems.length > 0 && products.length > 0) {
      const itemsToAdd: InvoiceItem[] = [];

      initialCartItems.forEach((calcItem) => {
        // Try to match product by name
        const matched = products.find(
          (p) =>
            p.name.toLowerCase().includes(calcItem.name.toLowerCase()) ||
            calcItem.name.toLowerCase().includes(p.name.toLowerCase())
        );

        if (matched) {
          itemsToAdd.push({
            id: `item_${Date.now()}_${Math.random()}`,
            productId: matched.id,
            productName: matched.name,
            sku: matched.sku,
            unit: matched.unit,
            purchasePrice: matched.purchasePrice,
            unitPrice: matched.retailPrice,
            priceType: 'retail',
            quantity: calcItem.quantity || 1,
            discountType: 'fixed',
            discountValue: 0,
            discountAmount: 0,
            taxRate: 0,
            taxAmount: 0,
            total: (calcItem.quantity || 1) * matched.retailPrice,
          });
        } else {
          // Use first product as placeholder or generic item
          const fallback = products[0];
          if (fallback) {
            itemsToAdd.push({
              id: `item_${Date.now()}_${Math.random()}`,
              productId: fallback.id,
              productName: `${calcItem.name} (${fallback.name})`,
              sku: fallback.sku,
              unit: fallback.unit,
              purchasePrice: fallback.purchasePrice,
              unitPrice: calcItem.price > 0 ? calcItem.price : fallback.retailPrice,
              priceType: 'retail',
              quantity: calcItem.quantity || 1,
              discountType: 'fixed',
              discountValue: 0,
              discountAmount: 0,
              taxRate: 0,
              taxAmount: 0,
              total: (calcItem.quantity || 1) * (calcItem.price > 0 ? calcItem.price : fallback.retailPrice),
            });
          }
        }
      });

      if (itemsToAdd.length > 0) {
        setCartItems(itemsToAdd);
      }

      if (onClearInitialItems) {
        onClearInitialItems();
      }
    }
  }, [initialCartItems, products, onClearInitialItems]);

  // Hardware Barcode Scanner Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in form inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTimeRef.current > 200) {
        barcodeBufferRef.current = '';
      }
      lastKeyTimeRef.current = currentTime;

      if (e.key === 'Enter') {
        const barcode = barcodeBufferRef.current.trim();
        if (barcode.length >= 3) {
          const matched = products.find((p) => p.barcode === barcode || p.sku === barcode);
          if (matched) {
            addProductToCart(matched);
            barcodeBufferRef.current = '';
          }
        }
      } else if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Add Product to Cart
  const addProductToCart = (prod: Product) => {
    setErrorMessage('');
    if (prod.stockQuantity <= 0) {
      setErrorMessage(`"${prod.name}" is OUT OF STOCK!`);
      return;
    }

    // Determine unit price based on selected price tier
    let unitPrice = prod.retailPrice;
    if (selectedPriceType === 'wholesale') unitPrice = prod.wholesalePrice;
    if (selectedPriceType === 'special') unitPrice = prod.specialPrice;

    setCartItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.productId === prod.id && i.priceType === selectedPriceType);

      if (existingIdx >= 0) {
        const currentQty = prev[existingIdx].quantity;
        if (currentQty + 1 > prod.stockQuantity) {
          setErrorMessage(`Cannot add more "${prod.name}". Only ${prod.stockQuantity} ${prod.unit} available in stock.`);
          return prev;
        }

        const updated = [...prev];
        const newQty = currentQty + 1;
        const lineTotal = newQty * unitPrice - updated[existingIdx].discountAmount;

        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          total: Math.max(0, lineTotal),
        };
        return updated;
      } else {
        const newItem: InvoiceItem = {
          id: `item_${Date.now()}_${Math.random().toString().slice(-4)}`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          unit: prod.unit,
          purchasePrice: prod.purchasePrice,
          unitPrice,
          priceType: selectedPriceType,
          quantity: 1,
          discountType: 'fixed',
          discountValue: 0,
          discountAmount: 0,
          taxRate: 0,
          taxAmount: 0,
          total: unitPrice,
        };
        return [...prev, newItem];
      }
    });
  };

  // Update item quantity
  const updateQuantity = (itemId: string, newQty: number) => {
    setErrorMessage('');
    if (newQty <= 0) {
      removeItem(itemId);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const prod = products.find((p) => p.id === item.productId);
          if (prod && newQty > prod.stockQuantity) {
            setErrorMessage(`Cannot exceed available stock of ${prod.stockQuantity} ${prod.unit} for "${prod.name}".`);
            return item;
          }

          let discountAmt = 0;
          if (item.discountType === 'percentage') {
            discountAmt = (item.unitPrice * newQty * item.discountValue) / 100;
          } else {
            discountAmt = Math.min(item.discountValue, item.unitPrice * newQty);
          }

          return {
            ...item,
            quantity: newQty,
            discountAmount: discountAmt,
            total: Math.max(0, item.unitPrice * newQty - discountAmt),
          };
        }
        return item;
      })
    );
  };

  // Remove item from cart
  const removeItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  // Financial Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.total, 0);

  let billDiscountAmount = 0;
  if (billDiscountType === 'percentage') {
    billDiscountAmount = (subtotal * (billDiscountValue || 0)) / 100;
  } else {
    billDiscountAmount = Math.min(billDiscountValue || 0, subtotal);
  }

  const grandTotal = Math.max(0, subtotal - billDiscountAmount);

  // Auto set paid amount to grand total if not manually altered
  const effectivePaidAmount = paidAmount !== '' ? parseFloat(paidAmount) || 0 : grandTotal;
  const dueAmount = Math.max(0, grandTotal - effectivePaidAmount);
  const changeDue = effectivePaidAmount > grandTotal ? effectivePaidAmount - grandTotal : 0;

  // Filter products
  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];
  const filteredProducts = products.filter((p) => {
    const matchesQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesQuery && matchesCat;
  });

  const favoriteProducts = products.filter((p) => p.isFavorite);

  // Complete Sale Action
  const handleCompleteSale = () => {
    setErrorMessage('');
    if (cartItems.length === 0) {
      setErrorMessage('Please add at least one product to the bill.');
      return;
    }

    if (!selectedCustomer) {
      setErrorMessage('Please select a customer (or Walk-in Customer).');
      return;
    }

    // Call atomic transactional service
    const result = StorageService.createSaleTransaction({
      businessId: currentBusiness.id,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      items: cartItems,
      billDiscountType,
      billDiscountValue,
      paymentMethod,
      paidAmount: effectivePaidAmount,
      notes: checkoutNotes,
    });

    if (result.success && result.invoice) {
      setCompletedInvoice(result.invoice);
      setCartItems([]);
      setPaidAmount('');
      setBillDiscountValue(0);
      setCheckoutNotes('');
      loadData();
    } else {
      setErrorMessage(result.error || 'Failed to complete sale');
    }
  };

  // Add New Customer Inline
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      return;
    }

    const created = StorageService.saveCustomer(
      {
        id: `cust_${Date.now()}`,
        businessId: currentBusiness.id,
        name: newCustName.trim(),
        phone: newCustPhone.trim(),
        address: newCustAddress.trim(),
        customerType: 'Regular',
        totalPurchases: 0,
        totalPaid: 0,
        totalDue: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );

    setSelectedCustomer(created);
    setShowNewCustomerModal(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    loadData();
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* LEFT: Product Catalog & Favorites Grid */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-200 dark:border-slate-800">
        {/* Top Search & Filter Bar */}
        <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search product, SKU, or scan barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <Barcode className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400" />
            )}
          </div>

          {/* Price Tier Selector */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs dark:border-slate-700 dark:bg-slate-800">
            <button
              onClick={() => setSelectedPriceType('retail')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                selectedPriceType === 'retail'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Retail
            </button>
            <button
              onClick={() => setSelectedPriceType('wholesale')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                selectedPriceType === 'wholesale'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Wholesale
            </button>
            <button
              onClick={() => setSelectedPriceType('special')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                selectedPriceType === 'special'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Special
            </button>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="px-3 py-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex gap-1.5 overflow-x-auto text-xs scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3 py-1 font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Main Products Grid */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Quick-Add Favorites Section */}
          {selectedCategory === 'All' && searchQuery === '' && favoriteProducts.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span>Quick Add Favorites</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {favoriteProducts.map((prod) => {
                  const displayPrice =
                    selectedPriceType === 'wholesale'
                      ? prod.wholesalePrice
                      : selectedPriceType === 'special'
                      ? prod.specialPrice
                      : prod.retailPrice;

                  const isLow = prod.stockQuantity <= prod.minimumStock;
                  const isOutOfStock = prod.stockQuantity <= 0;

                  return (
                    <button
                      key={prod.id}
                      onClick={() => addProductToCart(prod)}
                      disabled={isOutOfStock}
                      className={`group relative flex flex-col justify-between rounded-2xl border p-3 text-left transition active:scale-97 ${
                        isOutOfStock
                          ? 'border-slate-200 bg-slate-100 opacity-60 dark:border-slate-800 dark:bg-slate-900'
                          : 'border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span className="font-mono">{prod.sku}</span>
                          <span
                            className={`rounded-full px-1.5 py-0.2 font-bold ${
                              isOutOfStock
                                ? 'bg-rose-100 text-rose-700'
                                : isLow
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {prod.stockQuantity} {prod.unit}
                          </span>
                        </div>
                        <div className="font-bold text-slate-800 dark:text-white text-xs line-clamp-2">
                          {prod.name}
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                          {currentBusiness.currencySymbol} {displayPrice}
                        </span>
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition dark:bg-indigo-950 dark:text-indigo-400">
                          <Plus className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Catalog Products Grid */}
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              All Products ({filteredProducts.length})
            </div>

            {filteredProducts.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">
                No products found matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {filteredProducts.map((prod) => {
                  const displayPrice =
                    selectedPriceType === 'wholesale'
                      ? prod.wholesalePrice
                      : selectedPriceType === 'special'
                      ? prod.specialPrice
                      : prod.retailPrice;

                  const isLow = prod.stockQuantity <= prod.minimumStock;
                  const isOutOfStock = prod.stockQuantity <= 0;

                  return (
                    <button
                      key={prod.id}
                      onClick={() => addProductToCart(prod)}
                      disabled={isOutOfStock}
                      className={`group relative flex flex-col justify-between rounded-2xl border p-3 text-left transition active:scale-97 ${
                        isOutOfStock
                          ? 'border-slate-200 bg-slate-100 opacity-60 dark:border-slate-800 dark:bg-slate-900'
                          : 'border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span className="font-mono">{prod.sku}</span>
                          <span
                            className={`rounded-full px-1.5 py-0.2 font-bold ${
                              isOutOfStock
                                ? 'bg-rose-100 text-rose-700'
                                : isLow
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {prod.stockQuantity} {prod.unit}
                          </span>
                        </div>
                        <div className="font-bold text-slate-800 dark:text-white text-xs line-clamp-2">
                          {prod.name}
                        </div>
                        <div className="text-[10px] text-slate-400">{prod.category}</div>
                      </div>

                      <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                          {currentBusiness.currencySymbol} {displayPrice}
                        </span>
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition dark:bg-indigo-950 dark:text-indigo-400">
                          <Plus className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Active Bill & Checkout Panel */}
      <div className="w-full lg:w-[420px] flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        {/* Customer Header Bar */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                {selectedCustomer?.name || 'Walk-in Customer'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                {selectedCustomer?.phone && selectedCustomer.phone !== '0000000000'
                  ? selectedCustomer.phone
                  : 'Cash & Carry'}
                {selectedCustomer && selectedCustomer.totalDue > 0 && (
                  <span className="ml-1 font-bold text-amber-600 dark:text-amber-400">
                    (Udhaar: {currentBusiness.currencySymbol}{selectedCustomer.totalDue.toLocaleString()})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => setShowCustomerModal(true)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Change
            </button>
            <button
              onClick={() => setShowNewCustomerModal(true)}
              className="rounded-lg bg-indigo-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700"
              title="Add New Customer"
            >
              <UserPlus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="m-2 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-800 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-200">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Cart Line Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Zap className="h-10 w-10 text-slate-300 mb-2" />
              <div className="font-bold text-sm text-slate-600 dark:text-slate-300">Bill is Empty</div>
              <div className="text-xs">Click products from the catalog or scan barcode to add items</div>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-800/80 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <div className="font-bold text-slate-900 dark:text-white leading-tight">
                      {item.productName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {item.sku} &bull; {currentBusiness.currencySymbol} {item.unitPrice}/{item.unit}
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60">
                  {/* Quantity selector */}
                  <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-slate-700 hover:bg-slate-100 shadow-2xs dark:bg-slate-700 dark:text-slate-200"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                      className="w-10 text-center font-bold text-xs bg-transparent outline-none dark:text-white"
                    />
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-slate-700 hover:bg-slate-100 shadow-2xs dark:bg-slate-700 dark:text-slate-200"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-right">
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {currentBusiness.currencySymbol} {item.total.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Payment Section */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
          {/* Subtotal & Discount */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal ({cartItems.length} items):</span>
              <span className="font-bold text-slate-800 dark:text-white">
                {currentBusiness.currencySymbol} {subtotal.toLocaleString()}
              </span>
            </div>

            {/* Bill Discount input */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Percent className="h-3 w-3" />
                <span>Discount:</span>
              </span>
              <div className="flex items-center gap-1">
                <select
                  value={billDiscountType}
                  onChange={(e) => setBillDiscountType(e.target.value as 'percentage' | 'fixed')}
                  className="rounded-lg border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] outline-none dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="fixed">{currentBusiness.currencySymbol}</option>
                  <option value="percentage">%</option>
                </select>
                <input
                  type="number"
                  min={0}
                  value={billDiscountValue || ''}
                  placeholder="0"
                  onChange={(e) => setBillDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-right text-xs outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Grand Total */}
            <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
              <span>GRAND TOTAL:</span>
              <span className="text-base text-indigo-600 dark:text-indigo-400">
                {currentBusiness.currencySymbol} {grandTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Payment Method:
            </div>
            <div className="grid grid-cols-5 gap-1 text-[10px] font-bold">
              {[
                { id: 'CASH', label: 'Cash' },
                { id: 'CARD', label: 'Card' },
                { id: 'QR_ONLINE', label: 'QR/App' },
                { id: 'BANK_TRANSFER', label: 'Bank' },
                { id: 'UDHAAR_CREDIT', label: 'Udhaar' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setPaymentMethod(m.id as PaymentMethod);
                    if (m.id === 'UDHAAR_CREDIT') {
                      setPaidAmount('0');
                    }
                  }}
                  className={`rounded-lg py-1.5 px-1 border transition text-center ${
                    paymentMethod === m.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-extrabold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Paid & Quick Cash */}
          {paymentMethod !== 'UDHAAR_CREDIT' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Amount Received:
                </span>
                <input
                  type="number"
                  value={paidAmount}
                  placeholder={String(grandTotal)}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-28 rounded-lg border border-slate-300 bg-white px-2 py-1 text-right text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Quick Cash Presets */}
              <div className="flex gap-1 text-[10px] font-semibold">
                <button
                  onClick={() => setPaidAmount(String(grandTotal))}
                  className="flex-1 rounded-md bg-slate-200 py-1 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200"
                >
                  Exact
                </button>
                <button
                  onClick={() => setPaidAmount(String(Math.ceil(grandTotal / 500) * 500 || 500))}
                  className="flex-1 rounded-md bg-slate-200 py-1 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200"
                >
                  Round 500
                </button>
                <button
                  onClick={() => setPaidAmount(String(Math.ceil(grandTotal / 1000) * 1000 || 1000))}
                  className="flex-1 rounded-md bg-slate-200 py-1 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200"
                >
                  Round 1000
                </button>
              </div>

              {/* Change Due or Partial Remaining Due */}
              <div className="flex justify-between text-xs pt-1">
                {changeDue > 0 ? (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    Change to Return: {currentBusiness.currencySymbol} {changeDue.toLocaleString()}
                  </span>
                ) : dueAmount > 0 ? (
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    Balance Due (Udhaar): {currentBusiness.currencySymbol} {dueAmount.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-emerald-600 text-[11px] font-semibold">Bill Paid in Full</span>
                )}
              </div>
            </div>
          )}

          {/* Checkout Button */}
          <button
            onClick={handleCompleteSale}
            disabled={cartItems.length === 0}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-500/20 transition hover:from-emerald-700 hover:to-teal-700 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Zap className="h-4 w-4" />
            <span>COMPLETE SALE ({currentBusiness.currencySymbol} {grandTotal.toLocaleString()})</span>
          </button>
        </div>
      </div>

      {/* Select Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Select Customer</h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3">
              <input
                type="text"
                placeholder="Search by phone (e.g. 03001234567) or name..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                autoFocus
                className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="mt-3 max-h-60 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 dark:divide-slate-800">
              {customers
                .filter(
                  (c) =>
                    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                    c.phone.includes(customerSearch)
                )
                .map((cust) => (
                  <button
                    key={cust.id}
                    onClick={() => {
                      setSelectedCustomer(cust);
                      setShowCustomerModal(false);
                      setCustomerSearch('');
                    }}
                    className={`flex w-full items-center justify-between p-2.5 text-left text-xs transition ${
                      selectedCustomer?.id === cust.id
                        ? 'bg-indigo-50 font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div>{cust.name}</div>
                      <div className="text-[10px] text-slate-400">{cust.phone}</div>
                    </div>
                    <div className="text-right">
                      {cust.totalDue > 0 ? (
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          Due: {currentBusiness.currencySymbol} {cust.totalDue.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-emerald-600 text-[10px]">No Due</span>
                      )}
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Add New Customer</h3>
              <button
                onClick={() => setShowNewCustomerModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mehmood"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 03001234567"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Address (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shop 2, Plaza 4"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  Save &amp; Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Completed Invoice Receipt Modal */}
      {completedInvoice && (
        <InvoiceReceiptModal
          invoice={completedInvoice}
          business={currentBusiness}
          onClose={() => setCompletedInvoice(null)}
          onNewSale={() => setCompletedInvoice(null)}
        />
      )}
    </div>
  );
};
