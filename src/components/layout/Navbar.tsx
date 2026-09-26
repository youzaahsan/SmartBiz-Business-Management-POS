import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Store,
  User,
  Calculator,
  Wifi,
  WifiOff,
  KeyRound,
  AlertTriangle,
  ChevronDown,
  CheckCircle,
  Menu,
  Search,
  X,
  Bell,
  Package,
  Users,
  Receipt,
  ArrowRight,
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { Product, Customer, Invoice } from '../../types';

interface NavbarProps {
  onOpenCalculator: () => void;
  onNavigate: (view: string) => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCalculator, onNavigate, onToggleSidebar }) => {
  const { currentUser, currentBusiness, staffList, switchUserByPin, switchUserDirectly, isOffline } = useAuth();
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    products: Product[];
    customers: Customer[];
    invoices: Invoice[];
  }>({ products: [], customers: [], invoices: [] });

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Check low stock count for alert badge
  const products = StorageService.getProducts(currentBusiness.id);
  const lowStockCount = products.filter((p) => p.stockQuantity <= p.minimumStock).length;
  const recentActivities = StorageService.getActivityLogs(currentBusiness.id).slice(0, 5);

  // Perform search across real database collections
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchResults({ products: [], customers: [], invoices: [] });
      return;
    }

    const allProducts = StorageService.getProducts(currentBusiness.id);
    const allCustomers = StorageService.getCustomers(currentBusiness.id);
    const allInvoices = StorageService.getInvoices(currentBusiness.id);

    const matchedProducts = allProducts
      .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
      .slice(0, 4);

    const matchedCustomers = allCustomers
      .filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q))
      .slice(0, 4);

    const matchedInvoices = allInvoices
      .filter((i) => i.invoiceNumber.toLowerCase().includes(q) || i.customerName.toLowerCase().includes(q))
      .slice(0, 4);

    setSearchResults({
      products: matchedProducts,
      customers: matchedCustomers,
      invoices: matchedInvoices,
    });
  }, [searchQuery, currentBusiness.id]);

  // Click outside listener for search & notifications
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    const success = switchUserByPin(pinInput.trim());
    if (success) {
      setShowPinModal(false);
      setPinInput('');
      setPinError('');
    } else {
      setPinError('Invalid PIN code or inactive staff account');
    }
  };

  const totalResultsCount =
    searchResults.products.length + searchResults.customers.length + searchResults.invoices.length;

  return (
    <>
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between bg-[#EAE5DC] px-4 md:px-8 anim-slide-down">
        {/* Mobile Menu Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E2DDD3] text-[#5E554B] hover:bg-[#D5CDC0] md:hidden shadow-2xs border border-[#D5CDC0]"
            title="Toggle Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Center: Search Bar from screenshot */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-xl mx-2 md:mx-6">
          <div
            className={`flex items-center gap-2.5 rounded-2xl bg-[#E2DDD3] px-4 py-2.5 transition-all duration-200 border border-[#D5CDC0] ${
              isSearchFocused
                ? 'bg-[#E7E2D8] ring-2 ring-[#B8A68D]/40 shadow-inner'
                : 'hover:bg-[#E5DFD5]'
            }`}
          >
            <Search className="h-4 w-4 text-[#7A7268] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search products, customers, invoices..."
              className="w-full bg-transparent text-xs text-[#2B2520] placeholder-[#8A8175] outline-none font-medium"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[#7A7268] hover:text-[#2B2520]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <span className="hidden sm:inline-block rounded-md bg-[#DDD5C7] px-1.5 py-0.5 text-[9px] font-mono text-[#7A7268]">
                ⌘K
              </span>
            )}
          </div>

          {/* Search Dropdown Results */}
          {isSearchFocused && searchQuery.trim() && (
            <div className="absolute left-0 right-0 mt-2 rounded-2xl border border-[#DDD5C7] bg-[#F7F4EE] p-3.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {totalResultsCount === 0 ? (
                <div className="py-6 text-center text-xs text-[#7A7268]">
                  No matching items found for &quot;{searchQuery}&quot;
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {searchResults.products.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-[#8A8175] uppercase tracking-wider">
                        <Package className="h-3.5 w-3.5 text-[#8E7963]" />
                        <span>Products</span>
                      </div>
                      <div className="space-y-1 mt-1">
                        {searchResults.products.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              onNavigate('products');
                              setIsSearchFocused(false);
                            }}
                            className="flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs hover:bg-[#EFEAE0] cursor-pointer transition"
                          >
                            <div>
                              <div className="font-bold text-[#2B2520]">{p.name}</div>
                              <div className="text-[10px] text-[#7A7268]">
                                SKU: {p.sku} &bull; {p.category} &bull; Stock: {p.stockQuantity} {p.unit}
                              </div>
                            </div>
                            <div className="font-mono font-bold text-[#2B2520]">
                              {currentBusiness.currencySymbol} {p.retailPrice.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.customers.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-[#8A8175] uppercase tracking-wider">
                        <Users className="h-3.5 w-3.5 text-[#8E7963]" />
                        <span>Customers & Udhaar</span>
                      </div>
                      <div className="space-y-1 mt-1">
                        {searchResults.customers.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              onNavigate('customers');
                              setIsSearchFocused(false);
                            }}
                            className="flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs hover:bg-[#EFEAE0] cursor-pointer transition"
                          >
                            <div>
                              <div className="font-bold text-[#2B2520]">{c.name}</div>
                              <div className="text-[10px] text-[#7A7268]">{c.phone}</div>
                            </div>
                            <div className="text-right">
                              {c.totalDue > 0 ? (
                                <span className="font-mono font-bold text-[#A8544A] text-xs">
                                  Due: {currentBusiness.currencySymbol} {c.totalDue.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-[10px] text-[#4E7A58] font-semibold">No Due</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.invoices.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-[#8A8175] uppercase tracking-wider">
                        <Receipt className="h-3.5 w-3.5 text-[#8E7963]" />
                        <span>Invoices</span>
                      </div>
                      <div className="space-y-1 mt-1">
                        {searchResults.invoices.map((inv) => (
                          <div
                            key={inv.id}
                            onClick={() => {
                              onNavigate('invoices');
                              setIsSearchFocused(false);
                            }}
                            className="flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs hover:bg-[#EFEAE0] cursor-pointer transition"
                          >
                            <div>
                              <div className="font-bold text-[#2B2520] flex items-center gap-1.5">
                                <span>{inv.invoiceNumber}</span>
                                <span className="text-[#7A7268] font-normal">({inv.customerName})</span>
                              </div>
                              <div className="text-[10px] text-[#7A7268]">
                                {new Date(inv.createdAt).toLocaleDateString()} &bull; {inv.paymentMethod}
                              </div>
                            </div>
                            <div className="font-mono font-bold text-[#2B2520]">
                              {currentBusiness.currencySymbol} {inv.grandTotal.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Section: Notifications + User Profile */}
        <div className="flex items-center gap-3">
          {/* Notifications Button */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#E2DDD3] border border-[#D5CDC0] text-[#5E554B] hover:bg-[#D8D2C5] shadow-xs transition active:scale-95"
              title="Store Alerts & Notifications"
            >
              <Bell className="h-4 w-4" />
              {lowStockCount > 0 && (
                <span className="absolute top-0 right-0 flex h-3 w-3 items-center justify-center rounded-full bg-[#A8544A] ring-2 ring-[#EAE5DC]" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[#DDD5C7] bg-[#F7F4EE] p-3.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-[#E5DFD4]">
                  <div className="font-bold text-xs text-[#2B2520] flex items-center gap-1.5">
                    <Bell className="h-3.5 w-3.5 text-[#8E7963]" />
                    <span>Store Notifications</span>
                  </div>
                  <span className="text-[10px] text-[#7A7268]">Live Feed</span>
                </div>

                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                  {lowStockCount > 0 && (
                    <div
                      onClick={() => {
                        onNavigate('inventory');
                        setShowNotifications(false);
                      }}
                      className="p-2.5 rounded-xl bg-[#F4EFE6] border border-[#D8CEBF] text-[#734A30] text-xs cursor-pointer hover:bg-[#EFE9DD] transition"
                    >
                      <div className="font-bold flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 text-[#B87A4A]" />
                        <span>{lowStockCount} Products Low on Stock</span>
                      </div>
                      <div className="text-[11px] mt-0.5 text-[#735A40]">
                        Items need restocking to prevent stockouts. Click to review.
                      </div>
                    </div>
                  )}

                  {recentActivities.map((act) => (
                    <div key={act.id} className="p-2 rounded-xl bg-[#EFEAE1] text-xs">
                      <div className="flex items-center justify-between text-[10px] text-[#7A7268]">
                        <span className="font-bold text-[#4A4136]">{act.action}</span>
                        <span>{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="text-[11px] text-[#5E554B] mt-0.5 leading-snug">{act.details}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2.5 rounded-2xl bg-[#E2DDD3] border border-[#D5CDC0] p-1.5 pr-3 hover:bg-[#DAD4C7] transition active:scale-95"
            >
              {/* Profile Avatar Photo / Circular Initial */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8E7963] font-bold text-white text-xs shadow-xs border border-[#7A6753]">
                YA
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-extrabold text-xs text-[#2B2520] leading-tight">
                  Youza Ahsan
                </div>
                <div className="text-[10px] text-[#7A7268] font-medium leading-none">
                  Administrator
                </div>
              </div>
            </button>

            {/* User Dropdown */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[#DDD5C7] bg-[#F7F4EE] p-2.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="border-b border-[#E5DFD4] p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#7A7268]">Current Staff</span>
                    <span className="rounded-md border border-[#D5CDC0] bg-[#EAE5DC] px-1.5 py-0.5 text-[10px] font-bold text-[#4A4136]">
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="mt-1 font-bold text-[#2B2520]">Youza Ahsan</div>
                  <div className="text-xs text-[#7A7268]">{currentUser.email || 'youza@smartbiz.io'}</div>
                </div>

                <div className="p-1">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      setShowPinModal(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-[#4A4136] hover:bg-[#EFEAE0] transition"
                  >
                    <KeyRound className="h-4 w-4 text-[#8E7963]" />
                    <span>Quick Switch Staff (PIN)</span>
                  </button>

                  <div className="my-1 border-t border-[#E5DFD4]"></div>
                  <div className="px-2 py-1 text-[11px] font-semibold text-[#8A8175] uppercase tracking-wider">
                    Fast Switch
                  </div>
                  {staffList.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => {
                        switchUserDirectly(st.id);
                        setShowUserDropdown(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition ${
                        st.id === currentUser.id
                          ? 'bg-[#E7DFD2] font-bold text-[#2B2520]'
                          : 'text-[#5E554B] hover:bg-[#EFEAE0]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{st.id === 'user_admin' ? 'Youza Ahsan' : st.name}</span>
                        <span className="text-[10px] text-[#7A7268]">({st.role})</span>
                      </div>
                      {st.id === currentUser.id && <CheckCircle className="h-3.5 w-3.5 text-[#4E7A58]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Switch Cashier PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-[#DDD5C7] bg-[#F7F4EE] p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EBE5DB] text-[#8E7963]">
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#2B2520]">Cashier PIN Switch</h3>
                <p className="text-xs text-[#7A7268]">Enter your 4-digit PIN code</p>
              </div>
            </div>

            <form onSubmit={handlePinSubmit} className="mt-5 space-y-4">
              <div>
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter PIN (e.g. 1234 or 1111)"
                  autoFocus
                  className="w-full rounded-2xl border border-[#D5CDC0] bg-[#EFEAE1] px-4 py-3 text-center text-2xl font-bold tracking-widest text-[#2B2520] focus:ring-2 focus:ring-[#8E7963]/30 outline-none"
                />
                {pinError && <p className="mt-1.5 text-center text-xs font-semibold text-[#A8544A]">{pinError}</p>}
              </div>

              <div className="rounded-2xl bg-[#EDE7DD] p-3 text-xs text-[#5E554B] space-y-1">
                <div className="font-semibold text-[#2B2520]">Staff PINs:</div>
                <div className="flex justify-between">
                  <span>Youza Ahsan (Admin):</span> <code className="font-mono font-bold text-[#8E7963]">1234</code>
                </div>
                <div className="flex justify-between">
                  <span>Bilal Tariq (Manager):</span> <code className="font-mono font-bold text-[#8E7963]">2222</code>
                </div>
                <div className="flex justify-between">
                  <span>Hamza Khan (Cashier):</span> <code className="font-mono font-bold text-[#8E7963]">1111</code>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinModal(false);
                    setPinInput('');
                    setPinError('');
                  }}
                  className="flex-1 rounded-xl border border-[#D5CDC0] py-2.5 text-xs font-semibold text-[#5E554B] hover:bg-[#E5DFD4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#8E7963] py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#7A6753]"
                >
                  Confirm PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
